<script setup lang="ts">
// Вкладка «Настройки» главной панели — operational/business-настройки, доступные
// сотрудникам (`guardInternalApi`: Admin или активный `panel_access`).
// Системные настройки (секреты, URL, log-level, project_name) живут в /web/admin
// под `requireAccountRole('Admin')`.
//
// Состав:
//   - Полоска-обзор: чипы статусов трёх каналов (GetCourse / виджет LifePay /
//     виджет Lava.Top) — клик прокручивает к соответствующей секции.
//   - Секция «GetCourse» — переключатель `gc_enabled`.
//   - Секция «Виджеты оплаты» (`HomeWidgetSettings`) — две внутренние карточки
//     для LifePay и Lava.Top.
import { computed, ref } from 'vue'
import { saveOperationalSettingRoute } from '../../api/settings/save-operational'
import HomeWidgetSettings from './HomeWidgetSettings.vue'
import type { WidgetSettingsData } from '../../shared/widgetSettingsTypes'

declare const ctx: app.Ctx

const props = defineProps<{
  initialGcEnabled?: boolean
  initialGcCreatePayment?: boolean
  initialWidgetSettings?: WidgetSettingsData
  anchorBaseUrl?: string
}>()

const gcEnabled = ref<boolean>(!!props.initialGcEnabled)
const savedGcEnabled = ref<boolean>(!!props.initialGcEnabled)
const gcCreatePayment = ref<boolean>(props.initialGcCreatePayment !== false)
const savedGcCreatePayment = ref<boolean>(props.initialGcCreatePayment !== false)
const saving = ref(false)
const message = ref('')
const error = ref(false)
const widgetSettingsLive = ref<WidgetSettingsData | undefined>(props.initialWidgetSettings)

const hasUnsaved = computed(
  () =>
    gcEnabled.value !== savedGcEnabled.value || gcCreatePayment.value !== savedGcCreatePayment.value
)

const lifepayOn = computed(() => !!widgetSettingsLive.value?.lifepayEnabled)
const lavatopOn = computed(() => !!widgetSettingsLive.value?.lavatopEnabled)

function focusSection(id: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function saveGc() {
  message.value = ''
  error.value = false
  saving.value = true
  try {
    const pairs: Array<{ key: string; value: string }> = [
      { key: 'gc_enabled', value: gcEnabled.value ? 'true' : 'false' },
      { key: 'gc_create_payment', value: gcCreatePayment.value ? 'true' : 'false' }
    ]
    for (const { key, value } of pairs) {
      const res = await saveOperationalSettingRoute.run(ctx, { key, value })
      const data = res as { success?: boolean; error?: string }
      if (data?.success === false) {
        throw new Error(data.error || 'ошибка')
      }
    }
    savedGcEnabled.value = gcEnabled.value
    savedGcCreatePayment.value = gcCreatePayment.value
    message.value = 'Сохранено.'
  } catch (e) {
    message.value = (e as Error)?.message || String(e)
    error.value = true
  } finally {
    saving.value = false
  }
}

function onWidgetUpdate(next: WidgetSettingsData) {
  widgetSettingsLive.value = next
}
</script>

<template>
  <div class="st-tab">
    <!-- Полоска-обзор: компактный статус трёх каналов на одной строке. -->
    <div class="st-overview" role="status" aria-label="Статус операционных настроек">
      <span class="st-overview-label">Каналы:</span>
      <div class="st-overview-pills">
        <button
          type="button"
          class="st-overview-pill"
          :class="savedGcEnabled ? 'is-on' : 'is-off'"
          @click="focusSection('st-section-gc')"
          :title="savedGcEnabled ? 'GetCourse подключён' : 'GetCourse отключён'"
        >
          <span class="st-dot"></span>
          <i class="fas fa-graduation-cap"></i>
          GetCourse
        </button>
        <button
          type="button"
          class="st-overview-pill"
          :class="lifepayOn ? 'is-on' : 'is-off'"
          @click="focusSection('st-section-widgets')"
          :title="lifepayOn ? 'Виджет LifePay включён' : 'Виджет LifePay выключен'"
        >
          <span class="st-dot"></span>
          <i class="fas fa-mobile-screen-button"></i>
          Виджет LifePay
        </button>
        <button
          type="button"
          class="st-overview-pill"
          :class="lavatopOn ? 'is-on' : 'is-off'"
          @click="focusSection('st-section-widgets')"
          :title="lavatopOn ? 'Виджет Lava.Top включён' : 'Виджет Lava.Top выключен'"
        >
          <span class="st-dot"></span>
          <i class="fas fa-coins"></i>
          Виджет Lava.Top
        </button>
      </div>
    </div>

    <!-- Секция «GetCourse». -->
    <section id="st-section-gc" class="panel-section st-section">
      <header class="panel-section-head">
        <span class="prompt">›</span>
        <h2>GetCourse</h2>
      </header>
      <p class="st-section-sub">
        Подключение к школе GetCourse: загрузка списка операций для вкладки «Создать запрос» и
        фильтр виджетов по офферам GC. Когда выключено — на SSR не запрашивается каталог, в
        дропдауне нет группы «GetCourse», офферы для фильтра виджетов недоступны.
      </p>

      <label class="st-toggle-row" :for="'gc-enabled-toggle'">
        <span class="st-toggle">
          <input id="gc-enabled-toggle" v-model="gcEnabled" type="checkbox" :disabled="saving" />
          <span class="st-toggle-slider"></span>
        </span>
        <span class="st-toggle-text">
          <span class="st-toggle-title">Подключение к GetCourse</span>
          <span class="st-toggle-hint">
            Секреты и хост школы настраивает администратор в разделе
            <code>/web/admin</code>.
          </span>
        </span>
        <span class="st-toggle-state" :class="gcEnabled ? 'is-on' : ''">
          {{ gcEnabled ? 'Включено' : 'Выключено' }}
        </span>
      </label>

      <label class="st-toggle-row" :for="'gc-create-payment-toggle'">
        <span class="st-toggle">
          <input
            id="gc-create-payment-toggle"
            v-model="gcCreatePayment"
            type="checkbox"
            :disabled="saving"
          />
          <span class="st-toggle-slider"></span>
        </span>
        <span class="st-toggle-text">
          <span class="st-toggle-title">Создавать платёж</span>
          <span class="st-toggle-hint">
            Передавать <code>deal_is_paid=1</code> при вызове <code>createDeal</code> в GetCourse.
            Если выключено — передаётся <code>deal_is_paid=0</code>.
          </span>
        </span>
        <span class="st-toggle-state" :class="gcCreatePayment ? 'is-on' : ''">
          {{ gcCreatePayment ? 'Включено' : 'Выключено' }}
        </span>
      </label>

      <div class="st-actions">
        <button type="button" class="btn-primary" :disabled="!hasUnsaved || saving" @click="saveGc">
          <i class="fas fa-save"></i>
          {{ saving ? 'Сохранение…' : 'Сохранить' }}
        </button>
        <span v-if="hasUnsaved" class="st-unsaved" title="Есть несохранённые изменения">
          <i class="fas fa-circle"></i> Не сохранено
        </span>
        <p v-if="message" class="st-msg" :class="error ? 'is-err' : 'is-ok'">
          <i class="fas" :class="error ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
          {{ message }}
        </p>
      </div>
    </section>

    <!-- Секция «Виджеты оплаты»: внутри — две карточки. -->
    <section id="st-section-widgets">
      <HomeWidgetSettings
        :initial-widget-settings="props.initialWidgetSettings"
        :anchor-base-url="props.anchorBaseUrl"
        @update:widget-settings="onWidgetUpdate"
      />
    </section>
  </div>
</template>
