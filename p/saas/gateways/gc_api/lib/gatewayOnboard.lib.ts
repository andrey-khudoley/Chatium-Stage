import * as gatewaySchoolRepo from '../repos/gatewaySchool.repo'
import * as secretSettings from './secretSettings.lib'
import * as gatewaySchoolSecrets from './gatewaySchoolSecrets.lib'
import * as cryptoLib from './crypto.lib'
import * as authToken from './authToken.lib'

export type OnboardInput = {
  schoolId: string
  schoolSlug: string
  schoolApiKey: string
  /** Если поле передано пустым — сбрасываем override; если undefined — не трогаем существующий. */
  devKeyOverride?: string | undefined
}

export async function onboardOrUpdateSchool(ctx: app.Ctx, input: OnboardInput): Promise<{ clientToken: string }> {
  const master = await secretSettings.ensureGatewayMasterKey(ctx)
  const enc = gatewaySchoolSecrets.encryptSchoolApiKey(input.schoolApiKey.trim(), master)

  const existing = await gatewaySchoolRepo.findBySchoolId(ctx, input.schoolId.trim())
  let devKeyOverrideCiphertext = existing?.devKeyOverrideCiphertext
  let devKeyOverrideIv = existing?.devKeyOverrideIv

  if (input.devKeyOverride !== undefined) {
    const trimmed = input.devKeyOverride.trim()
    if (trimmed) {
      const e = cryptoLib.encryptUtf8(trimmed, master)
      devKeyOverrideCiphertext = e.ciphertext
      devKeyOverrideIv = e.iv
    } else {
      devKeyOverrideCiphertext = undefined
      devKeyOverrideIv = undefined
    }
  }

  const { plainToken, hash, salt } = authToken.newClientTokenCredentials()

  await gatewaySchoolRepo.upsertBySchoolId(ctx, {
    schoolId: input.schoolId.trim(),
    schoolSlug: input.schoolSlug.trim(),
    schoolApiKeyCiphertext: enc.schoolApiKeyCiphertext,
    schoolApiKeyIv: enc.schoolApiKeyIv,
    devKeyOverrideCiphertext,
    devKeyOverrideIv,
    clientTokenHash: hash,
    clientTokenSalt: salt,
    allowedOps: existing?.allowedOps,
    isEnabled: existing?.isEnabled ?? true,
    createdAt: existing?.createdAt ?? Date.now(),
    lastUsedAt: existing?.lastUsedAt,
    notes: existing?.notes
  })

  return { clientToken: plainToken }
}
