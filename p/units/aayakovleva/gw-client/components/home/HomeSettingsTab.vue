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
import { useSettingsAutoSave, type AutoSaveResult } from '../../shared/useSettingsAutoSave'
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
const gcCreatePayment = ref<boolean>(props.initialGcCreatePayment !== false)
const widgetSettingsLive = ref<WidgetSettingsData | undefined>(props.initialWidgetSettings)

// Автосохранение operational-настроек GetCourse по мере изменения (как в системной админке).
const { saving, saveStatus, error, flush } = useSettingsAutoSave({
  save: (key, value) =>
    saveOperationalSettingRoute.run(ctx, { key, value }) as Promise<AutoSaveResult>
})

const lifepayOn = computed(() => !!widgetSettingsLive.value?.lifepayEnabled)
const lavatopOn = computed(() => !!widgetSettingsLive.value?.lavatopEnabled)

function focusSection(id: string) {
  if (typeof document === 'undefined') return
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Тумблеры сохраняем немедленно; при ошибке откатываем визуальное состояние.
async function onGcEnabledChange() {
  const ok = await flush('gc_enabled', gcEnabled.value ? 'true' : 'false')
  if (!ok) gcEnabled.value = !gcEnabled.value
}

async function onGcCreatePaymentChange() {
  const ok = await flush('gc_create_payment', gcCreatePayment.value ? 'true' : 'false')
  if (!ok) gcCreatePayment.value = !gcCreatePayment.value
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
          :class="gcEnabled ? 'is-on' : 'is-off'"
          @click="focusSection('st-section-gc')"
          :title="gcEnabled ? 'GetCourse подключён' : 'GetCourse отключён'"
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
          <input
            id="gc-enabled-toggle"
            v-model="gcEnabled"
            type="checkbox"
            :disabled="saving"
            @change="onGcEnabledChange"
          />
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
            @change="onGcCreatePaymentChange"
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
        <span v-if="saving" class="st-msg">
          <i class="fas fa-spinner fa-spin"></i> Сохранение…
        </span>
        <span v-else-if="saveStatus === 'saved'" class="st-msg is-ok">
          <i class="fas fa-check-circle"></i> Сохранено
        </span>
        <span v-else-if="saveStatus === 'error'" class="st-msg is-err">
          <i class="fas fa-exclamation-circle"></i> {{ error }}
        </span>
        <span v-else class="st-field-hint">
          <i class="fas fa-bolt"></i> Изменения сохраняются автоматически
        </span>
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
