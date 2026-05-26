<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { createComponentLogger } from '../shared/logger'
import { GW_HEADER_SCHOOL_HOST, GW_HEADER_SCHOOL_API_KEY } from '../shared/gatewayHttpHeaders'
import type { GcTestValues } from '../shared/gatewaySettingKeys'
import type {
  OperationSummary,
  ArgsFieldSchema,
  ArgsTreeNode,
  ArgsTreeField
} from '../shared/operationsCatalogShared'

const log = createComponentLogger('RequestTestTab')

const props = defineProps<{
  operationsCatalog?: OperationSummary[]
  projectRoot: string
  // Тестовые значения из Heap (SSR-проп). Пустые строки = настройка не задана.
  testValues?: GcTestValues
}>()

const EMAIL_PLACEHOLDER = 'tester@khudoley.pro'
// Клиентский таймаут fetch — страховка от зависания формы. Должен быть БОЛЬШЕ серверного
// таймаута исходящего вызова GC (GW_OUTBOUND_TIMEOUT_MS = 10 с): иначе клиент прервёт запрос
// раньше, чем gateway успеет вернуть осмысленную ошибку INVOKE_GC_TIMEOUT. 10 с + запас.
const FETCH_TIMEOUT_MS = 15000

const catalog = computed<OperationSummary[]>(() => props.operationsCatalog ?? [])

type RequestSnapshot = {
  method: string
  url: string
  headers: Record<string, string>
  body: string | null
  query: Record<string, string> | null
}

type ResponseSnapshot = {
  statusCode: number
  headers: Record<string, string>
  body: string
  parsedBody: unknown
}

const selectedOp = ref<string>(
  catalog.value.find((e) => e.availability === 'enabled')?.op ?? catalog.value[0]?.op ?? ''
)
const xGcSchoolHost = ref<string>('')
const xGcSchoolApiKey = ref<string>('')
const showApiKey = ref(false)
const argsValues = ref<Record<string, string>>({})
const revealedArgs = ref<Record<string, boolean>>({})
// Спойлер-подсказка о формате запроса выбранной операции — по умолчанию закрыт.
const showHint = ref(false)
// Сырое тело запроса (для POST-операций с вложенными аргументами — отправляется как есть).
const rawBody = ref<string>('')
const requestPending = ref(false)
const requestError = ref<string>('')
const requestSnapshot = ref<RequestSnapshot | null>(null)
const responseSnapshot = ref<ResponseSnapshot | null>(null)
const responseOk = ref<boolean | null>(null)

const selectedOpEntry = computed<OperationSummary | null>(
  () => catalog.value.find((e) => e.op === selectedOp.value) ?? null
)

const isSelectedOpEnabled = computed(() => selectedOpEntry.value?.availability === 'enabled')

const argsFields = computed<ArgsFieldSchema[]>(() => selectedOpEntry.value?.argsSchema.fields ?? [])

const bodyLabel = computed(() =>
  selectedOpEntry.value?.httpMethod === 'GET' ? 'Параметры запроса (query)' : 'Тело запроса (JSON)'
)

// Полное дерево формата запроса (со всеми вложенными ключами), выведенное на сервере.
const argsTree = computed<ArgsTreeNode | null>(() => selectedOpEntry.value?.argsTree ?? null)

function scalarPlaceholder(type: string): unknown {
  if (type === 'number' || type === 'integer') return 0
  if (type === 'boolean') return true
  return 'string'
}

function nodeTypeLabel(node: ArgsTreeNode): string {
  if (node.kind === 'object') return 'object'
  if (node.kind === 'array') return `${nodeTypeLabel(node.items)}[]`
  if (node.kind === 'scalar') return node.type
  return 'any'
}

function exampleValueForNode(node: ArgsTreeNode): unknown {
  if (node.kind === 'object') {
    const obj: Record<string, unknown> = {}
    for (const f of node.fields) obj[f.name] = exampleValueForNode(f.node)
    return obj
  }
  if (node.kind === 'array') return [exampleValueForNode(node.items)]
  if (node.kind === 'scalar') return scalarPlaceholder(node.type)
  return {}
}

type LegendRow = {
  path: string
  depth: number
  type: string
  required: boolean
  description?: string
}

function collectRows(field: ArgsTreeField, parentPath: string, depth: number, rows: LegendRow[]) {
  const path = parentPath ? `${parentPath}.${field.name}` : field.name
  rows.push({
    path,
    depth,
    type: nodeTypeLabel(field.node),
    required: field.required,
    description: field.description
  })
  if (field.node.kind === 'object') {
    for (const f of field.node.fields) collectRows(f, path, depth + 1, rows)
  } else if (field.node.kind === 'array' && field.node.items.kind === 'object') {
    for (const f of field.node.items.fields) collectRows(f, `${path}[]`, depth + 1, rows)
  }
}

// Плоская легенда всех полей запроса (с вложенными, через точечные пути).
const legendRows = computed<LegendRow[]>(() => {
  const tree = argsTree.value
  if (!tree || tree.kind !== 'object') return []
  const rows: LegendRow[] = []
  for (const f of tree.fields) collectRows(f, '', 0, rows)
  return rows
})

// Пример запроса выбранной операции со всеми ключами (обязательными и опциональными).
const exampleRequest = computed<string>(() => {
  const entry = selectedOpEntry.value
  const tree = argsTree.value
  if (!entry || !tree) return ''
  if (entry.httpMethod === 'GET') {
    if (tree.kind !== 'object' || tree.fields.length === 0) return '(без параметров)'
    return '?' + tree.fields.map((f) => `${f.name}=<${nodeTypeLabel(f.node)}>`).join('&')
  }
  return JSON.stringify(exampleValueForNode(tree), null, 2)
})

// POST с вложенными аргументами (object/array) → единый редактор тела вместо по-полевого ввода.
// Тело отправляется как есть и совпадает с примером выше — без двойной обёртки полей.
const hasNestedArgs = computed(() => {
  const tree = argsTree.value
  if (!tree || tree.kind !== 'object') return false
  return tree.fields.some((f) => f.node.kind !== 'scalar')
})
const usesRawBody = computed(
  () => selectedOpEntry.value?.httpMethod === 'POST' && hasNestedArgs.value
)
const rawBodyError = computed<string>(() => {
  if (!usesRawBody.value) return ''
  const t = rawBody.value.trim()
  if (t === '') return 'Тело запроса обязательно.'
  try {
    JSON.parse(t)
  } catch {
    return 'Тело запроса — некорректный JSON.'
  }
  return ''
})

function fillExampleBody() {
  rawBody.value = exampleRequest.value
}

// Доступность кнопок «Подставить» для заголовков — только при наличии тестового значения в пропсах.
const canFillHost = computed(() => !!props.testValues && props.testValues.testSchoolHost !== '')
const canFillApiKey = computed(() => !!props.testValues && props.testValues.testSchoolApiKey !== '')

function isEmailField(name: string): boolean {
  return /email/i.test(name)
}

function isSecretField(name: string): boolean {
  return /key|secret|password|token|apikey/i.test(name)
}

function isJsonField(field: ArgsFieldSchema): boolean {
  return field.type === 'array' || field.type === 'object'
}

function validateHost(value: string): string {
  if (!value.trim()) return `Заголовок ${GW_HEADER_SCHOOL_HOST} обязателен.`
  return ''
}

function validateApiKey(value: string): string {
  if (!value.trim()) return `Заголовок ${GW_HEADER_SCHOOL_API_KEY} обязателен.`
  return ''
}

function validateArgField(field: ArgsFieldSchema, raw: string): string {
  const trimmed = (raw ?? '').trim()
  if (field.required && trimmed === '') return `Поле «${field.name}» обязательно.`
  if (trimmed === '') return ''
  if (field.type === 'number') {
    const n = Number(trimmed)
    if (!Number.isFinite(n)) return `Поле «${field.name}»: ожидается число.`
  }
  if (field.type === 'boolean') {
    if (trimmed !== 'true' && trimmed !== 'false')
      return `Поле «${field.name}»: ожидается true/false.`
  }
  if (isJsonField(field)) {
    try {
      JSON.parse(trimmed)
    } catch {
      return `Поле «${field.name}»: ожидается корректный JSON (${field.type}).`
    }
  }
  return ''
}

const fieldErrors = computed<Record<string, string>>(() => {
  const errs: Record<string, string> = {}
  errs[GW_HEADER_SCHOOL_HOST] = validateHost(xGcSchoolHost.value)
  errs[GW_HEADER_SCHOOL_API_KEY] = validateApiKey(xGcSchoolApiKey.value)
  // В режиме сырого тела по-полевые аргументы не валидируются (их нет в форме).
  if (!usesRawBody.value) {
    for (const field of argsFields.value) {
      const err = validateArgField(field, argsValues.value[field.name] ?? '')
      if (err) errs[field.name] = err
    }
  }
  return errs
})

const hasErrors = computed(
  () => Object.values(fieldErrors.value).some((e) => e !== '') || rawBodyError.value !== ''
)

const canSubmit = computed(
  () => isSelectedOpEnabled.value && !hasErrors.value && !requestPending.value
)

watch(selectedOp, () => {
  argsValues.value = {}
  revealedArgs.value = {}
  rawBody.value = ''
  showApiKey.value = false
  requestSnapshot.value = null
  responseSnapshot.value = null
  responseOk.value = null
  requestError.value = ''
})

function buildArgsObject(): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const field of argsFields.value) {
    const raw = (argsValues.value[field.name] ?? '').trim()
    if (raw === '') continue
    if (field.type === 'number') {
      result[field.name] = Number(raw)
    } else if (field.type === 'boolean') {
      result[field.name] = raw === 'true'
    } else if (isJsonField(field)) {
      try {
        result[field.name] = JSON.parse(raw)
      } catch {
        // Невалидный JSON отсекается валидацией до отправки; на всякий случай пропускаем.
        continue
      }
    } else {
      result[field.name] = raw
    }
  }
  return result
}

function fillHost() {
  if (props.testValues?.testSchoolHost) xGcSchoolHost.value = props.testValues.testSchoolHost
}

function fillApiKey() {
  if (props.testValues?.testSchoolApiKey) xGcSchoolApiKey.value = props.testValues.testSchoolApiKey
}

function fillAllTest() {
  fillHost()
  fillApiKey()
  log.info('fillAllTest from props', {
    hostLength: xGcSchoolHost.value.length,
    apiKeyLength: xGcSchoolApiKey.value.length
  })
}

function fillEmail(fieldName: string) {
  argsValues.value[fieldName] = EMAIL_PLACEHOLDER
}

function clearForm() {
  xGcSchoolHost.value = ''
  xGcSchoolApiKey.value = ''
  showApiKey.value = false
  argsValues.value = {}
  revealedArgs.value = {}
  rawBody.value = ''
  requestSnapshot.value = null
  responseSnapshot.value = null
  responseOk.value = null
  requestError.value = ''
  log.info('clearForm')
}

async function sendRequest() {
  if (!canSubmit.value || !selectedOpEntry.value) return

  requestPending.value = true
  requestError.value = ''
  requestSnapshot.value = null
  responseSnapshot.value = null
  responseOk.value = null

  const entry = selectedOpEntry.value
  const argsObj = buildArgsObject()
  const headers: Record<string, string> = {
    [GW_HEADER_SCHOOL_HOST]: xGcSchoolHost.value.trim(),
    [GW_HEADER_SCHOOL_API_KEY]: xGcSchoolApiKey.value.trim()
  }
  // Ведущий «/» — часть литерала; props.projectRoot = 'p/saas/gw/gc' (без слеша).
  let url = `/${props.projectRoot}/api/v1/${entry.op}`
  let body: string | null = null
  let query: Record<string, string> | null = null

  if (entry.httpMethod === 'GET') {
    const params = new URLSearchParams()
    query = {}
    for (const [k, v] of Object.entries(argsObj)) {
      const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
      params.set(k, s)
      query[k] = s
    }
    const queryString = params.toString()
    if (queryString) url += `?${queryString}`
  } else if (usesRawBody.value) {
    // Тело отправляется как есть — пользователь редактирует полный JSON запроса.
    headers['Content-Type'] = 'application/json'
    body = rawBody.value.trim()
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(argsObj)
  }

  requestSnapshot.value = { method: entry.httpMethod, url, headers, body, query }
  log.info('RequestTestTab.sendRequest', { op: entry.op, method: entry.httpMethod, url })

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: entry.httpMethod,
      headers,
      body,
      signal: controller.signal
    })
    const text = await res.text()
    const respHeaders: Record<string, string> = {}
    res.headers.forEach((value, key) => {
      respHeaders[key] = value
    })
    let parsedBody: unknown = text
    try {
      parsedBody = JSON.parse(text)
    } catch {
      parsedBody = text
    }
    responseSnapshot.value = {
      statusCode: res.status,
      headers: respHeaders,
      body: text,
      parsedBody
    }
    const okFromBody =
      parsedBody !== null &&
      typeof parsedBody === 'object' &&
      'ok' in (parsedBody as Record<string, unknown>)
        ? Boolean((parsedBody as { ok?: boolean }).ok)
        : null
    responseOk.value = okFromBody !== null ? okFromBody : res.status >= 200 && res.status < 300
  } catch (e) {
    requestError.value =
      e instanceof DOMException && e.name === 'AbortError'
        ? `Таймаут запроса (${FETCH_TIMEOUT_MS / 1000} с) — gateway не ответил.`
        : `Ошибка fetch: ${String(e)}`
    log.error('RequestTestTab.fetch_failed', { error: String(e) })
  } finally {
    clearTimeout(timeoutId)
    requestPending.value = false
  }
}

function formatJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function requestHeadersJson(): string {
  if (!requestSnapshot.value) return ''
  const { method, url, headers } = requestSnapshot.value
  return formatJson({ method, url, headers })
}

function requestBodyJson(): string {
  if (!requestSnapshot.value) return ''
  const { body, query } = requestSnapshot.value
  if (query !== null) return formatJson(query)
  if (body !== null) {
    try {
      return formatJson(JSON.parse(body))
    } catch {
      return body
    }
  }
  return '(тело запроса пустое)'
}

// «Ответ вышестоящего сервиса (GetCourse)» — содержимое поля data/error из тела ответа гейтвея.
function upstreamSnapshotJson(): string {
  if (!responseSnapshot.value) return ''
  const pb = responseSnapshot.value.parsedBody
  if (pb && typeof pb === 'object') {
    const obj = pb as Record<string, unknown>
    if ('ok' in obj) {
      if (obj.ok === true) {
        return 'data' in obj ? formatJson(obj.data) : '(в ответе гейтвея нет поля data)'
      }
      return 'error' in obj ? formatJson(obj.error) : '(в ответе гейтвея нет поля error)'
    }
  }
  return '(не удалось выделить ответ вышестоящего сервиса из тела ответа)'
}

// «Ответ гейтвея» — полная HTTP-обёртка ответа /v1/{op}.
function gatewaySnapshotJson(): string {
  if (!responseSnapshot.value) return ''
  const { statusCode, headers, parsedBody } = responseSnapshot.value
  return formatJson({ statusCode, headers, body: parsedBody })
}

function onSelectOpChange(event: Event) {
  selectedOp.value = (event.target as HTMLSelectElement).value
}

function toggleReveal(name: string) {
  revealedArgs.value[name] = !revealedArgs.value[name]
}
</script>

<template>
  <div class="rt">
    <div class="rt-row">
      <label class="rt-lbl" for="rt-op">Операция</label>
      <select id="rt-op" class="rt-input" :value="selectedOp" @change="onSelectOpChange">
        <option v-for="entry in catalog" :key="entry.op" :value="entry.op">
          {{ entry.httpMethod }} /v1/{{ entry.op }} [{{ entry.contour }}] — {{ entry.availability }}
        </option>
      </select>
    </div>

    <div v-if="selectedOpEntry && !isSelectedOpEnabled" class="rt-warn">
      <i class="fas fa-exclamation-triangle"></i>
      Метод недоступен (availability = {{ selectedOpEntry.availability }}). Отправка заблокирована.
    </div>

    <template v-if="selectedOpEntry">
      <div class="rt-section">
        <button
          type="button"
          class="rt-spoiler-hd"
          :aria-expanded="showHint"
          @click="showHint = !showHint"
        >
          <i
            class="fas rt-spoiler-chevron"
            :class="showHint ? 'fa-chevron-down' : 'fa-chevron-right'"
          ></i>
          <span class="rt-section-hd">Формат запроса — подсказка</span>
          <span class="rt-spoiler-count">
            {{ selectedOpEntry.httpMethod }} /v1/{{ selectedOpEntry.op }}
          </span>
        </button>
        <div v-show="showHint" class="rt-spoiler-body">
          <p class="rt-hint">
            {{
              selectedOpEntry.httpMethod === 'GET'
                ? 'Параметры передаются в query-строке URL.'
                : 'Параметры передаются в теле запроса (JSON).'
            }}
          </p>
          <div class="rt-hint-block">
            <div class="rt-hint-label">
              {{ selectedOpEntry.httpMethod === 'GET' ? 'Пример query' : 'Пример тела (JSON)' }}
            </div>
            <pre class="rt-pre custom-scrollbar">{{ exampleRequest }}</pre>
          </div>
          <div v-if="legendRows.length" class="rt-hint-block">
            <div class="rt-hint-label">Поля</div>
            <ul class="rt-legend">
              <li
                v-for="row in legendRows"
                :key="row.path"
                class="rt-legend-item"
                :style="{ paddingLeft: row.depth * 0.9 + 'rem' }"
              >
                <code class="rt-legend-name">{{ row.path }}</code>
                <span class="rt-legend-type">{{ row.type }}</span>
                <span v-if="row.required" class="rt-req">обязательное</span>
                <span v-else class="rt-opt">опционально</span>
                <span v-if="row.description" class="rt-legend-desc">— {{ row.description }}</span>
              </li>
            </ul>
          </div>
          <p v-else class="rt-hint">У этой операции нет параметров запроса.</p>
        </div>
      </div>

      <div class="rt-section">
        <div class="rt-section-hd-row">
          <div class="rt-section-hd">Заголовки</div>
          <button
            v-if="canFillHost || canFillApiKey"
            type="button"
            class="rt-btn-secondary"
            @click="fillAllTest"
            title="Подставить значения тестовой школы из настроек"
          >
            <i class="fas fa-flask"></i> Использовать тестовые
          </button>
        </div>
        <div class="rt-row">
          <label class="rt-lbl" for="rt-host"
            >{{ GW_HEADER_SCHOOL_HOST }}<span class="rt-req">*</span></label
          >
          <div class="rt-input-row">
            <input
              id="rt-host"
              class="rt-input rt-input-grow"
              type="text"
              v-model="xGcSchoolHost"
              placeholder="например, school.getcourse.ru"
            />
            <button
              v-if="canFillHost"
              type="button"
              class="rt-btn-secondary"
              @click="fillHost"
              title="Подставить gc_test_school_host"
            >
              <i class="fas fa-flask"></i> Подставить
            </button>
          </div>
          <p v-if="fieldErrors[GW_HEADER_SCHOOL_HOST]" class="rt-err">
            {{ fieldErrors[GW_HEADER_SCHOOL_HOST] }}
          </p>
        </div>
        <div class="rt-row">
          <label class="rt-lbl" for="rt-apikey"
            >{{ GW_HEADER_SCHOOL_API_KEY }}<span class="rt-req">*</span></label
          >
          <div class="rt-input-row">
            <input
              id="rt-apikey"
              class="rt-input rt-input-grow"
              :type="showApiKey ? 'text' : 'password'"
              autocomplete="off"
              v-model="xGcSchoolApiKey"
              placeholder="API-ключ школы GetCourse"
            />
            <button
              type="button"
              class="rt-btn-secondary"
              @click="showApiKey = !showApiKey"
              :title="showApiKey ? 'Скрыть' : 'Показать'"
            >
              <i class="fas" :class="showApiKey ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
            <button
              v-if="canFillApiKey"
              type="button"
              class="rt-btn-secondary"
              @click="fillApiKey"
              title="Подставить gc_test_school_api_key"
            >
              <i class="fas fa-flask"></i> Подставить
            </button>
          </div>
          <p v-if="fieldErrors[GW_HEADER_SCHOOL_API_KEY]" class="rt-err">
            {{ fieldErrors[GW_HEADER_SCHOOL_API_KEY] }}
          </p>
        </div>
      </div>

      <div v-if="usesRawBody" class="rt-section">
        <div class="rt-section-hd-row">
          <div class="rt-section-hd">Тело запроса (JSON)</div>
          <button type="button" class="rt-btn-secondary" @click="fillExampleBody">
            <i class="fas fa-code"></i> Подставить пример
          </button>
        </div>
        <textarea
          class="rt-input rt-textarea"
          rows="12"
          v-model="rawBody"
          placeholder="{ ... }"
        ></textarea>
        <p class="rt-hint">
          Отправляется как есть. Нажмите «Подставить пример» и замените значения на реальные; лишние
          опциональные поля удалите.
        </p>
        <p v-if="rawBodyError" class="rt-err">{{ rawBodyError }}</p>
      </div>

      <div v-else-if="argsFields.length" class="rt-section">
        <div class="rt-section-hd">{{ bodyLabel }}</div>
        <div v-for="field in argsFields" :key="field.name" class="rt-row">
          <label class="rt-lbl" :for="`rt-arg-${field.name}`">
            {{ field.name }}
            <span class="rt-type">{{ field.type }}</span>
            <span v-if="field.required" class="rt-req">*</span>
            <span v-else class="rt-opt">(опционально)</span>
          </label>

          <!-- boolean -->
          <select
            v-if="field.type === 'boolean'"
            :id="`rt-arg-${field.name}`"
            class="rt-input"
            v-model="argsValues[field.name]"
          >
            <option value="">— не задано —</option>
            <option value="true">true</option>
            <option value="false">false</option>
          </select>

          <!-- array / object -->
          <textarea
            v-else-if="isJsonField(field)"
            :id="`rt-arg-${field.name}`"
            class="rt-input rt-textarea"
            rows="3"
            v-model="argsValues[field.name]"
            :placeholder="field.type === 'array' ? '[ ... ]' : '{ ... }'"
          ></textarea>

          <!-- string / number -->
          <div v-else class="rt-input-row">
            <input
              :id="`rt-arg-${field.name}`"
              class="rt-input rt-input-grow"
              :type="isSecretField(field.name) && !revealedArgs[field.name] ? 'password' : 'text'"
              :inputmode="field.type === 'number' ? 'decimal' : 'text'"
              autocomplete="off"
              v-model="argsValues[field.name]"
              :placeholder="field.description"
            />
            <button
              v-if="isSecretField(field.name)"
              type="button"
              class="rt-btn-secondary"
              @click="toggleReveal(field.name)"
              :title="revealedArgs[field.name] ? 'Скрыть' : 'Показать'"
            >
              <i class="fas" :class="revealedArgs[field.name] ? 'fa-eye-slash' : 'fa-eye'"></i>
            </button>
            <button
              v-if="isEmailField(field.name)"
              type="button"
              class="rt-btn-secondary"
              @click="fillEmail(field.name)"
              title="Подставить тестовый email"
            >
              <i class="fas fa-at"></i> Подставить
            </button>
          </div>

          <p v-if="field.description" class="rt-hint">{{ field.description }}</p>
          <p v-if="fieldErrors[field.name]" class="rt-err">{{ fieldErrors[field.name] }}</p>
        </div>
      </div>

      <div class="rt-actions">
        <button type="button" class="rt-btn-primary" :disabled="!canSubmit" @click="sendRequest">
          <i v-if="requestPending" class="fas fa-circle-notch fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          {{ requestPending ? 'Отправка...' : 'Отправить' }}
        </button>
        <button
          type="button"
          class="rt-btn-secondary"
          :disabled="requestPending"
          @click="clearForm"
          title="Очистить форму"
        >
          <i class="fas fa-eraser"></i> Очистить
        </button>
        <span
          v-if="responseOk !== null"
          class="rt-status"
          :class="responseOk ? 'rt-status--ok' : 'rt-status--fail'"
        >
          {{ responseOk ? 'УСПЕХ' : 'ПРОВАЛ' }}
        </span>
      </div>

      <p v-if="requestError" class="rt-err">{{ requestError }}</p>

      <div v-if="requestSnapshot" class="rt-snap">
        <div class="rt-snap-hd">Заголовки запроса</div>
        <pre class="rt-pre custom-scrollbar">{{ requestHeadersJson() }}</pre>
      </div>

      <div v-if="requestSnapshot" class="rt-snap">
        <div class="rt-snap-hd">Тело запроса</div>
        <pre class="rt-pre custom-scrollbar">{{ requestBodyJson() }}</pre>
      </div>

      <div v-if="responseSnapshot" class="rt-snap">
        <div class="rt-snap-hd">Ответ вышестоящего сервиса (GetCourse)</div>
        <pre class="rt-pre custom-scrollbar">{{ upstreamSnapshotJson() }}</pre>
      </div>

      <div v-if="responseSnapshot" class="rt-snap">
        <div class="rt-snap-hd">Ответ гейтвея</div>
        <pre class="rt-pre custom-scrollbar">{{ gatewaySnapshotJson() }}</pre>
      </div>
    </template>
  </div>
</template>

<style scoped>
.rt {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  color: #e0dcdf;
}
.rt-section {
  border: 1px solid rgba(50, 44, 54, 0.55);
  background: rgba(12, 11, 14, 0.85);
  padding: 0.6rem 0.8rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.rt-section-hd {
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  color: #d95672;
  text-transform: uppercase;
  font-weight: 600;
}
.rt-section-hd-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}
.rt-spoiler-hd {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font-family: inherit;
}
.rt-spoiler-chevron {
  color: #d95672;
  font-size: 0.7rem;
  width: 0.8rem;
}
.rt-spoiler-count {
  margin-left: auto;
  font-size: 0.66rem;
  color: #7e777b;
  letter-spacing: 0.04em;
}
.rt-spoiler-body {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-top: 0.55rem;
}
.rt-hint-block {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.rt-hint-label {
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  color: #a39da0;
  text-transform: uppercase;
}
.rt-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.rt-legend-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem;
  font-size: 0.72rem;
  line-height: 1.4;
}
.rt-legend-name {
  color: #e0dcdf;
  background: rgba(50, 44, 54, 0.45);
  padding: 0.05rem 0.35rem;
}
.rt-legend-type {
  color: #8fb3c9;
  font-size: 0.66rem;
}
.rt-legend-desc {
  color: #a39da0;
  flex-basis: 100%;
}
.rt-btn-primary {
  background: rgba(196, 33, 63, 0.9);
  border: 1px solid #c4213f;
  color: #fff;
  padding: 0.4rem 0.9rem;
  font-family: inherit;
  font-size: 0.74rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background 0.15s ease;
}
.rt-btn-primary:hover:not(:disabled) {
  background: #c4213f;
}
.rt-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.rt-btn-secondary {
  background: rgba(8, 7, 10, 0.95);
  border: 1px solid rgba(50, 44, 54, 0.55);
  color: #cfc9cc;
  padding: 0.3rem 0.65rem;
  font-family: inherit;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  white-space: nowrap;
  transition:
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}
.rt-btn-secondary:hover:not(:disabled) {
  border-color: #c4213f;
  color: #fff;
  background: rgba(196, 33, 63, 0.1);
}
.rt-btn-secondary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.rt-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.rt-input-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.rt-input-grow {
  flex: 1 1 auto;
  min-width: 0;
}
.rt-lbl {
  font-size: 0.72rem;
  color: #a39da0;
  letter-spacing: 0.04em;
}
.rt-type {
  color: #7e777b;
  margin-left: 0.35rem;
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.rt-req {
  color: #d97a8a;
  margin-left: 0.2rem;
}
.rt-opt {
  color: #7e777b;
  margin-left: 0.3rem;
  font-size: 0.66rem;
}
.rt-input {
  background: rgba(8, 7, 10, 0.95);
  border: 1px solid rgba(50, 44, 54, 0.55);
  color: #e0dcdf;
  padding: 0.45rem 0.6rem;
  font-family: inherit;
  font-size: 0.78rem;
  outline: none;
}
.rt-input:focus {
  border-color: #c4213f;
  background: rgba(20, 18, 24, 0.95);
}
.rt-textarea {
  resize: vertical;
  white-space: pre;
}
.rt-hint {
  font-size: 0.66rem;
  color: #7e777b;
  margin: 0;
}
.rt-err {
  font-size: 0.7rem;
  color: #d97a8a;
  margin: 0;
}
.rt-warn {
  border: 1px solid #c9a660;
  background: rgba(201, 166, 96, 0.08);
  color: #c9a660;
  padding: 0.5rem 0.7rem;
  font-size: 0.74rem;
}
.rt-actions {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}
.rt-status {
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  border: 1px solid;
}
.rt-status--ok {
  color: #6aaf7e;
  border-color: #6aaf7e;
}
.rt-status--fail {
  color: #d97a8a;
  border-color: #d97a8a;
}
.rt-snap {
  border: 1px solid rgba(50, 44, 54, 0.55);
  background: rgba(8, 7, 10, 0.95);
  display: flex;
  flex-direction: column;
}
.rt-snap-hd {
  padding: 0.4rem 0.7rem;
  background: rgba(196, 33, 63, 0.08);
  color: #d95672;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(50, 44, 54, 0.55);
}
.rt-pre {
  margin: 0;
  padding: 0.6rem 0.7rem;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  font-size: 0.74rem;
  color: #cfc9cc;
  white-space: pre;
  overflow-x: auto;
  max-height: 480px;
  overflow-y: auto;
}
</style>
