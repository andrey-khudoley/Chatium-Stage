<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { createComponentLogger } from '../shared/logger'
import { getSettingRoute } from '../api/settings/get'
import { LP_TEST_APIKEY, LP_TEST_LOGIN } from '../shared/gatewaySettingKeys'
import type {
  OperationSummary,
  ArgsFieldSchema
} from '../shared/operationsCatalogShared'

declare const ctx: app.Ctx

const log = createComponentLogger('RequestTestTab')

const props = defineProps<{
  operationsCatalog?: OperationSummary[]
  projectRoot: string
}>()

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
  catalog.value.find((e) => e.availability === 'enabled')?.op ?? (catalog.value[0]?.op ?? '')
)
const xLpApikey = ref<string>('')
const xLpLogin = ref<string>('')
const argsValues = ref<Record<string, string>>({})
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

const isSelectedOpEnabled = computed(
  () => selectedOpEntry.value?.availability === 'enabled'
)

const argsFields = computed<ArgsFieldSchema[]>(
  () => selectedOpEntry.value?.argsSchema.fields ?? []
)

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

async function useTestCredentials() {
  if (useTestPending.value) return
  useTestPending.value = true
  useTestError.value = ''
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
    if (Array.from(params.keys()).length > 0) url += `?${params.toString()}`
  } else {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(argsObj)
  }

  requestSnapshot.value = { method: entry.httpMethod, url, headers, body, query }
  log.info('RequestTestTab.sendRequest', { op: entry.op, method: entry.httpMethod, url })

  try {
    const res = await fetch(url, {
      method: entry.httpMethod,
      headers,
      body
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
    responseOk.value =
      okFromBody !== null ? okFromBody : res.status >= 200 && res.status < 300
  } catch (e) {
    requestError.value = `Ошибка fetch: ${String(e)}`
    log.error('RequestTestTab.fetch_failed', { error: String(e) })
  } finally {
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

function requestSnapshotJson(): string {
  if (!requestSnapshot.value) return ''
  const { method, url, headers, body, query } = requestSnapshot.value
  const payload: Record<string, unknown> = { method, url, headers }
  if (query !== null) payload.query = query
  if (body !== null) {
    try {
      payload.body = JSON.parse(body)
    } catch {
      payload.body = body
    }
  }
  return formatJson(payload)
}

function responseSnapshotJson(): string {
  if (!responseSnapshot.value) return ''
  const { statusCode, headers, parsedBody } = responseSnapshot.value
  return formatJson({ statusCode, headers, body: parsedBody })
}
</script>

<template>
  <div class="rt">
    <div class="rt-row">
      <label class="rt-lbl" for="rt-op">Операция</label>
      <select
        id="rt-op"
        class="rt-input"
        :value="selectedOp"
        @change="(e) => (selectedOp = (e.target as HTMLSelectElement).value)"
      >
        <option v-for="entry in catalog" :key="entry.op" :value="entry.op">
          {{ entry.httpMethod }} /v1/{{ entry.op }} — {{ entry.availability }}
        </option>
      </select>
    </div>

    <div v-if="selectedOpEntry && !isSelectedOpEnabled" class="rt-warn">
      <i class="fas fa-exclamation-triangle"></i>
      Метод недоступен (availability = {{ selectedOpEntry.availability }}). Отправка заблокирована.
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
        <input
          id="rt-apikey"
          class="rt-input"
          type="text"
          v-model="xLpApikey"
          placeholder="API-ключ магазина LifePay"
        />
        <p v-if="fieldErrors['X-Lp-Apikey']" class="rt-err">{{ fieldErrors['X-Lp-Apikey'] }}</p>
      </div>
      <div class="rt-row">
        <label class="rt-lbl" for="rt-login">X-Lp-Login<span class="rt-req">*</span></label>
        <input
          id="rt-login"
          class="rt-input"
          type="text"
          inputmode="numeric"
          v-model="xLpLogin"
          placeholder="7XXXXXXXXXX"
        />
        <p v-if="fieldErrors['X-Lp-Login']" class="rt-err">{{ fieldErrors['X-Lp-Login'] }}</p>
      </div>
    </div>

    <div v-if="argsFields.length" class="rt-section">
      <div class="rt-section-hd">
        Аргументы ({{ selectedOpEntry?.httpMethod === 'GET' ? 'query' : 'body JSON' }})
      </div>
      <div v-for="field in argsFields" :key="field.name" class="rt-row">
        <label class="rt-lbl" :for="`rt-arg-${field.name}`">
          {{ field.name }}
          <span v-if="field.required" class="rt-req">*</span>
          <span v-else class="rt-opt">(опционально)</span>
        </label>
        <input
          :id="`rt-arg-${field.name}`"
          class="rt-input"
          type="text"
          :inputmode="field.type === 'number' ? 'decimal' : 'text'"
          v-model="argsValues[field.name]"
          :placeholder="field.description"
        />
        <p v-if="field.description" class="rt-hint">{{ field.description }}</p>
        <p v-if="fieldErrors[field.name]" class="rt-err">{{ fieldErrors[field.name] }}</p>
      </div>
    </div>

    <div class="rt-actions">
      <button
        type="button"
        class="tp-btn tp-btn--primary"
        :disabled="!canSubmit"
        @click="sendRequest"
      >
        <i v-if="requestPending" class="fas fa-circle-notch fa-spin"></i>
        <i v-else class="fas fa-paper-plane"></i>
        {{ requestPending ? 'Отправка...' : 'Отправить' }}
      </button>
      <span v-if="responseOk !== null" class="rt-status" :class="responseOk ? 'rt-status--ok' : 'rt-status--fail'">
        {{ responseOk ? 'УСПЕХ' : 'ПРОВАЛ' }}
      </span>
    </div>

    <p v-if="requestError" class="rt-err">{{ requestError }}</p>

    <div v-if="requestSnapshot" class="rt-snap">
      <div class="rt-snap-hd">Запрос</div>
      <pre class="rt-pre custom-scrollbar">{{ requestSnapshotJson() }}</pre>
    </div>

    <div v-if="responseSnapshot" class="rt-snap">
      <div class="rt-snap-hd">Ответ</div>
      <pre class="rt-pre custom-scrollbar">{{ responseSnapshotJson() }}</pre>
    </div>
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
.rt-btn-secondary {
  background: rgba(8, 7, 10, 0.95);
  border: 1px solid rgba(50, 44, 54, 0.55);
  color: #cfc9cc;
  padding: 0.3rem 0.65rem;
  font-family: inherit;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
}
.rt-btn-secondary:hover:not(:disabled) {
  border-color: #c4213f;
  color: #fff;
  background: rgba(196, 33, 63, 0.1);
}
.rt-btn-secondary:disabled { opacity: 0.55; cursor: not-allowed; }
.rt-row {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.rt-lbl {
  font-size: 0.72rem;
  color: #a39da0;
  letter-spacing: 0.04em;
}
.rt-req { color: #d97a8a; margin-left: 0.2rem; }
.rt-opt { color: #7e777b; margin-left: 0.3rem; font-size: 0.66rem; }
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
.rt-status--ok { color: #6aaf7e; border-color: #6aaf7e; }
.rt-status--fail { color: #d97a8a; border-color: #d97a8a; }
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
