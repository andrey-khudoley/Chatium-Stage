// @shared-route
import { request } from "@app/request"
import SettingsTable from '../tables/settings.table'
import WebhookEventsTable from '../tables/webhook-events.table'
import PaymentOffersTable from '../tables/payment-offers.table'
import PaymentLogsTable from '../tables/payment-logs.table'
import { addCommentToLead } from './commentService'

// Ключи для хранения OAuth данных
const SETTINGS_KEYS = {
  SUBDOMAIN: 'amocrm_subdomain',
  ACCESS_TOKEN: 'amocrm_access_token',
  EXPIRES_AT: 'amocrm_expires_at'
}

// Главный endpoint для приёма вебхуков от amoCRM
export const amoCRMWebhookRoute = app.post('/', async (ctx, req) => {
  const payload = req.body
  
  ctx.account.log('AmoCRM: входящий вебхук получен', {
    level: 'info',
    json: { payload }
  })
  
  // Быстро отвечаем amoCRM
  // Обработка будет асинхронной
  processWebhookAsync(ctx, payload).catch(error => {
    ctx.account.log('AmoCRM: ошибка асинхронной обработки вебхука', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
  })
  
  return { success: true }
})

// Функция парсинга form-encoded данных от AmoCRM
function parseAmoCRMPayload(payload: any) {
  // AmoCRM отправляет данные в формате leads[update][0][field]
  const leads = []
  
  // Находим все индексы сделок
  const leadIndices = new Set<number>()
  for (const key in payload) {
    const match = key.match(/^leads\[update\]\[(\d+)\]/)
    if (match) {
      leadIndices.add(parseInt(match[1]))
    }
  }
  
  // Собираем данные для каждой сделки
  for (const index of leadIndices) {
    const prefix = `leads[update][${index}]`
    const lead: any = {}
    
    for (const key in payload) {
      if (key.startsWith(prefix)) {
        const fieldMatch = key.match(/^leads\[update\]\[\d+\]\[([^\]]+)\](?:\[(\d+)\])?(?:\[([^\]]+)\])?(?:\[(\d+)\])?(?:\[([^\]]+)\])?/)
        
        if (fieldMatch) {
          const [, field1, idx1, field2, idx2, field3] = fieldMatch
          
          if (field1 === 'custom_fields') {
            if (!lead.custom_fields) lead.custom_fields = []
            const cfIndex = parseInt(idx1)
            if (!lead.custom_fields[cfIndex]) lead.custom_fields[cfIndex] = {}
            
            if (field2 === 'values') {
              if (!lead.custom_fields[cfIndex].values) lead.custom_fields[cfIndex].values = []
              const valIndex = parseInt(idx2)
              if (!lead.custom_fields[cfIndex].values[valIndex]) lead.custom_fields[cfIndex].values[valIndex] = {}
              if (field3) {
                lead.custom_fields[cfIndex].values[valIndex][field3] = payload[key]
              }
            } else {
              lead.custom_fields[cfIndex][field2] = payload[key]
            }
          } else {
            lead[field1] = payload[key]
          }
        }
      }
    }
    
    leads.push(lead)
  }
  
  return leads
}

// Асинхронная обработка вебхука
async function processWebhookAsync(ctx, payload) {
  try {
    // Парсим form-encoded данные от AmoCRM
    const leads = parseAmoCRMPayload(payload)
    
    // Проверяем, есть ли обновления сделок
    if (leads.length === 0) {
      ctx.account.log('AmoCRM: вебхук не содержит обновлений сделок', {
        level: 'info',
        json: { payload }
      })
      return
    }
    
    // Обрабатываем каждую обновленную сделку
    for (const lead of leads) {
      await processLeadUpdate(ctx, lead)
    }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при обработке вебхука', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
  }
}

// Обработка обновления сделки
async function processLeadUpdate(ctx, lead: any) {
  let leadId: number
  let updatedAt: number
  
  try {
    leadId = parseInt(lead.id)
    updatedAt = parseInt(lead.updated_at)
    
    // Получаем настройки полей
    const fieldSettings = await getWebhookFieldSettings(ctx)
    
    if (!fieldSettings.field_check || !fieldSettings.field_product || 
        !fieldSettings.field_tariff || !fieldSettings.field_price) {
      ctx.account.log('AmoCRM: настройки полей вебхука не заполнены', {
        level: 'warn',
        json: { leadId }
      })
      return
    }
    
    // Получаем токен и subdomain
    const authConfig = await getAuthConfig(ctx)
    
    if (!authConfig.subdomain || !authConfig.accessToken) {
      ctx.account.log('AmoCRM: OAuth не настроен', {
        level: 'error',
        json: { leadId }
      })
      return
    }
    
    // Получаем данные сделки с контактами
    const leadData = await getLeadWithContacts(ctx, authConfig, leadId)
    
    if (!leadData) {
      ctx.account.log('AmoCRM: не удалось получить данные сделки', {
        level: 'error',
        json: { leadId }
      })
      return
    }
    
    // Извлекаем значения полей из актуальной сделки
    const productData = extractSelectFieldValue(
      leadData.custom_fields_values,
      fieldSettings.field_product
    )
    
    const tariffData = extractSelectFieldValue(
      leadData.custom_fields_values,
      fieldSettings.field_tariff
    )
    
    const customPrice = extractNumericFieldValue(
      leadData.custom_fields_values,
      fieldSettings.field_price
    )
    
    // Проверка на дубли с учётом значений полей и времени (8 часов)
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000)
    
    const recentEvents = await WebhookEventsTable.findAll(ctx, {
      where: {
        leadId,
        productValue: productData.value,
        tariffValue: tariffData.value,
        price: customPrice,
        processedAt: { $gte: eightHoursAgo }
      }
    })
    
    if (recentEvents.length > 0) {
      ctx.account.log('AmoCRM: найден дубликат события (тот же leadId, продукт, тариф, цена за последние 8 часов)', {
        level: 'info',
        json: { 
          leadId, 
          productValue: productData.value,
          tariffValue: tariffData.value,
          price: customPrice,
          existingEventId: recentEvents[0].id,
          existingEventTime: recentEvents[0].processedAt
        }
      })
      return
    }
    
    // Проверяем чекбокс "Сформировать?"
    const shouldProcess = checkCustomFieldValue(
      leadData.custom_fields_values,
      fieldSettings.field_check,
      'checkbox'
    )
    
    // Извлекаем значение чекбокса для лога
    const checkboxValue = extractCheckboxFieldValue(
      leadData.custom_fields_values,
      fieldSettings.field_check
    )
    
    if (!shouldProcess) {
      ctx.account.log('AmoCRM: чекбокс "Сформировать?" не активирован', {
        level: 'info',
        json: { leadId, checkbox_value: checkboxValue }
      })
      return
    }
    
    // Создаем запись о начале обработки
    const eventRecord = await WebhookEventsTable.create(ctx, {
      leadId,
      leadUpdatedAt: updatedAt,
      processedAt: new Date(),
      status: 'processing',
      productValue: productData.value,
      tariffValue: tariffData.value,
      price: customPrice
    })
    
    // Получаем email основного контакта
    const email = await getMainContactEmail(ctx, authConfig, leadData)
    
    // Логируем обработанную заявку
    ctx.account.log('AmoCRM: заявка обработана', {
      level: 'info',
      json: {
        lead_id: leadId,
        email: email || 'не найден',
        should_process: checkboxValue,
        product: productData,
        tariff: tariffData,
        custom_price: customPrice,
        processed_at: new Date().toISOString()
      }
    })
    
    // Интеграция с Payment Service (Deal Manager)
    await processPaymentService(ctx, {
      leadId,
      email,
      productValue: productData.value,
      tariffValue: tariffData.value,
      customPrice
    })
    
    // Обновляем статус обработки
    await WebhookEventsTable.update(ctx, {
      id: eventRecord.id,
      status: 'processed'
    })
    
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при обработке сделки', {
      level: 'error',
      json: { 
        leadId: leadId || 'неизвестно', 
        error: error.message, 
        stack: error.stack 
      }
    })
    
    // Пытаемся обновить статус на error, если запись была создана
    if (leadId && updatedAt) {
      try {
        const existingEvents = await WebhookEventsTable.findAll(ctx, {
          where: { leadId, leadUpdatedAt: updatedAt }
        })
        if (existingEvents.length > 0) {
          await WebhookEventsTable.update(ctx, {
            id: existingEvents[0].id,
            status: 'error',
            errorMessage: error.message
          })
        }
      } catch (updateError) {
        // Игнорируем ошибку обновления статуса
      }
    }
  }
}

// Получение настроек полей вебхука
async function getWebhookFieldSettings(ctx) {
  const settings = await SettingsTable.findAll(ctx, {
    where: {
      key: {
        $in: [
          'webhook_field_check',
          'webhook_field_product',
          'webhook_field_tariff',
          'webhook_field_price'
        ]
      }
    }
  })
  
  const config: Record<string, string> = {}
  settings.forEach(setting => {
    config[setting.key] = setting.value
  })
  
  return {
    field_check: config['webhook_field_check'],
    field_product: config['webhook_field_product'],
    field_tariff: config['webhook_field_tariff'],
    field_price: config['webhook_field_price']
  }
}

// Получение OAuth конфигурации
async function getAuthConfig(ctx) {
  const settings = await SettingsTable.findAll(ctx, {
    where: {
      key: {
        $in: [SETTINGS_KEYS.SUBDOMAIN, SETTINGS_KEYS.ACCESS_TOKEN, SETTINGS_KEYS.EXPIRES_AT]
      }
    }
  })
  
  const config: Record<string, string> = {}
  settings.forEach(setting => {
    config[setting.key] = setting.value
  })
  
  // Проверяем срок действия токена
  if (config[SETTINGS_KEYS.EXPIRES_AT]) {
    const expiresAt = new Date(config[SETTINGS_KEYS.EXPIRES_AT])
    if (expiresAt < new Date()) {
      ctx.account.log('AmoCRM: токен истёк при обработке вебхука', {
        level: 'warn',
        json: { expiresAt: expiresAt.toISOString() }
      })
      return { subdomain: null, accessToken: null }
    }
  }
  
  return {
    subdomain: config[SETTINGS_KEYS.SUBDOMAIN],
    accessToken: config[SETTINGS_KEYS.ACCESS_TOKEN]
  }
}

// Получение сделки с контактами
async function getLeadWithContacts(ctx, authConfig, leadId: number) {
  try {
    const response = await request({
      url: `https://${authConfig.subdomain}.amocrm.ru/api/v4/leads/${leadId}?with=contacts`,
      method: 'get',
      headers: {
        'Authorization': `Bearer ${authConfig.accessToken}`,
        'Content-Type': 'application/json'
      },
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode !== 200) {
      ctx.account.log('AmoCRM: ошибка получения сделки', {
        level: 'error',
        json: { 
          leadId,
          status: response.statusCode,
          errorBody: response.body
        }
      })
      return null
    }
    
    return response.body
  } catch (error) {
    ctx.account.log('AmoCRM: исключение при получении сделки', {
      level: 'error',
      json: { leadId, error: error.message }
    })
    return null
  }
}

// Проверка значения чекбокса
function checkCustomFieldValue(customFields: any[], fieldId: string, fieldType: string): boolean {
  if (!customFields || !Array.isArray(customFields)) {
    return false
  }
  
  const field = customFields.find(f => String(f.field_id) === String(fieldId))
  
  if (!field || !field.values || field.values.length === 0) {
    return false
  }
  
  if (fieldType === 'checkbox') {
    const value = field.values[0].value
    return value === true || value === 1 || value === '1'
  }
  
  return false
}

// Извлечение значения чекбокса для отображения
function extractCheckboxFieldValue(customFields: any[], fieldId: string): boolean | null {
  if (!customFields || !Array.isArray(customFields)) {
    return null
  }
  
  const field = customFields.find(f => String(f.field_id) === String(fieldId))
  
  if (!field || !field.values || field.values.length === 0) {
    return null
  }
  
  const value = field.values[0].value
  // Возвращаем true, если активен; false, если неактивен
  return value === true || value === 1 || value === '1'
}

// Извлечение значения select поля
function extractSelectFieldValue(customFields: any[], fieldId: string) {
  if (!customFields || !Array.isArray(customFields)) {
    return { value: null, enum_id: null }
  }
  
  const field = customFields.find(f => String(f.field_id) === String(fieldId))
  
  if (!field || !field.values || field.values.length === 0) {
    return { value: null, enum_id: null }
  }
  
  return {
    value: field.values[0].value || null,
    enum_id: field.values[0].enum_id || null
  }
}

// Извлечение значения numeric поля
function extractNumericFieldValue(customFields: any[], fieldId: string): number | null {
  if (!customFields || !Array.isArray(customFields)) {
    return null
  }
  
  const field = customFields.find(f => String(f.field_id) === String(fieldId))
  
  if (!field || !field.values || field.values.length === 0) {
    return null
  }
  
  const value = field.values[0].value
  return typeof value === 'number' ? value : (value ? parseFloat(value) : null)
}

// Получение email основного контакта
async function getMainContactEmail(ctx, authConfig, leadData): Promise<string | null> {
  try {
    // Ищем основной контакт в связях сделки
    const contacts = leadData._embedded?.contacts || []
    
    if (contacts.length === 0) {
      ctx.account.log('AmoCRM: у сделки нет контактов', {
        level: 'warn',
        json: { leadId: leadData.id }
      })
      return null
    }
    
    // Ищем контакт с is_main = true
    let mainContactId = null
    for (const contact of contacts) {
      if (contact.is_main) {
        mainContactId = contact.id
        break
      }
    }
    
    // Если нет основного контакта, берём первый
    if (!mainContactId && contacts.length > 0) {
      mainContactId = contacts[0].id
    }
    
    if (!mainContactId) {
      return null
    }
    
    // Получаем данные контакта
    const response = await request({
      url: `https://${authConfig.subdomain}.amocrm.ru/api/v4/contacts/${mainContactId}`,
      method: 'get',
      headers: {
        'Authorization': `Bearer ${authConfig.accessToken}`,
        'Content-Type': 'application/json'
      },
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode !== 200) {
      ctx.account.log('AmoCRM: ошибка получения контакта', {
        level: 'error',
        json: { 
          contactId: mainContactId,
          status: response.statusCode
        }
      })
      return null
    }
    
    const contactData = response.body
    const customFields = contactData.custom_fields_values || []
    
    // Ищем поле EMAIL
    const emailField = customFields.find(f => f.field_code === 'EMAIL')
    
    if (!emailField || !emailField.values || emailField.values.length === 0) {
      ctx.account.log('AmoCRM: у контакта нет email', {
        level: 'warn',
        json: { contactId: mainContactId }
      })
      return null
    }
    
    return emailField.values[0].value
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при получении email контакта', {
      level: 'error',
      json: { error: error.message }
    })
    return null
  }
}

// Обработка Payment Service (интеграция с Deal Manager)
async function processPaymentService(ctx, params: {
  leadId: number
  email: string | null
  productValue: string | null
  tariffValue: string | null
  customPrice: number | null
}) {
  try {
    const { leadId, email, productValue, tariffValue, customPrice } = params
    
    // Проверяем, включен ли сервис
    const serviceSetting = await SettingsTable.findOneBy(ctx, {
      key: 'payment_service_enabled'
    })
    
    const serviceEnabled = serviceSetting?.value === 'true'
    
    if (!serviceEnabled) {
      ctx.account.log('Payment Service: сервис отключен', {
        level: 'info',
        json: { leadId }
      })
      return
    }
    
    // Ищем соответствующий offerId (проверяем до других валидаций)
    let offer = null
    if (productValue && tariffValue) {
      offer = await PaymentOffersTable.findOneBy(ctx, {
        productValue,
        tariffValue
      })
    }
    
    // Проверяем наличие email
    if (!email) {
      ctx.account.log('Payment Service: email не найден', {
        level: 'warn',
        json: { leadId }
      })
      
      // Сохраняем requestData если есть offer, чтобы можно было повторить
      const requestData = offer ? {
        email: null,
        offerId: offer.offerId,
        ...(customPrice !== null && customPrice !== undefined ? { price: customPrice } : {})
      } : null
      
      await PaymentLogsTable.create(ctx, {
        leadId,
        email: null,
        productValue,
        tariffValue,
        customPrice,
        status: 'error',
        errorMessage: 'Email не найден',
        requestData
      })
      return
    }
    
    // Проверяем наличие продукта и тарифа
    if (!productValue || !tariffValue) {
      ctx.account.log('Payment Service: продукт или тариф не найдены', {
        level: 'warn',
        json: { leadId, productValue, tariffValue }
      })
      
      await PaymentLogsTable.create(ctx, {
        leadId,
        email,
        productValue,
        tariffValue,
        customPrice,
        status: 'error',
        errorMessage: 'Продукт или тариф не указаны'
      })
      return
    }
    
    // Проверяем что нашли offer
    if (!offer) {
      ctx.account.log('Payment Service: код предложения не найден', {
        level: 'warn',
        json: { leadId, productValue, tariffValue }
      })
      
      await PaymentLogsTable.create(ctx, {
        leadId,
        email,
        productValue,
        tariffValue,
        customPrice,
        status: 'error',
        errorMessage: `Код предложения для ${productValue} + ${tariffValue} не найден`
      })
      return
    }
    
    ctx.account.log('Payment Service: найден offerId', {
      level: 'info',
      json: { leadId, offerId: offer.offerId }
    })
    
    // Формируем запрос к Deal Manager
    const requestData: any = {
      email,
      offerId: offer.offerId
    }
    
    // Добавляем цену если указана
    if (customPrice !== null && customPrice !== undefined) {
      requestData.price = customPrice
    }
    
    ctx.account.log('Payment Service: отправка запроса к Deal Manager', {
      level: 'info',
      json: { leadId, requestData }
    })
    
    // ============================================================================
    // ВНИМАНИЕ: ЭТО ВНЕШНИЙ HTTPS ЗАПРОС К ДРУГОМУ АККАУНТУ CHATIUM!
    // ============================================================================
    // Отправляем запрос к внешнему сервису Deal Manager на sobolevavika.ru
    // 
    // ВАЖНО: URL формируется по правилам file-based роутинга Chatium:
    // - Файл: createOrder.ts
    // - Роут в файле: app.post('/create', ...)
    // - Правильный URL: ...createOrder~create (с ТИЛЬДОЙ ~, а не слешем /)
    // 
    // ❌ НЕПРАВИЛЬНО: .../createOrder/create
    // ✅ ПРАВИЛЬНО:   .../createOrder~create
    // ============================================================================
    const response = await request({
      url: 'https://sobolevavika.ru/chtm/services/connectors/gc/deal/api/createOrder~create',
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData),
      responseType: 'json',
      throwHttpErrors: false
    })
    
    // Проверяем результат
    if (response.statusCode === 200 && response.body?.success) {
      const { dealId, dealNumber, paymentUrl } = response.body
      
      ctx.account.log('Payment Service: ссылка на оплату получена', {
        level: 'info',
        json: { leadId, dealId, dealNumber, paymentUrl }
      })
      
      // Сохраняем успешный результат
      await PaymentLogsTable.create(ctx, {
        leadId,
        email,
        productValue,
        tariffValue,
        customPrice,
        offerId: offer.offerId,
        dealId: dealId || null,
        dealNumber: dealNumber || null,
        paymentUrl: paymentUrl || null,
        status: 'success',
        requestData,
        responseData: response.body
      })
      
      // ============================================================================
      // Интеграция с Comment Service - добавление комментария в AmoCRM
      // ============================================================================
      if (paymentUrl) {
        await processCommentService(ctx, {
          leadId,
          email,
          paymentUrl
        })
      }
      
    } else {
      // Ошибка от Deal Manager
      const errorMessage = response.body?.error || `HTTP ${response.statusCode}`
      
      ctx.account.log('Payment Service: ошибка от Deal Manager', {
        level: 'error',
        json: { leadId, statusCode: response.statusCode, error: errorMessage, body: response.body }
      })
      
      await PaymentLogsTable.create(ctx, {
        leadId,
        email,
        productValue,
        tariffValue,
        customPrice,
        offerId: offer.offerId,
        status: 'error',
        errorMessage,
        requestData,
        responseData: response.body
      })
    }
    
  } catch (error: any) {
    ctx.account.log('Payment Service: исключение при обработке', {
      level: 'error',
      json: { 
        leadId: params.leadId,
        error: error.message,
        stack: error.stack
      }
    })
    
    // Сохраняем ошибку
    try {
      await PaymentLogsTable.create(ctx, {
        leadId: params.leadId,
        email: params.email,
        productValue: params.productValue,
        tariffValue: params.tariffValue,
        customPrice: params.customPrice,
        status: 'error',
        errorMessage: error.message
      })
    } catch (dbError) {
      // Игнорируем ошибку записи в БД
    }
  }
}

// Сброс полей сделки в AmoCRM
async function resetLeadFields(ctx, leadId: number) {
  try {
    // Получаем настройки полей вебхука
    const fieldSettings = await getWebhookFieldSettings(ctx)
    
    if (!fieldSettings.field_check || !fieldSettings.field_product || 
        !fieldSettings.field_tariff || !fieldSettings.field_price) {
      ctx.account.log('Reset Fields: настройки полей не заполнены, сброс невозможен', {
        level: 'warn',
        json: { leadId }
      })
      return
    }
    
    // Получаем OAuth конфигурацию
    const authConfig = await getAuthConfig(ctx)
    
    if (!authConfig.subdomain || !authConfig.accessToken) {
      ctx.account.log('Reset Fields: OAuth не настроен', {
        level: 'error',
        json: { leadId }
      })
      return
    }
    
    // Формируем массив полей для сброса
    // Для select-полей передаём value: null, чтобы сбросить выбор
    // Для числового поля передаём 0 (API требует числовой тип)
    // Для чекбокса передаём false
    const customFieldsToReset = [
      {
        field_id: parseInt(fieldSettings.field_check),
        values: [{ value: false }]
      },
      {
        field_id: parseInt(fieldSettings.field_product),
        values: [{ value: null }]  // Для select-поля передаём null
      },
      {
        field_id: parseInt(fieldSettings.field_tariff),
        values: [{ value: null }]  // Для select-поля передаём null
      },
      {
        field_id: parseInt(fieldSettings.field_price),
        values: [{ value: 0 }]  // Для числового поля передаём 0 (API требует numeric)
      }
    ]
    
    ctx.account.log('Reset Fields: сброс полей сделки', {
      level: 'info',
      json: { 
        leadId, 
        fields: customFieldsToReset.map(f => f.field_id)
      }
    })
    
    // Выполняем PATCH запрос к AmoCRM для обновления полей
    const response = await request({
      url: `https://${authConfig.subdomain}.amocrm.ru/api/v4/leads/${leadId}`,
      method: 'patch',
      headers: {
        'Authorization': `Bearer ${authConfig.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        custom_fields_values: customFieldsToReset
      }),
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode === 200) {
      ctx.account.log('Reset Fields: поля успешно сброшены', {
        level: 'info',
        json: { leadId }
      })
    } else {
      ctx.account.log('Reset Fields: ошибка сброса полей', {
        level: 'error',
        json: { 
          leadId,
          status: response.statusCode,
          errorBody: response.body
        }
      })
    }
    
  } catch (error: any) {
    ctx.account.log('Reset Fields: исключение при сбросе полей', {
      level: 'error',
      json: { 
        leadId,
        error: error.message,
        stack: error.stack
      }
    })
  }
}

// Обработка Comment Service (добавление комментария в AmoCRM)
async function processCommentService(ctx, params: {
  leadId: number
  email: string | null
  paymentUrl: string
}) {
  try {
    const { leadId, email, paymentUrl } = params
    
    // Проверяем, включен ли сервис комментариев
    const serviceSetting = await SettingsTable.findOneBy(ctx, {
      key: 'comment_service_enabled'
    })
    
    const serviceEnabled = serviceSetting?.value === 'true'
    
    if (!serviceEnabled) {
      ctx.account.log('Comment Service: сервис отключен', {
        level: 'info',
        json: { leadId }
      })
      return
    }
    
    // Получаем шаблон комментария
    const templateSetting = await SettingsTable.findOneBy(ctx, {
      key: 'comment_template'
    })
    
    const defaultTemplate = 'Ссылка на оплату: {paymentUrl}\n\nСпасибо за ваш заказ!'
    const template = templateSetting?.value || defaultTemplate
    
    // Заменяем переменную {paymentUrl} на реальную ссылку
    const commentText = template.replace(/{paymentUrl}/g, paymentUrl)
    
    ctx.account.log('Comment Service: добавление комментария', {
      level: 'info',
      json: { leadId, commentText: commentText.substring(0, 100) + '...' }
    })
    
    // Добавляем комментарий к сделке
    const result = await addCommentToLead(ctx, leadId, commentText, email || undefined, paymentUrl)
    
    if (result.success) {
      ctx.account.log('Comment Service: комментарий успешно добавлен', {
        level: 'info',
        json: { leadId, noteId: result.noteId }
      })
      
      // После успешной отправки комментария сбрасываем поля
      await resetLeadFields(ctx, leadId)
    } else {
      ctx.account.log('Comment Service: ошибка добавления комментария', {
        level: 'error',
        json: { leadId, error: result.error }
      })
    }
    
  } catch (error: any) {
    ctx.account.log('Comment Service: исключение при обработке', {
      level: 'error',
      json: { 
        leadId: params.leadId,
        error: error.message,
        stack: error.stack
      }
    })
  }
}

// Экспортируем функцию для тестирования
export async function testWebhookProcessing(ctx, leadId: number) {
  try {
    // Получаем настройки полей
    const fieldSettings = await getWebhookFieldSettings(ctx)
    
    if (!fieldSettings.field_check || !fieldSettings.field_product || 
        !fieldSettings.field_tariff || !fieldSettings.field_price) {
      return {
        success: false,
        error: 'Настройки полей не заполнены'
      }
    }
    
    // Получаем OAuth конфигурацию
    const authConfig = await getAuthConfig(ctx)
    
    if (!authConfig.subdomain || !authConfig.accessToken) {
      return {
        success: false,
        error: 'OAuth не настроен'
      }
    }
    
    // Получаем данные сделки с контактами
    const leadData = await getLeadWithContacts(ctx, authConfig, leadId)
    
    if (!leadData) {
      return {
        success: false,
        error: 'Не удалось получить данные сделки'
      }
    }
    
    // Извлекаем значение чекбокса "Сформировать?"
    const checkboxValue = extractCheckboxFieldValue(
      leadData.custom_fields_values,
      fieldSettings.field_check
    )
    
    // Извлекаем значения полей
    const productData = extractSelectFieldValue(
      leadData.custom_fields_values,
      fieldSettings.field_product
    )
    
    const tariffData = extractSelectFieldValue(
      leadData.custom_fields_values,
      fieldSettings.field_tariff
    )
    
    const customPrice = extractNumericFieldValue(
      leadData.custom_fields_values,
      fieldSettings.field_price
    )
    
    // Получаем email основного контакта
    const email = await getMainContactEmail(ctx, authConfig, leadData)
    
    const resultData = {
      lead_id: leadId,
      email: email || null,
      should_process: checkboxValue,
      product: productData,
      tariff: tariffData,
      custom_price: customPrice,
      processed_at: new Date().toISOString()
    }
    
    // Логируем обработанную заявку
    ctx.account.log('AmoCRM: тестирование обработки вебхука', {
      level: 'info',
      json: resultData
    })
    
    return {
      success: true,
      message: 'Тестирование успешно завершено',
      data: resultData
    }
  } catch (error) {
    ctx.account.log('AmoCRM: ошибка при тестировании', {
      level: 'error',
      json: { leadId, error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка при тестировании'
    }
  }
}

