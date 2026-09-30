import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Sandbox } from '../helpers/repo.js';

// Audit finding covered here: H-4 (shell injection through the branch name).
// `gh pr checkout` creates a local branch named after the attacker's head branch.

let sb: Sandbox;

beforeEach(() => {
  sb = Sandbox.create();
});

afterEach(() => {
  sb.cleanup();
});

describe('git arguments never reach a shell', () => {
  it('does not execute shell syntax that is part of the branch name (audit H-4)', () => {
    // git accepts this name: `git check-ref-format --branch 'fix$(touch${IFS}PWNED)'`
    const branch = 'fix$(touch${IFS}PWNED)';
    sb.git(['switch', '-c', branch]);
    sb.commit({ 'a.js': 'const a = 1;\n' });

    sb.run(['push']);

    expect(sb.exists('PWNED')).toBe(false);
  });

  it('does not execute shell syntax passed through --branch (audit H-4)', () => {
    sb.commit({ 'a.js': 'const a = 1;\n' });

    sb.run(['push', '--branch', 'x$(touch${IFS}PWNED)']);

    expect(sb.exists('PWNED')).toBe(false);
  });
});
