// Заголовки секций оплаты + распределение методов.
// Карточная зона (новые секции): «Рекомендуемые способы оплаты» / «Pay-методы» /
// «Оплата картами из РФ» / «Оплата зарубежными картами» — метки вставляются в форму,
// визуальное размещение держит CSS `order` (см. payment-page.css). Штатный внешний
// заголовок «Оплата банковскими картами» при этом скрывается.
// Кредитная зона: надписи «Рассрочки» / «Оплата по частям», детерминированное
// распределение методов по секциям + чистка внутренностей кредитных карточек
// (примечание «Только для клиентов банка…», переносы строк в вариантах рассрочки).
// xdgetId: r6794
$(function () {
  // Порядок секций: определяет sectionIndex для раскладки через CSS order.
  var SECTION_ORDER = [
    'recommended',
    'pay',
    'cards_rf',
    'cards_world',
    'installments',
    'payparts',
    'noncash'
  ]
  var SECTION_LABELS = {
    recommended: { cls: 'label-recommended', text: 'Рекомендуемые способы оплаты' },
    pay: { cls: 'label-pay-methods', text: 'Pay-методы' },
    cards_rf: { cls: 'label-rf-cards', text: 'Оплата картами из РФ' },
    cards_world: { cls: 'label-foreign-cards', text: 'Оплата зарубежными картами' },
    installments: { cls: 'label-credit', text: 'Рассрочки' },
    payparts: { cls: 'label-payparts', text: 'Оплата по частям' },
    noncash: { cls: 'label-invoice', text: 'Безналичная оплата' }
  }
  function sectionIndex(section) {
    var i = SECTION_ORDER.indexOf(section)
    return i // -1 если неизвестна
  }

  /**
   * resolveMethodEl(methodId, methodCfg): находит DOM-элемент метода.
   * Если methodCfg.resolver задан — использует его (type='id' → getElementById,
   * type='class' → querySelector('.value')).
   * Иначе — FALLBACK-конвенция: сначала getElementById(methodId), затем querySelector('.'+methodId).
   * Кастомные методы без совпадения в DOM → null → пропуск (без сбоя).
   * methodId и resolver.value из нашего справочника — валидные CSS-токены ([a-zA-Z0-9_-]).
   */
  function resolveMethodEl(methodId, methodCfg) {
    var resolver = methodCfg && methodCfg.resolver
    if (resolver) {
      if (resolver.type === 'id') {
        // Защита: пустой/невалидный value — не вызывать getElementById('')
        if (!resolver.value || typeof resolver.value !== 'string') return null
        return document.getElementById(resolver.value)
      }
      if (resolver.type === 'class') {
        // Защита: пустой/невалидный value — не вызывать querySelector('.')
        if (!resolver.value || typeof resolver.value !== 'string') return null
        return document.querySelector('.' + resolver.value)
      }
    }
    // FALLBACK: нет resolver — старая конвенция (по id, затем по классу)
    // Пустой methodId — не вызываем querySelector с пустым селектором
    if (!methodId || typeof methodId !== 'string') return null
    return document.getElementById(methodId) || document.querySelector('.' + methodId)
  }

  // Явное распределение методов по секциям. Порядок в массиве = порядок отображения внутри секции.
  // Рассрочки: tinkoffcredit-2, poscredit, resource-razvitie (по запросу) + остальные кредитные.
  let creditIds = [
    '#fresh-credit',
    '#tinkoffcredit',
    '#tinkoffcredit-2',
    '#vsegdada',
    '#poscredit',
    '#resource-razvitie',
    '#sber-pokupay'
  ]
  // Оплата по частям: yandex-split-improved (по запросу) + прочие сплит-методы.
  let payPartsIds = [
    '#yandex-split-improved',
    '#yandex-split',
    '#alpha-bank-podeli',
    '#tinkoff-dolyame'
  ]

  let find = (ids) => ids.map((sel) => document.querySelector(sel)).filter((el) => el !== null)

  // placePayer(): переносит «Данные плательщика» внутрь сводки заказа (между составом и суммой)
  // в обеих раскладках через клоны. Оригинальный GC-блок прячется и служит источником данных.
  function makePayerCard(extraCls, srcInfo) {
    var card = document.createElement('div')
    card.className = 'payer-card' + (extraCls ? ' ' + extraCls : '')
    var h = document.createElement('div')
    h.className = 'payer-heading'
    h.textContent = 'Данные плательщика'
    var body = srcInfo.cloneNode(true)
    body.removeAttribute('id')
    body.removeAttribute('style')
    body.querySelectorAll('[id]').forEach(function (e) {
      e.removeAttribute('id')
    })
    body.classList.remove('xdget-currentUserInfo')
    body.classList.add('payer-info')
    // Ссылка «Изменить данные» → профиль пользователя в новой вкладке (на текущем домене).
    body.querySelectorAll('a').forEach(function (a) {
      if (/Изменить данные/i.test(a.textContent)) {
        a.setAttribute('href', window.location.origin + '/user/my/profile')
        a.setAttribute('target', '_blank')
        a.setAttribute('rel', 'noopener')
      }
    })
    card.appendChild(h)
    card.appendChild(body)
    return card
  }
  function placePayer() {
    var info = document.querySelector('.order-left-side .xdget-currentUserInfo')
    document.querySelectorAll('.payer-card').forEach(function (el) {
      el.remove()
    }) // upsert клонов
    if (!info) return

    // Прячем штатные блоки — они источник данных, показываем только клоны в сводке.
    info.style.display = 'none'
    var origHeading = Array.from(
      document.querySelectorAll('.order-left-side .left-side-content > h4')
    ).find(function (h) {
      return /Данные плательщика/i.test(h.textContent)
    })
    if (origHeading) origHeading.style.display = 'none'

    // У неавторизованного покупателя блок пуст — карточки не строим.
    var hasData =
      info.textContent.trim().length > 0 ||
      info.querySelector('input, select, textarea, table, a, img, .xdget-block')
    if (!hasData) return

    // ПК (≥992): в правую сводку .total-cost .right-info, перед «Суммой для оплаты».
    var price = document.querySelector('.total-cost .right-info .deal-finish-price-title')
    if (price && price.parentNode) {
      price.parentNode.insertBefore(makePayerCard('payer-card-desktop', info), price)
    }
    // Стопка (≤991): в левую колонку между составом (.main-info) и суммами (.mobile-total-cost).
    var mobileTotal = document.querySelector('.order-left-side .mobile-total-cost')
    if (mobileTotal && mobileTotal.parentNode) {
      mobileTotal.parentNode.insertBefore(makePayerCard('payer-card-mobile', info), mobileTotal)
    }
  }

  // styleComposition(): приводит «Состав заказа» к виду «Данные плательщика» — единый
  // заголовок с иконкой (.summary-heading) + мягкая плашка вокруг состава (.summary-box).
  // Заголовок вставляется в обе видимые сводки (ПК — .right-info, стопка — .main-info);
  // видимость держат сами контейнеры (right-info скрыт ≤991, main-info скрыт ≥992).
  // Штатный крупный h3 «Состав заказа:» прячем — его заменяет единый заголовок.
  function styleComposition() {
    document.querySelectorAll('.summary-heading').forEach(function (el) {
      el.remove()
    }) // upsert
    Array.from(document.querySelectorAll('.order-left-side .left-side-content > h3'))
      .filter(function (h) {
        return /Состав заказа/i.test(h.textContent)
      })
      .forEach(function (h) {
        h.style.display = 'none'
      })
    ;[
      document.querySelector('.total-cost .right-info .deal-positions'),
      document.querySelector('.order-left-side .main-info .deal-positions')
    ]
      .filter(Boolean)
      .forEach(function (pos) {
        pos.classList.add('summary-box')
        var h = document.createElement('div')
        h.className = 'summary-heading'
        h.textContent = 'Состав заказа'
        pos.parentNode.insertBefore(h, pos)
      })
  }

  // applyCallout(): вставляет/обновляет/удаляет коллаут-блок (.pp-callout) из __PP_CONFIG__.
  // Идемпотентна: при неизменном исходном html не перезаписывает DOM. Если html пуст — удаляет.
  // Инвариант: при отсутствии window.__PP_CONFIG__ html='' → isEmpty → удалить/ничего.
  // ВАЖНО: видимое размещение блока ВЫШЕ «Рекомендуемых способов оплаты» держит CSS
  // order:-13 во flex-контейнере .xdget-payform (appendChild ставит его в конец DOM).
  function applyCallout() {
    var html =
      (window.__PP_CONFIG__ &&
        window.__PP_CONFIG__.general &&
        window.__PP_CONFIG__.general.calloutHtml) ||
      ''
    var payform = document.querySelector('.order-left-side .xdget-payform')
    if (!payform) return
    // Пустым считается: нет текста (без учёта <br>, &nbsp; и пустых тегов)
    var isEmpty =
      !html ||
      !html
        .replace(/<br\s*\/?>/gi, '')
        .replace(/&nbsp;/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim()
    var existing = payform.querySelector('.pp-callout')
    if (isEmpty) {
      if (existing) existing.remove()
      return
    }
    if (!existing) {
      existing = document.createElement('div')
      existing.className = 'pp-callout'
      payform.appendChild(existing)
    }
    // Идемпотентность: сравниваем с ИСХОДНЫМ html (через data-атрибут), а не с existing.innerHTML.
    // Браузер нормализует innerHTML при установке (регистр атрибутов, пробелы, закрытие тегов),
    // поэтому existing.innerHTML === html почти никогда не совпало бы → DOM пересоздавался бы на
    // каждом ретрае build() (1600/3600мс), сбрасывая фокус/состояние внутри коллаута.
    if (existing.getAttribute('data-pp-callout-src') === html) return
    existing.setAttribute('data-pp-callout-src', html)
    existing.innerHTML = html
  }

  // applyConfigDrivenLabels(cfg): добавляет метки секций на основе конфига.
  // Вызывается ПОСЛЕ applyMethodConfig (когда cfg есть).
  // Скрывает пустые секции: метка добавляется только при наличии ВИДИМОГО метода.
  // Инлайн order с !important — перебивает stylesheet !important по специфичности (inline > sheet).
  function applyConfigDrivenLabels(cfg) {
    var payform = document.querySelector('.order-left-side .xdget-payform')
    if (!payform) return
    SECTION_ORDER.forEach(function (section, si) {
      var info = SECTION_LABELS[section]
      if (!info) return
      // Есть ли видимый метод этой секции: id из cfg.methods с section===section, el в DOM и не скрыт
      var hasVisible = Object.keys(cfg.methods).some(function (id) {
        var mc = cfg.methods[id]
        if (!mc || mc.section !== section) return false
        var el = resolveMethodEl(id, mc)
        return el && !el.dataset.ppHidden
      })
      if (!hasVisible) return // пустая секция — метку не добавляем
      var d = document.createElement('div')
      d.className = 'pay-section-label ' + info.cls
      d.textContent = info.text
      d.style.setProperty('order', String(si * 1000 - 1), 'important')
      payform.appendChild(d)
    })
  }

  // build(): сборка секций/меток/частичной оплаты. Полностью идемпотентна (все вставки —
  // через upsert/удаление перед повторной сборкой), поэтому безопасно вызывать многократно.
  // Методы GC подгружаются асинхронно — повторяем на ready/load/с задержкой, чтобы поздно
  // появившиеся методы тоже попали в секции.
  function build() {
    // Upsert: убираем ВСЕ ранее вставленные метки перед повторной сборкой
    document
      .querySelectorAll(
        '.label-credit, .label-payparts, .label-recommended, .label-pay-methods, ' +
          '.label-rf-cards, .label-foreign-cards, .label-invoice, .pay-section-label'
      )
      .forEach(function (el) {
        el.remove()
      })

    var cfg = window.__PP_CONFIG__

    // === Заголовки секций карточной зоны ===
    var payform = document.querySelector('.order-left-side .xdget-payform')
    if (payform) {
      // Скрываем штатный внешний заголовок «Оплата банковскими картами» — его заменяют секц-метки
      document.querySelectorAll('.order-left-side .xdget-html p').forEach(function (p) {
        if (/Оплата банковскими картами/i.test(p.textContent)) {
          var block = p.closest('.xdget-html') || p
          block.style.display = 'none'
        }
      })

      if (!cfg || !cfg.methods) {
        // === Fallback-ветка: конфига нет — добавляем hasAny-метки ===
        var hasAny = function (sel) {
          return document.querySelector(sel) !== null
        }
        var addSectionLabel = function (cls, text) {
          var d = document.createElement('div')
          d.className = 'pay-section-label ' + cls
          d.textContent = text
          payform.appendChild(d)
        }

        if (hasAny('.order-left-side #sbp-pay')) {
          addSectionLabel('label-recommended', 'Рекомендуемые способы оплаты')
        }
        if (
          hasAny(
            '.order-left-side #yandex-pay, .order-left-side #sber-pay, ' +
              '.order-left-side #alpha-pay, .order-left-side #sber-sbp, ' +
              '.order-left-side #wb-pay, .order-left-side #tinkoff-pay, ' +
              '.order-left-side form[name="tinkoff_sbp"]'
          )
        ) {
          addSectionLabel('label-pay-methods', 'Pay-методы')
        }
        if (hasAny('.order-left-side .xdget-payform .gc-payment-method-card.made-RF')) {
          addSectionLabel('label-rf-cards', 'Оплата картами из РФ')
        }
        if (
          hasAny(
            '.order-left-side .xdget-payform .gc-payment-method-card.made-world, ' +
              '.order-left-side #PAYPAL'
          )
        ) {
          addSectionLabel('label-foreign-cards', 'Оплата зарубежными картами')
        }
      }
    }

    // === Частичная оплата под мобильной кнопкой ===
    // Штатный блок частичной оплаты (.part) лежит ВНУТРИ .total-cost, который на стопке
    // (≤991px) скрыт — вместе с ним пропадала бы частичная оплата. Клонируем его под
    // .confirm-mobile (клон .part-mobile виден только ≤991px, стилизация в payment-page.css).
    // Делаем здесь (после скрипта 08, заменяющего текст) — клон копирует уже корректный текст.
    var confirmMobile = document.querySelector('.order-left-side .confirm-mobile')
    document.querySelectorAll('.order-left-side .part-mobile').forEach(function (el) {
      el.remove()
    }) // upsert
    var partSrc = document.querySelector('.total-cost .part')
    if (confirmMobile && partSrc) {
      var partClone = partSrc.cloneNode(true)
      partClone.removeAttribute('id')
      partClone.removeAttribute('style')
      partClone.classList.add('part-mobile')
      partClone.querySelectorAll('[id]').forEach(function (el) {
        el.removeAttribute('id')
      })
      confirmMobile.insertAdjacentElement('afterend', partClone)
    }

    // === «Данные плательщика» — внутри сводки заказа, между составом и суммой ===
    placePayer()
    styleComposition()

    // === Применение серверного конфига методов (window.__PP_CONFIG__) ===
    // ИНВАРИАНТ: при отсутствии __PP_CONFIG__ поведение НЕ меняется (чистый fallback).
    ;(function applyMethodConfig() {
      if (!cfg || !cfg.methods) return // fallback: конфига нет — всё как было

      // Определяем сумму заказа из DOM (итог «Сумма для оплаты» → <b>).
      // Если определить нельзя — amount остаётся null, amount-фильтр пропускается.
      var amount = null
      var priceEl =
        document.querySelector('.total-cost .deal-finish-price-title b') ||
        document.querySelector('.mobile-total-cost .deal-finish-price-title b')
      if (priceEl) {
        var priceText = priceEl.textContent || ''
        // Удаляем пробелы и нечисловые символы кроме точки/запятой, парсим
        var numStr = priceText.replace(/[^\d.,]/g, '').replace(',', '.')
        var parsed = parseFloat(numStr)
        if (isFinite(parsed) && parsed > 0) amount = parsed
      }
      if (amount === null) {
        console.warn(
          '[pp-config] Не удалось определить сумму заказа из DOM — amount-фильтр пропущен'
        )
      }

      // Определяем offer-позиции заказа из DOM (.deal-positions li[data-offer-id]).
      // Если определить нельзя — positions остаётся null, offer-фильтр пропускается.
      var positions = null
      try {
        var liItems = document.querySelectorAll('.deal-positions li')
        if (liItems.length > 0) {
          positions = []
          liItems.forEach(function (li) {
            var id = (li.getAttribute('data-offer-id') || '').trim()
            if (id !== '') positions.push(id)
          })
          if (positions.length === 0) positions = null // нет data-offer-id — фильтр пропускаем
        }
      } catch (e) {
        console.warn('[pp-config] Ошибка при чтении позиций заказа:', e)
      }
      if (positions === null) {
        console.warn('[pp-config] Не удалось определить позиции заказа — offer-фильтр пропущен')
      }

      // Список methodId берём из cfg.methods (конфиг с сервера) — не хардкод.
      // Кастомные методы без совпадения в DOM → el=null → пропуск (без сбоя).
      Object.keys(cfg.methods).forEach(function (methodId) {
        try {
          var methodCfg = cfg.methods[methodId]
          if (!methodCfg) return // нет конфига для этого метода — не трогаем

          // Ищем DOM-элемент метода через resolver (id/class) или fallback-конвенцию.
          var el = resolveMethodEl(methodId, methodCfg)
          if (!el) return // метод не в DOM — ничего не делаем

          // (1) enabled===false → скрыть карточку и пропустить всё остальное
          if (methodCfg.enabled === false) {
            el.style.display = 'none'
            el.dataset.ppHidden = 'disabled'
            return
          }

          // Восстанавливаем, если ранее был скрыт этим же механизмом и теперь enabled
          if (el.dataset.ppHidden) {
            el.style.display = ''
            delete el.dataset.ppHidden
          }

          // (2) Применяем label (непустой) к подписи кнопки метода.
          //     Меняем только текстовый узел/value — не сносим вложенные иконки.
          if (methodCfg.label) {
            var btn = el.querySelector(
              '.btn, .btn-info, .gc-payment-method-button, input[type="submit"]'
            )
            if (btn) {
              if (btn.value !== undefined && btn.type === 'submit') {
                btn.value = methodCfg.label
              } else {
                // Меняем первый текстовый узел-потомок
                var textNode = null
                btn.childNodes.forEach(function (n) {
                  if (!textNode && n.nodeType === 3 && n.nodeValue.trim()) {
                    textNode = n
                  }
                })
                if (textNode) {
                  textNode.nodeValue = methodCfg.label
                } else {
                  btn.textContent = methodCfg.label
                }
              }
            }
          }

          // (3) Применяем imageUrl (непустой) к изображению метода.
          if (methodCfg.imageUrl) {
            var img = el.querySelector('img')
            if (img) img.src = methodCfg.imageUrl
          }

          // (5) Amount-фильтр: скрыть если сумма вне диапазона [minAmount, maxAmount].
          //     Пропускаем если сумму не удалось определить.
          if (amount !== null) {
            var min = methodCfg.minAmount || 0
            var max = methodCfg.maxAmount || 0
            var outOfRange = (min > 0 && amount < min) || (max > 0 && amount > max)
            if (outOfRange) {
              el.style.display = 'none'
              el.dataset.ppHidden = 'amount'
              return
            }
          }

          // (6) Offer-фильтр: скрыть/показать по whitelist/blacklist.
          //     Пропускаем если позиции не удалось определить или тип = 'off'.
          var listType = methodCfg.offerListType
          if (listType && listType !== 'off' && positions !== null) {
            var offerIds = Array.isArray(methodCfg.offerIds) ? methodCfg.offerIds : []
            // Проверяем пересечение позиций заказа с offerIds
            var hasIntersection = positions.some(function (posId) {
              return offerIds.indexOf(posId) !== -1
            })
            var shouldHide = listType === 'whitelist' ? !hasIntersection : hasIntersection
            if (shouldHide) {
              el.style.display = 'none'
              el.dataset.ppHidden = 'offer'
              return
            }
          }

          // (4) Section/order — section-driven раскладка через инлайн CSS order с !important.
          //     Схема: sectionIndex * 1000 + position (без коллизий между секциями).
          //     Инлайн !important перебивает stylesheet !important (специфичность inline > sheet).
          var si = sectionIndex(methodCfg.section)
          if (si >= 0) {
            var ord =
              typeof methodCfg.order === 'number' && isFinite(methodCfg.order)
                ? Math.floor(methodCfg.order)
                : 0
            el.style.setProperty('order', String(si * 1000 + ord), 'important')
          }
          // Если si < 0 (неизвестная секция) — НЕ трогаем order, метод остаётся на своём месте
        } catch (e) {
          console.warn('[pp-config] Ошибка при обработке метода ' + methodId + ':', e)
        }
      })

      // После применения конфига методов — добавляем метки секций (только непустых)
      applyConfigDrivenLabels(cfg)
    })()
    // === Конец применения конфига ===

    // Fallback-ветка: DOM-перенос кредитных методов + метки — только когда конфига нет
    if (!cfg || !cfg.methods) {
      let credits = find(creditIds)
      let payParts = find(payPartsIds)
      let lastAnchor = null // последний размещённый элемент — к нему примыкает следующая секция

      // === Заголовок раздела «Безналичная оплата» — настоящий full-width лейбл перед #invoice ===
      // Раньше это был ::before у карточки #invoice, который НЕ переносил строку: при малом числе
      // методов выше карточка вставала рядом со «Сплит», и заголовок «плыл» во 2-ю колонку.
      // Лейбл (order:3, flex-basis:100%) форсирует новую строку, как «Рассрочки»/«Оплата по частям».
      var invoiceEl = document.querySelector('.order-left-side .xdget-payform #invoice')
      if (invoiceEl) {
        invoiceEl.insertAdjacentHTML(
          'beforebegin',
          '<div class="label-invoice">Безналичная оплата</div>'
        )
      }

      // Секция «Рассрочки»: метка перед первым найденным методом, затем переносим методы по порядку
      if (credits.length > 0) {
        credits[0].insertAdjacentHTML('beforebegin', `<div class="label-credit">Рассрочки</div>`)
        let anchor = document.querySelector('.label-credit')
        credits.forEach(function (el) {
          anchor.insertAdjacentElement('afterend', el)
          anchor = el
        })
        lastAnchor = anchor
      }

      // Секция «Оплата по частям»: всегда сразу после блока рассрочек (если он есть)
      if (payParts.length > 0) {
        if (lastAnchor !== null) {
          lastAnchor.insertAdjacentHTML(
            'afterend',
            `<div class="label-payparts">Оплата по частям</div>`
          )
        } else {
          payParts[0].insertAdjacentHTML(
            'beforebegin',
            `<div class="label-payparts">Оплата по частям</div>`
          )
        }
        let anchor = document.querySelector('.label-payparts')
        payParts.forEach(function (el) {
          anchor.insertAdjacentElement('afterend', el)
          anchor = el
        })
      }
    }

    // Чистка внутреннего содержимого кредитных карточек (идемпотентно):

    // 1. Убираем примечание «Только для клиентов банка / Заявка подаётся через СберБанк Онлайн»
    document
      .querySelectorAll('.xdget-payform .gc-payment-method-credit .margin-bottom-10')
      .forEach(function (el) {
        if (/Только для клиентов банка/i.test(el.textContent)) {
          el.remove()
        }
      })

    // 2. Нормализуем переносы строк в списках вариантов рассрочки:
    //    пустая строка перед первым пунктом и после последнего, без пустых строк между пунктами.
    //    Обёртка вариантов = любой контейнер (div, td, …), прямые потомки которого содержат
    //    и <label>, и <br> (у «Ресурс развития» список лежит в <td>, а не в <div>).
    //    Тонкость: часть лейблов в CSS блочные (display:block — #fresh-credit, #tinkoffcredit-2,
    //    #poscredit, #resource-razvitie, #yandex-split-improved), часть inline-block (остальные).
    //    У блочных каждый пункт и так на своей строке, поэтому <br> между ними даёт ЛИШНЮЮ пустую
    //    строку — между блочными пунктами <br> не ставим. У inline-block <br> нужен для переноса.
    document
      .querySelectorAll('.xdget-payform .gc-payment-method-credit *')
      .forEach(function (wrap) {
        let labels = Array.from(wrap.children).filter((c) => c.tagName === 'LABEL')
        let brs = Array.from(wrap.children).filter((c) => c.tagName === 'BR')
        if (labels.length === 0 || brs.length === 0) return

        let isBlock = getComputedStyle(labels[0]).display === 'block'

        // Сбрасываем все <br> и пересобираем детерминированно
        brs.forEach((br) => br.remove())
        if (isBlock) {
          // блочные пункты: переносятся сами; <br> только после последнего => пустая строка снизу
          labels[labels.length - 1].insertAdjacentElement('afterend', document.createElement('br'))
        } else {
          // inline-block пункты: <br> после каждого (последний => пустая строка снизу)
          labels.forEach((lbl) =>
            lbl.insertAdjacentElement('afterend', document.createElement('br'))
          )
        }
        labels[0].insertAdjacentElement('beforebegin', document.createElement('br')) // <br> перед первым => пустая строка сверху
      })

    // 3. Переименовываем заголовок метода «Счет на безналичную оплату» → «Оплата от юр. лица».
    //    Идемпотентно: ставим фиксированный текст только если ещё стоит исходная GC-подпись.
    var invoiceLabel = document.querySelector('#invoice tr > td:last-child > label')
    if (invoiceLabel && /Сч[её]т на безналичную оплату/i.test(invoiceLabel.textContent)) {
      invoiceLabel.textContent = 'Оплата от юр. лица'
    }

    // 4. Унифицируем подпись кнопок рассрочки: «Купить в рассрочку» → «Оформить рассрочку»
    //    (приводим к одной формулировке со «Сплитами»/прочими «Оформить …»). Кнопки
    //    «Показать варианты рассрочки» НЕ трогаем — у них другая логика (раскрытие списка
    //    сроков, а не подача заявки), переименование сбило бы смысл действия. Идемпотентно:
    //    после замены текст уже не совпадает с «Купить в рассрочку». Меняем только текстовый
    //    узел/value, чтобы не снести возможные вложенные иконки (font-size:0 + :before).
    document
      .querySelectorAll(
        '.xdget-payform .gc-payment-method-credit .btn, ' +
          '.xdget-payform .gc-payment-method-credit .btn-info, ' +
          '.xdget-payform .gc-payment-method-credit .gc-payment-method-button'
      )
      .forEach(function (btn) {
        var label = btn.value || btn.textContent || ''
        if (!/Купить в рассрочку/i.test(label) || /Показать варианты/i.test(label)) return
        if (btn.value && /Купить в рассрочку/i.test(btn.value)) {
          btn.value = btn.value.replace(/Купить в рассрочку/gi, 'Оформить рассрочку')
          return
        }
        var replaced = false
        btn.childNodes.forEach(function (node) {
          if (node.nodeType === 3 && /Купить в рассрочку/i.test(node.nodeValue)) {
            node.nodeValue = node.nodeValue.replace(/Купить в рассрочку/gi, 'Оформить рассрочку')
            replaced = true
          }
        })
        if (!replaced) btn.textContent = 'Оформить рассрочку'
      })

    // 5. Коллаут-блок из серверного конфига (выше «Рекомендуемые способы оплаты»)
    applyCallout()
  }

  setTimeout(build, 0) // даём отработать извлечению/иконкам
  $(window).on('load', build) // и после полной загрузки страницы
  setTimeout(build, 1600) // ретраи на случай поздней асинхронной догрузки методов
  setTimeout(build, 3600)
})
