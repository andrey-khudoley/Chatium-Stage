/**
 * Секреты gateway: master key, зашифрованный GC dev key, onboarding token.
 */
import * as crypto from 'crypto'
import * as settingsLib from './settings.lib'
import * as cryptoLib from './crypto.lib'

export type GcDevKeyEncryptedPayload = { ciphertext: string; iv: string }

export async function ensureGatewayMasterKey(ctx: app.Ctx): Promise<string> {
  const existing = await settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.GATEWAY_MASTER_KEY)
  if (typeof existing === 'string' && existing.length > 0) {
    cryptoLib.assertMasterKeyLength(existing)
    return existing
  }
  const key = crypto.randomBytes(32).toString('base64')
  await settingsLib.setSetting(ctx, settingsLib.SETTING_KEYS.GATEWAY_MASTER_KEY, key)
  return key
}

export async function getGatewayMasterKey(ctx: app.Ctx): Promise<string> {
  return ensureGatewayMasterKey(ctx)
}

export async function getGcDevKeyPlain(ctx: app.Ctx): Promise<string | null> {
  const raw = await settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.GC_DEV_KEY_ENCRYPTED)
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (typeof o.ciphertext !== 'string' || typeof o.iv !== 'string') return null
  const master = await getGatewayMasterKey(ctx)
  try {
    return cryptoLib.decryptUtf8(o.ciphertext, o.iv, master)
  } catch {
    return null
  }
}

export async function setGcDevKeyPlain(ctx: app.Ctx, plain: string): Promise<void> {
  const trimmed = plain.trim()
  if (!trimmed) {
    await settingsLib.setSetting(ctx, settingsLib.SETTING_KEYS.GC_DEV_KEY_ENCRYPTED, null)
    return
  }
  const master = await getGatewayMasterKey(ctx)
  const payload = cryptoLib.encryptUtf8(trimmed, master)
  const blob: GcDevKeyEncryptedPayload = { ciphertext: payload.ciphertext, iv: payload.iv }
  await settingsLib.setSetting(ctx, settingsLib.SETTING_KEYS.GC_DEV_KEY_ENCRYPTED, blob)
}

export async function getOnboardingToken(ctx: app.Ctx): Promise<string> {
  const v = await settingsLib.getSetting(ctx, settingsLib.SETTING_KEYS.ONBOARDING_TOKEN)
  return typeof v === 'string' ? v : ''
}

export async function setOnboardingToken(ctx: app.Ctx, token: string): Promise<void> {
  await settingsLib.setSetting(ctx, settingsLib.SETTING_KEYS.ONBOARDING_TOKEN, token.trim())
}
