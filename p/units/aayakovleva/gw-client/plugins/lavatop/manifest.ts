import { SETTING_KEYS } from '../../lib/settings.lib'
import type { PaymentPluginManifest } from '../../shared/pluginManifestTypes'

export const lavatopPluginManifest: PaymentPluginManifest = {
  id: 'lavatop',
  title: 'Lava.Top',
  description: 'Gateway settings for Lava.Top payments.',
  icon: 'fa-fire',
  fields: [
    {
      key: SETTING_KEYS.LAVA_TEST_APIKEY,
      label: 'API key',
      input: 'password',
      secret: true,
      required: true,
      placeholder: 'Lava.Top API key'
    },
    {
      key: SETTING_KEYS.LAVA_BASE_URL,
      label: 'Base URL',
      input: 'url',
      required: true,
      placeholder: 'https://gate.lava.top'
    },
    {
      key: SETTING_KEYS.LAVA_WEBHOOK_SECRET,
      label: 'Webhook secret',
      input: 'password',
      secret: true,
      required: true,
      generator: 'hex64'
    }
  ]
}
