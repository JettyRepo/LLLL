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
}

export interface ScanResult {
  gate: Gate;
  verdict: Verdict;
  timestamp: string;
  scannedCommits?: number;
  scannedFiles: number;
  findings: Finding[];
  overrides: OverrideEntry[];
}

export interface OverrideEntry {
  timestamp: string;
  action: 'override';
  findingIds: string[];
  actor: string;
  justification: string;
  filesAffected: string[];
  verdictBefore: Verdict;
  verdictAfter: string;
}

export interface GuardConfig {
  enabled: boolean;
  pushRules: RuleConfig;
  releaseRules: RuleConfig;
  excludePatterns: string[];
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
