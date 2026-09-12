import crypto from 'crypto'
import fs from 'fs'

// Load .env.local manually
if (fs.existsSync('.env.local')) {
  const content = fs.readFileSync('.env.local', 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=')
      const k = trimmed.slice(0, idx).trim()
      const v = trimmed.slice(idx + 1).trim()
      if (!process.env[k]) process.env[k] = v
    }
  }
}

console.log('=== LIFE//OS CUSTOM AUTH SECURITY VERIFICATION ===')

// 1. Test scrypt Password Hashing & Verification
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = crypto.scryptSync(password, salt, 64)
  return `${salt}:${derivedKey.toString('hex')}`
}

function verifyPassword(password, combinedHash) {
  try {
    const [salt, storedHash] = combinedHash.split(':')
    if (!salt || !storedHash) return false
    const derivedKey = crypto.scryptSync(password, salt, 64)
    const storedBuffer = Buffer.from(storedHash, 'hex')
    if (storedBuffer.length !== derivedKey.length) return false
    return crypto.timingSafeEqual(storedBuffer, derivedKey)
  } catch {
    return false
  }
}

const testPass = 'OperatorSecPass2026!'
const hash = hashPassword(testPass)
console.log('[1] Generated scrypt hash:', hash.slice(0, 32) + '...')
const isValid = verifyPassword(testPass, hash)
const isInvalid = verifyPassword('WrongPassword!', hash)

if (isValid && !isInvalid) {
  console.log('  -> PASS: scrypt password hashing & timing-safe verification verified.')
} else {
  console.error('  -> FAIL: scrypt password verification failed.')
  process.exit(1)
}

// 2. Test Session Signing & Tamper Resistance
const secret = process.env.LIFEOS_SESSION_SECRET
if (!secret) {
  console.error('  -> FAIL: LIFEOS_SESSION_SECRET is missing.')
  process.exit(1)
}

function signSessionToken(user, sec) {
  const payload = {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  }
  const base64Data = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = crypto.createHmac('sha256', sec).update(base64Data).digest('base64url')
  return `${base64Data}.${signature}`
}

function verifySessionToken(token, sec) {
  try {
    const [base64Data, signature] = token.split('.')
    if (!base64Data || !signature) return null

    const expectedSig = crypto.createHmac('sha256', sec).update(base64Data).digest('base64url')
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

const mockUser = { id: crypto.randomUUID(), email: 'sec_test@lifeos.dev', displayName: 'Sec Tester' }
const token = signSessionToken(mockUser, secret)
const verified = verifySessionToken(token, secret)
const tamperedToken = token.slice(0, -4) + 'abcd'
const verifiedTampered = verifySessionToken(tamperedToken, secret)
const wrongSecretVerified = verifySessionToken(token, 'different_secret_key_12345')

if (verified && verified.id === mockUser.id && !verifiedTampered && !wrongSecretVerified) {
  console.log('[2] PASS: Session token minting, verification, and tamper rejection verified.')
} else {
  console.error('[2] FAIL: Session token verification test failed.')
  process.exit(1)
}

console.log('=== ALL SECURITY ARCHITECTURE TESTS PASSED ===')
