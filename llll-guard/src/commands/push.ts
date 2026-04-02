import { execSync } from 'node:child_process';
import { scanForSecrets, scanFilePathForSecrets } from '../scanners/secret-scanner.js';
import { scanForPolicyIssues, scanForCopyleftDeps } from '../scanners/policy-scanner.js';
import { loadConfig, loadGuardIgnore } from '../config/loader.js';
import { printResult } from '../output/terminal.js';
import { printJsonResult } from '../output/json.js';
import { minimatch } from 'minimatch';
import type { Finding, ScanResult, Verdict } from '../types.js';

interface PushOptions {
  json?: boolean;
  remote?: string;
  branch?: string;
}

export async function pushCommand(options: PushOptions): Promise<void> {
  const config = loadConfig();
  const ignorePatterns = loadGuardIgnore();

  if (!config.enabled) {
    console.log('LLLL Guard is disabled. Skipping scan.');
    return;
  }

  // Get outgoing diff
  let diff: string;
  let commitCount: number;
  try {
    const remote = options.remote || 'origin';
    const branch = options.branch || getCurrentBranch();
    const range = `${remote}/${branch}..HEAD`;

    // Count outgoing commits
    try {
      const logOutput = execSync(`git log --oneline ${range} 2>/dev/null`, { encoding: 'utf-8' });
      commitCount = logOutput.trim().split('\n').filter(l => l).length;
    } catch {
      commitCount = 0;
    }

    if (commitCount === 0) {
      console.log('No outgoing commits found. Nothing to scan.');
      return;
    }

    diff = execSync(`git diff ${range}`, { encoding: 'utf-8' });
  } catch {
    // Fallback: scan staged + unstaged changes
    diff = execSync('git diff HEAD', { encoding: 'utf-8' });
    commitCount = 1;
  }

  // Parse diff into file-based chunks
  const fileChunks = parseDiff(diff);
  const allFindings: Finding[] = [];

  for (const chunk of fileChunks) {
    // Skip excluded patterns
    if (shouldIgnore(chunk.filePath, config.excludePatterns, ignorePatterns)) {
      continue;
    }

    // Check file path itself
    const pathFinding = scanFilePathForSecrets(chunk.filePath);
    if (pathFinding) {
      allFindings.push(pathFinding);
    }

    // Scan added lines only (lines starting with +)
    const addedContent = chunk.addedLines.join('\n');
    if (addedContent) {
      if (config.pushRules.hardBlock) {
        allFindings.push(...scanForSecrets(addedContent, chunk.filePath));
      }
      if (config.pushRules.softBlock) {
        allFindings.push(...scanForPolicyIssues(addedContent, chunk.filePath));
        allFindings.push(...scanForCopyleftDeps(addedContent, chunk.filePath));
      }
    }
  }

  // Filter disabled rules
  const filteredFindings = allFindings.filter(
    f => !config.pushRules.disabledRules.includes(f.id),
  );

  // Determine verdict
  const verdict = determineVerdict(filteredFindings);

  const result: ScanResult = {
    gate: 'push',
    verdict,
    timestamp: new Date().toISOString(),
    scannedCommits: commitCount,
    scannedFiles: fileChunks.length,
    findings: filteredFindings,
    overrides: [],
  };

  if (options.json) {
    printJsonResult(result);
  } else {
    printResult(result);
  }

  // Exit with non-zero code if blocked
  if (verdict === 'HARD_BLOCK' || verdict === 'SOFT_BLOCK') {
    process.exit(1);
  }
}

interface DiffChunk {
  filePath: string;
  addedLines: string[];
}

function parseDiff(diff: string): DiffChunk[] {
  const chunks: DiffChunk[] = [];
  let currentFile: string | null = null;
  let addedLines: string[] = [];

  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git')) {
      if (currentFile) {
        chunks.push({ filePath: currentFile, addedLines });
      }
      const match = line.match(/b\/(.+)$/);
      currentFile = match ? match[1] : null;
      addedLines = [];
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      addedLines.push(line.substring(1));
    }
  }

  if (currentFile) {
    chunks.push({ filePath: currentFile, addedLines });
  }

  return chunks;
}

function getCurrentBranch(): string {
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
}

function shouldIgnore(filePath: string, excludePatterns: string[], ignorePatterns: string[]): boolean {
  const allPatterns = [...excludePatterns, ...ignorePatterns];
  return allPatterns.some(pattern => minimatch(filePath, pattern));
}

function determineVerdict(findings: Finding[]): Verdict {
  if (findings.some(f => f.severity === 'HARD_BLOCK')) return 'HARD_BLOCK';
  if (findings.some(f => f.severity === 'SOFT_BLOCK' && !f.overridden)) return 'SOFT_BLOCK';
  if (findings.some(f => f.severity === 'WARN')) return 'WARN';
  return 'PASS';
}
