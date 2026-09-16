/**
 * PKCE helpers (RFC 7636, S256 only) for the OAuth 2.1 authorization-code flow.
 *
 * Uses WebCrypto, which requires a secure context (HTTPS or localhost).
 */

export interface PkcePair {
  codeVerifier: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  state: string;
}

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += BASE64URL_ALPHABET[bytes[i] % BASE64URL_ALPHABET.length];
  }
  return out;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function s256Challenge(codeVerifier: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
  return base64UrlEncode(digest);
}

export async function createPkcePair(): Promise<PkcePair> {
  const codeVerifier = randomString(64);
  const codeChallenge = await s256Challenge(codeVerifier);
  return {
    codeVerifier,
    codeChallenge,
    codeChallengeMethod: 'S256',
    state: randomString(32),
  };
}

export default { createPkcePair };
