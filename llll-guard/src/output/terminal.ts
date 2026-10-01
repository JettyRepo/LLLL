import chalk from 'chalk';
import type { ScanResult, Finding, Gate } from '../types.js';

const SEVERITY_COLORS = {
  HARD_BLOCK: chalk.red.bold,
  SOFT_BLOCK: chalk.yellow.bold,
  WARN: chalk.blue,
  PASS: chalk.green.bold,
} as const;

export function printResult(result: ScanResult): void {
  const gateName = result.gate === 'push' ? 'Push Gate' : 'Release Gate';

  // Verdict header
  console.log('');
  console.log(chalk.gray('┌' + '─'.repeat(50) + '┐'));
  console.log(chalk.gray('│') + ` LLLL Guard — ${gateName}`.padEnd(50) + chalk.gray('│'));
  console.log(chalk.gray('│') + ` Result: ${SEVERITY_COLORS[result.verdict](result.verdict)}`.padEnd(59) + chalk.gray('│'));
  console.log(chalk.gray('│') + ` Findings: ${summarizeFindings(result.findings)}`.padEnd(50) + chalk.gray('│'));
  if (result.scannedCommits !== undefined) {
    console.log(chalk.gray('│') + ` Scanned: ${result.scannedCommits} commits, ${result.scannedFiles} files`.padEnd(50) + chalk.gray('│'));
  } else {
    console.log(chalk.gray('│') + ` Scanned: ${result.scannedFiles} files`.padEnd(50) + chalk.gray('│'));
  }
  console.log(chalk.gray('└' + '─'.repeat(50) + '┘'));
  console.log('');

  for (const note of result.notes ?? []) {
    console.log(chalk.yellow(`  Note: ${note}`));
  }
  if ((result.notes ?? []).length > 0) console.log('');

  // Hidden is not silent: the policy on the remote turned these rules off, and the user is told so.
  if (result.suppressedByPolicy) {
    const hidden = Object.entries(result.suppressedByPolicy)
      .map(([id, count]) => `${id} x${count}`)
      .join(', ');
    console.log(chalk.yellow(`  Hidden by the policy: ${hidden}`));
    console.log('');
  }

  if (result.findings.length === 0) {
    // "Safe" is only said of a scan that was done as usual. With notes, or with findings hidden by
    // the policy, the result depends on how the scan was judged, and that is not for this line to hide.
    const plain = (result.notes ?? []).length === 0 && !result.suppressedByPolicy;
    console.log(
      plain
        ? chalk.green('  No issues found. Safe to proceed.')
        : chalk.yellow('  No issues found, but see above for how this was judged. This is not a plain clean scan.'),
    );
    console.log('');
    return;
  }

  // Group findings by severity
  const hardBlocks = result.findings.filter(f => f.severity === 'HARD_BLOCK');
  const softBlocks = result.findings.filter(f => f.severity === 'SOFT_BLOCK' && !f.overridden);
  const warns = result.findings.filter(f => f.severity === 'WARN');

  if (hardBlocks.length > 0) {
    console.log(chalk.red.bold('  HARD_BLOCK — Must fix before proceeding:'));
    console.log('');
    for (const finding of hardBlocks) {
      printFinding(finding);
    }
    if (hardBlocks.some(f => f.category === 'secret')) {
      console.log(chalk.red('  A committed secret stays in git history even if a later commit removes it.'));
      console.log(chalk.red('  Remove it from the commit (amend or rebase) and rotate the credential.'));
      console.log('');
    }
  }

  if (softBlocks.length > 0) {
    console.log(chalk.yellow.bold('  SOFT_BLOCK — Requires review or override:'));
    console.log('');
    for (const finding of softBlocks) {
      printFinding(finding);
    }
  }

  const overridden = result.findings.filter(f => f.severity === 'SOFT_BLOCK' && f.overridden);
  if (overridden.length > 0) {
    console.log(chalk.gray('  Overridden (accepted by a person, expires):'));
    for (const finding of overridden) {
      console.log(chalk.gray(`    [${finding.id}] ${finding.file ?? ''} — ${finding.overrideJustification ?? ''}`));
    }
    console.log('');
  }

  if (warns.length > 0) {
    console.log(chalk.blue('  WARN — Worth noting:'));
    console.log('');
    for (const finding of warns) {
      printFinding(finding);
    }
  }
}

function printFinding(finding: Finding): void {
  const color = SEVERITY_COLORS[finding.severity];
  const location = finding.file
    ? finding.line
      ? `${finding.file}:${finding.line}`
      : finding.file
    : '';

  console.log(`  ${color(`[${finding.id}]`)} ${finding.title} — ${color(finding.severity)}`);
  if (location) {
    console.log(chalk.gray(`    File: ${location}`));
  }
  if (finding.match) {
    console.log(chalk.gray(`    Match: ${finding.match}`));
  }
  console.log(chalk.gray(`    Category: ${finding.category}`));
  console.log(`    Action: ${finding.action}`);
  if (finding.severity === 'SOFT_BLOCK' && finding.overrideToken && !finding.overridden) {
    const file = finding.file ? ` --file ${finding.file}` : '';
    console.log(chalk.yellow(`    Override: llll-guard override ${finding.id}@${finding.overrideToken} "<justification>"${file}`));
  }
  console.log('');
}

function summarizeFindings(findings: Finding[]): string {
  const counts: Record<string, number> = {};
  for (const f of findings) {
    counts[f.severity] = (counts[f.severity] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([sev, count]) => `${count} ${sev}`)
    .join(', ') || 'none';
}
