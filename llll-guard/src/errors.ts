/**
 * A problem that stops the guard from doing its job (bad input, unreadable
 * config, unresolvable range). Reported with exit code 2, never as a pass.
 */
export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardError';
  }
}
