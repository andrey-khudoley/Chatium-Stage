<script setup lang="ts">
// Карточка «Настройки GetCourse» — базовый URL гейтвея, ключ тестовой школы
// и хост тестовой школы. Источник истины при первой загрузке — SSR-проп
// initialSettings; компонент сам сохраняет изменения через `saveSettingRoute`
// и показывает индикатор «не сохранено / OK / ERR».
// Флаг активации `gc_enabled` живёт на вкладке «Настройки» главной панели
// (HomeSettingsTab) — operational-тоггл рядом с журналом запросов.
import { computed, ref } from 'vue'
import { saveSettingRoute } from '../../api/settings/save'
import { createComponentLogger } from '../../shared/logger'

const log = createComponentLogger('AdminGcSettings')

declare const ctx: app.Ctx

const props = defineProps<{
  initialSettings?: {
    gc_base_url: string
    gc_test_school_api_key: string
    gc_test_school_host: string
  }
}>()

const GC_SETTINGS_KEYS = [
  'gc_base_url',
  'gc_test_school_api_key',
  'gc_test_school_host'
] as const
type GcSettingKey = (typeof GC_SETTINGS_KEYS)[number]

const gcSettings = ref<Record<GcSettingKey, string>>({
  gc_base_url: props.initialSettings?.gc_base_url ?? '',
  gc_test_school_api_key: props.initialSettings?.gc_test_school_api_key ?? '',
  gc_test_school_host: props.initialSettings?.gc_test_school_host ?? ''
})
const savedGcSettings = ref<Record<GcSettingKey, string>>({ ...gcSettings.value })
const gcSettingsMessage = ref('')
const gcSettingsError = ref(false)
const gcSettingsSaving = ref(false)

const hasUnsavedGcSettings = computed(() =>
  GC_SETTINGS_KEYS.some((k) => (gcSettings.value[k] || '') !== (savedGcSettings.value[k] || ''))
)

const saveGcSettings = async () => {
  log.info('saveGcSettings entry')
  gcSettingsMessage.value = ''
  gcSettingsError.value = false
  gcSettingsSaving.value = true
  try {
    for (const key of GC_SETTINGS_KEYS) {
      const value = gcSettings.value[key] ?? ''
      // Пустые значения не отправляем, чтобы валидация не отвергла очищение.
      if (!value) continue
      const res = await saveSettingRoute.run(ctx, { key, value })
      const data = res as { success?: boolean; error?: string }
      if (data?.success === false) {
        throw new Error(`${key}: ${data.error || 'ошибка'}`)
      }
    }
    savedGcSettings.value = { ...gcSettings.value }
    gcSettingsMessage.value = 'Сохранено.'
    log.notice('Настройки GC сохранены')
  } catch (e) {
    gcSettingsMessage.value = (e as Error)?.message || String(e)
    gcSettingsError.value = true
    log.error('Ошибка сохранения настроек GC', gcSettingsMessage.value)
  } finally {
    gcSettingsSaving.value = false
    log.info('saveGcSettings exit')
  }
}
</script>

<template>
  <section class="ap-card ap-card--stagger-3 ap-settings">
    <div class="ap-card-hd">
      <h2><i class="fas fa-graduation-cap ap-icon-hd"></i> Настройки GetCourse</h2>
      <span
        v-if="gcSettingsMessage"
        class="ap-badge"
        :class="gcSettingsError ? 'ap-badge--err' : 'ap-badge--ok'"
      >
        <i :class="gcSettingsError ? 'fas fa-times' : 'fas fa-check'"></i>
        {{ gcSettingsError ? 'ERR' : 'OK' }}
      </span>
    </div>

    <form class="ap-set-form" @submit.prevent="saveGcSettings">
      <fieldset class="ap-set-grp">
        <legend class="ap-set-legend"><i class="fas fa-server"></i> Gateway</legend>
        <p class="ap-hint">
          Базовый URL gateway GetCourse (<code>p/saas/gw/gc</code>). С него клиент загружает каталог
          enabled-операций и шлёт реальные запросы.
        </p>
        <div class="ap-set-fields">
          <label class="ap-field ap-field-full">
            <span class="ap-field-label">gc_base_url</span>
            <input
              v-model="gcSettings.gc_base_url"
              type="text"
              placeholder="https://p.chtm.khudoley.pro/p/saas/gw/gc"
              class="ap-input"
            />
            <span class="ap-field-hint">Без trailing slash. Должен начинаться с http(s)://.</span>
          </label>
        </div>
      </fieldset>

      <fieldset class="ap-set-grp">
        <legend class="ap-set-legend"><i class="fas fa-key"></i> Тестовая школа</legend>
        <p class="ap-hint">
          Заголовки школы, под которой gateway выполняет реальные запросы к GetCourse
          (<code>X-Gc-School-Api-Key</code>, <code>X-Gc-School-Host</code>).
        </p>
        <div class="ap-set-fields">
          <label class="ap-field ap-field-full">
            <span class="ap-field-label">gc_test_school_api_key</span>
            <input
              v-model="gcSettings.gc_test_school_api_key"
              type="password"
              autocomplete="off"
              class="ap-input"
            />
            <span class="ap-field-hint"
              >Передаётся в заголовке <code>X-Gc-School-Api-Key</code>.</span
            >
          </label>
          <label class="ap-field ap-field-full">
            <span class="ap-field-label">gc_test_school_host</span>
            <input
              v-model="gcSettings.gc_test_school_host"
              type="text"
              placeholder="school.getcourse.ru"
              class="ap-input"
            />
            <span class="ap-field-hint"
              >Hostname без схемы (без <code>http://</code>). Передаётся в заголовке
              <code>X-Gc-School-Host</code>.</span
            >
          </label>
        </div>
      </fieldset>

      <div class="ap-save-bar">
        <button
          type="submit"
          class="ap-btn ap-btn--primary"
          :disabled="!hasUnsavedGcSettings || gcSettingsSaving"
        >
          <i class="fas fa-save"></i>
          {{ gcSettingsSaving ? 'Сохранение…' : 'Сохранить' }}
        </button>
        <span v-if="hasUnsavedGcSettings" class="ap-unsaved" title="Есть несохранённые изменения">
          <i class="fas fa-circle"></i> Не сохранено
        </span>
        <p
          v-if="gcSettingsMessage"
          class="ap-msg"
          :class="gcSettingsError ? 'ap-msg--err' : 'ap-msg--ok'"
        >
          <i class="fas" :class="gcSettingsError ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
          {{ gcSettingsMessage }}
        </p>
      </div>
    </form>
  </section>
</template>
