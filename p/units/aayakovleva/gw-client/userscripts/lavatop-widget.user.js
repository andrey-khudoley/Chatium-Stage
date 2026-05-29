/* ========================================================================
 * gw-client Lava.Top widget — встраиваемый виджет оплаты через Lava.Top
 * для сторонних страниц магазина.
 *
 * Отличия от LifePay-виджета:
 *   - Цена за оффер берётся из Lava.Top по `offerId`; `amount` опционален.
 *   - По клику виджет не открывает модалку с QR, а делает редирект:
 *     `window.location.href = response.paymentUrl`.
 *   - `offerId` обязателен — без него Lava.Top не примет инвойс. По умолчанию
 *     берётся из data-атрибута якоря; если не задан и пройти offerListType
 *     не позволяет — виджет не рендерится.
 *
 * Параметры через data-атрибуты якорного элемента `#gw-lavatop-widget`:
 *   - data-gw-base-url   (обязателен) — корень gw-client.
 *   - data-offer-id      (рекомендуется) — id оффера Lava.Top.
 *   - data-email         (опционально) — email покупателя.
 *   - data-client-order-id (опционально) — внешний номер заказа.
 *
 * Зависимости: `window.GwWidgetCommon` из `common.js`.
 *
 * @file
 * ======================================================================== */

;(function (window) {
  'use strict'

  var common = window.GwWidgetCommon
  if (!common || typeof common.safeInit !== 'function') {
    return
  }

  common.safeInit(function () {
    var anchor = document.getElementById('gw-lavatop-widget')
    if (!anchor) return

    var baseUrl = anchor.getAttribute('data-gw-base-url') || ''
    if (!baseUrl) return
    var pageOfferId = anchor.getAttribute('data-offer-id')

    common.fetchWidgetConfig(baseUrl).then(function (config) {
      if (!config) return
      if (!config.lavatop || config.lavatop.enabled !== true) return

      var amount = common.extractOrderAmount()
      if (amount === null) return
      if (!common.isAmountInRange(amount, config.lavatop.minAmount, config.lavatop.maxAmount))
        return

      var offerIds = Array.isArray(config.lavatop.offerIds) ? config.lavatop.offerIds : []
      if (offerIds.length > 0 && !pageOfferId) return
      if (!common.isOfferMatched(pageOfferId, offerIds, config.lavatop.offerListType)) return

      // Lava.Top требует offerId: если на якоре не задан и список офферов
      // не помог уточнить — попытаемся взять первый из whitelist'а.
      var resolvedOfferId = pageOfferId
      if (!resolvedOfferId && config.lavatop.offerListType === 'whitelist' && offerIds.length > 0) {
        resolvedOfferId = offerIds[0]
      }
      if (!resolvedOfferId) return

      renderWidget(anchor, baseUrl, amount, resolvedOfferId)
    })
  })

  /**
   * Создаёт кликабельный блок виджета Lava.Top. По клику — POST в intent и
   * редирект.
   *
   * @param {HTMLElement} anchor
   * @param {string} baseUrl
   * @param {number} amount
   * @param {string} offerId
   */
  function renderWidget(anchor, baseUrl, amount, offerId) {
    anchor.innerHTML = ''
    var button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Оплатить через Lava.Top'
    button.style.cssText =
      'display:inline-block;padding:12px 24px;background:#1a8052;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;font-family:inherit;line-height:1.2;'
    button.setAttribute('data-gw-method', 'lavatop')

    var error = document.createElement('div')
    error.style.cssText = 'color:#b00020;font-size:13px;margin-top:8px;display:none;'

    button.addEventListener('click', function () {
      button.disabled = true
      var originalText = button.textContent
      button.textContent = 'Создание инвойса…'
      error.style.display = 'none'

      var email = anchor.getAttribute('data-email') || ''
      var clientOrderId = anchor.getAttribute('data-client-order-id') || ''
      var payload = {
        amount: amount,
        email: email,
        offerId: offerId
      }
      if (clientOrderId) payload.clientOrderId = clientOrderId

      common.postWidgetIntent(baseUrl, 'lavatop', payload).then(function (response) {
        if (!response || !response.ok || !response.paymentUrl) {
          button.disabled = false
          button.textContent = originalText
          var errCode = (response && response.error) || 'WIDGET_INTENT_ERROR'
          error.textContent = errorToText(errCode)
          error.style.display = 'block'
          return
        }
        // Редирект на форму оплаты Lava.Top.
        window.location.href = response.paymentUrl
      })
    })

    anchor.appendChild(button)
    anchor.appendChild(error)
  }

  /** Локализация серверных кодов ошибок. */
  function errorToText(code) {
    switch (code) {
      case 'CORS_ORIGIN_NOT_ALLOWED':
        return 'Сайт не входит в список разрешённых доменов виджета.'
      case 'WIDGET_METHOD_DISABLED':
        return 'Оплата через Lava.Top временно отключена.'
      case 'WIDGET_AMOUNT_INVALID':
      case 'WIDGET_AMOUNT_BELOW_MIN':
      case 'WIDGET_AMOUNT_EXCEEDS_LIMIT':
      case 'WIDGET_AMOUNT_EXCEEDS_HARD_LIMIT':
        return 'Сумма заказа вне допустимого диапазона для оплаты через Lava.Top.'
      case 'WIDGET_EMAIL_REQUIRED':
        return 'Для оплаты через Lava.Top требуется email покупателя.'
      case 'WIDGET_OFFER_ID_REQUIRED':
        return 'Не указан идентификатор оффера для оплаты.'
      case 'WIDGET_OFFER_NOT_ALLOWED':
        return 'Этот товар недоступен для оплаты через Lava.Top.'
      case 'WIDGET_GATEWAY_ERROR':
        return 'Ошибка при создании инвойса. Попробуйте ещё раз через несколько секунд.'
      default:
        return 'Не удалось создать инвойс. Попробуйте ещё раз.'
    }
  }
})(window)
