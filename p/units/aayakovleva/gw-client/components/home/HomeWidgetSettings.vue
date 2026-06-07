<script setup lang="ts">
/**
 * Виджеты оплаты — две независимые секции (LifePay и Lava.Top) на вкладке
 * «Настройки» главной панели. Каждая секция:
 *   - крупный переключатель «Виджет включён / выключен»;
 *   - две числовые цели лимита (мин / макс) с человекочитаемыми лейблами;
 *   - textarea с разрешёнными доменами (CORS-whitelist);
 *   - фильтр офферов (whitelist/blacklist), общий источник — GC `getOffers`;
 *   - сворачиваемый блок «Как встроить виджет» с DOM-якорь сниппетами;
 *   - кнопка «Сохранить» секции с индикацией статуса/несохранённых изменений.
 *
 * При каждом успешном сохранении эмитим `update:widgetSettings` (живой снимок),
 * чтобы родительский `HomeSettingsTab` пересчитал чипы статуса в шапке.
 *
 * Доступ — Admin или сотрудник с активным `panel_access` (виджет-настройки —
 * operational/бизнес, не секреты).
 */
import { computed, onMounted, ref, watch } from 'vue'
import { widgetSettingsSaveRoute } from '../../api/widgets/settings-save'
import { widgetOffersRoute } from '../../api/widgets/offers'
import { useSettingsAutoSave, type AutoSaveResult } from '../../shared/useSettingsAutoSave'
import {
  WIDGET_SETTING_KEYS,
  type WidgetSettingsData,
  type WidgetOfferListType,
  type AllowedOffer
} from '../../shared/widgetSettingsTypes'
import { createComponentLogger } from '../../shared/logger'
import HomeWidgetOfferList from './HomeWidgetOfferList.vue'

const log = createComponentLogger('HomeWidgetSettings')

declare const ctx: app.Ctx

const props = defineProps<{
  initialWidgetSettings?: WidgetSettingsData
  anchorBaseUrl?: string
}>()

const emit = defineEmits<{
  (e: 'update:widgetSettings', value: WidgetSettingsData): void
}>()

const defaults: WidgetSettingsData = {
  lifepayEnabled: false,
  lifepayDomains: '',
  lifepayMin: 0,
  lifepayMax: 0,
  // 'off' — фильтр не применяется, виджет показан всем (режим Выключен).
  lifepayOfferListType: 'off',
  lifepayOffers: [],
  lavatopEnabled: false,
  lavatopDomains: '',
  lavatopMin: 0,
  lavatopMax: 0,
  // 'off' — фильтр не применяется, виджет показан всем (режим Выключен).
  lavatopOfferListType: 'off',
  lavatopOffers: []
}

const initial = props.initialWidgetSettings ?? defaults

// LifePay
const lifepayEnabled = ref<boolean>(initial.lifepayEnabled)
const lifepayDomains = ref<string>(initial.lifepayDomains)
const lifepayMin = ref<number>(initial.lifepayMin)
const lifepayMax = ref<number>(initial.lifepayMax)
const lifepayOfferListType = ref<WidgetOfferListType>(initial.lifepayOfferListType)
const lifepayOffers = ref<AllowedOffer[]>([...(initial.lifepayOffers ?? [])])

// Lava.Top
const lavatopEnabled = ref<boolean>(initial.lavatopEnabled)
const lavatopDomains = ref<string>(initial.lavatopDomains)
const lavatopMin = ref<number>(initial.lavatopMin)
const lavatopMax = ref<number>(initial.lavatopMax)
const lavatopOfferListType = ref<WidgetOfferListType>(initial.lavatopOfferListType)
const lavatopOffers = ref<AllowedOffer[]>([...(initial.lavatopOffers ?? [])])

// Автосохранение по мере изменения — отдельный экземпляр на секцию (свой статус/ошибка).
const saveWidgetSetting = (key: string, value: unknown) =>
  widgetSettingsSaveRoute.run(ctx, { key, value }) as Promise<AutoSaveResult>

const {
  saving: lifepaySaving,
  saveStatus: lifepaySaveStatus,
  error: lifepayError,
  queue: lifepayQueue,
  flush: lifepayFlush
} = useSettingsAutoSave({ save: saveWidgetSetting })

const {
  saving: lavatopSaving,
  saveStatus: lavatopSaveStatus,
  error: lavatopError,
  queue: lavatopQueue,
  flush: lavatopFlush
} = useSettingsAutoSave({ save: saveWidgetSetting })

function snapshot(): WidgetSettingsData {
  return {
    lifepayEnabled: lifepayEnabled.value,
    lifepayDomains: lifepayDomains.value,
    lifepayMin: lifepayMin.value || 0,
    lifepayMax: lifepayMax.value || 0,
    lifepayOfferListType: lifepayOfferListType.value,
    lifepayOffers: [...lifepayOffers.value],
    lavatopEnabled: lavatopEnabled.value,
    lavatopDomains: lavatopDomains.value,
    lavatopMin: lavatopMin.value || 0,
    lavatopMax: lavatopMax.value || 0,
    lavatopOfferListType: lavatopOfferListType.value,
    lavatopOffers: [...lavatopOffers.value]
  }
}

const lifepayDomainCount = computed(
  () => lifepayDomains.value.split(/[\s,;\n]+/).filter(Boolean).length
)
const lavatopDomainCount = computed(
  () => lavatopDomains.value.split(/[\s,;\n]+/).filter(Boolean).length
)

function emitSnapshot() {
  emit('update:widgetSettings', snapshot())
}

/* ====== LifePay: автосохранение по полям ====== */

// Тумблер сохраняем немедленно; при ошибке откатываем визуальное состояние.
async function onLifepayEnabled() {
  emitSnapshot()
  const ok = await lifepayFlush(WIDGET_SETTING_KEYS.LIFEPAY_ENABLED, String(lifepayEnabled.value))
  if (!ok) {
    lifepayEnabled.value = !lifepayEnabled.value
    emitSnapshot()
  }
}

// Инвариант: пустой список офферов = фильтр выключен ('off'). Иначе whitelist/blacklist
// без офферов сохранился бы как активный фильтр в UI, но 'off' на сервере (рассинхрон).
function persistLifepayOfferFilter() {
  if (lifepayOffers.value.length === 0 && lifepayOfferListType.value !== 'off') {
    lifepayOfferListType.value = 'off'
  }
  lifepayQueue(WIDGET_SETTING_KEYS.LIFEPAY_OFFER_LIST_TYPE, lifepayOfferListType.value)
  lifepayQueue(WIDGET_SETTING_KEYS.LIFEPAY_OFFERS, JSON.stringify(lifepayOffers.value))
  emitSnapshot()
  log.notice('LifePay-фильтр офферов изменён', { offerCount: lifepayOffers.value.length })
}

watch(lifepayMin, () => {
  emitSnapshot()
  lifepayQueue(WIDGET_SETTING_KEYS.LIFEPAY_MIN, String(lifepayMin.value || 0))
})
watch(lifepayMax, () => {
  emitSnapshot()
  lifepayQueue(WIDGET_SETTING_KEYS.LIFEPAY_MAX, String(lifepayMax.value || 0))
})
watch(lifepayDomains, () => {
  emitSnapshot()
  lifepayQueue(WIDGET_SETTING_KEYS.LIFEPAY_DOMAINS, lifepayDomains.value)
})
watch(lifepayOfferListType, persistLifepayOfferFilter)
watch(lifepayOffers, persistLifepayOfferFilter, { deep: true })

/* ====== Lava.Top: автосохранение по полям ====== */

async function onLavatopEnabled() {
  emitSnapshot()
  const ok = await lavatopFlush(WIDGET_SETTING_KEYS.LAVATOP_ENABLED, String(lavatopEnabled.value))
  if (!ok) {
    lavatopEnabled.value = !lavatopEnabled.value
    emitSnapshot()
  }
}

function persistLavatopOfferFilter() {
  if (lavatopOffers.value.length === 0 && lavatopOfferListType.value !== 'off') {
    lavatopOfferListType.value = 'off'
  }
  lavatopQueue(WIDGET_SETTING_KEYS.LAVATOP_OFFER_LIST_TYPE, lavatopOfferListType.value)
  lavatopQueue(WIDGET_SETTING_KEYS.LAVATOP_OFFERS, JSON.stringify(lavatopOffers.value))
  emitSnapshot()
  log.notice('Lava.Top-фильтр офферов изменён', { offerCount: lavatopOffers.value.length })
}

watch(lavatopMin, () => {
  emitSnapshot()
  lavatopQueue(WIDGET_SETTING_KEYS.LAVATOP_MIN, String(lavatopMin.value || 0))
})
watch(lavatopMax, () => {
  emitSnapshot()
  lavatopQueue(WIDGET_SETTING_KEYS.LAVATOP_MAX, String(lavatopMax.value || 0))
})
watch(lavatopDomains, () => {
  emitSnapshot()
  lavatopQueue(WIDGET_SETTING_KEYS.LAVATOP_DOMAINS, lavatopDomains.value)
})
watch(lavatopOfferListType, persistLavatopOfferFilter)
watch(lavatopOffers, persistLavatopOfferFilter, { deep: true })

type OffersLoadResult = {
  success?: boolean
  offers?: { id: string; name: string; price?: number }[]
  error?: string
}

async function loadOffers(): Promise<OffersLoadResult> {
  return (await widgetOffersRoute.run(ctx)) as OffersLoadResult
}

const offerErrorHints: Record<string, string> = {
  GC_DISABLED:
    'GetCourse-интеграция выключена. Включите её в секции «GetCourse» выше, чтобы получить список офферов. Сохранённые id офферов не затронуты.',
  GC_NOT_CONFIGURED:
    'Не заполнены секреты GetCourse (адрес школы, API-ключ). Их задаёт администратор в разделе /web/admin. Сохранённые id офферов не затронуты.'
}

const anchorBase = computed(
  () => props.anchorBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
)

const copied = ref<Record<string, boolean>>({})
function copySnippet(key: string, text: string) {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text)
    }
  } catch (_e) {
    /* ignore */
  }
  copied.value = { ...copied.value, [key]: true }
  setTimeout(() => {
    copied.value = { ...copied.value, [key]: false }
  }, 1500)
}

const lifepaySnippets = computed(() => [
  {
    key: 'lp-common',
    code:
      `<script src="${anchorBase.value}/p/units/aayakovleva/gw-client/userscripts/common.js"></` +
      `script>`
  },
  {
    key: 'lp-widget',
    code:
      `<script src="${anchorBase.value}/p/units/aayakovleva/gw-client/userscripts/lifepay-widget.user.js"></` +
      `script>`
  },
  {
    key: 'lp-anchor',
    code: `<div id="gw-lifepay-widget" data-gw-base-url="${anchorBase.value}"></div>`
  }
])

const lavatopSnippets = computed(() => [
  {
    key: 'lv-common',
    code:
      `<script src="${anchorBase.value}/p/units/aayakovleva/gw-client/userscripts/common.js"></` +
      `script>`
  },
  {
    key: 'lv-widget',
    code:
      `<script src="${anchorBase.value}/p/units/aayakovleva/gw-client/userscripts/lavatop-widget.user.js"></` +
      `script>`
  },
  {
    key: 'lv-anchor',
    code: `<div id="gw-lavatop-widget" data-gw-base-url="${anchorBase.value}"></div>`
  }
])

onMounted(() => {
  log.info('Компонент смонтирован', {
    lifepayEnabled: lifepayEnabled.value,
    lavatopEnabled: lavatopEnabled.value,
    lifepayOfferCount: lifepayOffers.value.length,
    lavatopOfferCount: lavatopOffers.value.length
  })
})
</script>

<template>
  <div class="st-widget-stack">
    <!-- Виджет LifePay (СБП). -->
    <section class="panel-section st-section">
      <header class="panel-section-head">
        <span class="prompt">›</span>
        <h2>Виджет LifePay <span style="opacity: 0.6">(СБП)</span></h2>
      </header>
      <p class="st-section-sub">
        Встраиваемая кнопка на сторонней странице. По клику открывает модальное окно с QR-кодом
        Системы быстрых платежей. После оплаты приходит webhook, статус заказа обновляется
        автоматически.
      </p>

      <form class="ap-set-form" @submit.prevent>
        <label class="st-toggle-row" :for="'lp-widget-toggle'">
          <span class="st-toggle">
            <input
              id="lp-widget-toggle"
              v-model="lifepayEnabled"
              type="checkbox"
              :disabled="lifepaySaving"
              @change="onLifepayEnabled"
            />
            <span class="st-toggle-slider"></span>
          </span>
          <span class="st-toggle-text">
            <span class="st-toggle-title">Виджет на сторонних сайтах</span>
            <span class="st-toggle-hint">
              Когда выключено — виджет не отвечает на запросы конфигурации, кнопка покупки на чужих
              сайтах перестаёт работать.
            </span>
          </span>
          <span class="st-toggle-state" :class="lifepayEnabled ? 'is-on' : ''">
            {{ lifepayEnabled ? 'Включён' : 'Выключен' }}
          </span>
        </label>

        <div class="st-grid">
          <div>
            <label class="st-field-label" for="lp-min">Минимальная сумма, ₽</label>
            <input
              id="lp-min"
              v-model.number="lifepayMin"
              type="number"
              min="0"
              step="1"
              class="st-input"
              placeholder="0 — без ограничений"
            />
            <p class="st-field-hint">Ниже этого порога виджет не предложит оплату.</p>
          </div>
          <div>
            <label class="st-field-label" for="lp-max">Максимальная сумма, ₽</label>
            <input
              id="lp-max"
              v-model.number="lifepayMax"
              type="number"
              min="0"
              step="1"
              class="st-input"
              placeholder="0 — без ограничений"
            />
            <p class="st-field-hint">Серверный потолок — 500 000 ₽.</p>
          </div>
          <div class="st-field-full">
            <label class="st-field-label" for="lp-domains">
              Разрешённые домены
              <span style="opacity: 0.55">· найдено: {{ lifepayDomainCount }}</span>
            </label>
            <textarea
              id="lp-domains"
              v-model="lifepayDomains"
              class="st-textarea"
              placeholder="example.com, school.example.com"
            ></textarea>
            <p class="st-field-hint">
              Один домен в строке или через запятую. Запросы с других сайтов отклоняются CORS.
            </p>
          </div>
        </div>

        <div class="st-offer-block">
          <HomeWidgetOfferList
            v-model:list-type="lifepayOfferListType"
            v-model:selected-offers="lifepayOffers"
            title="Фильтр офферов LifePay"
            hint="«Выключен» — виджет работает на всех страницах. «Только выбранные» — покажется на странице перечисленных офферов. «Кроме выбранных» — на всех, кроме перечисленных. Источник списка — GetCourse."
            :error-hints="offerErrorHints"
            :loader="loadOffers"
          />
        </div>

        <details class="st-collapsible">
          <summary class="st-collapsible-summary">
            <i class="fas fa-chevron-right"></i>
            <i class="fas fa-code"></i>
            Как встроить виджет на сайт
          </summary>
          <div class="st-collapsible-body">
            <p class="st-field-hint" style="margin-top: 0; margin-bottom: 0.55rem">
              Вставьте три фрагмента в HTML страницы заказа. Виджет автоматически определяет позиции
              заказа из DOM (.deal-positions) и применяет фильтр офферов на клиенте. Email и сумма
              берутся из GetCourse-заказа на сервере.
            </p>
            <div v-for="s in lifepaySnippets" :key="s.key" class="st-snippet">
              <pre><code>{{ s.code }}</code></pre>
              <button
                type="button"
                class="st-snippet-copy"
                :class="copied[s.key] ? 'is-copied' : ''"
                @click="copySnippet(s.key, s.code)"
              >
                <i class="fas" :class="copied[s.key] ? 'fa-check' : 'fa-copy'"></i>
                {{ copied[s.key] ? 'Скопировано' : 'Копировать' }}
              </button>
            </div>
          </div>
        </details>

        <div class="st-actions">
          <span v-if="lifepaySaving" class="st-msg">
            <i class="fas fa-spinner fa-spin"></i> Сохранение…
          </span>
          <span v-else-if="lifepaySaveStatus === 'saved'" class="st-msg is-ok">
            <i class="fas fa-check-circle"></i> Сохранено
          </span>
          <span v-else-if="lifepaySaveStatus === 'error'" class="st-msg is-err">
            <i class="fas fa-exclamation-circle"></i> {{ lifepayError }}
          </span>
          <span v-else class="st-field-hint">
            <i class="fas fa-bolt"></i> Изменения сохраняются автоматически
          </span>
        </div>
      </form>
    </section>

    <!-- Виджет Lava.Top. -->
    <section class="panel-section st-section">
      <header class="panel-section-head">
        <span class="prompt">›</span>
        <h2>Виджет Lava.Top</h2>
      </header>
      <p class="st-section-sub">
        Встраиваемая кнопка на сторонней странице. По клику создаёт инвойс в Lava.Top и редиректит
        покупателя на форму оплаты. Статус заказа обновляется автоматически после webhook.
      </p>

      <form class="ap-set-form" @submit.prevent>
        <label class="st-toggle-row" :for="'lv-widget-toggle'">
          <span class="st-toggle">
            <input
              id="lv-widget-toggle"
              v-model="lavatopEnabled"
              type="checkbox"
              :disabled="lavatopSaving"
              @change="onLavatopEnabled"
            />
            <span class="st-toggle-slider"></span>
          </span>
          <span class="st-toggle-text">
            <span class="st-toggle-title">Виджет на сторонних сайтах</span>
            <span class="st-toggle-hint">
              Когда выключено — виджет не создаёт инвойсы и не отдаёт конфигурацию по запросу с
              сайтов.
            </span>
          </span>
          <span class="st-toggle-state" :class="lavatopEnabled ? 'is-on' : ''">
            {{ lavatopEnabled ? 'Включён' : 'Выключен' }}
          </span>
        </label>

        <div class="st-grid">
          <div>
            <label class="st-field-label" for="lv-min">Минимальная сумма, ₽</label>
            <input
              id="lv-min"
              v-model.number="lavatopMin"
              type="number"
              min="0"
              step="1"
              class="st-input"
              placeholder="0 — без ограничений"
            />
            <p class="st-field-hint">Ниже этого порога виджет не предложит оплату.</p>
          </div>
          <div>
            <label class="st-field-label" for="lv-max">Максимальная сумма, ₽</label>
            <input
              id="lv-max"
              v-model.number="lavatopMax"
              type="number"
              min="0"
              step="1"
              class="st-input"
              placeholder="0 — без ограничений"
            />
            <p class="st-field-hint">Серверный потолок — 500 000 ₽.</p>
          </div>
          <div class="st-field-full">
            <label class="st-field-label" for="lv-domains">
              Разрешённые домены
              <span style="opacity: 0.55">· найдено: {{ lavatopDomainCount }}</span>
            </label>
            <textarea
              id="lv-domains"
              v-model="lavatopDomains"
              class="st-textarea"
              placeholder="example.com, store.example.com"
            ></textarea>
            <p class="st-field-hint">
              Один домен в строке или через запятую. Запросы с других сайтов отклоняются CORS.
            </p>
          </div>
        </div>

        <div class="st-offer-block">
          <HomeWidgetOfferList
            v-model:list-type="lavatopOfferListType"
            v-model:selected-offers="lavatopOffers"
            title="Фильтр офферов Lava.Top"
            hint="«Выключен» — виджет работает на всех страницах. «Только выбранные» — покажется на странице перечисленных офферов. «Кроме выбранных» — на всех, кроме перечисленных. Источник списка — GetCourse."
            :error-hints="offerErrorHints"
            :loader="loadOffers"
          />
        </div>

        <details class="st-collapsible">
          <summary class="st-collapsible-summary">
            <i class="fas fa-chevron-right"></i>
            <i class="fas fa-code"></i>
            Как встроить виджет на сайт
          </summary>
          <div class="st-collapsible-body">
            <p class="st-field-hint" style="margin-top: 0; margin-bottom: 0.55rem">
              Вставьте три фрагмента в HTML страницы заказа. Виджет автоматически определяет позиции
              заказа из DOM (.deal-positions) и применяет фильтр офферов на клиенте. Email и сумма
              берутся из GetCourse-заказа на сервере.
            </p>
            <div v-for="s in lavatopSnippets" :key="s.key" class="st-snippet">
              <pre><code>{{ s.code }}</code></pre>
              <button
                type="button"
                class="st-snippet-copy"
                :class="copied[s.key] ? 'is-copied' : ''"
                @click="copySnippet(s.key, s.code)"
              >
                <i class="fas" :class="copied[s.key] ? 'fa-check' : 'fa-copy'"></i>
                {{ copied[s.key] ? 'Скопировано' : 'Копировать' }}
              </button>
            </div>
          </div>
        </details>

        <div class="st-actions">
          <span v-if="lavatopSaving" class="st-msg">
            <i class="fas fa-spinner fa-spin"></i> Сохранение…
          </span>
          <span v-else-if="lavatopSaveStatus === 'saved'" class="st-msg is-ok">
            <i class="fas fa-check-circle"></i> Сохранено
          </span>
          <span v-else-if="lavatopSaveStatus === 'error'" class="st-msg is-err">
            <i class="fas fa-exclamation-circle"></i> {{ lavatopError }}
          </span>
          <span v-else class="st-field-hint">
            <i class="fas fa-bolt"></i> Изменения сохраняются автоматически
          </span>
        </div>
      </form>
    </section>
  </div>
</template>
