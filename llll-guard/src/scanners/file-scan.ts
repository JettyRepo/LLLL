import type { AddedLine } from '../diff.js';
import type { Finding, GuardConfig } from '../types.js';
import { publicByDesignReason, type PublicByDesignDeps } from './public-by-design.js';
import { scanFilePathForSecrets, scanForSecretHits, isEnvTemplatePath } from './secret-scanner.js';
import { scanForCopyleftDeps, scanForPolicyIssues, scanManifestPath } from './policy-scanner.js';

export interface FileChange {
  path: string;
  added: AddedLine[];
}

// A prose extension, or one of the conventional names with at most one suffix (LICENSE-MIT).
// `readme-parser.ts` is code, so a name that merely starts with README does not count.
const DOCUMENT =
  /\.(?:md|markdown|txt|rst|adoc)$|^(?:README|CHANGELOG|CHANGES|HISTORY|LICENSE|LICENCE|NOTICE|CONTRIBUTING|COPYING|AUTHORS)(?:[-_][A-Za-z0-9]+)?$/i;

// `.txt` files that are not prose: dependency lists and build files.
const NOT_PROSE = /^(?:requirements|constraints)[\w.-]*\.txt$|^CMakeLists\.txt$/i;

/** Prose, where a credential example is common and a policy keyword means nothing. */
export function isDocumentPath(filePath: string): boolean {
  const base = filePath.split('/').pop() ?? filePath;
  return DOCUMENT.test(base) && !NOT_PROSE.test(base);
}

/**
 * Findings for one file changed by one commit.
 *
 * - Path rules (.env, key files, internal files, manifests) apply to every file.
 * - Documentation is still scanned. Credentials in a provider's own format, a password inside a
 *   connection string and personal data block, so a real key pasted into notes.txt is caught;
 *   obvious placeholders and published example values pass. A credential-looking assignment
 *   in prose is only a warning, because prose is full of examples. Policy keywords do not apply.
 * - Env templates are scanned like code, except that placeholder values pass and policy keywords
 *   (`OPENAI_API_KEY=` names a variable, it does not add an integration) do not apply.
 * - A generic assignment can be a deliberately public credential; see public-by-design.ts.
 */
export function scanFileChange(change: FileChange, config: GuardConfig, deps: PublicByDesignDeps): Finding[] {
  const findings: Finding[] = [];

  const pathFinding = scanFilePathForSecrets(change.path, { internalFilePatterns: config.internalFilePatterns });
  if (pathFinding) findings.push(pathFinding);

  const manifest = scanManifestPath(change.path);
  if (manifest) findings.push(manifest);

  const content = change.added.map(l => l.text).join('\n');
  if (!content) return findings;

  const document = isDocumentPath(change.path);
  const template = isEnvTemplatePath(change.path);

  if (config.pushRules.hardBlock) {
    const hits = scanForSecretHits(content, change.path, { allowPlaceholders: document || template });
    for (const hit of hits) {
      if (document && hit.tier === 'generic') {
        findings.push({
          ...hit.finding,
          severity: 'WARN',
          title: `${hit.finding.title} (in documentation)`,
          description: `${hit.finding.description}. Reported as a warning because it is in a documentation file.`,
          action: 'Check that this is an example, not a real credential.',
        });
        continue;
      }

      const reason = publicByDesignReason(
        {
          tier: hit.tier,
          ruleId: hit.finding.id,
          value: hit.value,
          valueStart: hit.valueStart,
          lineText: hit.lineText,
          file: change.path,
        },
        deps,
      );
      findings.push(
        reason
          ? {
              ...hit.finding,
              severity: 'WARN',
              title: `${hit.finding.title} (public by design)`,
              description: `${hit.finding.description}. Treated as deliberately public: ${reason}.`,
              action: 'Confirm that exposing this value, and any quota or billing it carries, is intended.',
            }
          : hit.finding,
      );
    }
  }

  if (config.pushRules.softBlock && !document && !template) {
    findings.push(...scanForPolicyIssues(content, change.path));
    findings.push(...scanForCopyleftDeps(content, change.path));
  }

  return findings;
}
