/* ========================================================================
 * gw-client userscript common — общие утилиты для встраиваемых виджетов
 * LifePay и Lava.Top на сторонних страницах магазина.
 *
 * Скрипт регистрирует объект `window.GwWidgetCommon` с pure-функциями:
 *   - safeInit(fn)                  — глобальный try/catch вокруг инициализации
 *   - extractOrderAmount()          — извлечение суммы заказа из DOM магазина
 *   - isAmountInRange(amount, max)  — клиентский фильтр по диапазону суммы
 *   - isOfferMatched(id, ids, type) — клиентский фильтр по white/blacklist
 *   - fetchWidgetConfig(baseUrl)    — GET /api/widgets/config
 *   - postWidgetIntent(baseUrl, m, b) — POST /api/widgets/intent-<m>
 *   - createModal(el, onClose?)     — оверлей-модалка без внешних CSS
 *
 * Подключение: вставить тег <script> с этим файлом перед тегом конкретного
 * виджета (`lifepay-widget.user.js` или `lavatop-widget.user.js`). Файл не
 * выполняет никаких side-effects сам по себе.
 *
 * Зависимости: нет (vanilla JS, без TypeScript). Совместимо с ES5+ браузерами.
 * Файл намеренно вне зоны проверки vue-tsc — типизация только через JSDoc.
 * ======================================================================== */

;(function (window) {
  'use strict'

  if (window.GwWidgetCommon) {
    // Повторная загрузка common.js — оставляем первую регистрацию, чтобы не
    // ломать существующие виджеты, которые уже захватили ссылку.
    return
  }

  /**
   * Обёртка вокруг инициализации виджета. Любая ошибка (CSP-блокировка,
   * сетевая, DOM-парсинг, неожиданная структура страницы) гасится — виджет
   * тихо выходит, не ломая основной флоу магазина.
   *
   * @param {() => void | Promise<void>} fn — функция инициализации виджета.
   */
  function safeInit(fn) {
    try {
      var result = fn()
      if (result && typeof result.catch === 'function') {
        result.catch(function () {
          /* swallow — userscript не должен влиять на страницу. */
        })
      }
    } catch (err) {
      /* swallow */
    }
  }

  /**
   * Реестр CSS-селекторов суммы заказа на странице магазина. Порядок имеет
   * значение: первый найденный селектор побеждает. Расширяется без релиза
   * клиента — достаточно добавить новую запись.
   *
   * @type {string[]}
   */
  var ORDER_AMOUNT_SELECTORS = [
    '.deal-finish-price-title b',
    '.order-amount',
    '[data-order-amount]',
    '[data-gw-amount]'
  ]

  /**
   * Извлекает сумму заказа из DOM магазина по реестру селекторов.
   * Возвращает число или `null` (например, если страница ещё не отрисовала
   * итоговую цену). Не бросает исключений.
   *
   * @returns {number | null}
   */
  function extractOrderAmount() {
    try {
      for (var i = 0; i < ORDER_AMOUNT_SELECTORS.length; i++) {
        var selector = ORDER_AMOUNT_SELECTORS[i]
        var node = document.querySelector(selector)
        if (!node) continue
        // Атрибут data-* приоритетнее textContent для пары `[data-…]`.
        var raw = ''
        if (selector === '[data-order-amount]') {
          raw = node.getAttribute('data-order-amount') || node.textContent || ''
        } else if (selector === '[data-gw-amount]') {
          raw = node.getAttribute('data-gw-amount') || node.textContent || ''
        } else {
          raw = node.textContent || ''
        }
        var digits = String(raw).replace(/[^\d]/g, '')
        if (!digits) continue
        var n = parseInt(digits, 10)
        if (isFinite(n) && n > 0) return n
      }
    } catch (err) {
      /* swallow */
    }
    return null
  }

  /**
   * Проверка соответствия суммы пользовательскому диапазону виджета.
   * `minAmount === 0` — без ограничения снизу. `maxAmount === 0` — без
   * ограничения сверху. Отрицательные/NaN границы трактуются как «без
   * ограничения».
   *
   * @param {number} amount
   * @param {number} minAmount
   * @param {number} maxAmount
   * @returns {boolean}
   */
  function isAmountInRange(amount, minAmount, maxAmount) {
    if (!isFinite(amount) || amount <= 0) return false
    if (isFinite(minAmount) && minAmount > 0 && amount < minAmount) return false
    if (isFinite(maxAmount) && maxAmount > 0 && amount > maxAmount) return false
    return true
  }

  /**
   * Проверка фильтра офферов. Пустой список — виджет показывается для всех
   * офферов (никакого ограничения). При непустом списке логика зависит от
   * `listType`: whitelist разрешает только перечисленные, blacklist — наоборот.
   *
   * @param {string | null | undefined} pageOfferId
   * @param {string[]} offerIds
   * @param {'whitelist' | 'blacklist' | string} listType
   * @returns {boolean}
   */
  function isOfferMatched(pageOfferId, offerIds, listType) {
    if (!Array.isArray(offerIds) || offerIds.length === 0) return true
    var id = pageOfferId ? String(pageOfferId) : ''
    var inList = id ? offerIds.indexOf(id) !== -1 : false
    if (listType === 'blacklist') return !inList
    return inList
  }

  /**
   * Запрос публичной конфигурации виджета у нашего клиента. Возвращает
   * `WidgetPublicConfig` или `null` при сетевой ошибке / `403` (CORS).
   *
   * @param {string} baseUrl — базовый URL клиента (например, `https://s.chtm.khudoley.pro`).
   * @returns {Promise<object | null>}
   */
  function fetchWidgetConfig(baseUrl) {
    var url = baseUrl.replace(/\/$/, '') + '/p/units/aayakovleva/gw-client/api/widgets/config'
    return fetch(url, {
      method: 'GET',
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-store'
    })
      .then(function (response) {
        if (!response.ok) return null
        return response.json().then(function (data) {
          if (data && data.ok && data.config) return data.config
          return null
        })
      })
      .catch(function () {
        return null
      })
  }

  /**
   * POST к intent-эндпоинту нашего клиента. Тело отправляется как
   * `Content-Type: text/plain` с JSON-строкой внутри, чтобы избежать CORS
   * preflight (платформа не обслуживает OPTIONS).
   *
   * @param {string} baseUrl
   * @param {'lifepay' | 'lavatop'} method
   * @param {object} payload
   * @returns {Promise<object | null>}
   */
  function postWidgetIntent(baseUrl, method, payload) {
    var url =
      baseUrl.replace(/\/$/, '') + '/p/units/aayakovleva/gw-client/api/widgets/intent-' + method
    var body = JSON.stringify(payload || {})
    return fetch(url, {
      method: 'POST',
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-store',
      headers: { 'Content-Type': 'text/plain' },
      body: body
    })
      .then(function (response) {
        return response
          .json()
          .then(function (data) {
            return data || null
          })
          .catch(function () {
            return null
          })
      })
      .catch(function () {
        return null
      })
  }

  /**
   * Простая модалка-оверлей без внешних CSS/зависимостей. Возвращает объект
   * `{ show, hide }`. Стили — инлайн, чтобы не зависеть от CSP `style-src`.
   *
   * @param {HTMLElement | string} content — DOM-элемент или HTML-строка.
   * @param {() => void} [onClose]
   * @returns {{ show: () => void, hide: () => void }}
   */
  function createModal(content, onClose) {
    var overlay = document.createElement('div')
    overlay.setAttribute('data-gw-modal', '1')
    overlay.style.cssText =
      'position:fixed;top:0;left:0;right:0;bottom:0;width:100vw;height:100vh;background:rgba(0,0,0,0.7);z-index:2147483646;display:flex;align-items:center;justify-content:center;'

    var inner = document.createElement('div')
    inner.style.cssText =
      'position:relative;background:#fff;color:#222;padding:24px;border-radius:8px;max-width:90vw;max-height:90vh;overflow:auto;box-shadow:0 12px 32px rgba(0,0,0,0.3);font-family:sans-serif;'

    var closeBtn = document.createElement('button')
    closeBtn.type = 'button'
    closeBtn.textContent = '×'
    closeBtn.setAttribute('aria-label', 'Закрыть')
    closeBtn.style.cssText =
      'position:absolute;top:6px;right:8px;border:none;background:transparent;color:#888;font-size:22px;line-height:1;cursor:pointer;padding:4px 8px;'
    inner.appendChild(closeBtn)

    if (typeof content === 'string') {
      var span = document.createElement('div')
      span.innerHTML = content
      inner.appendChild(span)
    } else if (content && content.nodeType === 1) {
      inner.appendChild(content)
    }

    overlay.appendChild(inner)

    function hide() {
      try {
        overlay.parentNode && overlay.parentNode.removeChild(overlay)
      } catch (e) {
        /* swallow */
      }
      if (typeof onClose === 'function') {
        try {
          onClose()
        } catch (e) {
          /* swallow */
        }
      }
    }

    closeBtn.addEventListener('click', hide)
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) hide()
    })

    return {
      show: function () {
        document.body.appendChild(overlay)
      },
      hide: hide
    }
  }

  window.GwWidgetCommon = {
    safeInit: safeInit,
    extractOrderAmount: extractOrderAmount,
    isAmountInRange: isAmountInRange,
    isOfferMatched: isOfferMatched,
    fetchWidgetConfig: fetchWidgetConfig,
    postWidgetIntent: postWidgetIntent,
    createModal: createModal
  }
})(window)
