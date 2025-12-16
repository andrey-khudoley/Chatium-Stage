// @shared-route
import { request } from "@app/request"
import PaymentOffersTable from '../tables/payment-offers.table'
import PaymentLogsTable from '../tables/payment-logs.table'
import SettingsTable from '../tables/settings.table'

// ==================== Payment Offers ====================

// GET /api/paymentService/payment-offers/list
export const apiGetPaymentOffersRoute = app.get('/payment-offers/list', async (ctx) => {
  try {
    const offers = await PaymentOffersTable.findAll(ctx, {
      order: [{ productValue: 'asc' }, { tariffValue: 'asc' }],
      limit: 1000
    })
    
    return {
      success: true,
      offers: offers || []
    }
  } catch (error: any) {
    ctx.account.log('Payment Service: Error loading offers', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка загрузки кодов предложений'
    }
  }
})

// POST /api/paymentService/payment-offers/create
export const apiCreatePaymentOfferRoute = app.post('/payment-offers/create', async (ctx, req) => {
  try {
    const { productValue, tariffValue, offerId, offerName, description } = req.body
    
    // Валидация
    if (!productValue || !tariffValue || !offerId || !offerName) {
      return {
        success: false,
        error: 'Необходимо заполнить все обязательные поля'
      }
    }
    
    // Проверка на дубликат
    const existing = await PaymentOffersTable.findOneBy(ctx, {
      productValue,
      tariffValue
    })
    
    if (existing) {
      return {
        success: false,
        error: 'Код предложения для этой комбинации продукт+тариф уже существует'
      }
    }
    
    const offer = await PaymentOffersTable.create(ctx, {
      productValue,
      tariffValue,
      offerId,
      offerName,
      description: description || undefined
    })
    
    ctx.account.log('Payment Service: Offer created', {
      level: 'info',
      json: { offerId: offer.id, productValue, tariffValue }
    })
    
    return {
      success: true,
      offer
    }
  } catch (error: any) {
    ctx.account.log('Payment Service: Error creating offer', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка создания кода предложения'
    }
  }
})

// POST /api/paymentService/payment-offers/update
export const apiUpdatePaymentOfferRoute = app.post('/payment-offers/update', async (ctx, req) => {
  try {
    const { id, productValue, tariffValue, offerId, offerName, description } = req.body
    
    // Валидация
    if (!id || !productValue || !tariffValue || !offerId || !offerName) {
      return {
        success: false,
        error: 'Необходимо заполнить все обязательные поля'
      }
    }
    
    // Проверка на дубликат (исключая текущую запись)
    const existing = await PaymentOffersTable.findOneBy(ctx, {
      productValue,
      tariffValue
    })
    
    if (existing && existing.id !== id) {
      return {
        success: false,
        error: 'Код предложения для этой комбинации продукт+тариф уже существует'
      }
    }
    
    const offer = await PaymentOffersTable.update(ctx, {
      id,
      productValue,
      tariffValue,
      offerId,
      offerName,
      description: description || undefined
    })
    
    ctx.account.log('Payment Service: Offer updated', {
      level: 'info',
      json: { offerId: offer.id, productValue, tariffValue }
    })
    
    return {
      success: true,
      offer
    }
  } catch (error: any) {
    ctx.account.log('Payment Service: Error updating offer', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка обновления кода предложения'
    }
  }
})

// DELETE /api/paymentService/payment-offers/delete
export const apiDeletePaymentOfferRoute = app.post('/payment-offers/delete', async (ctx, req) => {
  try {
    const { id } = req.body
    
    if (!id) {
      return {
        success: false,
        error: 'Необходимо указать ID'
      }
    }
    
    await PaymentOffersTable.delete(ctx, id)
    
    ctx.account.log('Payment Service: Offer deleted', {
      level: 'info',
      json: { offerId: id }
    })
    
    return {
      success: true
    }
  } catch (error: any) {
    ctx.account.log('Payment Service: Error deleting offer', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка удаления кода предложения'
    }
  }
})

// ==================== Payment Logs ====================

// GET /api/paymentService/payment-logs/list
export const apiGetPaymentLogsRoute = app.get('/payment-logs/list', async (ctx, req) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const offset = parseInt(req.query.offset as string) || 0
    
    const logs = await PaymentLogsTable.findAll(ctx, {
      order: [{ createdAt: 'desc' }],
      limit,
      offset
    })
    
    const total = await PaymentLogsTable.countBy(ctx)
    
    return {
      success: true,
      logs: logs || [],
      total
    }
  } catch (error: any) {
    ctx.account.log('Payment Service: Error loading logs', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка загрузки логов'
    }
  }
})

// ==================== Service Status ====================

// GET /api/paymentService/payment-service/status
export const apiGetPaymentServiceStatusRoute = app.get('/payment-service/status', async (ctx) => {
  try {
    const setting = await SettingsTable.findOneBy(ctx, {
      key: 'payment_service_enabled'
    })
    
    const enabled = setting?.value === 'true'
    
    return {
      success: true,
      enabled
    }
  } catch (error: any) {
    ctx.account.log('Payment Service: Error getting status', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка получения статуса сервиса'
    }
  }
})

// POST /api/paymentService/payment-service/toggle
export const apiTogglePaymentServiceRoute = app.post('/payment-service/toggle', async (ctx, req) => {
  try {
    const { enabled } = req.body
    
    if (typeof enabled !== 'boolean') {
      return {
        success: false,
        error: 'Необходимо указать enabled (true/false)'
      }
    }
    
    await SettingsTable.createOrUpdateBy(ctx, 'key', {
      key: 'payment_service_enabled',
      value: enabled ? 'true' : 'false',
      description: 'Включить/выключить сервис генерации ссылок на оплату'
    })
    
    ctx.account.log('Payment Service: Service toggled', {
      level: 'info',
      json: { enabled }
    })
    
    return {
      success: true,
      enabled
    }
  } catch (error: any) {
    ctx.account.log('Payment Service: Error toggling service', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка переключения статуса сервиса'
    }
  }
})

// POST /api/paymentService/payment-logs/clear-all
export const apiClearAllPaymentLogsRoute = app.post('/payment-logs/clear-all', async (ctx, req) => {
  try {
    // Получаем все логи
    const logs = await PaymentLogsTable.findAll(ctx)
    
    // Удаляем все записи
    for (const log of logs) {
      await PaymentLogsTable.delete(ctx, log.id)
    }
    
    ctx.account.log('Payment Service: все логи удалены', {
      level: 'info',
      json: { deletedCount: logs.length }
    })
    
    return {
      success: true,
      deletedCount: logs.length
    }
  } catch (error: any) {
    ctx.account.log('Payment Service: ошибка при удалении логов', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка удаления логов'
    }
  }
})

// ==================== Retry Payment ====================

// POST /api/paymentService/payment-logs/retry
export const apiRetryPaymentRoute = app.post('/payment-logs/retry', async (ctx, req) => {
  try {
    const { logId } = req.body
    
    if (!logId) {
      return {
        success: false,
        error: 'Необходимо указать ID лога'
      }
    }
    
    // Получаем запись из логов
    const log = await PaymentLogsTable.findById(ctx, logId)
    
    if (!log) {
      return {
        success: false,
        error: 'Лог не найден'
      }
    }
    
    // Проверяем, есть ли сохраненные данные запроса
    if (!log.requestData) {
      return {
        success: false,
        error: 'Данные запроса не сохранены'
      }
    }
    
    ctx.account.log('Payment Service: повторная отправка запроса', {
      level: 'info',
      json: { logId, leadId: log.leadId, requestData: log.requestData }
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
      body: JSON.stringify(log.requestData),
      responseType: 'json',
      throwHttpErrors: false
    })
    
    // Проверяем результат
    if (response.statusCode === 200 && response.body?.success) {
      const { dealId, dealNumber, paymentUrl } = response.body
      
      ctx.account.log('Payment Service: повторная отправка успешна', {
        level: 'info',
        json: { logId, dealId, dealNumber, paymentUrl }
      })
      
      // Обновляем существующую запись
      await PaymentLogsTable.update(ctx, {
        id: logId,
        dealId: dealId || log.dealId,
        dealNumber: dealNumber || log.dealNumber,
        paymentUrl: paymentUrl || log.paymentUrl,
        status: 'success',
        errorMessage: undefined,
        responseData: response.body
      })
      
      return {
        success: true,
        message: 'Запрос успешно отправлен повторно',
        paymentUrl
      }
      
    } else {
      // Ошибка от Deal Manager
      const errorMessage = response.body?.error || `HTTP ${response.statusCode}`
      
      ctx.account.log('Payment Service: ошибка при повторной отправке', {
        level: 'error',
        json: { logId, statusCode: response.statusCode, error: errorMessage, body: response.body }
      })
      
      // Обновляем запись с новой ошибкой
      await PaymentLogsTable.update(ctx, {
        id: logId,
        errorMessage,
        responseData: response.body
      })
      
      return {
        success: false,
        error: errorMessage
      }
    }
    
  } catch (error: any) {
    ctx.account.log('Payment Service: исключение при повторной отправке', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message || 'Ошибка повторной отправки'
    }
  }
})

