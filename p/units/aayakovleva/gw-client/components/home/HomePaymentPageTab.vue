<script setup lang="ts">
/**
 * Вкладка «Страница оплаты» главной панели.
 *
 * Позволяет настраивать визуальный конфиг встраиваемой страницы оплаты:
 *   - Общий блок: enabled, accentColor, calloutHtml.
 *   - Таблица методов: enabled, min/max, imageUrl, label (текст кнопки), caption (подпись под
 *     методом), resolver, фильтр офферов.
 *   - Секция и порядок — задаются DnD-перетаскиванием или мобайл-кнопками ↑/↓ + select секции.
 *   - Форма добавления кастомного метода.
 *   - Удаление кастомных методов (isSystem=false).
 *   - Сниппет встраивания: тег <script> лоадера + пример прелоадера-оверлея.
 *
 * Данные загружаются через SSR-пропсы (initialPaymentPageGeneral/Methods).
 * Сохранение — через paymentPageSettingsSaveRoute.run(ctx, {key, value}).
 */
import { computed, onMounted, ref, watch } from 'vue'
import { paymentPageSettingsSaveRoute } from '../../api/payment-page/settings-save'
import { paymentPageMethodCreateRoute } from '../../api/payment-page/method-create'
import { paymentPageMethodDeleteRoute } from '../../api/payment-page/method-delete'
import { widgetOffersRoute } from '../../api/widgets/offers'
import { useSettingsAutoSave, type AutoSaveResult } from '../../shared/useSettingsAutoSave'
import {
  PAYMENT_PAGE_SECTIONS,
  PAYMENT_PAGE_SETTING_KEYS,
  PAYMENT_PAGE_DEFAULT_ACCENT,
  isValidHexColor,
  isPaymentPageSection,
  parsePaymentPageGeneral,
  parsePaymentPageMethodRecord,
  type PaymentPageGeneralConfig,
  type PaymentPageMethodRecord,
  type PaymentPageSection
} from '../../shared/paymentPageTypes'
import type { AllowedOffer, WidgetOfferListType } from '../../shared/widgetSettingsTypes'
import { createComponentLogger } from '../../shared/logger'
import HomeWidgetOfferList from './HomeWidgetOfferList.vue'

const log = createComponentLogger('HomePaymentPageTab')

declare const ctx: app.Ctx

type CreateResult = { success?: boolean; error?: string; method?: PaymentPageMethodRecord }
type DeleteResult = { success?: boolean; error?: string }

const props = defineProps<{
  initialPaymentPageGeneral?: PaymentPageGeneralConfig | null
  initialPaymentPageMethods?: PaymentPageMethodRecord[] | null
  anchorBaseUrl?: string
  loaderUrl?: string
}>()

/* ======= Общие настройки ======= */

const defaultGeneral: PaymentPageGeneralConfig = parsePaymentPageGeneral(null)

const generalEnabled = ref<boolean>(
  props.initialPaymentPageGeneral?.enabled ?? defaultGeneral.enabled
)
const generalAccentColor = ref<string>(
  props.initialPaymentPageGeneral?.accentColor ?? defaultGeneral.accentColor
)
const generalCalloutHtml = ref<string>(props.initialPaymentPageGeneral?.calloutHtml ?? '')
const generalDefaultMethod = ref<string>(
  props.initialPaymentPageGeneral?.defaultMethod ?? defaultGeneral.defaultMethod
)
const calloutEditorRef = ref<HTMLElement | null>(null)

function onCalloutInput() {
  if (!calloutEditorRef.value) return
  generalCalloutHtml.value = calloutEditorRef.value.innerHTML
}

function execBold() {
  document.execCommand('bold')
  onCalloutInput()
}
function execItalic() {
  document.execCommand('italic')
  onCalloutInput()
}
function execCalloutLink() {
  const url = window.prompt('URL ссылки:', 'https://')
  if (url) document.execCommand('createLink', false, url)
  onCalloutInput()
}
function execCalloutList() {
  document.execCommand('insertUnorderedList')
  onCalloutInput()
}

/* ======= Методы (Record по methodKey) ======= */

function buildInitialMethods(): Record<string, PaymentPageMethodRecord> {
  const result: Record<string, PaymentPageMethodRecord> = {}
  const src = props.initialPaymentPageMethods
  if (!src || !Array.isArray(src)) return result
  for (const rec of src) {
    if (rec && typeof rec === 'object' && typeof rec.methodKey === 'string' && rec.methodKey) {
      result[rec.methodKey] = parsePaymentPageMethodRecord({
        ...rec,
        // Убеждаемся, что resolver передан как объект
        resolver: rec.resolver ?? { type: 'id', value: rec.methodKey }
      })
    }
  }
  return result
}

const methods = ref<Record<string, PaymentPageMethodRecord>>(buildInitialMethods())

/* ======= Автосохранение по мере изменения ======= */

// Сообщение об ошибке удаления метода (создание/удаление — отдельные роуты).
const message = ref('')
const isError = ref(false)

const savePaymentPageSetting = (key: string, value: unknown) =>
  paymentPageSettingsSaveRoute.run(ctx, { key, value }) as Promise<AutoSaveResult>

const {
  saving,
  saveStatus,
  error: saveError,
  queue,
  flush
} = useSettingsAutoSave({ save: savePaymentPageSetting })

function buildGeneralPayload(): PaymentPageGeneralConfig {
  return {
    enabled: generalEnabled.value,
    accentColor: generalAccentColor.value,
    calloutHtml: generalCalloutHtml.value,
    defaultMethod: generalDefaultMethod.value
  }
}

// Общие настройки хранятся одним объектом (ключ GENERAL) — при любой правке
// поля сохраняем весь объект. Невалидный hex не отправляем (показываем подсказку у поля).
function queueGeneral() {
  if (!isValidHexColor(generalAccentColor.value)) return
  queue(PAYMENT_PAGE_SETTING_KEYS.GENERAL, buildGeneralPayload())
}

// Тумблер «страница включена» сохраняем немедленно; при ошибке откатываем.
async function onGeneralEnabledChange() {
  if (!isValidHexColor(generalAccentColor.value)) return
  const prev = !generalEnabled.value
  const ok = await flush(PAYMENT_PAGE_SETTING_KEYS.GENERAL, buildGeneralPayload())
  if (!ok) generalEnabled.value = prev
}

watch(generalAccentColor, queueGeneral)
watch(generalCalloutHtml, queueGeneral)
watch(generalDefaultMethod, queueGeneral)

// Любая правка метода (вкл/лимиты/подпись/изображение/резолвер/секция/порядок/офферы)
// уходит debounce-bulk-update'ом массива методов. Создание/удаление идут отдельными
// роутами, но их мутации methods.value тоже попадут сюда — это идемпотентный
// upsert по methodKey (роут METHODS обновляет существующие строки, не удаляет лишние).
//
// Флаг подавления: при добавлении метода create уже персистит строку целиком (включая
// order), поэтому немедленный bulk-autosave только что созданного метода не нужен — и
// мог бы прислать его на сервер раньше, чем зафиксируется create (гонка двух запросов).
// Подавляем ровно одну сработку watch после addMethod.
let suppressMethodsWatch = false
watch(
  methods,
  () => {
    if (suppressMethodsWatch) {
      suppressMethodsWatch = false
      return
    }
    queue(PAYMENT_PAGE_SETTING_KEYS.METHODS, Object.values(methods.value))
  },
  { deep: true }
)

/* ======= Форма добавления кастомного метода ======= */

const newMethodName = ref('')
const newMethodResolverType = ref<'id' | 'class'>('id')
const newMethodResolverValue = ref('')
const newMethodSection = ref<PaymentPageSection>('pay')
const addMethodSaving = ref(false)
const addMethodError = ref('')
const addMethodSuccess = ref('')

async function addMethod() {
  addMethodError.value = ''
  addMethodSuccess.value = ''
  addMethodSaving.value = true
  try {
    // Порядок нового метода вычисляем ДО создания (конец его секции = max+1) и
    // передаём в create, чтобы сервер сразу персистил корректный order, а не 0.
    const targetSection = newMethodSection.value
    const newOrder =
      Object.values(methods.value)
        .filter((m) => m.section === targetSection)
        .reduce((max, m) => (m.order > max ? m.order : max), -1) + 1
    const res = (await paymentPageMethodCreateRoute.run(ctx, {
      name: newMethodName.value.trim(),
      resolverType: newMethodResolverType.value,
      resolverValue: newMethodResolverValue.value.trim(),
      section: targetSection,
      order: newOrder
    })) as CreateResult
    if (res?.success === false) {
      addMethodError.value = res.error || 'Ошибка создания метода'
      log.error('Ошибка добавления метода', addMethodError.value)
      return
    }
    if (res?.success === true && res.method) {
      const rec = parsePaymentPageMethodRecord({
        ...res.method,
        resolver: res.method.resolver ?? {
          type: newMethodResolverType.value,
          value: newMethodResolverValue.value
        }
      })
      // Метод уже персистён сервером целиком (включая order) — подавляем немедленный
      // bulk-autosave этой мутации, чтобы не слать только что созданную строку второй
      // раз и не ловить гонку с ещё не зафиксированным create.
      suppressMethodsWatch = true
      methods.value = { ...methods.value, [rec.methodKey]: rec }
      // Раскрываем секцию нового метода
      expandedGroups.value = { ...expandedGroups.value, [rec.section]: true }
      addMethodSuccess.value = `Метод "${rec.methodKey}" добавлен`
      // Сбрасываем форму
      newMethodName.value = ''
      newMethodResolverValue.value = ''
      newMethodResolverType.value = 'id'
      newMethodSection.value = 'pay'
      log.notice('Кастомный метод добавлен', { methodKey: rec.methodKey })
    }
  } catch (e) {
    addMethodError.value = (e as Error)?.message || String(e)
    log.error('Исключение при добавлении метода', addMethodError.value)
  } finally {
    addMethodSaving.value = false
  }
}

/* ======= Удаление кастомного метода ======= */

const deletingMethodKey = ref<string | null>(null)

async function deleteMethod(methodKey: string) {
  deletingMethodKey.value = methodKey
  try {
    const res = (await paymentPageMethodDeleteRoute.run(ctx, { methodKey })) as DeleteResult
    if (res?.success === false) {
      log.error('Ошибка удаления метода', res.error ?? '')
      message.value = res.error || 'Ошибка удаления метода'
      isError.value = true
      return
    }
    // Убираем из state
    const next = { ...methods.value }
    delete next[methodKey]
    methods.value = next
    log.notice('Кастомный метод удалён', { methodKey })
  } catch (e) {
    log.error('Исключение при удалении метода', (e as Error)?.message || String(e))
    message.value = (e as Error)?.message || String(e)
    isError.value = true
  } finally {
    deletingMethodKey.value = null
  }
}

/* ======= Офферы ======= */

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
    'GetCourse-интеграция выключена. Включите её в разделе «Настройки», чтобы получить список офферов.',
  GC_NOT_CONFIGURED: 'Не заполнены секреты GetCourse. Их задаёт администратор в разделе /web/admin.'
}

function getMethodOffers(id: string): AllowedOffer[] {
  return methods.value[id]?.offers ?? []
}
function getMethodOfferListType(id: string): WidgetOfferListType {
  return methods.value[id]?.offerListType ?? 'off'
}
function setMethodOffers(id: string, offers: AllowedOffer[]) {
  if (methods.value[id]) {
    methods.value[id] = { ...methods.value[id], offers }
  }
}
function setMethodOfferListType(id: string, listType: WidgetOfferListType) {
  if (methods.value[id]) {
    methods.value[id] = { ...methods.value[id], offerListType: listType }
  }
}

/* ======= Сниппет встраивания ======= */

const loaderSnippet = computed(() => {
  const url = props.loaderUrl || '{URL загрузчика недоступен — обновите страницу}'
  return `<script src="${url}"><\/script>`
})

const svgPreloaderSnippet = `<div id="pp-preloader" style="position:fixed;inset:0;z-index:99998;background:#fff;display:flex;align-items:center;justify-content:center;">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="40" height="40" fill="none" stroke="#f85c50" stroke-width="4"><circle cx="25" cy="25" r="20" stroke-opacity="0.2"/><path d="M25 5a20 20 0 0 1 20 20"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="0.8s" repeatCount="indefinite"/></path></svg>
</div>
<script>
  /* В редакторе конструктора GC (?editMode=1) прелоадер не показываем, даже если pp-loader.js не загрузится. */
  if (/[?&]editMode=1(?:&|$)/.test(location.search)) {
    var pp = document.getElementById('pp-preloader');
    if (pp) pp.style.display = 'none';
  }
<\/script>`

const copied = ref<Record<string, boolean>>({})
const copyError = ref<Record<string, boolean>>({})

function markCopied(key: string) {
  copied.value = { ...copied.value, [key]: true }
  setTimeout(() => {
    copied.value = { ...copied.value, [key]: false }
  }, 1500)
}

function markCopyError(key: string, e: unknown) {
  log.error('Не удалось скопировать сниппет', (e as Error)?.message || String(e))
  copyError.value = { ...copyError.value, [key]: true }
  setTimeout(() => {
    copyError.value = { ...copyError.value, [key]: false }
  }, 1500)
}

// «Скопировано» показываем только при реальном успехе clipboard. В небезопасном
// контексте (http) или при отказе в правах промис отклонится — показываем ошибку,
// а не ложный успех. Отклонение промиса обязательно обрабатываем (.catch).
function copySnippet(key: string, text: string) {
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    markCopyError(key, new Error('clipboard API недоступен'))
    return
  }
  navigator.clipboard.writeText(text).then(
    () => markCopied(key),
    (e) => markCopyError(key, e)
  )
}

/* ======= Расширение/свёртка методов ======= */

const expandedMethods = ref<Record<string, boolean>>({})
function toggleMethod(id: string) {
  expandedMethods.value = {
    ...expandedMethods.value,
    [id]: !expandedMethods.value[id]
  }
}

/* ======= Группы секций (аккордеон) ======= */

const expandedGroups = ref<Record<string, boolean>>(
  Object.fromEntries(PAYMENT_PAGE_SECTIONS.map((s) => [s, true]))
)

function toggleGroup(section: string) {
  const next = !expandedGroups.value[section]
  expandedGroups.value = { ...expandedGroups.value, [section]: next }
  log.debug('Группа методов переключена', { section, open: next })
}

function setAllGroups(open: boolean) {
  expandedGroups.value = Object.fromEntries(PAYMENT_PAGE_SECTIONS.map((s) => [s, open]))
}

const allGroupsExpanded = computed(() =>
  PAYMENT_PAGE_SECTIONS.every((s) => expandedGroups.value[s])
)

/* ======= Группировка методов по секциям ======= */

// id методов по секциям, отсортированы по order, затем по позиции в исходном массиве (стабильно).
const methodsBySection = computed<Record<PaymentPageSection, string[]>>(() => {
  const groups = Object.fromEntries(
    PAYMENT_PAGE_SECTIONS.map((sec) => [sec, [] as string[]])
  ) as Record<PaymentPageSection, string[]>

  const allKeys = Object.keys(methods.value)
  for (const id of allKeys) {
    const sec = methods.value[id]?.section
    if (sec && isPaymentPageSection(sec)) {
      groups[sec].push(id)
    } else {
      groups['pay'].push(id)
    }
  }
  for (const sec of PAYMENT_PAGE_SECTIONS) {
    groups[sec].sort((a, b) => {
      const oa = getMethod(a).order
      const ob = getMethod(b).order
      if (oa !== ob) return oa - ob
      return a < b ? -1 : a > b ? 1 : 0
    })
  }
  return groups
})

// счётчик включённых/всего по секции
const enabledCountBySection = computed<
  Record<PaymentPageSection, { enabled: number; total: number }>
>(() => {
  return Object.fromEntries(
    PAYMENT_PAGE_SECTIONS.map((sec) => {
      const ids = methodsBySection.value[sec]
      return [sec, { total: ids.length, enabled: ids.filter((id) => getMethod(id).enabled).length }]
    })
  ) as Record<PaymentPageSection, { enabled: number; total: number }>
})

/* ======= Метки секций ======= */

const sectionLabels: Record<string, string> = {
  recommended: 'Рекомендуемые',
  pay: 'Оплата',
  cards_rf: 'Карты РФ',
  cards_world: 'Карты мира',
  installments: 'Рассрочка',
  payparts: 'Оплата частями',
  noncash: 'Безналичный расчёт'
}

/* ======= Опции для «метод по умолчанию» ======= */

// Список методов для select «выделить по умолчанию», сгруппированный по секциям
// в порядке отображения. Включаем только enabled-методы: выделять по умолчанию
// скрытый метод бессмысленно (на странице он не отрисуется).
const defaultMethodGroups = computed<{ section: string; label: string; ids: string[] }[]>(() => {
  return PAYMENT_PAGE_SECTIONS.map((sec) => ({
    section: sec,
    label: sectionLabels[sec] ?? sec,
    ids: methodsBySection.value[sec].filter((id) => getMethod(id).enabled)
  })).filter((g) => g.ids.length > 0)
})

// Если выбранный по умолчанию метод исчез/выключен — сбрасываем в «не выделять»,
// чтобы не сохранять «висячий» ключ (автосейв подхватит изменение через watch).
watch([defaultMethodGroups, generalDefaultMethod], () => {
  const cur = generalDefaultMethod.value
  if (!cur) return
  const exists = defaultMethodGroups.value.some((g) => g.ids.includes(cur))
  if (!exists) generalDefaultMethod.value = ''
})

/** Методы, для которых показываем подсказку про допуск СБП/зарубежных оплат. */
const SBP_NOTICE_IDS = new Set(['sbp-pay', 'alpha-bank-podeli'])

/** Безопасный геттер метода: всегда возвращает объект (дефолт при отсутствии). */
function getMethod(id: string): PaymentPageMethodRecord {
  return (
    methods.value[id] ?? {
      methodKey: id,
      name: id,
      resolver: { type: 'id' as const, value: id },
      enabled: true,
      isSystem: false,
      minAmount: 0,
      maxAmount: 0,
      imageUrl: '',
      section: 'pay' as const,
      order: 0,
      offerListType: 'off' as const,
      offers: [],
      label: '',
      caption: ''
    }
  )
}

function setMethodField<K extends keyof PaymentPageMethodRecord>(
  id: string,
  field: K,
  val: PaymentPageMethodRecord[K]
) {
  if (methods.value[id]) {
    methods.value[id] = { ...methods.value[id], [field]: val }
    if (field === 'section') {
      expandedGroups.value = { ...expandedGroups.value, [val as string]: true }
    }
  }
}

/* ======= DnD — живой предпросмотр + атомарное перестроение ======= */

const dragMethodId = ref<string | null>(null)
const dragFromSection = ref<PaymentPageSection | null>(null)
const dragOverSection = ref<PaymentPageSection | null>(null)
const dragOverBeforeId = ref<string | null>(null)

const displayedMethodsBySection = computed<Record<PaymentPageSection, string[]>>(() => {
  const base = methodsBySection.value
  const id = dragMethodId.value
  const target = dragOverSection.value
  if (!id || !target) return base
  const result = Object.fromEntries(
    PAYMENT_PAGE_SECTIONS.map((sec) => [sec, base[sec].filter((x) => x !== id)])
  ) as Record<PaymentPageSection, string[]>
  const arr = result[target]
  const beforeId = dragOverBeforeId.value
  const pos = beforeId ? arr.indexOf(beforeId) : -1
  if (pos >= 0) arr.splice(pos, 0, id)
  else arr.push(id)
  return result
})

function applyLayout(
  updates: { id: string; section: PaymentPageSection }[],
  sectionOrder: Record<string, string[]>
) {
  const next: Record<string, PaymentPageMethodRecord> = { ...methods.value }
  for (const u of updates) {
    const cur = next[u.id]
    if (cur) next[u.id] = { ...cur, section: u.section }
  }
  for (const sec of Object.keys(sectionOrder)) {
    const ids = sectionOrder[sec]
    if (ids) {
      ids.forEach((id, idx) => {
        const cur = next[id]
        if (cur) next[id] = { ...cur, order: idx }
      })
    }
  }
  methods.value = next
}

function onMethodDragStart(ev: DragEvent, id: string, section: PaymentPageSection) {
  dragMethodId.value = id
  dragFromSection.value = section
  dragOverSection.value = section
  const arr = methodsBySection.value[section]
  const idx = arr.indexOf(id)
  dragOverBeforeId.value = idx >= 0 && idx + 1 < arr.length ? (arr[idx + 1] ?? null) : null
  if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move'
  log.debug('DnD старт', { id, section })
}

function onMethodDragEnd() {
  dragMethodId.value = null
  dragFromSection.value = null
  dragOverSection.value = null
  dragOverBeforeId.value = null
}

function onRowDragOver(ev: DragEvent, section: PaymentPageSection, overId: string) {
  ev.preventDefault()
  dragOverSection.value = section
  if (overId === dragMethodId.value) return
  const el = ev.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const after = ev.clientY > rect.top + rect.height / 2
  if (after) {
    const arr = methodsBySection.value[section].filter((x) => x !== dragMethodId.value)
    const p = arr.indexOf(overId)
    dragOverBeforeId.value = p >= 0 && p + 1 < arr.length ? (arr[p + 1] ?? null) : null
  } else {
    dragOverBeforeId.value = overId
  }
}

function onBodyDragOver(ev: DragEvent, section: PaymentPageSection) {
  ev.preventDefault()
  dragOverSection.value = section
  dragOverBeforeId.value = null
}

function onHeadDragOver(ev: DragEvent, section: PaymentPageSection) {
  if (!dragMethodId.value) return
  ev.preventDefault()
  if (!expandedGroups.value[section]) {
    expandedGroups.value = { ...expandedGroups.value, [section]: true }
  }
  dragOverSection.value = section
  dragOverBeforeId.value = null
}

function onDrop(ev: DragEvent) {
  ev.preventDefault()
  const id = dragMethodId.value
  const target = dragOverSection.value
  if (!id || !target) {
    onMethodDragEnd()
    return
  }
  const from = dragFromSection.value
  const preview = displayedMethodsBySection.value
  const sectionOrder: Record<string, string[]> = { [target]: [...preview[target]] }
  if (from && from !== target) sectionOrder[from] = [...preview[from]]
  const updates: { id: string; section: PaymentPageSection }[] =
    from && from !== target ? [{ id, section: target }] : []
  log.debug('DnD дроп', { id, from, to: target })
  applyLayout(updates, sectionOrder)
  onMethodDragEnd()
}

/* ======= Мобайл/тач fallback (↑/↓ + смена секции) ======= */

function moveMethod(id: string, section: PaymentPageSection, delta: -1 | 1) {
  const ids = [...methodsBySection.value[section]]
  const idx = ids.indexOf(id)
  if (idx < 0) return
  const newIdx = idx + delta
  if (newIdx < 0 || newIdx >= ids.length) return
  const a = ids[idx]
  const b = ids[newIdx]
  if (a === undefined || b === undefined) return
  ids[idx] = b
  ids[newIdx] = a
  applyLayout([], { [section]: ids })
}

function onMoveSectionChange(ev: Event, id: string, _currentSection: PaymentPageSection) {
  const target = ev.target as HTMLSelectElement
  if (!(PAYMENT_PAGE_SECTIONS as readonly string[]).includes(target.value)) return
  const newSection = target.value as PaymentPageSection
  if (newSection === _currentSection) return
  const sourceIds = methodsBySection.value[_currentSection].filter((x) => x !== id)
  const targetIds = [...methodsBySection.value[newSection], id]
  applyLayout([{ id, section: newSection }], {
    [_currentSection]: sourceIds,
    [newSection]: targetIds
  })
  expandedGroups.value = { ...expandedGroups.value, [newSection]: true }
  target.value = _currentSection
}

/* ======= Обработчики полей метода ======= */

function onMethodEnabledChange(id: string, ev: Event) {
  setMethodField(id, 'enabled', (ev.target as HTMLInputElement).checked)
}
function onMethodNumberChange(id: string, field: 'minAmount' | 'maxAmount', ev: Event) {
  setMethodField(id, field, Number((ev.target as HTMLInputElement).value) || 0)
}
function onMethodTextInput(id: string, field: 'label' | 'caption' | 'imageUrl', ev: Event) {
  setMethodField(id, field, (ev.target as HTMLInputElement).value)
}
function onResolverTypeChange(id: string, ev: Event) {
  const val = (ev.target as HTMLSelectElement).value
  if (val === 'id' || val === 'class') {
    const cur = methods.value[id]
    if (cur) {
      methods.value[id] = { ...cur, resolver: { ...cur.resolver, type: val } }
    }
  }
}
function onResolverValueInput(id: string, ev: Event) {
  const val = (ev.target as HTMLInputElement).value
  const cur = methods.value[id]
  if (cur) {
    methods.value[id] = { ...cur, resolver: { ...cur.resolver, value: val } }
  }
}

onMounted(() => {
  log.info('Компонент смонтирован', {
    generalEnabled: generalEnabled.value,
    methodCount: Object.keys(methods.value).length
  })
  if (calloutEditorRef.value) {
    calloutEditorRef.value.innerHTML = generalCalloutHtml.value
  }
})
</script>

<template>
  <div class="st-tab">
    <form class="ap-set-form" @submit.prevent>
      <!-- Блок «Общие» -->
      <section class="panel-section st-section">
        <header class="panel-section-head">
          <span class="prompt">›</span>
          <h2>Страница оплаты — общие настройки</h2>
        </header>
        <p class="st-section-sub">
          Управление встраиваемой страницей оплаты. Лоадер-скрипт загружает конфиг с этого сервера и
          отображает методы оплаты на странице заказа.
        </p>

        <label class="st-toggle-row" for="pp-enabled-toggle">
          <span class="st-toggle">
            <input
              id="pp-enabled-toggle"
              v-model="generalEnabled"
              type="checkbox"
              @change="onGeneralEnabledChange"
            />
            <span class="st-toggle-slider"></span>
          </span>
          <span class="st-toggle-text">
            <span class="st-toggle-title">Страница оплаты включена</span>
            <span class="st-toggle-hint">
              Когда выключено — конфиг-эндпоинт возвращает enabled:false, страница не отображает
              методы.
            </span>
          </span>
          <span class="st-toggle-state" :class="generalEnabled ? 'is-on' : ''">
            {{ generalEnabled ? 'Включена' : 'Выключена' }}
          </span>
        </label>

        <div class="st-grid">
          <div>
            <label class="st-field-label" for="pp-accent-color">Акцентный цвет</label>
            <input
              id="pp-accent-color"
              v-model="generalAccentColor"
              type="text"
              class="st-input"
              :placeholder="PAYMENT_PAGE_DEFAULT_ACCENT"
              maxlength="7"
            />
            <p class="st-field-hint">
              Hex-формат, например {{ PAYMENT_PAGE_DEFAULT_ACCENT }}.
              <span
                v-if="generalAccentColor && !isValidHexColor(generalAccentColor)"
                style="color: var(--err)"
              >
                Невалидный hex.
              </span>
            </p>
          </div>
        </div>

        <label class="st-field-label">Коллаут-блок над способами оплаты (HTML)</label>
        <div class="pp-callout-toolbar">
          <button type="button" class="pp-callout-btn" @click="execBold">Жирный</button>
          <button type="button" class="pp-callout-btn" @click="execItalic">Курсив</button>
          <button type="button" class="pp-callout-btn" @click="execCalloutLink">Ссылка</button>
          <button type="button" class="pp-callout-btn" @click="execCalloutList">Список</button>
        </div>
        <div
          ref="calloutEditorRef"
          class="pp-callout-editor"
          contenteditable="true"
          @input="onCalloutInput"
        ></div>
        <p class="st-field-hint">
          Произвольный HTML. Показывается на странице оплаты над блоком «Рекомендуемые способы
          оплаты». Если пусто — блок не отображается. Удобно для контактов поддержки и телефона.
        </p>

        <div class="st-grid">
          <div class="st-field-full">
            <label class="st-field-label" for="pp-default-method">
              Метод, выделенный по умолчанию
            </label>
            <select id="pp-default-method" v-model="generalDefaultMethod" class="st-input">
              <option value="">— Не выделять ни один —</option>
              <optgroup v-for="grp in defaultMethodGroups" :key="grp.section" :label="grp.label">
                <option v-for="id in grp.ids" :key="id" :value="id">
                  {{ getMethod(id).name || id }}
                </option>
              </optgroup>
            </select>
            <p class="st-field-hint">
              Какой способ оплаты подсвечен сразу при открытии страницы. «Не выделять ни один» —
              кнопка оплаты заблокирована, пока покупатель не выберет способ сам (рекомендуется). В
              списке только включённые методы.
            </p>
          </div>
        </div>
      </section>

      <!-- Таблица методов -->
      <section class="panel-section st-section">
        <header class="panel-section-head">
          <span class="prompt">›</span>
          <h2>Методы оплаты</h2>
          <button
            type="button"
            class="pp-group-toggle-all"
            @click="setAllGroups(!allGroupsExpanded)"
          >
            <i class="fas" :class="allGroupsExpanded ? 'fa-angles-up' : 'fa-angles-down'"></i>
            {{ allGroupsExpanded ? 'Свернуть все' : 'Развернуть все' }}
          </button>
        </header>
        <p class="st-section-sub">
          Настройте каждый метод: включение, ценовые ограничения, текст кнопки, подпись под методом
          и фильтр офферов. Секция и порядок — перетаскиванием или кнопками ↑/↓. Разворачивайте
          строку метода для детальной настройки. Системные методы нельзя удалить.
        </p>

        <template v-for="sectionId in PAYMENT_PAGE_SECTIONS" :key="sectionId">
          <div class="pp-group" :class="{ 'is-dnd-over': dragOverSection === sectionId }">
            <div
              class="pp-group-head"
              @click="toggleGroup(sectionId)"
              @dragover="onHeadDragOver($event, sectionId)"
              @drop="onDrop($event)"
            >
              <i
                class="fas fa-chevron-right pp-group-chevron"
                :class="expandedGroups[sectionId] ? 'is-open' : ''"
              ></i>
              <span class="pp-group-title">{{ sectionLabels[sectionId] ?? sectionId }}</span>
              <span class="pp-group-counter">
                {{ enabledCountBySection[sectionId].enabled }} вкл /
                {{ enabledCountBySection[sectionId].total }}
              </span>
            </div>
            <div
              v-if="expandedGroups[sectionId]"
              class="pp-group-body"
              @dragover="onBodyDragOver($event, sectionId)"
              @drop="onDrop($event)"
            >
              <div
                v-if="displayedMethodsBySection[sectionId].length === 0"
                class="pp-group-empty-drop"
              >
                Перетащите способ оплаты в этот раздел
              </div>
              <div
                v-for="methodId in displayedMethodsBySection[sectionId]"
                :key="methodId"
                class="st-method-row"
                :class="{ 'is-dragging': dragMethodId === methodId }"
                :draggable="true"
                @dragstart="onMethodDragStart($event, methodId, sectionId)"
                @dragend="onMethodDragEnd()"
                @dragover.stop="onRowDragOver($event, sectionId, methodId)"
                @drop.stop="onDrop($event)"
              >
                <!-- Сводная строка метода -->
                <div class="st-method-summary" @click="toggleMethod(methodId)">
                  <span class="pp-dnd-handle" aria-hidden="true">⠿</span>
                  <label class="st-toggle st-method-toggle" :for="'pp-method-' + methodId">
                    <input
                      :id="'pp-method-' + methodId"
                      :checked="getMethod(methodId).enabled"
                      type="checkbox"
                      @click.stop
                      @change="onMethodEnabledChange(methodId, $event)"
                    />
                    <span class="st-toggle-slider"></span>
                  </label>
                  <span class="st-method-id">{{ getMethod(methodId).name || methodId }}</span>
                  <span v-if="getMethod(methodId).label" class="st-method-label-preview">
                    {{ getMethod(methodId).label }}
                  </span>
                  <!-- Бейдж «Системный» -->
                  <span v-if="getMethod(methodId).isSystem" class="pp-badge-system">Системный</span>
                  <span class="st-method-section-badge">
                    {{ sectionLabels[getMethod(methodId).section] ?? getMethod(methodId).section }}
                  </span>
                  <i
                    class="fas"
                    :class="expandedMethods[methodId] ? 'fa-chevron-up' : 'fa-chevron-down'"
                    style="margin-left: auto; opacity: 0.5"
                  ></i>
                </div>

                <!-- Детальная настройка (раскрытая) -->
                <div v-if="expandedMethods[methodId]" class="st-method-detail">
                  <!-- Подсказка для СБП/зарубежных -->
                  <p v-if="SBP_NOTICE_IDS.has(methodId)" class="st-method-notice">
                    <i class="fas fa-circle-info"></i>
                    Платёжный допуск и лимиты СБП/зарубежных оплат настраиваются в разделе «Виджеты
                    оплаты».
                  </p>

                  <div class="st-grid">
                    <div>
                      <label class="st-field-label" :for="'pp-min-' + methodId"
                        >Мин. сумма, ₽</label
                      >
                      <input
                        :id="'pp-min-' + methodId"
                        :value="getMethod(methodId).minAmount"
                        type="number"
                        min="0"
                        step="1"
                        class="st-input"
                        placeholder="0 — без ограничений"
                        @change="onMethodNumberChange(methodId, 'minAmount', $event)"
                      />
                    </div>
                    <div>
                      <label class="st-field-label" :for="'pp-max-' + methodId"
                        >Макс. сумма, ₽</label
                      >
                      <input
                        :id="'pp-max-' + methodId"
                        :value="getMethod(methodId).maxAmount"
                        type="number"
                        min="0"
                        step="1"
                        class="st-input"
                        placeholder="0 — без ограничений"
                        @change="onMethodNumberChange(methodId, 'maxAmount', $event)"
                      />
                    </div>
                    <div class="st-field-full">
                      <label class="st-field-label" :for="'pp-label-' + methodId"
                        >Текст кнопки</label
                      >
                      <input
                        :id="'pp-label-' + methodId"
                        :value="getMethod(methodId).label"
                        type="text"
                        class="st-input"
                        placeholder="Например: Тинькофф Рассрочка"
                        @input="onMethodTextInput(methodId, 'label', $event)"
                      />
                      <p class="st-field-hint">
                        Подменяет надпись на самой кнопке метода. Пусто — остаётся штатный текст.
                      </p>
                    </div>
                    <div class="st-field-full">
                      <label class="st-field-label" :for="'pp-caption-' + methodId"
                        >Подпись под методом</label
                      >
                      <input
                        :id="'pp-caption-' + methodId"
                        :value="getMethod(methodId).caption"
                        type="text"
                        class="st-input"
                        placeholder="Например: Оплата картой любого банка РФ"
                        maxlength="120"
                        @input="onMethodTextInput(methodId, 'caption', $event)"
                      />
                      <p class="st-field-hint">
                        Короткий поясняющий текст под методом — вместо скрытых системных подписей.
                        Пусто — ничего не показывается. До 2 строк на странице.
                      </p>
                    </div>
                    <div class="st-field-full">
                      <label class="st-field-label" :for="'pp-image-' + methodId"
                        >URL изображения</label
                      >
                      <input
                        :id="'pp-image-' + methodId"
                        :value="getMethod(methodId).imageUrl"
                        type="text"
                        class="st-input"
                        placeholder="https://..."
                        @input="onMethodTextInput(methodId, 'imageUrl', $event)"
                      />
                    </div>
                    <!-- Resolver (тип + значение) -->
                    <div>
                      <label class="st-field-label" :for="'pp-resolver-type-' + methodId"
                        >Тип резолвера</label
                      >
                      <select
                        :id="'pp-resolver-type-' + methodId"
                        :value="getMethod(methodId).resolver.type"
                        class="st-input"
                        @change="onResolverTypeChange(methodId, $event)"
                      >
                        <option value="id">По id</option>
                        <option value="class">По CSS-классу</option>
                      </select>
                    </div>
                    <div>
                      <label class="st-field-label" :for="'pp-resolver-value-' + methodId"
                        >Значение резолвера</label
                      >
                      <input
                        :id="'pp-resolver-value-' + methodId"
                        :value="getMethod(methodId).resolver.value"
                        type="text"
                        class="st-input"
                        placeholder="id или CSS-класс"
                        @input="onResolverValueInput(methodId, $event)"
                      />
                    </div>
                  </div>

                  <!-- Мобайл/тач: кнопки ↑/↓ и смена секции -->
                  <div class="pp-mobile-actions">
                    <button
                      type="button"
                      class="pp-mobile-btn"
                      :disabled="methodsBySection[sectionId].indexOf(methodId) === 0"
                      @click="moveMethod(methodId, sectionId, -1)"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      class="pp-mobile-btn"
                      :disabled="
                        methodsBySection[sectionId].indexOf(methodId) ===
                        methodsBySection[sectionId].length - 1
                      "
                      @click="moveMethod(methodId, sectionId, 1)"
                    >
                      ↓
                    </button>
                    <select
                      class="st-input pp-mobile-section-select"
                      :value="sectionId"
                      @change="onMoveSectionChange($event, methodId, sectionId)"
                    >
                      <option v-for="sec in PAYMENT_PAGE_SECTIONS" :key="sec" :value="sec">
                        {{ sectionLabels[sec] ?? sec }}
                      </option>
                    </select>
                  </div>

                  <!-- Фильтр офферов -->
                  <div class="st-offer-block">
                    <HomeWidgetOfferList
                      :list-type="getMethodOfferListType(methodId)"
                      :selected-offers="getMethodOffers(methodId)"
                      :title="'Фильтр офферов — ' + methodId"
                      hint="«Выключен» — метод доступен для всех заказов. «Только выбранные» — только для заказов с выбранными офферами."
                      :error-hints="offerErrorHints"
                      :loader="loadOffers"
                      @update:list-type="
                        (v: WidgetOfferListType) => setMethodOfferListType(methodId, v)
                      "
                      @update:selected-offers="(v: AllowedOffer[]) => setMethodOffers(methodId, v)"
                    />
                  </div>

                  <!-- Кнопка удаления (только для кастомных) -->
                  <div v-if="!getMethod(methodId).isSystem" class="pp-delete-method-row">
                    <button
                      type="button"
                      class="pp-delete-method-btn"
                      :disabled="deletingMethodKey === methodId"
                      @click.stop="deleteMethod(methodId)"
                    >
                      <i class="fas fa-trash"></i>
                      {{ deletingMethodKey === methodId ? 'Удаление…' : 'Удалить метод' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </section>

      <!-- Форма добавления кастомного метода -->
      <section class="panel-section st-section">
        <header class="panel-section-head">
          <span class="prompt">›</span>
          <h2>Добавить кастомный метод</h2>
        </header>
        <p class="st-section-sub">
          Добавьте метод, которого нет в системном списке. Укажите название, тип резолвера (по id
          или CSS-классу), значение резолвера и секцию.
        </p>
        <div class="st-grid">
          <div class="st-field-full">
            <label class="st-field-label" for="new-method-name">Название</label>
            <input
              id="new-method-name"
              v-model="newMethodName"
              type="text"
              class="st-input"
              placeholder="Например: Моя оплата"
            />
          </div>
          <div>
            <label class="st-field-label" for="new-method-resolver-type">Тип резолвера</label>
            <select id="new-method-resolver-type" v-model="newMethodResolverType" class="st-input">
              <option value="id">По id</option>
              <option value="class">По CSS-классу</option>
            </select>
          </div>
          <div>
            <label class="st-field-label" for="new-method-resolver-value">Значение резолвера</label>
            <input
              id="new-method-resolver-value"
              v-model="newMethodResolverValue"
              type="text"
              class="st-input"
              placeholder="id или CSS-класс"
            />
          </div>
          <div>
            <label class="st-field-label" for="new-method-section">Секция</label>
            <select id="new-method-section" v-model="newMethodSection" class="st-input">
              <option v-for="sec in PAYMENT_PAGE_SECTIONS" :key="sec" :value="sec">
                {{ sectionLabels[sec] ?? sec }}
              </option>
            </select>
          </div>
        </div>
        <div class="st-actions" style="margin-top: 0.75rem">
          <button type="button" class="btn-primary" :disabled="addMethodSaving" @click="addMethod">
            <i class="fas fa-plus"></i>
            {{ addMethodSaving ? 'Добавление…' : 'Добавить метод' }}
          </button>
          <p v-if="addMethodError" class="st-msg is-err">
            <i class="fas fa-exclamation-circle"></i>
            {{ addMethodError }}
          </p>
          <p v-if="addMethodSuccess" class="st-msg is-ok">
            <i class="fas fa-check-circle"></i>
            {{ addMethodSuccess }}
          </p>
        </div>
      </section>

      <!-- Сниппет встраивания -->
      <section class="panel-section st-section">
        <header class="panel-section-head">
          <span class="prompt">›</span>
          <h2>Встраивание на страницу заказа</h2>
        </header>
        <p class="st-section-sub">
          Вставьте скрипт-лоадер в HTML страницы заказа перед закрывающим тегом
          <code>&lt;/body&gt;</code>. Лоадер загружает конфиг и инициализирует страницу оплаты.
        </p>

        <div class="st-snippet">
          <pre><code>{{ loaderSnippet }}</code></pre>
          <button
            type="button"
            class="st-snippet-copy"
            :class="copied['pp-loader'] ? 'is-copied' : copyError['pp-loader'] ? 'is-err' : ''"
            @click="copySnippet('pp-loader', loaderSnippet)"
          >
            <i
              class="fas"
              :class="
                copied['pp-loader']
                  ? 'fa-check'
                  : copyError['pp-loader']
                    ? 'fa-exclamation-circle'
                    : 'fa-copy'
              "
            ></i>
            {{
              copied['pp-loader']
                ? 'Скопировано'
                : copyError['pp-loader']
                  ? 'Не удалось'
                  : 'Копировать'
            }}
          </button>
        </div>

        <p class="st-field-hint" style="margin-top: 0.75rem">
          Пример прелоадера. Вставьте его в HTML страницы заказа (лучше сразу после открывающего
          <code>&lt;body&gt;</code>) — он перекроет «сырую» страницу сразу при загрузке.
        </p>
        <div class="st-snippet">
          <pre><code>{{ svgPreloaderSnippet }}</code></pre>
          <button
            type="button"
            class="st-snippet-copy"
            :class="copied['pp-svg'] ? 'is-copied' : copyError['pp-svg'] ? 'is-err' : ''"
            @click="copySnippet('pp-svg', svgPreloaderSnippet)"
          >
            <i
              class="fas"
              :class="
                copied['pp-svg']
                  ? 'fa-check'
                  : copyError['pp-svg']
                    ? 'fa-exclamation-circle'
                    : 'fa-copy'
              "
            ></i>
            {{
              copied['pp-svg'] ? 'Скопировано' : copyError['pp-svg'] ? 'Не удалось' : 'Копировать'
            }}
          </button>
        </div>
      </section>

      <!-- Статус автосохранения -->
      <div class="st-actions">
        <span v-if="saving" class="st-msg">
          <i class="fas fa-spinner fa-spin"></i> Сохранение…
        </span>
        <span v-else-if="saveStatus === 'saved'" class="st-msg is-ok">
          <i class="fas fa-check-circle"></i> Сохранено
        </span>
        <span v-else-if="saveStatus === 'error'" class="st-msg is-err">
          <i class="fas fa-exclamation-circle"></i> {{ saveError }}
        </span>
        <span v-else class="st-field-hint">
          <i class="fas fa-bolt"></i> Изменения сохраняются автоматически
        </span>
        <p v-if="message" class="st-msg" :class="isError ? 'is-err' : 'is-ok'">
          <i class="fas" :class="isError ? 'fa-exclamation-circle' : 'fa-check-circle'"></i>
          {{ message }}
        </p>
      </div>
    </form>
  </div>
</template>
