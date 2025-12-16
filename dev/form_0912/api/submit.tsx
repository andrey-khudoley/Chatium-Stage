// @shared-route
import { GrantApplicationsTable } from '../tables/grant-applications.table'
import { Debug } from '../shared/debug'
import { request } from '@app/request'

export const apiSubmitRoute = app.post('/submit', async (ctx, req) => {
  Debug.info(ctx, '[api/submit] Начало обработки запроса на создание заявки')
  
  const { 
    fullName, 
    phone, 
    email, 
    telegramNick, 
    realEstateSituation, 
    desiredResult, 
    whyDeserveGrant 
  } = req.body

  Debug.info(ctx, `[api/submit] Получены данные формы: fullName=${fullName ? 'заполнено' : 'пусто'}, phone=${phone ? 'заполнено' : 'пусто'}, email=${email || 'пусто'}, telegramNick=${telegramNick ? 'заполнено' : 'пусто'}, realEstateSituation=${realEstateSituation ? 'заполнено' : 'пусто'}, desiredResult=${desiredResult ? 'заполнено' : 'пусто'}, whyDeserveGrant=${whyDeserveGrant ? 'заполнено' : 'пусто'}`)

  // Валидация обязательных полей
  if (!fullName || !fullName.trim()) {
    Debug.warn(ctx, '[api/submit] Валидация не пройдена: имя и фамилия не заполнены')
    ctx.resp.status(400)
    return { success: false, error: 'Имя и фамилия обязательны' }
  }

  if (!phone || !phone.trim()) {
    Debug.warn(ctx, '[api/submit] Валидация не пройдена: номер телефона не заполнен')
    ctx.resp.status(400)
    return { success: false, error: 'Номер телефона обязателен' }
  }

  if (!email || !email.trim()) {
    Debug.warn(ctx, '[api/submit] Валидация не пройдена: email не заполнен')
    ctx.resp.status(400)
    return { success: false, error: 'Почта обязательна' }
  }

  if (!telegramNick || !telegramNick.trim()) {
    Debug.warn(ctx, '[api/submit] Валидация не пройдена: ник в телеграм не заполнен')
    ctx.resp.status(400)
    return { success: false, error: 'Ник в телеграм обязателен' }
  }

  if (!realEstateSituation || !realEstateSituation.trim()) {
    Debug.warn(ctx, '[api/submit] Валидация не пройдена: ситуация в сфере недвижимости не заполнена')
    ctx.resp.status(400)
    return { success: false, error: 'Расскажите про свою ситуацию в сфере недвижимости' }
  }

  if (!desiredResult || !desiredResult.trim()) {
    Debug.warn(ctx, '[api/submit] Валидация не пройдена: желаемый результат не заполнен')
    ctx.resp.status(400)
    return { success: false, error: 'Укажите желаемый результат' }
  }

  // Валидация email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    Debug.warn(ctx, `[api/submit] Валидация не пройдена: некорректный формат email: ${email}`)
    ctx.resp.status(400)
    return { success: false, error: 'Некорректный формат email' }
  }

  Debug.info(ctx, '[api/submit] Валидация пройдена успешно, начинаем создание записи в Heap')

  try {
    const trimmedData = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      telegramNick: telegramNick.trim(),
      realEstateSituation: realEstateSituation.trim(),
      desiredResult: desiredResult.trim(),
      whyDeserveGrant: whyDeserveGrant ? whyDeserveGrant.trim() : undefined
    }

    Debug.info(ctx, `[api/submit] Создание записи в Heap с данными: fullName="${trimmedData.fullName}", phone="${trimmedData.phone}", email="${trimmedData.email}", telegramNick="${trimmedData.telegramNick}", realEstateSituation length=${trimmedData.realEstateSituation.length}, desiredResult length=${trimmedData.desiredResult.length}, whyDeserveGrant=${trimmedData.whyDeserveGrant ? `length=${trimmedData.whyDeserveGrant.length}` : 'не заполнено'}`)

    // Создание записи в Heap
    const application = await GrantApplicationsTable.create(ctx, trimmedData)

    Debug.info(ctx, `[api/submit] Заявка успешно создана в Heap с ID: ${application.id}, fullName: "${application.fullName}", email: "${application.email}"`)

    // Отправка данных на webhook
    const webhookUrl = 'https://vakas-tools.ru/base/webhook/68669e2/91471/2705/'
    Debug.info(ctx, `[api/submit] Начинаем отправку данных на webhook: ${webhookUrl}`)
    
    try {
      const webhookData = {
        fullName: trimmedData.fullName,
        phone: trimmedData.phone,
        email: trimmedData.email,
        telegramNick: trimmedData.telegramNick,
        realEstateSituation: trimmedData.realEstateSituation,
        desiredResult: trimmedData.desiredResult,
        whyDeserveGrant: trimmedData.whyDeserveGrant || null,
        applicationId: application.id,
        createdAt: new Date().toISOString()
      }

      Debug.info(ctx, `[api/submit] Отправляем данные на webhook: ${JSON.stringify(webhookData)}`)

      const webhookResponse = await request({
        url: webhookUrl,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookData),
        responseType: 'json',
        throwHttpErrors: false
      })

      Debug.info(ctx, `[api/submit] Webhook ответ получен, статус: ${webhookResponse.statusCode}, тело: ${JSON.stringify(webhookResponse.body)}`)

      if (webhookResponse.statusCode >= 200 && webhookResponse.statusCode < 300) {
        Debug.info(ctx, `[api/submit] Webhook успешно получил данные`)
      } else {
        Debug.warn(ctx, `[api/submit] Webhook вернул неожиданный статус: ${webhookResponse.statusCode}`)
      }
    } catch (webhookError: any) {
      // Ошибка отправки на webhook не должна блокировать успешный ответ пользователю
      Debug.error(ctx, `[api/submit] Ошибка при отправке на webhook: ${webhookError?.message || String(webhookError)}`, 'E_WEBHOOK_SEND')
      Debug.info(ctx, `[api/submit] Стек ошибки webhook: ${webhookError?.stack || 'нет стека'}`)
    }

    return {
      success: true,
      id: application.id
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/submit] Ошибка при создании заявки в Heap: ${error?.message || String(error)}`, 'E_HEAP_CREATE')
    Debug.info(ctx, `[api/submit] Стек ошибки: ${error?.stack || 'нет стека'}`)
    
    ctx.resp.status(500)
    return {
      success: false,
      error: 'Ошибка при сохранении заявки. Попробуйте позже.'
    }
  }
})

