/* ========================================================================
 * gw-client Lava.Top widget — встраиваемый виджет оплаты через Lava.Top
 * для сторонних страниц магазина. Deal-поток (2026).
 *
 * Поведение:
 *   1. Ждёт DOM-якорь `#gw-lavatop-widget` (если не найден — тихий выход).
 *   2. Читает `data-gw-base-url` с якоря (обязателен).
 *   3. Извлекает dealId из URL текущей страницы (`GwWidgetCommon.extractDealIdFromUrl`).
 *      Если null — тихий выход без рендера и ошибок.
 *   4. Запрашивает конфиг через `GwWidgetCommon.fetchWidgetConfig`.
 *      Если `config.lavatop.enabled !== true` — тихий выход.
 *   5. Клиентская проверка позиций заказа (.deal-positions li) по config.lavatop.offers
 *      и config.lavatop.offerListType. Если хоть одна позиция не разрешена — тихий выход.
 *   6. Отрисовывает три кнопки валют: «Оплатить в ₽» (RUB), «Оплатить в $» (USD),
 *      «Оплатить в €» (EUR).
 *   7. По клику кнопки — POST в intent-by-deal (method:'lavatop', currency).
 *      При успехе — редирект на paymentUrl. При ошибке — текст из errorToText.
 *
 * Параметры через data-атрибуты якорного элемента `#gw-lavatop-widget`:
 *   - data-gw-base-url  (обязателен) — корень gw-client.
 *
 * УДАЛЕНО:
 *   - data-offer-id       — заменён проверкой всех позиций .deal-positions.
 *   - data-email          — email берётся из GC-заказа на сервере.
 *   - data-client-order-id — correlationId детерминирован: `gcdeal-{dealId}`.
 *   - extractOrderAmount / isAmountInRange — сумма с сервера из GC.
 *
 * Зависимости: глобал `window.GwWidgetCommon` из `common.js`.
 *
 * @file
 * ======================================================================== */

;(function (window) {
  'use strict'

  var common = window.GwWidgetCommon
  if (!common || typeof common.safeInit !== 'function') {
    // common.js должен быть подключён перед этим файлом.
    return
  }

  common.safeInit(function () {
    var anchor = document.getElementById('gw-lavatop-widget')
    if (!anchor) return

    var baseUrl = anchor.getAttribute('data-gw-base-url') || ''
    if (!baseUrl) return

    // Извлекаем dealId из URL страницы — если null, виджет не отображается
    // (страница не является страницей конкретного заказа).
    var dealId = common.extractDealIdFromUrl()
    if (!dealId) return

    common.fetchWidgetConfig(baseUrl).then(function (config) {
      if (!config) return
      if (!config.lavatop || config.lavatop.enabled !== true) return

      // Клиентская проверка позиций заказа по белому/чёрному списку офферов.
      var positions = common.extractDealPositions()
      if (!common.areAllPositionsAllowed(positions, config.lavatop.offers || [], config.lavatop.offerListType)) return

      renderWidget(anchor, baseUrl, dealId)
    })
  })

  /**
   * Создаёт три кнопки валют внутри `anchor`. Удаляет существующий рендер
   * при повторной инициализации.
   *
   * @param {HTMLElement} anchor
   * @param {string} baseUrl
   * @param {string} dealId — id заказа GC
   */
  function renderWidget(anchor, baseUrl, dealId) {
    anchor.innerHTML = ''

    var CURRENCIES = [
      { code: 'RUB', label: 'Оплатить в ₽' },
      { code: 'USD', label: 'Оплатить в $' },
      { code: 'EUR', label: 'Оплатить в €' }
    ]

    var error = document.createElement('div')
    error.style.cssText = 'color:#b00020;font-size:13px;margin-top:8px;display:none;'

    var buttons = []

    for (var i = 0; i < CURRENCIES.length; i++) {
      (function (curr) {
        var button = document.createElement('button')
        button.type = 'button'
        button.textContent = curr.label
        button.style.cssText =
          'display:inline-block;padding:12px 24px;background:#1a8052;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;font-family:inherit;line-height:1.2;margin-right:8px;margin-bottom:8px;'
        button.setAttribute('data-gw-method', 'lavatop')
        button.setAttribute('data-gw-currency', curr.code)

        button.addEventListener('click', function () {
          // Дизейбл всех кнопок на время запроса
          for (var j = 0; j < buttons.length; j++) {
            buttons[j].disabled = true
          }
          error.style.display = 'none'

          var payload = { dealId: dealId, method: 'lavatop', currency: curr.code }
          common.postWidgetIntentByDeal(baseUrl, payload).then(function (response) {
            if (response && response.ok && response.paymentUrl) {
              // Редирект на форму оплаты Lava.Top
              window.location.href = response.paymentUrl
              return
            }
            // Ошибка — вернуть кнопки в активное состояние, показать текст
            for (var j = 0; j < buttons.length; j++) {
              buttons[j].disabled = false
            }
            var errCode = (response && response.error) || 'WIDGET_INTENT_ERROR'
            error.textContent = errorToText(errCode)
            error.style.display = 'block'
          })
        })

        buttons.push(button)
        anchor.appendChild(button)
      })(CURRENCIES[i])
    }

    anchor.appendChild(error)
  }

  /**
   * Локализация серверных кодов ошибок в человекочитаемые сообщения.
   * Включает коды deal-потока LifePay, Lava.Top и общие.
   */
  function errorToText(code) {
    switch (code) {
      // CORS и метод
      case 'CORS_ORIGIN_NOT_ALLOWED':
        return 'Сайт не входит в список разрешённых доменов виджета.'
      case 'WIDGET_METHOD_DISABLED':
        return 'Оплата через Lava.Top временно отключена.'
      case 'WIDGET_GC_METHOD_UNSUPPORTED':
        return 'Способ оплаты недоступен для этого заказа.'
      // Оффер
      case 'WIDGET_OFFER_NOT_ALLOWED':
        return 'Заказ содержит товар, недоступный для оплаты этим способом.'
      // Lava.Top deal-поток
      case 'WIDGET_LAVATOP_CURRENCY_INVALID':
        return 'Неверная валюта оплаты.'
      case 'WIDGET_LAVATOP_NOT_CONFIGURED':
        return 'Оплата через Lava.Top временно недоступна.'
      case 'WIDGET_LAVATOP_RATE_UNAVAILABLE':
        return 'Не удалось получить курс валюты. Попробуйте позже.'
      case 'WIDGET_LAVATOP_PRICE_UPDATE_FAILED':
        return 'Ошибка подготовки платежа. Попробуйте позже.'
      case 'WIDGET_LAVATOP_AMOUNT_TOO_SMALL':
        return 'Сумма заказа слишком мала для оплаты в выбранной валюте.'
      // Deal-поток: коды из GC-резолвера
      case 'WIDGET_GC_DEAL_ID_INVALID':
        return 'Не удалось определить заказ для оплаты.'
      case 'WIDGET_GC_DEAL_NOT_FOUND':
        return 'Заказ не найден или недоступен.'
      case 'WIDGET_GC_ALREADY_PAID':
        return 'Этот заказ уже оплачен.'
      case 'WIDGET_GC_EMAIL_MISSING':
        return 'Не удалось определить email покупателя в заказе.'
      case 'WIDGET_GC_GATEWAY_ERROR':
        return 'Ошибка при создании инвойса. Попробуйте ещё раз через несколько секунд.'
      // Ограничения суммы
      case 'WIDGET_AMOUNT_INVALID':
      case 'WIDGET_AMOUNT_BELOW_MIN':
      case 'WIDGET_AMOUNT_EXCEEDS_LIMIT':
      case 'WIDGET_AMOUNT_EXCEEDS_HARD_LIMIT':
        return 'Сумма заказа вне допустимого диапазона для оплаты через Lava.Top.'
      default:
        return 'Не удалось создать инвойс. Попробуйте ещё раз.'
    }
  }
})(window)
