import { SETTING_KEYS } from '../settings.lib'
import {
  paymentPluginManifests,
  validatePaymentPluginManifests
} from '../plugins/pluginRegistry.lib'
import {
  revealPluginSetting,
  savePluginSetting,
  toPluginPublicFieldValue
} from '../plugins/pluginSettings.lib'
import { tryPush, tryPushAsync, type LifepayUnitTestResult } from './lifepayUnitHelpers'

const knownSettingKeys = new Set<string>(Object.values(SETTING_KEYS))

export async function runPluginManifestUnitChecks(): Promise<LifepayUnitTestResult[]> {
  const results: LifepayUnitTestResult[] = []

  tryPush(results, 'plugin_manifests_validate', 'payment plugin manifests validate', () => {
    validatePaymentPluginManifests()
    return true
  })

  tryPush(results, 'plugin_manifest_ids', 'plugin ids are lifepay/lavatop/getcourse', () => {
    const ids = paymentPluginManifests.map((manifest) => manifest.id).sort()
    return ids.join(',') === 'getcourse,lavatop,lifepay'
  })

  tryPush(
    results,
    'plugin_manifest_field_keys_unique',
    'plugin field keys are globally unique',
    () => {
      const keys = paymentPluginManifests.flatMap((manifest) =>
        manifest.fields.map((field) => field.key)
      )
      return new Set(keys).size === keys.length
    }
  )

  tryPush(results, 'plugin_manifest_keys_known', 'plugin field keys exist in SETTING_KEYS', () =>
    paymentPluginManifests.every((manifest) =>
      manifest.fields.every((field) => knownSettingKeys.has(field.key))
    )
  )

  tryPush(
    results,
    'plugin_manifest_no_widget_keys',
    'payment plugins do not use widget_* keys',
    () =>
      paymentPluginManifests.every((manifest) =>
        manifest.fields.every((field) => !field.key.startsWith('widget_'))
      )
  )

  tryPush(
    results,
    'plugin_secret_public_value_write_only',
    'secret public DTO has no raw value',
    () => {
      const field = paymentPluginManifests
        .flatMap((manifest) => manifest.fields)
        .find((item) => item.key === SETTING_KEYS.LP_APIKEY)
      if (!field) return false
      const dto = toPluginPublicFieldValue(field, 'sk_test_secret_value')
      return (
        dto.hasValue === true &&
        dto.value === undefined &&
        dto.maskedValue !== 'sk_test_secret_value'
      )
    }
  )

  tryPush(results, 'plugin_login_public_value_masked', 'lp_login is masked in public DTO', () => {
    const field = paymentPluginManifests
      .flatMap((manifest) => manifest.fields)
      .find((item) => item.key === SETTING_KEYS.LP_LOGIN)
    if (!field) return false
    const dto = toPluginPublicFieldValue(field, '79991234567')
    return dto.hasValue === true && dto.value === undefined && dto.maskedValue === '+7999***4567'
  })

  tryPush(
    results,
    'plugin_boolean_public_value',
    'boolean public DTO returns boolean value',
    () => {
      const field = paymentPluginManifests
        .flatMap((manifest) => manifest.fields)
        .find((item) => item.key === SETTING_KEYS.GC_ENABLED)
      if (!field) return false
      const dto = toPluginPublicFieldValue(field, 'true')
      return dto.hasValue === true && dto.value === true
    }
  )

  await tryPushAsync(
    results,
    'plugin_save_unknown_plugin_rejected',
    'unknown plugin is rejected before save',
    async () => {
      try {
        await savePluginSetting({} as app.Ctx, 'unknown', SETTING_KEYS.LP_APIKEY, 'x')
        return false
      } catch (e) {
        return String(e).includes('Unknown payment plugin')
      }
    }
  )

  await tryPushAsync(
    results,
    'plugin_save_unknown_key_rejected',
    'unknown plugin key is rejected before save',
    async () => {
      try {
        await savePluginSetting({} as app.Ctx, 'lifepay', 'widget_lifepay_enabled', 'true')
        return false
      } catch (e) {
        return String(e).includes('Unknown plugin setting key')
      }
    }
  )

  await tryPushAsync(
    results,
    'plugin_save_object_value_rejected',
    'object plugin value is rejected before save',
    async () => {
      try {
        await savePluginSetting({} as app.Ctx, 'lifepay', SETTING_KEYS.GATEWAY_BASE_URL, {
          url: 'https://example.test'
        })
        return false
      } catch (e) {
        return String(e).includes('Plugin setting value must be a string')
      }
    }
  )

  await tryPushAsync(
    results,
    'plugin_reveal_non_secret_rejected',
    'non-secret plugin field cannot be revealed',
    async () => {
      try {
        await revealPluginSetting({} as app.Ctx, 'lifepay', SETTING_KEYS.GATEWAY_BASE_URL)
        return false
      } catch (e) {
        return String(e).includes('Plugin setting is not revealable')
      }
    }
  )

  return results
}
