/**
 * SHA-256 hash usando Web Crypto API (nativa do browser)
 * Sem dependências externas.
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(String(password))
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
