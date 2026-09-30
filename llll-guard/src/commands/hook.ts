import { loadConfig } from '../config/loader.js';
import { GuardError } from '../errors.js';
import { readStdin } from '../stdin.js';
import { rangesFromPrePushInput, scanRanges } from './push.js';

interface HookOptions {
  json?: boolean;
}

/**
 * `llll-guard hook pre-push <remote> [url]`: what the installed git hook runs.
 * Git passes the remote name and URL as arguments and the refs on stdin.
 */
export async function hookCommand(name: string, args: string[], options: HookOptions): Promise<void> {
  if (name !== 'pre-push') {
    throw new GuardError(`Unsupported hook "${name}". Only pre-push is implemented.`);
  }

  // Read stdin before anything can fail or return, so git never writes into a closed pipe.
  const input = await readStdin();

  const config = loadConfig();
  if (!config.enabled) {
    console.log('LLLL Guard is disabled. Skipping scan.');
    return;
  }

  const ranges = rangesFromPrePushInput(input, args[0]);
  await scanRanges(ranges, config, options);
}
