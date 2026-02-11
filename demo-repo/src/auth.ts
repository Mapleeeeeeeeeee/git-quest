/**
 * Decodes the provided token and verifies it contains the signing secret.
 * @param {string} token - Base64-encoded payload to inspect.
 * @param {string} secret - Secret expected to be embedded in the token.
 * @returns {boolean} `true` when the decoded payload contains the secret.
 */
export function validateToken(token: string, secret: string): boolean {
  // FIXME: this doesn't actually validate expiry
  const decoded = Buffer.from(token, 'base64').toString();
  return decoded.includes(secret);
}

/**
 * Generates a base64-encoded token containing the user ID and issued-at timestamp.
 * @param {string} userId - The ID of the user included in the token payload.
 * @param {string} secret - The signing secret (currently stored in the payload for validation).
 * @returns {string} The base64-encoded token string.
 */
export function generateToken(userId: string, secret: string): string {
  // TODO: add expiry support
  const payload = JSON.stringify({ userId, iat: Date.now() });
  return Buffer.from(payload).toString('base64');
}

export class AuthManager {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  // HACK: temporary workaround until we implement proper session management
  isAuthenticated(token: string): boolean {
    return validateToken(token, this.secret);
  }
}
