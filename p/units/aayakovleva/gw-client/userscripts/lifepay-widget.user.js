/* ========================================================================
 * gw-client LifePay widget — встраиваемый виджет оплаты через LifePay (СБП)
 * для сторонних страниц магазина.
 *
 * Поведение:
 *   1. Ждёт DOM-якорь `#gw-lifepay-widget` (если не найден — тихий выход).
 *   2. Запрашивает конфиг через `GwWidgetCommon.fetchWidgetConfig`.
 *   3. Прогоняет 5 фильтров: enabled / amount-есть / amount-в-диапазоне /
 *      offerId-определён / offerId-проходит-white-blacklist. При провале
 *      любого — тихий выход без рендера.
 *   4. Отрисовывает кликабельный блок «Оплатить через СБП (LifePay)».
 *   5. По клику делает POST `/api/widgets/intent-lifepay` (через
 *      `postWidgetIntent`), при успехе — динамически подгружает QR-библиотеку
 *      с CDN и показывает модалку с QR-кодом. При ошибке/недоступности CDN —
 *      fallback на текстовую ссылку.
 *
 * Параметры через data-атрибуты якорного элемента:
 *   - data-gw-base-url   (обязателен) — корень gw-client, например
 *                        `https://s.chtm.khudoley.pro`.
 *   - data-offer-id      (опционально) — id оффера для фильтрации списком.
 *   - data-email         (опционально) — email покупателя; если магазин
 *                        отрисовывает другое поле, можно прописать на якоре.
 *   - data-order-number  (опционально) — внешний номер заказа.
 *
 * Зависимости: глобал `window.GwWidgetCommon` из `common.js`.
 *
 * @file
 * ======================================================================== */

;(function (window) {
  'use strict'

  /** URL CDN QR-библиотеки (тот же что использует наша админ-панель). */
  var QR_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/qrcode/1.5.1/qrcode.min.js'

  var common = window.GwWidgetCommon
  if (!common || typeof common.safeInit !== 'function') {
    // common.js должен быть подключён перед этим файлом.
    return
  }

  common.safeInit(function () {
    var anchor = document.getElementById('gw-lifepay-widget')
    if (!anchor) return

    var baseUrl = anchor.getAttribute('data-gw-base-url') || ''
    if (!baseUrl) return
    var pageOfferId = anchor.getAttribute('data-offer-id')

    common.fetchWidgetConfig(baseUrl).then(function (config) {
      if (!config) return
      if (!config.lifepay || config.lifepay.enabled !== true) return

      var amount = common.extractOrderAmount()
      if (amount === null) return
      if (!common.isAmountInRange(amount, config.lifepay.minAmount, config.lifepay.maxAmount))
        return

      var offerIds = Array.isArray(config.lifepay.offerIds) ? config.lifepay.offerIds : []
      if (offerIds.length > 0 && !pageOfferId) {
        // Список офферов задан, но якорь не указал id страницы — консервативно
        // не показываем (иначе админ не сможет ограничить виджет конкретными
        // офферами через data-offer-id).
        return
      }
      if (!common.isOfferMatched(pageOfferId, offerIds, config.lifepay.offerListType)) return

      renderWidget(anchor, baseUrl, amount, pageOfferId)
    })
  })

  /**
   * Создаёт кликабельный блок виджета внутри `anchor`. Удаляет существующий
   * рендер, если виджет переинициализируется (повторный safeInit вызов
   * допустим, но не должен дублировать DOM).
   *
   * @param {HTMLElement} anchor
   * @param {string} baseUrl
   * @param {number} amount
   * @param {string | null} pageOfferId
   */
  function renderWidget(anchor, baseUrl, amount, pageOfferId) {
    anchor.innerHTML = ''
    var button = document.createElement('button')
    button.type = 'button'
    button.textContent = 'Оплатить через СБП (LifePay)'
    button.style.cssText =
      'display:inline-block;padding:12px 24px;background:#d3234b;color:#fff;border:none;border-radius:6px;font-size:15px;cursor:pointer;font-family:inherit;line-height:1.2;'
    button.setAttribute('data-gw-method', 'lifepay')

    var error = document.createElement('div')
    error.style.cssText = 'color:#b00020;font-size:13px;margin-top:8px;display:none;'

    button.addEventListener('click', function () {
      button.disabled = true
      var originalText = button.textContent
      button.textContent = 'Создание счёта…'
      error.style.display = 'none'

      var email = anchor.getAttribute('data-email') || ''
      var orderNumber = anchor.getAttribute('data-order-number') || ''
      var payload = {
        amount: amount,
        email: email
      }
      if (orderNumber) payload.orderNumber = orderNumber
      if (pageOfferId) {
        payload.offerId = pageOfferId
        payload.correlationId = pageOfferId
      }

      common.postWidgetIntent(baseUrl, 'lifepay', payload).then(function (response) {
        button.disabled = false
        button.textContent = originalText
        if (!response || !response.ok || !response.paymentUrl) {
          var errCode = (response && response.error) || 'WIDGET_INTENT_ERROR'
          error.textContent = errorToText(errCode)
          error.style.display = 'block'
          return
        }
        showQrModal(response.paymentUrl)
      })
    })

    anchor.appendChild(button)
    anchor.appendChild(error)
  }

  /**
   * Загружает QR-библиотеку с CDN при необходимости, генерирует QR-код по
   * paymentUrl и показывает модалку. При ошибке загрузки/генерации —
   * fallback: модалка со ссылкой на paymentUrl.
   *
   * @param {string} paymentUrl
   */
  function showQrModal(paymentUrl) {
    if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
      renderQrInModal(paymentUrl)
      return
    }
    var script = document.createElement('script')
    script.src = QR_CDN_URL
    script.async = true
    script.onload = function () {
      if (window.QRCode && typeof window.QRCode.toCanvas === 'function') {
        renderQrInModal(paymentUrl)
      } else {
        showLinkFallbackModal(paymentUrl)
      }
    }
    script.onerror = function () {
      showLinkFallbackModal(paymentUrl)
    }
    document.head.appendChild(script)
  }

  /**
   * Рендерит canvas с QR в модалке.
   *
   * @param {string} paymentUrl
   */
  function renderQrInModal(paymentUrl) {
    var wrapper = document.createElement('div')
    wrapper.style.cssText = 'text-align:center;max-width:320px;'

    var title = document.createElement('div')
    title.textContent = 'Отсканируйте QR-код для оплаты через СБП'
    title.style.cssText = 'font-size:15px;color:#222;margin-bottom:14px;font-weight:600;'
    wrapper.appendChild(title)

    var canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;margin:0 auto;'
    wrapper.appendChild(canvas)

    var link = document.createElement('a')
    link.href = paymentUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.textContent = 'или открыть ссылку оплаты'
    link.style.cssText =
      'display:inline-block;margin-top:14px;color:#1a4ea0;font-size:13px;text-decoration:underline;'
    wrapper.appendChild(link)

    var modal = common.createModal(wrapper)
    modal.show()

    try {
      window.QRCode.toCanvas(canvas, paymentUrl, { width: 256, margin: 1 }, function (err) {
        if (err) {
          modal.hide()
          showLinkFallbackModal(paymentUrl)
        }
      })
    } catch (e) {
      modal.hide()
      showLinkFallbackModal(paymentUrl)
    }
  }

  /**
   * Модалка-фоллбэк: если QR недоступен — даём кликабельную ссылку.
   *
   * @param {string} paymentUrl
   */
  function showLinkFallbackModal(paymentUrl) {
    var wrapper = document.createElement('div')
    wrapper.style.cssText = 'max-width:320px;'

    var title = document.createElement('div')
    title.textContent = 'Перейдите по ссылке для оплаты:'
    title.style.cssText = 'font-size:14px;color:#222;margin-bottom:12px;'
    wrapper.appendChild(title)

    var link = document.createElement('a')
    link.href = paymentUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.textContent = paymentUrl
    link.style.cssText = 'color:#1a4ea0;font-size:14px;word-break:break-all;'
    wrapper.appendChild(link)

    common.createModal(wrapper).show()
  }

  /** Локализация серверных кодов ошибок в человекочитаемые сообщения. */
  function errorToText(code) {
    switch (code) {
      case 'CORS_ORIGIN_NOT_ALLOWED':
        return 'Сайт не входит в список разрешённых доменов виджета.'
      case 'WIDGET_METHOD_DISABLED':
        return 'Оплата через LifePay временно отключена.'
      case 'WIDGET_AMOUNT_INVALID':
      case 'WIDGET_AMOUNT_BELOW_MIN':
      case 'WIDGET_AMOUNT_EXCEEDS_LIMIT':
      case 'WIDGET_AMOUNT_EXCEEDS_HARD_LIMIT':
        return 'Сумма заказа вне допустимого диапазона для оплаты через LifePay.'
      case 'WIDGET_EMAIL_REQUIRED':
        return 'Для оплаты через LifePay требуется email покупателя.'
      case 'WIDGET_OFFER_ID_REQUIRED':
      case 'WIDGET_OFFER_NOT_ALLOWED':
        return 'Этот товар недоступен для оплаты через LifePay.'
      case 'WIDGET_GATEWAY_ERROR':
        return 'Ошибка при создании счёта. Попробуйте ещё раз через несколько секунд.'
      default:
        return 'Не удалось создать счёт. Попробуйте ещё раз.'
    }
  }
})(window)
