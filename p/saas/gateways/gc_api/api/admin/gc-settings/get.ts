// @shared-route
import { requireAccountRole } from '@app/auth'
import * as secretSettings from '../../../lib/secretSettings.lib'

/** GET — флаги конфигурации GC (без секретов). */
export const adminGcSettingsGetRoute = app.get('/', async (ctx, _req) => {
  requireAccountRole(ctx, 'Admin')
  const devPlain = await secretSettings.getGcDevKeyPlain(ctx)
  const onboarding = await secretSettings.getOnboardingToken(ctx)
  return {
    success: true,
    gcDevKeyConfigured: !!(devPlain && devPlain.trim()),
    onboardingTokenConfigured: !!(onboarding && onboarding.trim())
  }
})
