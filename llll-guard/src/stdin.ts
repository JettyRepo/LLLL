import { GuardError } from './errors.js';

/**
 * Reads all of stdin. Only used where git is known to send input (the pre-push hook);
 * a terminal, or a pipe that never closes, is an error rather than a hang.
 */
export function readStdin(timeoutMs = 10_000): Promise<string> {
  if (process.stdin.isTTY) {
    return Promise.reject(
      new GuardError('This command reads the refs git sends on stdin. Run it from a git hook, not from a terminal.'),
    );
  }

  return new Promise((resolve, reject) => {
    let data = '';
    const timer = setTimeout(() => {
      process.stdin.destroy();
      reject(new GuardError('Timed out waiting for git to send the refs on stdin.'));
    }, timeoutMs);

    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timer);
      resolve(data);
    });
    process.stdin.on('error', error => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
