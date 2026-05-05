import type { GatewaySchoolRow } from '../tables/gatewaySchool.table'
import * as gatewaySchoolRepo from '../repos/gatewaySchool.repo'
import * as cryptoLib from './crypto.lib'

export function parseBearer(authHeader: string | undefined): string | null {
  if (!authHeader || typeof authHeader !== 'string') return null
  const m = /^Bearer\s+(.+)$/i.exec(authHeader.trim())
  return m ? m[1].trim() : null
}

export async function authenticateBearer(
  ctx: app.Ctx,
  authHeader: string | undefined,
  schoolId: string
): Promise<GatewaySchoolRow | null> {
  const token = parseBearer(authHeader)
  if (!token || !schoolId) return null
  const school = await gatewaySchoolRepo.findBySchoolId(ctx, schoolId.trim())
  if (!school || !school.isEnabled) return null
  const ok = cryptoLib.verifyTokenSlow(token, school.clientTokenHash, school.clientTokenSalt)
  return ok ? school : null
}

/** Генерирует plain-токен и возвращает хэш/соль для записи в школу */
export function newClientTokenCredentials(): { plainToken: string; hash: string; salt: string } {
  const plainToken = cryptoLib.randomUrlSafeToken(32)
  const { hash, salt } = cryptoLib.hashTokenSlow(plainToken)
  return { plainToken, hash, salt }
}
