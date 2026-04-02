import { existsSync, writeFileSync, chmodSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PRE_PUSH_HOOK = `#!/bin/sh
# LLLL Guard — Pre-Push Compliance Gate
# Installed by: llll-guard install-hook

echo "LLLL Guard: Scanning outgoing changes..."
npx llll-guard push

exit_code=$?
if [ $exit_code -ne 0 ]; then
  echo ""
  echo "LLLL Guard: Push blocked. Fix findings above or use 'llll-guard override' for SOFT_BLOCK items."
  exit $exit_code
fi
`;

interface InstallOptions {
  force?: boolean;
}

export async function installHook(options: InstallOptions): Promise<void> {
  const hooksDir = resolve(process.cwd(), '.git', 'hooks');
  const hookPath = resolve(hooksDir, 'pre-push');

  if (!existsSync(resolve(process.cwd(), '.git'))) {
    console.error('Not a git repository. Run this command from a git repository root.');
    process.exit(1);
  }

  if (existsSync(hookPath) && !options.force) {
    const existing = readFileSync(hookPath, 'utf-8');
    if (existing.includes('llll-guard')) {
      console.log('LLLL Guard pre-push hook is already installed.');
      return;
    }
    console.error('A pre-push hook already exists. Use --force to overwrite.');
    process.exit(1);
  }

  writeFileSync(hookPath, PRE_PUSH_HOOK);
  chmodSync(hookPath, '755');

  console.log('LLLL Guard pre-push hook installed successfully.');
  console.log(`  Location: ${hookPath}`);
  console.log('');
  console.log('The hook will run "llll-guard push" before every git push.');
  console.log('To uninstall, delete the pre-push hook file.');
}
