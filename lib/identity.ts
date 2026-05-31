import { createHash, randomBytes } from 'crypto'

const TOKEN_BYTES = 32

function getHashSecret() {
  const secret = process.env.IDENTITY_HASH_SECRET || process.env.PORTONE_API_SECRET
  if (!secret) throw new Error('IDENTITY_HASH_SECRET is not configured')
  return secret
}

export function createVerificationToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url')
}

export function hashIdentityValue(value: string) {
  return createHash('sha256').update(`${getHashSecret()}:${value}`).digest('hex')
}

export function getPhoneLast4(phoneNumber?: string | null) {
  if (!phoneNumber) return null
  const digits = phoneNumber.replace(/\D/g, '')
  return digits.length >= 4 ? digits.slice(-4) : digits || null
}
