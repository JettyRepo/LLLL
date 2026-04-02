import { execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { scanReleaseFiles, checkWhitelist, checkReleaseSize, scanSourceMapContent } from '../scanners/release-scanner.js';
import { scanForSecrets } from '../scanners/secret-scanner.js';
import { scanForSourceMapReferences } from '../scanners/source-map-scanner.js';
import { loadConfig, loadWhitelist } from '../config/loader.js';
import { printResult } from '../output/terminal.js';
import { printJsonResult } from '../output/json.js';
import type { Finding, ScanResult, Verdict } from '../types.js';

interface ReleaseOptions {
  json?: boolean;
  dir?: string;
}

export async function releaseCommand(options: ReleaseOptions): Promise<void> {
  const config = loadConfig();
  const whitelist = loadWhitelist();

  if (!config.enabled) {
    console.log('LLLL Guard is disabled. Skipping scan.');
    return;
  }

  let fileList: string[];
  let totalSize = 0;

  // Try npm pack --dry-run first
  if (!options.dir) {
    try {
      const packOutput = execSync('npm pack --dry-run --json 2>/dev/null', { encoding: 'utf-8' });
      const packData = JSON.parse(packOutput);
      if (Array.isArray(packData) && packData[0]?.files) {
        fileList = packData[0].files.map((f: { path: string }) => f.path);
        totalSize = packData[0].unpackedSize || 0;
      } else {
        fileList = getFileListFromDir('dist');
      }
    } catch {
      fileList = getFileListFromDir('dist');
    }
  } else {
    fileList = getFileListFromDir(options.dir);
  }

  if (fileList.length === 0) {
    console.log('No release files found. Nothing to scan.');
    return;
  }

  const allFindings: Finding[] = [];

  // Check file paths against release rules
  allFindings.push(...scanReleaseFiles(fileList));

  // Check whitelist policy
  const hasFilesField = checkPackageJsonFiles();
  const hasNpmignore = existsSync('.npmignore');
  if (!hasFilesField && !hasNpmignore) {
    const whitelistFinding = checkWhitelist(fileList, { ...whitelist, allowedPatterns: [] });
    if (whitelistFinding) allFindings.push(whitelistFinding);
  }

  // Check package size
  if (totalSize > 0) {
    const sizeFinding = checkReleaseSize(totalSize, whitelist.maxPackageSize);
    if (sizeFinding) allFindings.push(sizeFinding);
  }

  // Scan .map files for sourcesContent
  for (const file of fileList) {
    if (file.endsWith('.map') && existsSync(file)) {
      try {
        const content = readFileSync(file, 'utf-8');
        const mapFinding = scanSourceMapContent(content, file);
        if (mapFinding) allFindings.push(mapFinding);
        allFindings.push(...scanForSourceMapReferences(content, file));
      } catch {
        // Skip files that can't be read
      }
    }
  }

  // Filter disabled rules
  const filteredFindings = allFindings.filter(
    f => !config.releaseRules.disabledRules.includes(f.id),
  );

  const verdict = determineVerdict(filteredFindings);

  const result: ScanResult = {
    gate: 'release',
    verdict,
    timestamp: new Date().toISOString(),
    scannedFiles: fileList.length,
    findings: filteredFindings,
    overrides: [],
  };

  if (options.json) {
    printJsonResult(result);
  } else {
    printResult(result);
  }

  if (verdict === 'HARD_BLOCK' || verdict === 'SOFT_BLOCK') {
    process.exit(1);
  }
}

function getFileListFromDir(dir: string): string[] {
  if (!existsSync(dir)) return [];

  const files: string[] = [];
  function walk(currentDir: string): void {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.git') {
          walk(fullPath);
        }
      } else {
        files.push(relative(process.cwd(), fullPath));
      }
    }
  }
  walk(dir);
  return files;
}

function checkPackageJsonFiles(): boolean {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    return Array.isArray(pkg.files);
  } catch {
    return false;
  }
}

function determineVerdict(findings: Finding[]): Verdict {
  if (findings.some(f => f.severity === 'HARD_BLOCK')) return 'HARD_BLOCK';
  if (findings.some(f => f.severity === 'SOFT_BLOCK' && !f.overridden)) return 'SOFT_BLOCK';
  if (findings.some(f => f.severity === 'WARN')) return 'WARN';
  return 'PASS';
}
