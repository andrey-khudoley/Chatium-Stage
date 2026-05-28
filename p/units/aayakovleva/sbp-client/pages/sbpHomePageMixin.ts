// @shared
/**
 * Методы домашней панели SBP-клиента (loaders для analytics/requests/webhooks,
 * управление доступом, raw-модалка, поиск, фильтр по дате, создание счёта,
 * загрузка qrcode.js). Вынесены из HomePage.vue в mixin ради лимита размера
 * файла; `this` — экземпляр HomePage (Options API). Поведение сохранено дословно.
 */
import { generateCorrelationId, appendCorrelationId } from '../shared/correlation'
import { msToLocalDate, msToLocalTime } from '../shared/sbpHomeFormat'

const REFRESH_INTERVAL_MS = 15000

export const sbpHomePageMethodsMixin = {
  methods: {
    /* ====== Маршрутизация загрузок по вкладкам ====== */
    loadForTab(this: any, tab: string) {
      if (tab === 'overview') {
        this.loadAnalytics()
        this.loadRequests()
        this.loadWebhooks()
      } else if (tab === 'requests') {
        this.loadRequests()
      } else if (tab === 'webhooks') {
        this.loadWebhooks()
      } else if (tab === 'access') {
        if (this.isAdmin) this.loadAccess()
      }
    },
    startAutoRefresh(this: any) {
      this.stopAutoRefresh()
      this.refreshTimer = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return
        this.loadForTab(this.activeTab)
      }, REFRESH_INTERVAL_MS)
    },
    stopAutoRefresh(this: any) {
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
      }
    },

    /* ====== Управление доступом (Admin) ====== */
    async loadAccess(this: any) {
      this.accessError = ''
      try {
        const [invRes, grRes] = await Promise.all([
          fetch(this.apiUrls?.accessInvites, { headers: { Accept: 'application/json' } }),
          fetch(this.apiUrls?.accessGrants, { headers: { Accept: 'application/json' } })
        ])
        const invData = await invRes.json().catch(() => ({}))
        const grData = await grRes.json().catch(() => ({}))
        this.invites = invData && invData.success ? invData.invites || [] : []
        this.grants = grData && grData.success ? grData.grants || [] : []
        if (!(invData && invData.success) || !(grData && grData.success)) {
          this.accessError = 'Не удалось загрузить данные доступа.'
        }
      } catch (e) {
        this.accessError = 'Не удалось загрузить данные доступа.'
      }
    },
    openInviteModal(this: any) {
      this.inviteModal = { note: '', creating: false, error: '', result: null }
    },
    closeInviteModal(this: any) {
      this.inviteModal = null
      this.loadAccess()
    },
    onInviteNote(this: any, value: string) {
      if (this.inviteModal) this.inviteModal.note = value
    },
    async createInvite(this: any) {
      if (!this.inviteModal || this.inviteModal.creating) return
      this.inviteModal.creating = true
      this.inviteModal.error = ''
      try {
        const resp = await fetch(this.apiUrls?.accessGenerateInvite, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: this.inviteModal.note || '' })
        })
        const data = await resp.json().catch(() => ({}))
        if (data && data.success) {
          this.inviteModal.result = { fullUrl: data.fullUrl, expiresAt: data.expiresAt }
        } else {
          this.inviteModal.error = (data && data.error) || 'Не удалось создать ссылку.'
        }
      } catch (e) {
        this.inviteModal.error = 'Не удалось создать ссылку.'
      } finally {
        if (this.inviteModal) this.inviteModal.creating = false
      }
    },
    async revokeInvite(this: any, inviteId: string) {
      try {
        await fetch(this.apiUrls?.accessRevokeInvite, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inviteId })
        })
      } catch (e) {
        // ignore — обновим список ниже
      }
      this.loadAccess()
    },
    async revokeGrant(this: any, userId: string) {
      try {
        await fetch(this.apiUrls?.accessRevokeGrant, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
      } catch (e) {
        // ignore — обновим список ниже
      }
      this.loadAccess()
    },

    /* ====== Raw payload modal ====== */
    async openRaw(this: any, kind: string, id: string | number) {
      // kind === 'request' → apiUrls.rawRequest, kind === 'webhook' → apiUrls.rawWebhook
      const url = kind === 'webhook' ? this.apiUrls?.rawWebhook : this.apiUrls?.rawRequest
      if (!url || !id) {
        this.rawModal = { kind, id, entry: null, loading: false, error: 'URL или id отсутствуют' }
        return
      }
      this.rawModal = { kind, id, entry: null, loading: true, error: '' }
      try {
        const sep = url.includes('?') ? '&' : '?'
        const res = await fetch(`${url}${sep}id=${encodeURIComponent(String(id))}`, {
          method: 'GET',
          headers: { Accept: 'application/json' }
        })
        const data = await res.json()
        if (!data || data.success !== true) {
          this.rawModal = {
            kind,
            id,
            entry: null,
            loading: false,
            error: data?.error || 'Ошибка загрузки'
          }
          return
        }
        this.rawModal = { kind, id, entry: data.entry || null, loading: false, error: '' }
      } catch (e) {
        this.rawModal = { kind, id, entry: null, loading: false, error: String(e) }
      }
    },
    closeRaw(this: any) {
      this.rawModal = null
    },

    /* ====== Search & lookup ====== */
    clearSearch(this: any) {
      this.searchValue = ''
      this.searchResult = null
      this.searchedQuery = ''
    },
    lookupRequest(this: any, requestId: string) {
      if (!requestId) return
      this.searchValue = requestId
      this.doSearch()
    },
    async doSearch(this: any) {
      const url = this.apiUrls?.searchByRequestId
      const q = (this.searchValue || '').trim()
      if (!url || !q) return
      this.searchedQuery = q
      try {
        const resp = await fetch(url + '?requestId=' + encodeURIComponent(q))
        const data = await resp.json()
        this.searchResult = data.success ? data : { request: null, webhooks: [] }
      } catch (_e) {
        this.searchResult = { request: null, webhooks: [] }
      }
    },

    /* ====== Data loaders ====== */
    async loadAnalytics(this: any) {
      const url = this.apiUrls?.analyticsSummary
      if (!url) return
      try {
        const resp = await fetch(url)
        const data = await resp.json()
        if (data.success) this.analytics = data
        this.lastUpdated.analytics = Date.now()
      } catch (_e) {
        // keep prior data
      }
    },
    async loadRequests(this: any) {
      const url = this.apiUrls?.recentRequests
      if (!url) return
      try {
        const resp = await fetch(url + '?limit=50')
        const data = await resp.json()
        if (data.success) this.requests = data.entries || []
        this.lastUpdated.requests = Date.now()
      } catch (_e) {
        // keep prior data
      }
    },
    async loadWebhooks(this: any) {
      const url = this.apiUrls?.recentWebhooks
      if (!url) return
      try {
        const resp = await fetch(url + '?limit=50')
        const data = await resp.json()
        if (data.success) this.webhooks = data.entries || []
        this.lastUpdated.webhooks = Date.now()
      } catch (_e) {
        // keep prior data
      }
    },

    /* ====== Date filter ====== */
    onFilterChange(this: any) {
      this.saveDateFilter()
    },
    applySavedFilter(this: any, saved: { from?: number; to?: number } | null | undefined) {
      const from = saved && typeof saved.from === 'number' ? saved.from : null
      const to = saved && typeof saved.to === 'number' ? saved.to : null
      this.fromDate = msToLocalDate(from)
      this.fromTime = msToLocalTime(from)
      this.toDate = msToLocalDate(to)
      this.toTime = msToLocalTime(to)
    },
    async saveDateFilter(this: any) {
      const url = this.apiUrls?.filterSave
      if (!url) return
      const from = this.fromMs
      const to = this.toMs
      // Клиентская проверка диапазона до запроса — не шлём заведомо невалидное.
      if (from !== null && to !== null && from > to) {
        this.dateFilterError = 'Дата начала не может быть позже даты окончания'
        return
      }
      this.dateFilterError = ''
      this.dateFilterSaving = true
      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to })
        })
        const data = await resp.json()
        if (!resp.ok || !data.success) {
          this.dateFilterError = (data && data.error) || 'Не удалось сохранить фильтр'
          return
        }
        // Источник истины — сервер: синхронизируем поля с сохранённым фильтром.
        this.applySavedFilter(data.filter || {})
        this.searchResult = null
        this.loadForTab(this.activeTab)
      } catch (e) {
        this.dateFilterError = 'Ошибка сети при сохранении фильтра'
      } finally {
        this.dateFilterSaving = false
      }
    },
    resetDateFilter(this: any) {
      this.fromDate = ''
      this.fromTime = ''
      this.toDate = ''
      this.toTime = ''
      this.saveDateFilter()
    },

    /* ====== Создание счёта + QR ====== */
    resetBillResult(this: any) {
      this.billResult = null
      this.billSuccessData = null
    },
    async createBill(this: any) {
      const url = this.apiUrls?.invoke
      if (!url) return
      this.billLoading = true
      this.billResult = null
      this.billSuccessData = null
      try {
        // correlationId — уникальный ключ связки счёта с входящим webhook.
        // LifePay не возвращает наш orderNumber в webhook, поэтому кладём ключ
        // и в callbackUrl (query), и в args (сервер сохранит в request_log).
        const correlationId = generateCorrelationId()
        // appendCorrelationId не бросает: при невалидном callbackUrl вернёт оригинал
        // с appended:false (correlationId уйдёт только в args, связка по query не
        // сработает). Счёт всё равно создаётся. Кейс практически недостижим: поле
        // предзаполнено валидным серверным webhookUrl, а с «битым» URL LifePay
        // не доставит webhook вовсе. Логирование на клиенте не ведём (console
        // запрещён стандартом; ctx-логгера в Vue нет).
        const cb = appendCorrelationId(this.bill.callbackUrl, correlationId)
        const args: Record<string, unknown> = {
          orderNumber: this.bill.orderNumber,
          amount: Number(this.bill.amount),
          customerEmail: this.bill.customerEmail,
          description: this.bill.description,
          callbackUrl: cb.url,
          correlationId
        }
        if (this.bill.customerPhone && this.bill.customerPhone.trim()) {
          args.customerPhone = this.bill.customerPhone.trim()
        }
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ op: 'createBill', args })
        })
        const data = await resp.json()
        this.billResult = data
        if (data.ok && data.data) {
          // QR рендерится подкомпонентом HomeCreateBillTab по watch(billSuccessData).
          this.billSuccessData = data.data
        }
      } catch (e: any) {
        this.billResult = {
          ok: false,
          error: { code: 'CLIENT_FETCH_ERROR', message: String(e?.message || e) },
          requestId: null
        }
      } finally {
        this.billLoading = false
      }
    },
    loadQrcodeLib(this: any) {
      if (typeof window === 'undefined') return
      if ((window as any).QRCode) return
      const s = document.createElement('script')
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js'
      s.async = true
      document.head.appendChild(s)
    }
  }
}
