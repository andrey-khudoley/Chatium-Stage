import { SETTING_KEYS } from '../../lib/settings.lib'
import type { PaymentPluginManifest } from '../../shared/pluginManifestTypes'

export const getcoursePluginManifest: PaymentPluginManifest = {
  id: 'getcourse',
  title: 'GetCourse',
  description: 'Integration settings for GetCourse offers and payment requests.',
  icon: 'fa-graduation-cap',
  fields: [
    {
      key: SETTING_KEYS.GC_BASE_URL,
      label: 'Base URL',
      input: 'url',
      required: true,
      placeholder: 'https://example.getcourse.ru'
    },
    {
      key: SETTING_KEYS.GC_TEST_SCHOOL_API_KEY,
      label: 'School API key',
      input: 'password',
      secret: true,
      required: true
    },
    {
      key: SETTING_KEYS.GC_TEST_SCHOOL_HOST,
      label: 'School host',
      input: 'text',
      required: true,
      placeholder: 'example.getcourse.ru'
    },
    {
      key: SETTING_KEYS.GC_ENABLED,
      label: 'Enabled',
      input: 'boolean'
    },
    {
      key: SETTING_KEYS.GC_CREATE_PAYMENT,
      label: 'Create payment in GetCourse',
      input: 'boolean'
    }
  ]
}
