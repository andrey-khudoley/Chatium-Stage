<script setup lang="ts">
// Карточка «Настройки Lava.Top» — API-ключ магазина, секрет webhook и base URL gateway.
// Источник истины при первой загрузке — SSR-проп initialSettings; компонент сам сохраняет
// изменения через `saveSettingRoute` и показывает индикатор «не сохранено / OK / ERR».
import { computed, ref } from 'vue'
import { saveSettingRoute } from '../../api/settings/save'
import { createComponentLogger } from '../../shared/logger'

const log = createComponentLogger('AdminLavatopSettings')

declare const ctx: app.Ctx

const props = defineProps<{
  initialSettings?: {
    lava_test_apikey: string
    lava_base_url: string
    lava_webhook_secret: string
  }
}>()

const LAVA_SETTINGS_KEYS = ['lava_test_apikey', 'lava_base_url', 'lava_webhook_secret'] as const
type LavaSettingKey = (typeof LAVA_SETTINGS_KEYS)[number]

const lavaSettings = ref<Record<LavaSettingKey, string>>({
  lava_test_apikey: props.initialSettings?.lava_test_apikey ?? '',
  lava_base_url: props.initialSettings?.lava_base_url ?? '',
  lava_webhook_secret: props.initialSettings?.lava_webhook_secret ?? ''
})
const savedLavaSettings = ref<Record<LavaSettingKey, string>>({ ...lavaSettings.value })
const lavaSettingsMessage = ref('')
const lavaSettingsError = ref(false)
const lavaSettingsSaving = ref(false)

const hasUnsavedLavaSettings = computed(() =>
  LAVA_SETTINGS_KEYS.some(
    (k) => (lavaSettings.value[k] || '') !== (savedLavaSettings.value[k] || '')
  )
)

const generateWebhookSecret = () => {
  const chars = 'abcdef0123456789'
  let t = ''
  for (let i = 0; i < 32; i++) {
    t += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  lavaSettings.value.lava_webhook_secret = t
  log.notice('Сгенерирован webhook-секрет Lava.Top', { length: t.length })
}

const saveLavaSettings = async () => {
  log.info('saveLavaSettings entry')
  lavaSettingsMessage.value = ''
  lavaSettingsError.value = false
  lavaSettingsSaving.value = true
  try {
    for (const key of LAVA_SETTINGS_KEYS) {
      const value = lavaSettings.value[key] || ''
      // Пустые значения не отправляем — валидация lib отвергнет пустые секреты.
      if (!value) continue
      const res = await saveSettingRoute.run(ctx, { key, value })
      const data = res as { success?: boolean; error?: string }
      if (data?.success === false) {
        throw new Error(`${key}: ${data.error || 'ошибка'}`)
      }
    }
    savedLavaSettings.value = { ...lavaSettings.value }
    lavaSettingsMessage.value = 'Сохранено.'
    log.notice('Настройки Lava.Top сохранены')
  } catch (e) {
    lavaSettingsMessage.value = (e as Error)?.message || String(e)
    lavaSettingsError.value = true
    log.error('Ошибка сохранения настроек Lava.Top', lavaSettingsMessage.value)
  } finally {
    lavaSettingsSaving.value = false
    log.info('saveLavaSettings exit')
  }
}
</script>

<template>
  <section class="ap-card ap-card--stagger-3 ap-settings">
    <div class="ap-card-hd">
      <h2><i class="fas fa-wave-square ap-icon-hd"></i> Настройки Lava.Top</h2>
      <span
        v-if="lavaSettingsMessage"
        class="ap-badge"
        :class="lavaSettingsError ? 'ap-badge--err' : 'ap-badge--ok'"
      >
        <i :class="lavaSettingsError ? 'fas fa-times' : 'fas fa-check'"></i>
        {{ lavaSettingsError ? 'ERR' : 'OK' }}
      </span>
    </div>

    <form class="ap-set-form" @submit.prevent="saveLavaSettings">
      <fieldset class="ap-set-grp">
        <legend class="ap-set-legend"><i class="fas fa-key"></i> Авторизация</legend>
        <p class="ap-hint">
          API-ключ магазина Lava.Top — проксируется gateway-сервисом как X-Api-Key.
        </p>
        <div class="ap-set-fields">
          <label class="ap-field ap-field-full">
            <span class="ap-field-label">lava_test_apikey</span>
            <input
              v-model="lavaSettings.lava_test_apikey"
              type="password"
              autocomplete="off"
              class="ap-input"
            />
            <span class="ap-field-hint"
              >Передаётся в заголовке <code>X-Lava-Apikey</code> к gateway Lava.Top.</span
            >
          </label>
        </div>
      </fieldset>

      <fieldset class="ap-set-grp">
        <legend class="ap-set-legend"><i class="fas fa-bell"></i> Webhook</legend>
        <p class="ap-hint">
          Секрет webhook Lava.Top — проверяется на входящем
          <code>/web/webhook-lavatop</code>. Минимум 16 символов.
        </p>
        <div class="ap-set-fields">
          <label class="ap-field ap-field-full">
            <span class="ap-field-label">lava_webhook_secret</span>
            <div class="ap-field-row">
              <input
                v-model="lavaSettings.lava_webhook_secret"
                type="password"
                autocomplete="off"
                class="ap-input"
              />
              <button type="button" class="ap-btn" @click="generateWebhookSecret">
                <i class="fas fa-bolt"></i> Сгенерировать
              </button>
            </div>
          </label>
        </div>
      </fieldset>

      <fieldset class="ap-set-grp">
        <legend class="ap-set-legend"><i class="fas fa-server"></i> Gateway</legend>
        <p class="ap-hint">
          Базовый URL Lava.Top gateway. Дефолт — <code>https://gate.lava.top</code>.
        </p>
        <div class="ap-set-fields">
          <label class="ap-field ap-field-full">
            <span class="ap-field-label">lava_base_url</span>
            <input
              v-model="lavaSettings.lava_base_url"
              type="text"
              placeholder="https://gate.lava.top"
              class="ap-input"
            />
          </label>
        </div>
      </fieldset>

      <div class="ap-save-bar">
        <button
          type="submit"
          class="ap-btn ap-btn--primary"
          :disabled="!hasUnsavedLavaSettings || lavaSettingsSaving"
        >
          <i class="fas fa-save"></i>
          {{ lavaSettingsSaving ? 'Сохранение…' : 'Сохранить' }}
        </button>
        <span v-if="hasUnsavedLavaSettings" class="ap-unsaved" title="Есть несохранённые изменения">
          <i class="fas fa-circle"></i> Не сохранено
        </span>
        <p
          v-if="lavaSettingsMessage"
          class="ap-msg"
          :class="lavaSettingsError ? 'ap-msg--err' : 'ap-msg--ok'"
        >
          <i
            class="fas"
            :class="lavaSettingsError ? 'fa-exclamation-circle' : 'fa-check-circle'"
          ></i>
          {{ lavaSettingsMessage }}
        </p>
      </div>
    </form>
  </section>
</template>
