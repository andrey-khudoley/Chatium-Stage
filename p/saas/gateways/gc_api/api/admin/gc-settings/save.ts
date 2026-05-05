// @shared-route
import { requireAccountRole } from '@app/auth'
import * as secretSettings from '../../../lib/secretSettings.lib'

/** POST — сохранить GC dev key и/или onboarding token (plain → шифрование в Heap). */
export const adminGcSettingsSaveRoute = app.post('/', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const body = (req.body ?? {}) as { gcDevKey?: unknown; onboardingToken?: unknown }

  if (typeof body.gcDevKey === 'string') {
    await secretSettings.setGcDevKeyPlain(ctx, body.gcDevKey)
  }
  if (typeof body.onboardingToken === 'string') {
    await secretSettings.setOnboardingToken(ctx, body.onboardingToken)
  }

  return { success: true }
})
