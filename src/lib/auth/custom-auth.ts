import crypto from 'crypto'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'life_os_custom_session'
const SESSION_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'life_os_fallback_session_secret_key_2026'

export interface AuthUser {
  id: string
  email: string
  displayName?: string
}

/**
 * Hashes a password using Node.js crypto PBKDF2 with SHA-512 and a random 16-byte salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verifies a plain text password against a stored salt:hash string.
 */
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, storedHash] = combinedHash.split(':')
    if (!salt || !storedHash) return false
    const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(computedHash, 'hex'))
  } catch {
    return false
  }
}

/**
 * Signs a custom JWT-style session token using HMAC SHA-256.
 */
export function signSessionToken(user: AuthUser): string {
  const payload = {
    id: user.id,
    email: user.email,
    displayName: user.displayName || user.email.split('@')[0],
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  }
  const base64Data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(base64Data).digest('base64url')
  return `${base64Data}.${signature}`
}

/**
 * Verifies and decodes a custom session token.
 */
export function verifySessionToken(token: string): AuthUser | null {
  try {
    const [base64Data, signature] = token.split('.')
    if (!base64Data || !signature) return null

    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(base64Data).digest('base64url')
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
