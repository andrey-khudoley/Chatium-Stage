<script setup lang="ts">
// Карточка «Настройки LifePay» — редактирование секретов магазина, webhook-токена и base URL gateway.
// Источник истины при первой загрузке — SSR-проп initialSettings; компонент сам сохраняет изменения
// через `saveSettingRoute` и показывает индикатор «не сохранено / OK / ERR».
import { computed, ref } from 'vue'
import { saveSettingRoute } from '../../api/settings/save'
import { createComponentLogger } from '../../shared/logger'

const log = createComponentLogger('AdminLifePaySettings')

declare const ctx: app.Ctx

const props = defineProps<{
  initialSettings?: {
    lp_apikey: string
    lp_login: string
    lp_webhook_token: string
    gateway_base_url: string
  }
}>()

const LP_SETTINGS_KEYS = ['lp_apikey', 'lp_login', 'lp_webhook_token', 'gateway_base_url'] as const
type LpSettingKey = (typeof LP_SETTINGS_KEYS)[number]

const lpSettings = ref<Record<LpSettingKey, string>>({
  lp_apikey: props.initialSettings?.lp_apikey ?? '',
  lp_login: props.initialSettings?.lp_login ?? '',
  lp_webhook_token: props.initialSettings?.lp_webhook_token ?? '',
  gateway_base_url: props.initialSettings?.gateway_base_url ?? ''
})
const savedLpSettings = ref<Record<LpSettingKey, string>>({ ...lpSettings.value })
const lpSettingsMessage = ref('')
const lpSettingsError = ref(false)
const lpSettingsSaving = ref(false)

const hasUnsavedLpSettings = computed(() =>
  LP_SETTINGS_KEYS.some((k) => (lpSettings.value[k] || '') !== (savedLpSettings.value[k] || ''))
)

const generateWebhookToken = () => {
  const chars = 'abcdef0123456789'
  let t = ''
  for (let i = 0; i < 64; i++) {
    t += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  lpSettings.value.lp_webhook_token = t
  log.notice('Сгенерирован webhook-токен', { length: t.length })
}

const saveLpSettings = async () => {
  log.info('saveLpSettings entry')
  lpSettingsMessage.value = ''
  lpSettingsError.value = false
  lpSettingsSaving.value = true
  try {
    for (const key of LP_SETTINGS_KEYS) {
      const value = lpSettings.value[key] || ''
      // Пустые значения не отправляем — валидация lib отвергнет пустые секреты.
      if (!value) continue
      const res = await saveSettingRoute.run(ctx, { key, value })
      const data = res as { success?: boolean; error?: string }
      if (data?.success === false) {
        throw new Error(`${key}: ${data.error || 'ошибка'}`)
      }
    }
    savedLpSettings.value = { ...lpSettings.value }
    lpSettingsMessage.value = 'Сохранено.'
    log.notice('Настройки LifePay сохранены')
  } catch (e) {
    lpSettingsMessage.value = (e as Error)?.message || String(e)
    lpSettingsError.value = true
    log.error('Ошибка сохранения настроек LifePay', lpSettingsMessage.value)
  } finally {
    lpSettingsSaving.value = false
    log.info('saveLpSettings exit')
  }
}
</script>

<template>
  <section class="ap-card ap-card--stagger-3 ap-settings">
    <div class="ap-card-hd">
      <h2><i class="fas fa-plug ap-icon-hd"></i> Настройки LifePay</h2>
      <span
        v-if="lpSettingsMessage"
        class="ap-badge"
        :class="lpSettingsError ? 'ap-badge--err' : 'ap-badge--ok'"
      >
        <i :class="lpSettingsError ? 'fas fa-times' : 'fas fa-check'"></i>
        {{ lpSettingsError ? 'ERR' : 'OK' }}
      </span>
    </div>

    <form class="ap-set-form" @submit.prevent="saveLpSettings">
      <fieldset class="ap-set-grp">
        <legend class="ap-set-legend"><i class="fas fa-key"></i> Авторизация</legend>
        <p class="ap-hint">Учётные данные магазина для подписи API-вызовов к gateway.</p>
        <div class="ap-set-fields">
          <label class="ap-field">
            <span class="ap-field-label">lp_apikey (API-ключ магазина)</span>
            <input
              v-model="lpSettings.lp_apikey"
              type="password"
              autocomplete="off"
              class="ap-input"
            />
            <span class="ap-field-hint">Передаётся в заголовке <code>X-Lp-Apikey</code>.</span>
          </label>
          <label class="ap-field">
            <span class="ap-field-label">lp_login (телефон, 11 цифр, первая 7)</span>
            <input
              v-model="lpSettings.lp_login"
              type="text"
              placeholder="79991234567"
              class="ap-input"
            />
            <span class="ap-field-hint">Передаётся в заголовке <code>X-Lp-Login</code>.</span>
          </label>
        </div>
      </fieldset>

      <fieldset class="ap-set-grp">
        <legend class="ap-set-legend"><i class="fas fa-bell"></i> Webhook</legend>
        <p class="ap-hint">
          Токен для аутентификации входящего webhook от LifePay (query
          <code>?token=…</code>). Минимум 32 символа.
        </p>
        <div class="ap-set-fields">
          <label class="ap-field ap-field-full">
            <span class="ap-field-label">lp_webhook_token</span>
            <div class="ap-field-row">
              <input
                v-model="lpSettings.lp_webhook_token"
                type="password"
                autocomplete="off"
                class="ap-input"
              />
              <button type="button" class="ap-btn" @click="generateWebhookToken">
                <i class="fas fa-bolt"></i> Сгенерировать
              </button>
            </div>
          </label>
        </div>
      </fieldset>

      <fieldset class="ap-set-grp">
        <legend class="ap-set-legend"><i class="fas fa-server"></i> Gateway</legend>
        <p class="ap-hint">
          Публичный URL payments-gateway, через который выполняются все вызовы LifePay API.
        </p>
        <div class="ap-set-fields">
          <label class="ap-field ap-field-full">
            <span class="ap-field-label">gateway_base_url</span>
            <input
              v-model="lpSettings.gateway_base_url"
              type="text"
              placeholder="https://.../p/saas/gw/lifepay"
              class="ap-input"
            />
          </label>
        </div>
      </fieldset>

      <div class="ap-save-bar">
        <button
          type="submit"
          class="ap-btn ap-btn--primary"
          :disabled="!hasUnsavedLpSettings || lpSettingsSaving"
        >
          <i class="fas fa-save"></i> {{ lpSettingsSaving ? 'Сохранение…' : 'Сохранить' }}
        </button>
        <span v-if="hasUnsavedLpSettings" class="ap-unsaved" title="Есть несохранённые изменения">
          <i class="fas fa-circle"></i> Не сохранено
        </span>
        <p
          v-if="lpSettingsMessage"
          class="ap-msg"
          :class="lpSettingsError ? 'ap-msg--err' : 'ap-msg--ok'"
        >
          <i class="fas" :class="lpSettingsError ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
          {{ lpSettingsMessage }}
        </p>
      </div>
    </form>
  </section>
</template>
