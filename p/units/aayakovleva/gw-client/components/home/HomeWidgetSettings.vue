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
import { computed, onMounted, ref } from 'vue'
import { widgetSettingsSaveRoute } from '../../api/widgets/settings-save'
import { widgetOffersRoute } from '../../api/widgets/offers'
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

type SaveResult = { success?: boolean; error?: string }

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
  // 'blacklist' + пустой список = показать виджет всем (режим «Выключен»).
  lifepayOfferListType: 'blacklist',
  lifepayOffers: [],
  lavatopEnabled: false,
  lavatopDomains: '',
  lavatopMin: 0,
  lavatopMax: 0,
  // 'blacklist' + пустой список = показать виджет всем (режим «Выключен»).
  lavatopOfferListType: 'blacklist',
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
const lifepayMessage = ref('')
const lifepayError = ref(false)
const lifepaySaving = ref(false)

// Lava.Top
const lavatopEnabled = ref<boolean>(initial.lavatopEnabled)
const lavatopDomains = ref<string>(initial.lavatopDomains)
const lavatopMin = ref<number>(initial.lavatopMin)
const lavatopMax = ref<number>(initial.lavatopMax)
const lavatopOfferListType = ref<WidgetOfferListType>(initial.lavatopOfferListType)
const lavatopOffers = ref<AllowedOffer[]>([...(initial.lavatopOffers ?? [])])
const lavatopMessage = ref('')
const lavatopError = ref(false)
const lavatopSaving = ref(false)

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

async function saveSetting(key: string, value: unknown): Promise<SaveResult> {
  const res = (await widgetSettingsSaveRoute.run(ctx, { key, value })) as SaveResult
  return res
}

async function saveLifepay() {
  lifepayMessage.value = ''
  lifepayError.value = false
  lifepaySaving.value = true
  try {
    const enabledRes = await saveSetting(
      WIDGET_SETTING_KEYS.LIFEPAY_ENABLED,
      String(lifepayEnabled.value)
    )
    if (enabledRes?.success === false) throw new Error(enabledRes.error || 'enabled error')
    const domainsRes = await saveSetting(WIDGET_SETTING_KEYS.LIFEPAY_DOMAINS, lifepayDomains.value)
    if (domainsRes?.success === false) throw new Error(domainsRes.error || 'domains error')
    const minRes = await saveSetting(WIDGET_SETTING_KEYS.LIFEPAY_MIN, String(lifepayMin.value || 0))
    if (minRes?.success === false) throw new Error(minRes.error || 'min error')
    const maxRes = await saveSetting(WIDGET_SETTING_KEYS.LIFEPAY_MAX, String(lifepayMax.value || 0))
    if (maxRes?.success === false) throw new Error(maxRes.error || 'max error')
    const offerTypeRes = await saveSetting(
      WIDGET_SETTING_KEYS.LIFEPAY_OFFER_LIST_TYPE,
      lifepayOfferListType.value
    )
    if (offerTypeRes?.success === false)
      throw new Error(offerTypeRes.error || 'offer list type error')
    const offersRes = await saveSetting(
      WIDGET_SETTING_KEYS.LIFEPAY_OFFERS,
      JSON.stringify(lifepayOffers.value)
    )
    if (offersRes?.success === false) throw new Error(offersRes.error || 'offers error')
    lifepayMessage.value = 'Сохранено.'
    emit('update:widgetSettings', snapshot())
    log.notice('LifePay-настройки виджета сохранены', {
      offerCount: lifepayOffers.value.length
    })
  } catch (e) {
    lifepayMessage.value = (e as Error)?.message || String(e)
    lifepayError.value = true
    log.error('Ошибка сохранения LifePay-виджета', lifepayMessage.value)
  } finally {
    lifepaySaving.value = false
  }
}

async function saveLavatop() {
  lavatopMessage.value = ''
  lavatopError.value = false
  lavatopSaving.value = true
  try {
    const enabledRes = await saveSetting(
      WIDGET_SETTING_KEYS.LAVATOP_ENABLED,
      String(lavatopEnabled.value)
    )
    if (enabledRes?.success === false) throw new Error(enabledRes.error || 'enabled error')
    const domainsRes = await saveSetting(WIDGET_SETTING_KEYS.LAVATOP_DOMAINS, lavatopDomains.value)
    if (domainsRes?.success === false) throw new Error(domainsRes.error || 'domains error')
    const minRes = await saveSetting(WIDGET_SETTING_KEYS.LAVATOP_MIN, String(lavatopMin.value || 0))
    if (minRes?.success === false) throw new Error(minRes.error || 'min error')
    const maxRes = await saveSetting(WIDGET_SETTING_KEYS.LAVATOP_MAX, String(lavatopMax.value || 0))
    if (maxRes?.success === false) throw new Error(maxRes.error || 'max error')
    const offerTypeRes = await saveSetting(
      WIDGET_SETTING_KEYS.LAVATOP_OFFER_LIST_TYPE,
      lavatopOfferListType.value
    )
    if (offerTypeRes?.success === false)
      throw new Error(offerTypeRes.error || 'offer list type error')
    const offersRes = await saveSetting(
      WIDGET_SETTING_KEYS.LAVATOP_OFFERS,
      JSON.stringify(lavatopOffers.value)
    )
    if (offersRes?.success === false) throw new Error(offersRes.error || 'offers error')
    lavatopMessage.value = 'Сохранено.'
    emit('update:widgetSettings', snapshot())
    log.notice('Lava.Top-настройки виджета сохранены', {
      offerCount: lavatopOffers.value.length
    })
  } catch (e) {
    lavatopMessage.value = (e as Error)?.message || String(e)
    lavatopError.value = true
    log.error('Ошибка сохранения Lava.Top-виджета', lavatopMessage.value)
  } finally {
    lavatopSaving.value = false
  }
}

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
  <div>
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

      <form class="ap-set-form" @submit.prevent="saveLifepay">
        <label class="st-toggle-row" :for="'lp-widget-toggle'">
          <span class="st-toggle">
            <input id="lp-widget-toggle" v-model="lifepayEnabled" type="checkbox" />
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
          <button type="submit" class="btn-primary" :disabled="lifepaySaving">
            <i class="fas fa-save"></i>
            {{ lifepaySaving ? 'Сохранение…' : 'Сохранить' }}
          </button>
          <p v-if="lifepayMessage" class="st-msg" :class="lifepayError ? 'is-err' : 'is-ok'">
            <i class="fas" :class="lifepayError ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
            {{ lifepayMessage }}
          </p>
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

      <form class="ap-set-form" @submit.prevent="saveLavatop">
        <label class="st-toggle-row" :for="'lv-widget-toggle'">
          <span class="st-toggle">
            <input id="lv-widget-toggle" v-model="lavatopEnabled" type="checkbox" />
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
          <button type="submit" class="btn-primary" :disabled="lavatopSaving">
            <i class="fas fa-save"></i>
            {{ lavatopSaving ? 'Сохранение…' : 'Сохранить' }}
          </button>
          <p v-if="lavatopMessage" class="st-msg" :class="lavatopError ? 'is-err' : 'is-ok'">
            <i class="fas" :class="lavatopError ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
            {{ lavatopMessage }}
          </p>
        </div>
      </form>
    </section>
  </div>
</template>
