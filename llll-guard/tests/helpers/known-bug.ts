import { it } from 'vitest';

/**
 * Marks a test that states desired behaviour which the current code does not
 * deliver yet (an audit finding). Expected to FAIL today, so the suite stays
 * green; the phase that fixes the defect replaces `knownBug(` with `it(`.
 *
 * Run `LLLL_FIXED=1 npm test` to execute these as ordinary tests and read the
 * real failure messages, to confirm each one fails for the intended reason.
 */
export const knownBug = process.env.LLLL_FIXED === '1' ? it : it.fails;
