// Fake credentials used by the tests.
//
// Every value is assembled at runtime so that no secret-looking literal is
// committed to the repository. Literals would be blocked by Guard itself and
// rejected by GitHub push protection.

const j = (...parts: string[]): string => parts.join('');

export const FAKE = {
  awsKey: j('AK', 'IA', 'Q'.repeat(16)),
  openaiKey: j('sk-', 'abcdefghijklmnopqrstuvwxyz', '1234567890'),
  openaiProjectKey: j('sk-', 'proj-', 'abc123def456ghi789jkl012mno345'),
  anthropicKey: j('sk-', 'ant-', 'api03-abc123def456ghi789jkl012mno345'),
  stripeLiveKey: j('sk', '_live_', 'abc123def456ghi789jkl012'),
  githubPat: j('gh', 'p_', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij'),
  githubFineGrainedPat: j('github', '_pat_', 'A'.repeat(22), '_', 'B'.repeat(40)),
  slackBotToken: j('xox', 'b-', '123456789012-', '123456789012-', 'abcdefghijklmnopqrstuvwx'),
  googleApiKey: j('AI', 'za', 'Sy', 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6', 'Q'),
  /** High-entropy value that matches no provider pattern. */
  genericApiKeyValue: 'AbCdEf0123456789XyZqWe',
  pemRsa: j('-----', 'BEGIN RSA PRIVATE', ' KEY-----'),
  pemPkcs8: j('-----', 'BEGIN PRIVATE', ' KEY-----'),
  pemEncrypted: j('-----', 'BEGIN ENCRYPTED PRIVATE', ' KEY-----'),
  /** Passes the Luhn check. */
  cardNumberLuhnValid: j('4111', '1111', '1111', '1111'),
  /** Sixteen digits that fail the Luhn check (for example a timestamp). */
  sixteenDigitsNotACard: j('1234', '5678', '9012', '3456'),
};
