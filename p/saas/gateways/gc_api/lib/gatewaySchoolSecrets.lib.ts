import type { GatewaySchoolRow } from '../tables/gatewaySchool.table'
import * as cryptoLib from './crypto.lib'
import * as secretSettings from './secretSettings.lib'

export function decryptSchoolApiKey(row: GatewaySchoolRow, masterKeyBase64: string): string {
  return cryptoLib.decryptUtf8(row.schoolApiKeyCiphertext, row.schoolApiKeyIv, masterKeyBase64)
}

export function encryptSchoolApiKey(
  plain: string,
  masterKeyBase64: string
): { schoolApiKeyCiphertext: string; schoolApiKeyIv: string } {
  const { ciphertext, iv } = cryptoLib.encryptUtf8(plain, masterKeyBase64)
  return { schoolApiKeyCiphertext: ciphertext, schoolApiKeyIv: iv }
}

export async function decryptDevOverrideIfAny(
  ctx: app.Ctx,
  row: GatewaySchoolRow,
  masterKeyBase64: string
): Promise<string | null> {
  const ct = row.devKeyOverrideCiphertext
  const iv = row.devKeyOverrideIv
  if (typeof ct !== 'string' || typeof iv !== 'string' || !ct || !iv) return null
  try {
    return cryptoLib.decryptUtf8(ct, iv, masterKeyBase64)
  } catch {
    return null
  }
}

export async function getEffectiveDevKey(ctx: app.Ctx, row: GatewaySchoolRow): Promise<string | null> {
  const master = await secretSettings.getGatewayMasterKey(ctx)
  const override = await decryptDevOverrideIfAny(ctx, row, master)
  if (override?.trim()) return override.trim()
  return secretSettings.getGcDevKeyPlain(ctx)
}
