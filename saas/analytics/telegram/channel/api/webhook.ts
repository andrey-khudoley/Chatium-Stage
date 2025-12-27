// @shared-route

import { requireRealUser } from '@app/auth'
import { BotTokens } from '../tables/bot-tokens.table'
import { TelegramWebhooks } from '../tables/webhooks.table'
import { TelegramChats } from '../tables/chats.table'
import { ChannelLinkAnalytics } from '../tables/channel-link-analytics.table'
import { Debug } from '../shared/debug'
import { applyDebugLevel } from '../lib/logging'
import { sendDataToSocket } from '@app/socket'
import { request } from '@app/request'
import { extractChatFromUpdate } from '../lib/extract-chat'
import { runWithExclusiveLock } from '@app/sync'

/**
 * POST /api/webhook/:id
 * Обработка входящих вебхуков от Telegram для конкретного бота
 */
// ВАЖНО: Этот endpoint НЕ требует авторизации, так как Telegram отправляет запросы напрямую
export const apiWebhookRoute = app.post('/:id', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/webhook')
    
    Debug.info(ctx, `[api/webhook] ========== НАЧАЛО ОБРАБОТКИ ВЕБХУКА ==========`)
    Debug.info(ctx, `[api/webhook] Метод запроса: ${req.method}`)
    Debug.info(ctx, `[api/webhook] URL запроса: ${req.url}`)
    Debug.info(ctx, `[api/webhook] IP адрес: ${req.ip || 'N/A'}`)
    Debug.info(ctx, `[api/webhook] User-Agent: ${req.headers?.['user-agent'] || 'N/A'}`)
    Debug.info(ctx, `[api/webhook] Content-Type: ${req.headers?.['content-type'] || 'N/A'}`)
    Debug.info(ctx, `[api/webhook] Headers (первые 500 символов): ${JSON.stringify(req.headers || {}).substring(0, 500)}`)
    
    const botId = req.params.id
    Debug.info(ctx, `[api/webhook] ID бота из параметров URL: ${botId}`)
    
    const webhookData = req.body
    Debug.info(ctx, `[api/webhook] Тип body: ${typeof webhookData}`)
    Debug.info(ctx, `[api/webhook] Body пустой: ${!webhookData || Object.keys(webhookData).length === 0}`)
    
    // Логируем сырые данные вебхука
    if (webhookData) {
      Debug.info(ctx, `[api/webhook] Данные вебхука для бота ${botId}: ${JSON.stringify(webhookData)}`)
    } else {
      Debug.warn(ctx, `[api/webhook] ВЕБХУК ПУСТОЙ! Body отсутствует или пустой`)
    }
    
    // Находим бота по ID из URL параметра
    // Это гарантирует, что мы знаем, какому боту принадлежит вебхук
    Debug.info(ctx, `[api/webhook] Поиск бота в БД по ID: ${botId}`)
    const bot = await BotTokens.findById(ctx, botId)
    
    if (!bot) {
      Debug.warn(ctx, `[api/webhook] Бот с ID ${botId} не найден в БД`)
      Debug.warn(ctx, `[api/webhook] Возвращаем 200 OK, чтобы Telegram не повторял запрос`)
      // Все равно возвращаем 200 OK, чтобы Telegram не повторял запрос
      return {
        ok: true
      }
    }
    
    Debug.info(ctx, `[api/webhook] Бот найден: id=${bot.id}, userId=${bot.userId}, botName=${bot.botName || 'null'}, botUsername=${bot.botUsername || 'null'}`)
    
    // ВАЖНО: Проверяем, что у бота есть владелец (userId)
    // Без userId мы не можем определить, кому отправлять вебхук
    if (!bot.userId) {
      Debug.warn(ctx, `[api/webhook] У бота ${botId} нет userId, вебхук не отправлен`)
      // Все равно возвращаем 200 OK, чтобы Telegram не повторял запрос
      return {
        ok: true
      }
    }
    
    // Извлекаем update_id из вебхука для логирования
    // update_id присутствует в большинстве вебхуков от Telegram, но не во всех
    const updateId = typeof (webhookData as any)?.update_id === 'number' 
      ? (webhookData as any).update_id 
      : undefined
    
    // Сохраняем вебхук в таблицу для логирования
    try {
      Debug.info(ctx, `[api/webhook] Начало сохранения вебхука в таблицу TelegramWebhooks`)
      const webhookRecord = {
        botId: bot.id,
        userId: bot.userId,
        rawData: webhookData,
        receivedAt: new Date()
      } as any
      
      // Добавляем updateId только если он присутствует
      if (updateId !== undefined) {
        webhookRecord.updateId = updateId
        Debug.info(ctx, `[api/webhook] updateId найден: ${updateId}`)
      } else {
        Debug.info(ctx, `[api/webhook] updateId отсутствует в вебхуке`)
      }
      
      Debug.info(ctx, `[api/webhook] Данные для сохранения: botId=${webhookRecord.botId}, userId=${webhookRecord.userId}, receivedAt=${webhookRecord.receivedAt.toISOString()}`)
      
      const savedWebhook = await TelegramWebhooks.create(ctx, webhookRecord)
      Debug.info(ctx, `[api/webhook] Вебхук успешно сохранен в таблицу: id=${savedWebhook.id}, botId=${botId}, updateId=${updateId !== undefined ? updateId : 'N/A'}`)
    } catch (saveError: any) {
      // Логируем ошибку, но не прерываем обработку вебхука
      Debug.error(ctx, `[api/webhook] Ошибка сохранения вебхука в таблицу: ${saveError.message}`, 'E_WEBHOOK_SAVE')
      Debug.error(ctx, `[api/webhook] Stack trace сохранения: ${saveError.stack || 'N/A'}`)
    }
    
    // Обрабатываем событие вступления в канал через invite link
    try {
      Debug.info(ctx, `[api/webhook] Проверка события вступления в канал`)
      const chatMember = (webhookData as any)?.chat_member
      
      if (chatMember) {
        const oldStatus = chatMember.old_chat_member?.status
        const newStatus = chatMember.new_chat_member?.status
        
        // Извлекаем invite link - может быть объектом ChatInviteLink или строкой
        let inviteLink: string | null = null
        let inviteLinkName: string | null = null
        
        if (chatMember.invite_link) {
          if (typeof chatMember.invite_link === 'string') {
            // Если invite_link - строка, извлекаем только ссылку
            inviteLink = chatMember.invite_link
          } else if (typeof chatMember.invite_link === 'object') {
            // Если invite_link - объект, извлекаем и ссылку, и имя
            if (chatMember.invite_link.invite_link && typeof chatMember.invite_link.invite_link === 'string') {
              inviteLink = chatMember.invite_link.invite_link
            }
            // Извлекаем имя из объекта (если доступно)
            if (chatMember.invite_link.name) {
              inviteLinkName = String(chatMember.invite_link.name)
            }
          }
        }
        
        Debug.info(ctx, `[api/webhook] Событие chat_member обнаружено: oldStatus=${oldStatus || 'N/A'}, newStatus=${newStatus || 'N/A'}, inviteLink=${inviteLink || 'N/A'}, inviteLinkName=${inviteLinkName || 'N/A'}`)
        
        // Проверяем, что пользователь вступил в канал (статус изменился на "member" или "administrator")
        // и вступление было через invite link
        // Старый статус должен быть "left" или отсутствовать (для новых участников)
        const isJoining = (newStatus === 'member' || newStatus === 'administrator') && 
                          (oldStatus === 'left' || oldStatus === 'kicked' || !oldStatus) &&
                          inviteLink && 
                          typeof inviteLink === 'string'
        
        if (isJoining) {
          Debug.info(ctx, `[api/webhook] Пользователь вступил в канал через invite link: ${inviteLink}`)
          
          // Извлекаем ID пользователя Telegram из события
          // ID может быть в chat_member.from.id или chat_member.new_chat_member.user.id
          let telegramUserId: string | null = null
          if (chatMember.from && chatMember.from.id) {
            telegramUserId = String(chatMember.from.id)
          } else if (chatMember.new_chat_member && chatMember.new_chat_member.user && chatMember.new_chat_member.user.id) {
            telegramUserId = String(chatMember.new_chat_member.user.id)
          }
          
          Debug.info(ctx, `[api/webhook] ID пользователя Telegram: ${telegramUserId || 'N/A'}`)
          Debug.info(ctx, `[api/webhook] Имя invite link: ${inviteLinkName || 'N/A'}`)
          
          // Используем эксклюзивную блокировку для предотвращения race condition
          // Ключ блокировки должен быть одинаковым для всех параллельных запросов с одним inviteLink
          const lockKey = `channel-link-analytics-${inviteLink.trim()}`
          
          await runWithExclusiveLock(ctx, lockKey, {}, async () => {
            // ВСЕ операции с БД должны быть ВНУТРИ блокировки
            // Это гарантирует, что между findAll и update не произойдёт другой запрос
            
            // Ищем все записи в аналитике по invite link с пагинацией
            // ВАЖНО: Используем итеративную загрузку для обработки всех записей, даже если их больше 100
            let allAnalyticsRecords: any[] = []
            let offset = 0
            const BATCH_SIZE = 100
            let hasMore = true
            
            while (hasMore) {
              const batch = await ChannelLinkAnalytics.findAll(ctx, {
                where: {
                  inviteLink: inviteLink.trim()
                },
                limit: BATCH_SIZE,
                offset: offset
              })
              
              if (batch && batch.length > 0) {
                allAnalyticsRecords = allAnalyticsRecords.concat(batch)
                offset += BATCH_SIZE
                
                // Если получили меньше записей, чем лимит, значит это последний батч
                if (batch.length < BATCH_SIZE) {
                  hasMore = false
                }
              } else {
                hasMore = false
              }
            }
            
            Debug.info(ctx, `[api/webhook] Найдено записей аналитики для invite link: ${allAnalyticsRecords.length}`)
            
            if (allAnalyticsRecords.length > 0) {
              const now = new Date()
              let updatedCount = 0
              
              // Если имя invite link найдено, используем его для точного сопоставления
              if (inviteLinkName) {
                for (const record of allAnalyticsRecords) {
                  // ВАЖНО: Обновляем только если имя invite link совпадает с uid из записи
                  // Это гарантирует, что мы обновляем только записи конкретного пользователя
                  // Имя invite link создаётся равным uid при создании ссылки
                  const shouldUpdate = record.uid === inviteLinkName.trim()
                  
                  if (shouldUpdate && !record.joinedAt) {
                    const updateData: any = {
                      id: record.id,
                      joinedAt: now
                    }
                    
                    // Добавляем telegramUserId, если он был извлечён
                    if (telegramUserId) {
                      updateData.telegramUserId = telegramUserId
                    }
                    
                    await ChannelLinkAnalytics.update(ctx, updateData)
                    updatedCount++
                    Debug.info(ctx, `[api/webhook] Запись аналитики обновлена: linkId=${record.linkId}, uid=${record.uid}, joinedAt=${now.toISOString()}, telegramUserId=${telegramUserId || 'N/A'}`)
                  } else if (!shouldUpdate) {
                    Debug.info(ctx, `[api/webhook] Пропущена запись аналитики: uid не совпадает (запись uid=${record.uid}, invite link name=${inviteLinkName})`)
                  } else {
                    Debug.info(ctx, `[api/webhook] Запись аналитики уже помечена как вступившая: linkId=${record.linkId}, uid=${record.uid}`)
                  }
                }
                
                if (updatedCount === 0 && allAnalyticsRecords.length > 0) {
                  Debug.warn(ctx, `[api/webhook] Не найдено записей для обновления: все записи либо уже обновлены, либо uid не совпадает`)
                }
              } else {
                // Если имя invite link не найдено (invite_link был строкой), используем fallback логику
                // Обновляем только если найдена ровно одна запись (безопасный fallback)
                if (allAnalyticsRecords.length === 1) {
                  const record = allAnalyticsRecords[0]
                  if (!record.joinedAt) {
                    const updateData: any = {
                      id: record.id,
                      joinedAt: now
                    }
                    
                    // Добавляем telegramUserId, если он был извлечён
                    if (telegramUserId) {
                      updateData.telegramUserId = telegramUserId
                    }
                    
                    await ChannelLinkAnalytics.update(ctx, updateData)
                    updatedCount++
                    Debug.info(ctx, `[api/webhook] Запись аналитики обновлена (fallback, имя invite link недоступно): linkId=${record.linkId}, uid=${record.uid}, joinedAt=${now.toISOString()}, telegramUserId=${telegramUserId || 'N/A'}`)
                  } else {
                    Debug.info(ctx, `[api/webhook] Запись аналитики уже помечена как вступившая: linkId=${record.linkId}, uid=${record.uid}`)
                  }
                } else {
                  // Если записей несколько и имя недоступно, не обновляем, чтобы избежать неправильной атрибуции
                  Debug.warn(ctx, `[api/webhook] Имя invite link не найдено в событии и найдено ${allAnalyticsRecords.length} записей. Пропускаем обновление для избежания неправильной атрибуции. Для обновления требуется имя invite link (равное uid) или единственная запись.`)
                }
              }
            } else {
              Debug.warn(ctx, `[api/webhook] Запись аналитики не найдена для invite link: ${inviteLink}`)
            }
          })
        } else {
          Debug.info(ctx, `[api/webhook] Событие chat_member не является вступлением через invite link: oldStatus=${oldStatus || 'N/A'}, newStatus=${newStatus || 'N/A'}, inviteLink=${inviteLink || 'N/A'}`)
        }
      } else {
        Debug.info(ctx, `[api/webhook] Событие chat_member отсутствует в вебхуке`)
      }
    } catch (joinError: any) {
      // Логируем ошибку, но не прерываем обработку вебхука
      Debug.error(ctx, `[api/webhook] Ошибка обработки вступления в канал: ${joinError.message}`, 'E_JOIN_TRACK')
      Debug.error(ctx, `[api/webhook] Stack trace обработки вступления: ${joinError.stack || 'N/A'}`)
    }
    
    // Сохраняем информацию о чате, если она присутствует в вебхуке
    try {
      Debug.info(ctx, `[api/webhook] Попытка извлечения информации о чате из вебхука`)
      const chatInfo = extractChatFromUpdate(webhookData)
      
      if (chatInfo && chatInfo.id !== undefined && chatInfo.id !== null) {
        const chatIdString = String(chatInfo.id)
        Debug.info(ctx, `[api/webhook] Чат найден в вебхуке: chatId=${chatIdString}, type=${chatInfo.type || 'N/A'}, title=${chatInfo.title || 'N/A'}, username=${chatInfo.username || 'N/A'}`)
        
        const now = new Date()
        
        // Используем эксклюзивную блокировку для атомарной операции
        // Ключ блокировки должен быть одинаковым для всех параллельных запросов с одним chatId
        const lockKey = `telegram-chat-${chatIdString}`
        
        await runWithExclusiveLock(ctx, lockKey, {}, async () => {
          // ВСЕ операции с БД должны быть ВНУТРИ блокировки
          // Это гарантирует, что между findOneBy и createOrUpdateBy не произойдёт другой запрос
          const existingChat = await TelegramChats.findOneBy(ctx, { chatId: chatIdString })
          
          if (existingChat) {
            // Обновляем существующий чат
            Debug.info(ctx, `[api/webhook] Чат ${chatIdString} уже существует, обновляем lastSeenAt и другую информацию`)
            await TelegramChats.createOrUpdateBy(ctx, 'chatId', {
              chatId: chatIdString,
              botId: bot.id,
              userId: bot.userId,
              chatType: chatInfo.type || existingChat.chatType || null,
              chatTitle: chatInfo.title || existingChat.chatTitle || null,
              chatUsername: chatInfo.username || existingChat.chatUsername || null,
              firstSeenAt: existingChat.firstSeenAt, // Сохраняем оригинальное время первого появления
              lastSeenAt: now // Обновляем время последнего появления
            })
            Debug.info(ctx, `[api/webhook] Чат ${chatIdString} успешно обновлен`)
          } else {
            // Создаём новый чат
            Debug.info(ctx, `[api/webhook] Чат ${chatIdString} новый, создаём запись`)
            await TelegramChats.createOrUpdateBy(ctx, 'chatId', {
              chatId: chatIdString,
              botId: bot.id,
              userId: bot.userId,
              chatType: chatInfo.type || null,
              chatTitle: chatInfo.title || null,
              chatUsername: chatInfo.username || null,
              firstSeenAt: now,
              lastSeenAt: now
            })
            Debug.info(ctx, `[api/webhook] Чат ${chatIdString} успешно создан`)
          }
        })
      } else {
        Debug.info(ctx, `[api/webhook] Чат не найден в вебхуке (update не содержит chat)`)
      }
    } catch (chatError: any) {
      // Логируем ошибку, но не прерываем обработку вебхука
      Debug.error(ctx, `[api/webhook] Ошибка сохранения чата: ${chatError.message}`, 'E_CHAT_SAVE')
      Debug.error(ctx, `[api/webhook] Stack trace сохранения чата: ${chatError.stack || 'N/A'}`)
    }
    
    // БЕЗОПАСНОСТЬ: Отправляем вебхук ТОЛЬКО владельцу этого конкретного бота
    // Используем уникальный socketId на основе userId владельца
    // Это гарантирует, что вебхук не попадет к другим пользователям
    try {
      const socketId = `webhooks-${bot.userId}`
      
      Debug.info(ctx, `[api/webhook] Подготовка отправки вебхука через WebSocket`)
      Debug.info(ctx, `[api/webhook] socketId: ${socketId}`)
      Debug.info(ctx, `[api/webhook] Данные для отправки: botId=${bot.id}, botName=${bot.botName || 'null'}, botUsername=${bot.botUsername || 'null'}`)
      
      const socketData = {
        type: 'webhook',
        data: {
          timestamp: Date.now(),
          botId: bot.id,
          botName: bot.botName,
          botUsername: bot.botUsername,
          raw: webhookData
        }
      }
      
      Debug.info(ctx, `[api/webhook] Вызов sendDataToSocket с socketId=${socketId}`)
      await sendDataToSocket(ctx, socketId, socketData)
      
      Debug.info(ctx, `[api/webhook] Вебхук успешно отправлен через WebSocket владельцу ${bot.userId} для бота ${botId}`)
    } catch (socketError: any) {
      Debug.error(ctx, `[api/webhook] Ошибка отправки через WebSocket владельцу ${bot.userId}: ${socketError.message}`, 'E_WEBHOOK_SOCKET')
      Debug.error(ctx, `[api/webhook] Stack trace WebSocket: ${socketError.stack || 'N/A'}`)
      // Не пробрасываем ошибку дальше, чтобы Telegram получил 200 OK
    }
    
    Debug.info(ctx, `[api/webhook] ========== КОНЕЦ ОБРАБОТКИ ВЕБХУКА ==========`)
    
    // Telegram требует ответ 200 OK
    return {
      ok: true
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/webhook] ========== КРИТИЧЕСКАЯ ОШИБКА ОБРАБОТКИ ВЕБХУКА ==========`)
    Debug.error(ctx, `[api/webhook] Ошибка обработки вебхука: ${error.message}`, 'E_WEBHOOK_PROCESS')
    Debug.error(ctx, `[api/webhook] Тип ошибки: ${error.constructor?.name || 'Unknown'}`)
    Debug.error(ctx, `[api/webhook] Stack trace: ${error.stack || 'N/A'}`)
    Debug.error(ctx, `[api/webhook] URL запроса: ${req.url || 'N/A'}`)
    Debug.error(ctx, `[api/webhook] Метод запроса: ${req.method || 'N/A'}`)
    Debug.error(ctx, `[api/webhook] ========================================================`)
    
    // Все равно возвращаем 200 OK, чтобы Telegram не повторял запрос
    return {
      ok: true
    }
  }
})

/**
 * GET /api/webhook/list
 * Получение последних вебхуков текущего пользователя
 */
export const apiGetWebhooksListRoute = app.get('/list', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/webhook/list')
    Debug.info(ctx, '[api/webhook/list] ========== НАЧАЛО ЗАПРОСА СПИСКА ВЕБХУКОВ ==========')
    Debug.info(ctx, `[api/webhook/list] URL запроса: ${req.url}`)
    Debug.info(ctx, `[api/webhook/list] Query параметры: ${JSON.stringify(req.query || {})}`)
    
    // Проверка авторизации
    Debug.info(ctx, `[api/webhook/list] Проверка авторизации пользователя`)
    requireRealUser(ctx)
    Debug.info(ctx, `[api/webhook/list] Пользователь авторизован: userId=${ctx.user.id}`)
    
    // Получаем параметр limit из query (по умолчанию 30)
    const limitParam = req.query.limit as string | undefined
    let limit = limitParam ? parseInt(limitParam, 10) : 30
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      Debug.warn(ctx, `[api/webhook/list] Некорректный параметр limit: ${limitParam}, используем значение по умолчанию 30`)
      limit = 30
    }
    
    // Получаем параметр botId из query (опционально, для фильтрации по конкретному боту)
    const botIdParam = req.query.botId as string | undefined
    Debug.info(ctx, `[api/webhook/list] Параметр botId: ${botIdParam || 'не указан (показываем все вебхуки)'}`)
    
    // Формируем условие where
    const whereCondition: any = {
      userId: ctx.user.id
    }
    
    // Если указан botId, добавляем фильтр по боту
    if (botIdParam && botIdParam.trim()) {
      whereCondition.botId = botIdParam.trim()
      Debug.info(ctx, `[api/webhook/list] Фильтрация вебхуков по botId=${botIdParam}`)
    }
    
    // Получаем последние вебхуки текущего пользователя (с опциональной фильтрацией по боту)
    Debug.info(ctx, `[api/webhook/list] Запрос последних ${limit} вебхуков для userId=${ctx.user.id}`)
    const webhooks = await TelegramWebhooks.findAll(ctx, {
      where: whereCondition,
      order: { receivedAt: 'desc' },
      limit: limit
    })
    
    const webhooksCount = webhooks?.length || 0
    Debug.info(ctx, `[api/webhook/list] Найдено вебхуков: ${webhooksCount}`)
    
    // Получаем информацию о ботах для обогащения данных вебхуков
    const botIds = new Set<string>()
    if (webhooks && webhooks.length > 0) {
      for (const webhook of webhooks) {
        if (webhook.botId) {
          botIds.add(webhook.botId)
        }
      }
    }
    
    const botsMap = new Map<string, { botName: string | null; botUsername: string | null }>()
    if (botIds.size > 0) {
      for (const botId of botIds) {
        try {
          const bot = await BotTokens.findById(ctx, botId)
          if (bot) {
            botsMap.set(botId, {
              botName: bot.botName,
              botUsername: bot.botUsername
            })
          }
        } catch (botError: any) {
          Debug.warn(ctx, `[api/webhook/list] Ошибка получения информации о боте ${botId}: ${botError.message}`)
        }
      }
    }
    
    // Обогащаем вебхуки информацией о ботах
    Debug.info(ctx, `[api/webhook/list] Обогащение вебхуков информацией о ботах`)
    const enrichedWebhooks = (webhooks || []).map(webhook => ({
      id: webhook.id,
      botId: webhook.botId,
      botName: botsMap.get(webhook.botId)?.botName || null,
      botUsername: botsMap.get(webhook.botId)?.botUsername || null,
      updateId: webhook.updateId || null,
      raw: webhook.rawData,
      receivedAt: webhook.receivedAt?.getTime() || Date.now()
    }))
    
    Debug.info(ctx, `[api/webhook/list] Возвращаем ${enrichedWebhooks.length} вебхуков пользователю ${ctx.user.id}`)
    Debug.info(ctx, '[api/webhook/list] ========== КОНЕЦ ЗАПРОСА СПИСКА ВЕБХУКОВ ==========')
    
    return {
      success: true,
      webhooks: enrichedWebhooks
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/webhook/list] Ошибка при получении списка вебхуков: ${error.message}`, 'E_GET_WEBHOOKS_LIST')
    Debug.error(ctx, `[api/webhook/list] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при получении списка вебхуков'
    }
  }
})

/**
 * GET /api/webhook/check/:id
 * Проверка текущего webhook для бота в Telegram
 */
export const apiCheckWebhookRoute = app.get('/check/:id', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/webhook/check')
    Debug.info(ctx, '[api/webhook/check] Начало проверки webhook')
    
    requireRealUser(ctx)
    const botId = req.params.id
    Debug.info(ctx, `[api/webhook/check] Проверка webhook для бота ${botId}, пользователь ${ctx.user.id}`)
    
    const bot = await BotTokens.findById(ctx, botId)
    if (!bot) {
      Debug.warn(ctx, `[api/webhook/check] Бот ${botId} не найден`)
      return {
        success: false,
        error: 'Бот не найден'
      }
    }
    
    if (bot.userId !== ctx.user.id) {
      Debug.warn(ctx, `[api/webhook/check] Пользователь ${ctx.user.id} пытается проверить webhook бота ${botId}, принадлежащего ${bot.userId}`)
      return {
        success: false,
        error: 'Доступ запрещен'
      }
    }
    
    Debug.info(ctx, `[api/webhook/check] Запрос информации о webhook в Telegram для бота ${botId}`)
    const checkResponse = await request({
      url: `https://api.telegram.org/bot${bot.token}/getWebhookInfo`,
      method: 'get',
      responseType: 'json',
      throwHttpErrors: false,
      timeout: 10000
    })
    
    const checkBody = checkResponse.body as any
    Debug.info(ctx, `[api/webhook/check] Ответ от Telegram: statusCode=${checkResponse.statusCode}, body=${JSON.stringify(checkBody)}`)
    
    if (checkResponse.statusCode === 200 && checkBody?.ok) {
      const botIdString = String(bot.id)
      // Используем правильный способ генерации URL для роутов с параметрами пути
      const expectedUrl = apiWebhookRoute({ id: botIdString }).url()
      Debug.info(ctx, `[api/webhook/check] Ожидаемый URL: ${expectedUrl}`)
      Debug.info(ctx, `[api/webhook/check] Текущий URL в Telegram: ${checkBody.result?.url || 'не установлен'}`)
      
      return {
        success: true,
        webhookInfo: checkBody.result,
        expectedUrl: expectedUrl,
        isCorrect: checkBody.result?.url === expectedUrl
      }
    } else {
      Debug.warn(ctx, `[api/webhook/check] Ошибка получения информации о webhook: ${JSON.stringify(checkBody)}`)
      return {
        success: false,
        error: checkBody?.description || 'Ошибка получения информации о webhook'
      }
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/webhook/check] Ошибка проверки webhook: ${error.message}`, 'E_CHECK_WEBHOOK')
    Debug.error(ctx, `[api/webhook/check] Stack trace: ${error.stack || 'N/A'}`)
    return {
      success: false,
      error: error.message || 'Ошибка при проверке webhook'
    }
  }
})

/**
 * GET /api/webhook/test/:id
 * Тестовый endpoint для проверки доступности webhook endpoint
 */
export const apiTestWebhookRoute = app.get('/test/:id', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'api/webhook/test')
    Debug.info(ctx, '[api/webhook/test] Тестовый запрос для проверки доступности endpoint')
    
    const botId = req.params.id
    Debug.info(ctx, `[api/webhook/test] Тест для бота ${botId}`)
    
    const bot = await BotTokens.findById(ctx, botId)
    if (!bot) {
      return {
        success: false,
        error: 'Бот не найден'
      }
    }
    
    const botIdString = String(bot.id)
    // Используем правильный способ генерации URL для роутов с параметрами пути
    const expectedUrl = apiWebhookRoute({ id: botIdString }).url()
    Debug.info(ctx, `[api/webhook/test] Ожидаемый URL webhook: ${expectedUrl}`)
    
    return {
      success: true,
      message: 'Endpoint доступен',
      botId: bot.id,
      expectedWebhookUrl: expectedUrl,
      timestamp: new Date().toISOString()
    }
  } catch (error: any) {
    Debug.error(ctx, `[api/webhook/test] Ошибка: ${error.message}`, 'E_TEST_WEBHOOK')
    return {
      success: false,
      error: error.message || 'Ошибка при тестировании endpoint'
    }
  }
})

