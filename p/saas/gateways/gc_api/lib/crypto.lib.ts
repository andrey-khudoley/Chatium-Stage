/**
 * AES-256-GCM и медленный хэш для Bearer-токенов (PBKDF2).
 * Ключ шифрования — gateway_master_key (32 байта, base64).
 */
import * as nodeCrypto from 'crypto'

const AES_ALGO = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const PBKDF2_ITERATIONS = 120_000
const PBKDF2_KEYLEN = 64
const SALT_BYTES = 16

export function assertMasterKeyLength(masterKeyBase64: string): void {
  const buf = Buffer.from(masterKeyBase64, 'base64')
  if (buf.length !== 32) {
    throw new Error('gateway_master_key должен быть ровно 32 байта в base64')
  }
}

function masterKeyBuffer(masterKeyBase64: string): Buffer {
  assertMasterKeyLength(masterKeyBase64)
  return Buffer.from(masterKeyBase64, 'base64')
}

/** Шифрование строки UTF-8 → base64(ciphertext+tag), iv base64 */
export function encryptUtf8(plain: string, masterKeyBase64: string): { ciphertext: string; iv: string } {
  const iv = nodeCrypto.randomBytes(IV_LENGTH)
  const key = masterKeyBuffer(masterKeyBase64)
  const cipher = nodeCrypto.createCipheriv(AES_ALGO, key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const combined = Buffer.concat([enc, tag])
  return { ciphertext: combined.toString('base64'), iv: iv.toString('base64') }
}

/** Дешифрование из encryptUtf8 */
export function decryptUtf8(ciphertextB64: string, ivB64: string, masterKeyBase64: string): string {
  const iv = Buffer.from(ivB64, 'base64')
  const combined = Buffer.from(ciphertextB64, 'base64')
  if (combined.length < AUTH_TAG_LENGTH) {
    throw new Error('Некорректный ciphertext')
  }
  const tag = combined.subarray(combined.length - AUTH_TAG_LENGTH)
  const enc = combined.subarray(0, combined.length - AUTH_TAG_LENGTH)
  const key = masterKeyBuffer(masterKeyBase64)
  const decipher = nodeCrypto.createDecipheriv(AES_ALGO, key, iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

export function hashTokenSlow(plain: string): { hash: string; salt: string } {
  const salt = nodeCrypto.randomBytes(SALT_BYTES).toString('base64')
  const hash = nodeCrypto
    .pbkdf2Sync(plain, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha512')
    .toString('base64')
  return { hash, salt }
}

export function verifyTokenSlow(plain: string, hashB64: string, saltB64: string): boolean {
  try {
    const derived = nodeCrypto
      .pbkdf2Sync(plain, saltB64, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, 'sha512')
      .toString('base64')
    const a = Buffer.from(derived)
    const b = Buffer.from(hashB64)
    if (a.length !== b.length) return false
    return nodeCrypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export function randomUrlSafeToken(bytes = 32): string {
  return nodeCrypto.randomBytes(bytes).toString('base64url')
}
