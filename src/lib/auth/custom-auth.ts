import crypto from 'crypto'
import { cookies } from 'next/headers'

export const SESSION_COOKIE_NAME = 'life_os_session'

function getSessionSecret(): string {
  const secret = process.env.LIFEOS_SESSION_SECRET
  if (!secret) {
    throw new Error('FATAL SECURITY ERROR: LIFEOS_SESSION_SECRET environment variable is missing.')
  }
  return secret
}

export interface AuthUser {
  id: string
  email: string
  displayName?: string
}

/**
 * Hashes a password using Node.js crypto scrypt with a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verifies a plain text password against a stored salt:hash string using timing-safe equality.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, storedHash] = combinedHash.split(':')
    if (!salt || !storedHash) return false
    const derivedKey = crypto.scryptSync(password, salt, 64)
    const storedBuffer = Buffer.from(storedHash, 'hex')
    if (storedBuffer.length !== derivedKey.length) {
      // Fallback check for legacy PBKDF2 hashes if length doesn't match scrypt 64-byte key
      const pbkdf2Hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
      const legacyBuffer = Buffer.from(storedHash, 'hex')
      const pbkdf2Buffer = Buffer.from(pbkdf2Hash, 'hex')
      if (legacyBuffer.length !== pbkdf2Buffer.length) return false
      return crypto.timingSafeEqual(legacyBuffer, pbkdf2Buffer)
    }
    return crypto.timingSafeEqual(storedBuffer, derivedKey)
  } catch {
    return false
  }
}

/**
 * Signs a custom JWT-style session token using HMAC SHA-256 and LIFEOS_SESSION_SECRET.
 */
export function signSessionToken(user: AuthUser): string {
  const secret = getSessionSecret()
  const payload = {
    id: user.id,
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  const base64Data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(base64Data).digest('base64url')
  return `${base64Data}.${signature}`
}

/**
 * Verifies and decodes a custom session token.
 */
export function verifySessionToken(token: string): AuthUser | null {
  try {
    const secret = getSessionSecret()
    const [base64Data, signature] = token.split('.')
    if (!base64Data || !signature) return null

    const expectedSig = crypto.createHmac('sha256', secret).update(base64Data).digest('base64url')
    const sigBuffer = Buffer.from(signature)
    const expectedBuffer = Buffer.from(expectedSig)

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null
    }

    const payload = JSON.parse(Buffer.from(base64Data, 'base64url').toString('utf8'))
    if (payload.exp && Date.now() > payload.exp) {
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
      displayName: payload.displayName,
    }
  } catch {
    return null
  }
}

/**
 * Sets custom auth HTTP-only session cookie.
 */
export async function setCustomSessionCookie(user: AuthUser) {
  const cookieStore = await cookies()
  const token = signSessionToken(user)
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  })
}

/**
 * Retrieves custom authenticated user from HTTP-only session cookie.
 */
export async function getCustomSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get(SESSION_COOKIE_NAME)
    if (!cookie?.value) return null
    return verifySessionToken(cookie.value)
  } catch {
    return null
  }
}

/**
 * Clears custom auth session cookie.
 */
export async function clearCustomSessionCookie() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE_NAME)
  } catch {
    // Ignore cookie deletion errors in non-server context
  }
}
