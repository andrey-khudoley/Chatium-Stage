<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { createComponentLogger } from '../shared/logger'
import { getSettingRoute } from '../api/settings/get'
import { LP_TEST_APIKEY, LP_TEST_LOGIN } from '../shared/gatewaySettingKeys'
import type { LpTestValues } from '../shared/gatewaySettingKeys'
import type {
  OperationSummary,
  ArgsFieldSchema,
  ArgsTreeNode,
  ArgsTreeField
} from '../shared/operationsCatalogShared'

declare const ctx: app.Ctx

const log = createComponentLogger('RequestTestTab')

const props = defineProps<{
  operationsCatalog?: OperationSummary[]
  projectRoot: string
  // Тестовые значения из Heap, переданные через SSR-пропсы (вкладка панели).
  // Если не заданы (контекст TestsPage, Admin) — кнопка «Использовать тестовые» делает
  // fallback на getSettingRoute (требует роль Admin).
  testValues?: LpTestValues
}>()

const EMAIL_PLACEHOLDER = 'tester@khudoley.pro'
// Клиентский таймаут fetch — страховка от зависания формы. Должен быть БОЛЬШЕ серверного
// таймаута исходящего вызова LifePay (GW_OUTBOUND_TIMEOUT_MS = 10 с): иначе клиент прервёт запрос
// раньше, чем gateway успеет вернуть осмысленную ошибку таймаута upstream. 10 с + запас.
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
const xLpApikey = ref<string>('')
const xLpLogin = ref<string>('')
const showApiKey = ref(false)
const argsValues = ref<Record<string, string>>({})
const revealedArgs = ref<Record<string, boolean>>({})
// Спойлер-подсказка о формате запроса выбранной операции — по умолчанию закрыт.
const showHint = ref(false)
const useTestPending = ref(false)
const useTestError = ref<string>('')
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

// Доступность кнопок «Подставить» для заголовков — только при наличии тестового значения в пропсах.
const canFillApikey = computed(() => !!props.testValues && props.testValues.testApiKey !== '')
const canFillLogin = computed(() => !!props.testValues && props.testValues.testLogin !== '')

function isEmailField(name: string): boolean {
  return /email/i.test(name)
}

function isSecretField(name: string): boolean {
  return /key|secret|password|token|apikey/i.test(name)
}

function toggleReveal(name: string) {
  revealedArgs.value[name] = !revealedArgs.value[name]
}

const LP_LOGIN_RE = /^7[0-9]{10}$/

function validateLogin(value: string): string {
  const v = value.trim()
  if (!v) return 'Заголовок X-Lp-Login обязателен.'
  if (!LP_LOGIN_RE.test(v)) return 'X-Lp-Login: 11 цифр, начинается с 7, без префикса +.'
  return ''
}

function validateApikey(value: string): string {
  if (!value.trim()) return 'Заголовок X-Lp-Apikey обязателен.'
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
  return ''
}

const fieldErrors = computed<Record<string, string>>(() => {
  const errs: Record<string, string> = {}
  errs['X-Lp-Apikey'] = validateApikey(xLpApikey.value)
  errs['X-Lp-Login'] = validateLogin(xLpLogin.value)
  for (const field of argsFields.value) {
    const err = validateArgField(field, argsValues.value[field.name] ?? '')
    if (err) errs[field.name] = err
  }
  return errs
})

const hasErrors = computed(() => Object.values(fieldErrors.value).some((e) => e !== ''))

const canSubmit = computed(
  () => isSelectedOpEnabled.value && !hasErrors.value && !requestPending.value
)

watch(selectedOp, () => {
  argsValues.value = {}
  revealedArgs.value = {}
  showApiKey.value = false
  requestSnapshot.value = null
  responseSnapshot.value = null
  responseOk.value = null
  requestError.value = ''
})

function buildArgsObject(): Record<string, string | number> {
  const result: Record<string, string | number> = {}
  for (const field of argsFields.value) {
    const raw = (argsValues.value[field.name] ?? '').trim()
    if (raw === '') continue
    result[field.name] = field.type === 'number' ? Number(raw) : raw
  }
  return result
}

function fillApikey() {
  if (props.testValues?.testApiKey) xLpApikey.value = props.testValues.testApiKey
}

function fillLogin() {
  if (props.testValues?.testLogin) xLpLogin.value = props.testValues.testLogin
}

function fillEmail(fieldName: string) {
  argsValues.value[fieldName] = EMAIL_PLACEHOLDER
}

async function useTestCredentials() {
  if (useTestPending.value) return
  useTestError.value = ''
  // Если проп testValues передан (вкладка панели) — подставляем синхронно из него,
  // без сетевого запроса к Admin-only роуту. Пустые строки = настройки не заданы в проекте.
  if (props.testValues) {
    if (props.testValues.testApiKey !== '') xLpApikey.value = props.testValues.testApiKey
    if (props.testValues.testLogin !== '') xLpLogin.value = props.testValues.testLogin
    const missing: string[] = []
    if (props.testValues.testApiKey === '') missing.push('lp_test_apikey')
    if (props.testValues.testLogin === '') missing.push('lp_test_login')
    if (missing.length > 0) {
      useTestError.value = `Не заданы в настройках проекта: ${missing.join(', ')}.`
    }
    log.info('useTestCredentials from props', {
      apikeyLength: xLpApikey.value.length,
      loginLength: xLpLogin.value.length
    })
    return
  }
  // Fallback: контекст TestsPage (Admin, проп не передан) — читаем настройки через getSettingRoute.
  useTestPending.value = true
  try {
    const [apikeyRes, loginRes] = await Promise.all([
      getSettingRoute.query({ key: LP_TEST_APIKEY }).run(ctx),
      getSettingRoute.query({ key: LP_TEST_LOGIN }).run(ctx)
    ])
    const a = apikeyRes as { success?: boolean; value?: unknown; error?: string }
    const l = loginRes as { success?: boolean; value?: unknown; error?: string }
    if (a?.success && typeof a.value === 'string') {
      xLpApikey.value = a.value
    } else {
      useTestError.value = `Не удалось получить lp_test_apikey${a?.error ? `: ${a.error}` : ''}`
    }
    if (l?.success && typeof l.value === 'string') {
      xLpLogin.value = l.value
    } else if (!useTestError.value) {
      useTestError.value = `Не удалось получить lp_test_login${l?.error ? `: ${l.error}` : ''}`
    }
    log.info('useTestCredentials done', {
      apikeyLength: xLpApikey.value.length,
      loginLength: xLpLogin.value.length
    })
  } catch (e) {
    useTestError.value = `Ошибка загрузки настроек: ${String(e)}`
    log.error('useTestCredentials_failed', { error: String(e) })
  } finally {
    useTestPending.value = false
  }
}

function clearForm() {
  xLpApikey.value = ''
  xLpLogin.value = ''
  showApiKey.value = false
  argsValues.value = {}
  requestSnapshot.value = null
  responseSnapshot.value = null
  responseOk.value = null
  requestError.value = ''
  useTestError.value = ''
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
    'X-Lp-Apikey': xLpApikey.value.trim(),
    'X-Lp-Login': xLpLogin.value.trim()
  }
  let url = `/${props.projectRoot}/api/v1/${entry.op}`
  let body: string | null = null
  let query: Record<string, string> | null = null

  if (entry.httpMethod === 'GET') {
    const params = new URLSearchParams()
    query = {}
    for (const [k, v] of Object.entries(argsObj)) {
      const s = String(v)
      params.set(k, s)
      query[k] = s
    }
    const queryString = params.toString()
    if (queryString) url += `?${queryString}`
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

// «Ответ вышестоящего сервиса (LifePay)» — содержимое, которое гейтвей вернул из data/error.
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
</script>

<template>
  <div class="rt">
    <div class="rt-row">
      <label class="rt-lbl" for="rt-op">Операция</label>
      <select id="rt-op" class="rt-input" :value="selectedOp" @change="onSelectOpChange">
        <option v-for="entry in catalog" :key="entry.op" :value="entry.op">
          {{ entry.httpMethod }} /v1/{{ entry.op }} — {{ entry.availability }}
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
            type="button"
            class="rt-btn-secondary"
            :disabled="useTestPending"
            @click="useTestCredentials"
            title="Подставить значения lp_test_apikey и lp_test_login из настроек"
          >
            <i v-if="useTestPending" class="fas fa-circle-notch fa-spin"></i>
            <i v-else class="fas fa-flask"></i>
            {{ useTestPending ? 'Загрузка...' : 'Использовать тестовые' }}
          </button>
        </div>
        <p v-if="useTestError" class="rt-err">{{ useTestError }}</p>
        <div class="rt-row">
          <label class="rt-lbl" for="rt-apikey">X-Lp-Apikey<span class="rt-req">*</span></label>
          <div class="rt-input-row">
            <input
              id="rt-apikey"
              class="rt-input rt-input-grow"
              :type="showApiKey ? 'text' : 'password'"
              autocomplete="off"
              v-model="xLpApikey"
              placeholder="API-ключ магазина LifePay"
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
              v-if="canFillApikey"
              type="button"
              class="rt-btn-secondary"
              @click="fillApikey"
              title="Подставить lp_test_apikey"
            >
              <i class="fas fa-flask"></i> Подставить
            </button>
          </div>
          <p v-if="fieldErrors['X-Lp-Apikey']" class="rt-err">{{ fieldErrors['X-Lp-Apikey'] }}</p>
        </div>
        <div class="rt-row">
          <label class="rt-lbl" for="rt-login">X-Lp-Login<span class="rt-req">*</span></label>
          <div class="rt-input-row">
            <input
              id="rt-login"
              class="rt-input rt-input-grow"
              type="text"
              inputmode="numeric"
              v-model="xLpLogin"
              placeholder="7XXXXXXXXXX"
            />
            <button
              v-if="canFillLogin"
              type="button"
              class="rt-btn-secondary"
              @click="fillLogin"
              title="Подставить lp_test_login"
            >
              <i class="fas fa-flask"></i> Подставить
            </button>
          </div>
          <p v-if="fieldErrors['X-Lp-Login']" class="rt-err">{{ fieldErrors['X-Lp-Login'] }}</p>
        </div>
      </div>

      <div v-if="argsFields.length" class="rt-section">
        <div class="rt-section-hd">{{ bodyLabel }}</div>
        <div v-for="field in argsFields" :key="field.name" class="rt-row">
          <label class="rt-lbl" :for="`rt-arg-${field.name}`">
            {{ field.name }}
            <span v-if="field.required" class="rt-req">*</span>
            <span v-else class="rt-opt">(опционально)</span>
          </label>
          <div class="rt-input-row">
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
        <div class="rt-snap-hd">Ответ вышестоящего сервиса (LifePay)</div>
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
