export type Verdict = 'PASS' | 'WARN' | 'SOFT_BLOCK' | 'HARD_BLOCK';
export type Gate = 'push' | 'release';
export type FindingCategory = 'secret' | 'data' | 'feature' | 'license' | 'leakage' | 'policy' | 'hygiene' | 'dependency';

export interface Finding {
  id: string;
  severity: Verdict;
  title: string;
  file?: string;
  line?: number;
  match?: string;
  category: FindingCategory;
  description: string;
  action: string;
  mapsToDomain?: string;
  overridden?: boolean;
  overrideJustification?: string;
  /**
   * For a SOFT_BLOCK finding: the token that `llll-guard override <ID>@<token>` takes. It covers
   * this rule on this file as it is at the introducing commit, so changing the file voids it.
   */
  overrideToken?: string;
  /** The commit that introduced the finding (push gate). */
  commit?: string;
}

export interface ScanResult {
  gate: Gate;
  verdict: Verdict;
  timestamp: string;
  scannedCommits?: number;
  scannedFiles: number;
  findings: Finding[];
  /** The overrides that were applied to this scan. */
  overrides: OverrideEntry[];
  /** Findings hidden by `disabledRules` in the policy, by rule id. Hidden is not the same as silent. */
  suppressedByPolicy?: Record<string, number>;
  /**
   * What the user needs to know about how this scan was judged: the defaults applied because the
   * remote has no policy, a rule class the policy turned off, files a .guardignore skipped.
   */
  notes?: string[];
}

export interface OverrideEntry {
  timestamp: string;
  action: 'override';
  findingIds: string[];
  /** Matches the `overrideToken` of one finding. */
  findingToken: string;
  actor: string;
  justification: string;
  filesAffected: string[];
  /** Who confirmed: a person at a terminal, or the --yes flag (automation). */
  confirmation: 'tty' | 'flag';
  expiresAt: string;
  verdictBefore: Verdict;
  verdictAfter: string;
}

export interface GuardConfig {
  enabled: boolean;
  pushRules: RuleConfig;
  releaseRules: RuleConfig;
  /** Files skipped entirely (lock files and other generated output). */
  excludePatterns: string[];
  /** Glob patterns for files that must never be committed (PG-H014). */
  internalFilePatterns: string[];
}

export interface RuleConfig {
  hardBlock: boolean;
  softBlock: boolean;
  warn: boolean;
  disabledRules: string[];
}

export interface WhitelistConfig {
  allowedPatterns: string[];
  maxPackageSize?: number;
}
