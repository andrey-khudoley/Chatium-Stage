// @shared-route
import { requireAccountRole } from '@app/auth'
import UsersTable from '../tables/users.table.ts'
import { gcQueryAi } from '@gc-mcp-server/sdk'
import { subscribeToMetricEvents, unsubscribeFromMetricEvents } from '@app/metric'

// Получение списка всех пользователей с реальным количеством событий из ClickHouse
export const apiGetUsersRoute = app.get('/list', async (ctx, req) => {
  // requireAccountRole(ctx, 'Admin') // REMOVED: No authorization required
  
  try {
    const { search, limit = 25, offset = 0 } = req.query
    
    let users
    let totalCount
    let allSearchResults = []  // Храним все результаты поиска для подсчета totalCount
    
    if (search && typeof search === 'string') {
      // ИСПРАВЛЕНИЕ: searchBy не поддерживает offset
      // Используем searchBy для полнотекстового поиска, который вернет все результаты
      ctx.account.log('User search initiated', {
        level: 'info',
        json: { search, limit, offset }
      })
      
      allSearchResults = await UsersTable.searchBy(ctx, {
        query: search,
        limit: 1000  // Получаем больше результатов для возможности пагинации
      })
      
      ctx.account.log('Search results from Heap', {
        level: 'info',
        json: { 
          search, 
          resultsCount: allSearchResults.length,
          firstResult: allSearchResults[0] ? {
            email: allSearchResults[0].email,
            firstName: allSearchResults[0].firstName
          } : null
        }
      })
      
      // Применяем offset и limit вручную для возврата нужной страницы
      const offsetValue = parseInt(offset as string)
      const limitValue = parseInt(limit as string)
      
      if (allSearchResults && allSearchResults.length > 0) {
        users = allSearchResults.slice(offsetValue, offsetValue + limitValue)
        totalCount = allSearchResults.length
      } else {
        users = []
        totalCount = 0
      }
      
      // Если в Heap ничего не найдено, ищем напрямую в ClickHouse
      if (!users || users.length === 0) {
        const escapedSearch = search.trim().replace(/'/g, "''")
        
        // Простой поиск по точному совпадению email
        const exactEmailQuery = `
          WITH user_ids AS (
            SELECT DISTINCT user_id
            FROM chatium_ai.access_log
            WHERE lowerUTF8(user_email) = lowerUTF8('${escapedSearch}')
              AND user_id IS NOT NULL
              AND user_id != ''
            LIMIT 1
          )
          SELECT
            anyIf(user_email, user_email != '' AND user_email IS NOT NULL) as user_email,
            any(user_first_name) as user_first_name,
            any(user_last_name) as user_last_name,
            any(user_phone) as user_phone,
            any(uid) as uid,
            min(ts) as ts,
            max(ts) as last_ts
          FROM chatium_ai.access_log
          WHERE user_id IN (SELECT user_id FROM user_ids)
          GROUP BY user_id
          HAVING length(user_email) > 0
        `
        
        const result = await gcQueryAi(ctx, exactEmailQuery)
        
        // Если нашли пользователей в ClickHouse, создаём их в Heap
        if (result && result.rows && result.rows.length > 0) {
          users = []
          
          for (const row of result.rows) {
            try {
              // Создаём пользователя в Heap
              const newUser = await UsersTable.create(ctx, {
                email: row.user_email,
                firstName: row.user_first_name || undefined,
                lastName: row.user_last_name || undefined,
                phone: row.user_phone || undefined,
                uid: row.uid || undefined,
                registrationDate: new Date(row.ts),
                lastEventDate: new Date(row.last_ts),
                eventsCount: 0
              })
              
              users.push(newUser)
              
              ctx.account.log('User created from ClickHouse search', {
                level: 'info',
                json: { email: row.user_email, search }
              })
            } catch (createError: any) {
              // Если пользователь уже существует, попробуем найти его
              const existingUser = await UsersTable.findOneBy(ctx, {
                email: row.user_email
              })
              
              if (existingUser) {
                users.push(existingUser)
              } else {
                ctx.account.log('Failed to create user from ClickHouse search', {
                  level: 'error',
                  json: { email: row.user_email, error: createError.message }
                })
              }
            }
          }
          
          totalCount = users.length
        }
      }
    } else {
      // Просто получить все записи
      const limitValue = parseInt(limit as string)
      const offsetValue = parseInt(offset as string)
      
      ctx.account.log('Getting users without search', {
        level: 'info',
        json: { limit: limitValue, offset: offsetValue }
      })
      
      users = await UsersTable.findAll(ctx, {
        order: [{ registrationDate: 'desc' }],
        limit: limitValue,
        offset: offsetValue
      })
      
      ctx.account.log('Users fetched', {
        level: 'info',
        json: { 
          limit: limitValue, 
          offset: offsetValue,
          returned: users.length,
          firstUser: users[0] ? {
            id: users[0].id,
            email: users[0].email
          } : null
        }
      })
      
      // Без поиска - общее количество в базе
      totalCount = await UsersTable.countBy(ctx)
    }
    
    return {
      success: true,
      users: users || [],
      totalCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    }
  } catch (error: any) {
    ctx.account.log('Error fetching users', {
      level: 'error',
      json: { error: error.message, stack: error.stack }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Получение количества событий для конкретного пользователя
// Вызывается только при клике на пользователя (открытие спойлера)
export const apiGetUserEventsCountRoute = app.get('/user-events-count', async (ctx, req) => {
  // requireAccountRole(ctx, 'Admin') // REMOVED: No authorization required
  
  try {
    const { email } = req.query
    
    if (!email) {
      return {
        success: false,
        error: 'Email is required'
      }
    }
    
    const escapedEmail = String(email).replace(/'/g, "''")
    
    // Шаг 1: Находим ВСЕ resolved_user_id по email (может быть несколько)
    // resolved_user_id - это главный идентификатор пользователя в GetCourse
    const findResolvedUserIdsQuery = `
      SELECT DISTINCT 
        COALESCE(resolved_user_id, user_id) as user_id
      FROM chatium_ai.access_log
      WHERE user_email IS NOT NULL
        AND user_email != ''
        AND lowerUTF8(user_email) = lowerUTF8('${escapedEmail}')
    `
    
    const userIdsResult = await gcQueryAi(ctx, findResolvedUserIdsQuery)
    const userIds = (userIdsResult.rows || []).map(r => r.user_id).filter(id => id && id !== '')
    
    if (userIds.length === 0) {
      return {
        success: true,
        count: 0
      }
    }
    
    // Шаг 2: Считаем ВСЕ события для ВСЕХ resolved_user_id этого пользователя
    const userIdsConditions = userIds.map(uid => {
      const escapedUid = uid.replace(/'/g, "''")
      return `(COALESCE(resolved_user_id, user_id) = '${escapedUid}')`
    }).join(' OR ')
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chatium_ai.access_log
      WHERE ${userIdsConditions}
    `
    
    const countResult = await gcQueryAi(ctx, countQuery)
    const count = Number(countResult.rows?.[0]?.total) || 0
    
    return {
      success: true,
      count
    }
  } catch (error: any) {
    ctx.account.log('Error fetching user events count', {
      level: 'error',
      json: { error: error.message, email: req.query.email }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Получение статистики пользователей
export const apiGetUsersStatsRoute = app.get('/stats', async (ctx, req) => {
  // requireAccountRole(ctx, 'Admin') // REMOVED: No authorization required
  
  try {
    const now = new Date()
    // Создаем дату начала сегодняшнего дня в локальном времени (MSK на сервере)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Подсчитываем пользователей по периодам
    const totalUsers = await UsersTable.countBy(ctx)
    
    const todayUsers = await UsersTable.countBy(ctx, {
      registrationDate: { $gte: today }
    })
    
    const weekUsers = await UsersTable.countBy(ctx, {
      registrationDate: { $gte: weekAgo }
    })
    
    const monthUsers = await UsersTable.countBy(ctx, {
      registrationDate: { $gte: monthAgo }
    })
    
    return {
      success: true,
      stats: {
        totalUsers,
        todayUsers,
        weekUsers,
        monthUsers
      }
    }
  } catch (error: any) {
    ctx.account.log('Error fetching users stats', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Обновление исторических данных из ClickHouse
export const apiUpdateHistoricalDataRoute = app.post('/update-historical', async (ctx) => {
  requireAccountRole(ctx, 'Admin')
  
  try {
    ctx.account.log('Starting historical data update', {
      level: 'info',
      json: { startedAt: new Date() }
    })
    
    // Загружаем все существующие email из Heap постранично
    const existingEmailsSet = new Set<string>()
    let heapOffset = 0
    const HEAP_LIMIT = 1000
    let hasMoreInHeap = true
    
    while (hasMoreInHeap) {
      const batch = await UsersTable.findAll(ctx, {
        select: ['email'],
        limit: HEAP_LIMIT,
        offset: heapOffset
      })
      
      for (const user of batch) {
        existingEmailsSet.add(user.email.toLowerCase())
      }
      
      if (batch.length < HEAP_LIMIT) {
        hasMoreInHeap = false
      } else {
        heapOffset += HEAP_LIMIT
      }
    }
    
    ctx.account.log('Loaded existing users from Heap', {
      level: 'info',
      json: { count: existingEmailsSet.size }
    })
    
    const BATCH_SIZE = 150  // Размер батча
    const MAX_TOTAL_RECORDS = 5000  // Максимум 5,000 пользователей за один запуск (баланс скорость/таймаут)
    
    // Загружаем события создания пользователей за последние 7 дней
    const oldestRegistration = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    
    ctx.account.log('Will load users since', {
      level: 'info',
      json: { 
        oldestRegistration: oldestRegistration.toISOString(),
        existingEmailsCount: existingEmailsSet.size
      }
    })
    
    let totalProcessed = 0
    let totalCreated = 0
    let totalUpdated = 0
    let hasMore = true
    let iteration = 0
    let lastUserId = '' // Последний обработанный user_id для пагинации (алфавитный порядок)
    
    // Обрабатываем данные итерациями по BATCH_SIZE записей
    // Продолжаем, пока есть данные и не превысили лимит
    while (hasMore && totalProcessed < MAX_TOTAL_RECORDS) {
      iteration++
      
      // Для проблемного пользователя делаем дополнительный запрос
      if (iteration === 1) {
        try {
          // Запрос без GROUP BY - все события
          const debugQuery1 = `
            SELECT ts, user_email, user_first_name
            FROM chatium_ai.access_log
            WHERE user_email = 'gurovairina@inbox.ru'
            ORDER BY ts ASC
            LIMIT 10
          `
          const debugResult1 = await gcQueryAi(ctx, debugQuery1)
          ctx.account.log('All events for gurovairina (no GROUP BY)', {
            level: 'info',
            json: { events: debugResult1?.rows || [], count: debugResult1?.rows?.length || 0 }
          })
          
          // Запрос с GROUP BY - как в основном запросе
          const debugQuery2 = `
            SELECT
              user_email,
              any(user_first_name) as user_first_name,
              min(ts) as ts,
              count(*) as cnt
            FROM chatium_ai.access_log
            WHERE user_email = 'gurovairina@inbox.ru'
            GROUP BY user_email
          `
          const debugResult2 = await gcQueryAi(ctx, debugQuery2)
          ctx.account.log('Aggregated event for gurovairina (with GROUP BY)', {
            level: 'info',
            json: { events: debugResult2?.rows || [] }
          })
        } catch (e: any) {
          ctx.account.log('Failed to query gurovairina events', {
            level: 'error',
            json: { error: e.message }
          })
        }
      }
      
      // Получаем события создания пользователей из GetCourse за последние 7 дней
      const oldestRegistrationStr = oldestRegistration.toISOString().split('T')[0]
      
      // Упрощенный запрос без GROUP BY для отладки
      const query = `
        SELECT
          user_id,
          user_email,
          user_first_name,
          user_last_name,
          user_phone,
          uid,
          ts,
          dt
        FROM chatium_ai.access_log
        WHERE 
          urlPath = 'event://getcourse/user/created'
          AND user_email IS NOT NULL
          AND user_email != ''
          AND dt >= '${oldestRegistrationStr}'
        ORDER BY ts DESC
        LIMIT 10
      `
      
      // Логируем SQL запрос для отладки
      ctx.account.log('Executing ClickHouse query for users', {
        level: 'info',
        json: { 
          iteration, 
          lastUserId, 
          totalProcessed,
          query: query.substring(0, 500)
        }
      })
      
      let result
      try {
        result = await gcQueryAi(ctx, query)
      } catch (queryError: any) {
        ctx.account.log('ClickHouse query failed', {
          level: 'error',
          json: { error: queryError.message, iteration, lastUserId, query }
        })
        // Прерываем цикл при ошибке
        break
      }
      
      ctx.account.log('ClickHouse query result', {
        level: 'info',
        json: { 
          iteration,
          rowsReturned: result?.rows?.length || 0,
          hasResult: !!result,
          hasRows: !!result?.rows,
          firstRows: result?.rows?.slice(0, 3).map(r => ({
            user_id: r.user_id,
            email: r.user_email
          }))
        }
      })
      
      if (!result || !result.rows || result.rows.length === 0) {
        ctx.account.log('No more users', {
          level: 'info',
          json: { iteration, lastUserId, totalProcessed }
        })
        hasMore = false
        break
      }
      
      const events = result.rows as Array<{
        user_id?: string
        user_email?: string
        user_first_name?: string
        user_last_name?: string
        user_phone?: string
        uid?: string
        ts?: string
      }>
      
      ctx.account.log('Processing batch', {
        level: 'info',
        json: { iteration, batchSize: events.length, lastUserId, totalProcessed, totalCreated }
      })
      
      let batchProcessed = 0
      let batchCreated = 0
      let batchUpdated = 0
      
      // Обрабатываем каждое событие в батче
      for (const event of events) {
        if (!event.user_id) continue
        
        try {
          // Логируем для конкретного пользователя
          if (event.user_email === 'gurovairina@inbox.ru') {
            ctx.account.log('ClickHouse data for gurovairina', {
              level: 'info',
              json: {
                ts: event.ts,
                user_first_name: event.user_first_name,
                user_email: event.user_email
              }
            })
          }
          
          // Преобразуем строку даты из ClickHouse в объект Date
          // ClickHouse возвращает дату в московском времени (UTC+3)
          // Парсим как есть и сохраняем в этом же виде (MSK)
          let eventDate: Date
          if (event.ts) {
            eventDate = new Date(event.ts)
            
            // Проверяем, что дата валидна
            if (isNaN(eventDate.getTime())) {
              ctx.account.log('Invalid date parsed', {
                level: 'error',
                json: { ts: event.ts, email: event.user_email }
              })
              continue
            }
          } else {
            eventDate = new Date()
          }
          
          // Проверяем, существует ли уже пользователь с таким email
          const emailLower = event.user_email?.toLowerCase()
          
          if (!emailLower) {
            // Нет email - пропускаем
            continue
          }
          
          if (existingEmailsSet.has(emailLower)) {
            // Пользователь уже есть в Heap - пропускаем
            ctx.account.log('User already exists in Heap, skipping', {
              level: 'info',
              json: { email: event.user_email }
            })
            continue
          }
          
          // Создаем нового пользователя
          ctx.account.log('Creating new user from GetCourse event', {
            level: 'info',
            json: { 
              email: event.user_email,
              user_id: event.user_id
            }
          })
          
          const newUser = await UsersTable.create(ctx, {
            email: event.user_email,
            firstName: (event.user_first_name && event.user_first_name !== null && event.user_first_name !== '') ? event.user_first_name : undefined,
            lastName: (event.user_last_name && event.user_last_name !== null && event.user_last_name !== '') ? event.user_last_name : undefined,
            phone: (event.user_phone && event.user_phone !== null && event.user_phone !== '') ? event.user_phone : undefined,
            uid: (event.uid && event.uid !== null && event.uid !== '') ? event.uid : undefined,
            registrationDate: eventDate,
            lastEventDate: eventDate,
            eventsCount: 0
          })
          
          // Добавляем email в Set чтобы не создавать дубли
          existingEmailsSet.add(emailLower)
          batchCreated++
          
          ctx.account.log('User created successfully', {
            level: 'info',
            json: { 
              email: event.user_email,
              userId: newUser.id
            }
          })
          
          batchProcessed++
        } catch (itemError: any) {
          ctx.account.log('Error processing event', {
            level: 'error',
            json: { 
              user_id: event.user_id,
              email: event.user_email,
              error: itemError.message
            }
          })
        }
      }
      
      totalProcessed += batchProcessed
      totalCreated += batchCreated
      totalUpdated += batchUpdated
      
      ctx.account.log('Batch completed', {
        level: 'info',
        json: {
          iteration,
          batchProcessed,
          batchCreated,
          batchUpdated,
          totalProcessed,
          totalCreated,
          totalUpdated,
          lastUserId
        }
      })
      
      // Сохраняем последний user_id для следующей итерации
      if (events.length > 0) {
        lastUserId = events[events.length - 1].user_id || lastUserId
      }
      
      // Если получили меньше чем BATCH_SIZE, значит это последняя порция
      if (events.length < BATCH_SIZE) {
        hasMore = false
      }
    }
    
    const totalInSystem = await UsersTable.countBy(ctx)
    
    ctx.account.log('Historical data update completed', {
      level: 'info',
      json: { 
        processed: totalProcessed,
        created: totalCreated,
        updated: totalUpdated,
        totalInSystem,
        completedAt: new Date()
      }
    })
    
    return {
      success: true,
      processed: totalProcessed,
      created: totalCreated,
      updated: totalUpdated,
      totalInSystem
    }
  } catch (error: any) {
    ctx.account.log('Error updating historical data', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Обработчик новых событий - вызывается при регистрации пользователя
export const handleUserRegistrationEvent = async (ctx: any, eventData: {
  email?: string
  firstName?: string
  lastName?: string
  phone?: string
  uid?: string
}) => {
  try {
    if (!eventData.email) {
      return
    }
    
    // Проверяем, существует ли пользователь
    const existingUser = await UsersTable.findOneBy(ctx, {
      email: eventData.email
    })
    
    const now = new Date()
    
    if (existingUser) {
      // Обновляем существующего пользователя
      await UsersTable.update(ctx, {
        id: existingUser.id,
        firstName: eventData.firstName || existingUser.firstName,
        lastName: eventData.lastName || existingUser.lastName,
        phone: eventData.phone || existingUser.phone,
        uid: eventData.uid || existingUser.uid,
        lastEventDate: now,
        eventsCount: (existingUser.eventsCount || 0) + 1
      })
    } else {
      // Создаём нового пользователя
      await UsersTable.create(ctx, {
        email: eventData.email,
        firstName: eventData.firstName || undefined,
        lastName: eventData.lastName || undefined,
        phone: eventData.phone || undefined,
        uid: eventData.uid || undefined,
        registrationDate: now,
        lastEventDate: now,
        eventsCount: 1
      })
    }
    
    ctx.account.log('User data updated from event', {
      level: 'info',
      json: { 
        email: eventData.email,
        action: existingUser ? 'updated' : 'created'
      }
    })
  } catch (error: any) {
    ctx.account.log('Error handling user registration event', {
      level: 'error',
      json: { 
        email: eventData.email,
        error: error.message 
      }
    })
  }
}

// Тестовый эндпоинт для диагностики проблемы с подсчетом событий по user_id
export const apiTestUserIdEventsRoute = app.get('/test-userid-events', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { email = 'Kiseleva-ksyunya@mail.ru' } = req.query
  
  try {
    const escapedEmail = String(email).replace(/'/g, "''")
    
    const results = {
      email,
      tests: [] as any[]
    }
    
    // Тест 1: Найти ВСЕ user_id по email
    results.tests.push({ step: 1, description: 'Find ALL user_ids by email' })
    
    const findAllUserIdsQuery = `
      SELECT DISTINCT user_id, user_email, count(*) as events_count
      FROM chatium_ai.access_log
      WHERE user_email IS NOT NULL
        AND user_email != ''
        AND lowerUTF8(user_email) = lowerUTF8('${escapedEmail}')
      GROUP BY user_id, user_email
      ORDER BY events_count DESC
    `
    
    const allUserIdsResult = await gcQueryAi(ctx, findAllUserIdsQuery)
    const allUserIds = allUserIdsResult.rows || []
    
    results.tests.push({ 
      step: 2, 
      description: 'Found ALL user_ids', 
      data: allUserIds,
      count: allUserIds.length
    })
    
    if (allUserIds.length === 0) {
      return {
        success: true,
        error: 'No user_id found for this email',
        results
      }
    }
    
    // Тест 2: Посчитать события по ВСЕМ user_id
    const userIds = allUserIds.map(r => r.user_id).filter(id => id && id !== '')
    const userIdsConditions = userIds.map(uid => `user_id = '${uid.replace(/'/g, "''")}'`).join(' OR ')
    
    const countAllQuery = `
      SELECT COUNT(*) as total
      FROM chatium_ai.access_log
      WHERE ${userIdsConditions}
    `
    
    const allCountResult = await gcQueryAi(ctx, countAllQuery)
    const totalAllUserIds = Number(allCountResult.rows?.[0]?.total) || 0
    
    results.tests.push({ 
      step: 3, 
      description: 'Count by ALL user_ids', 
      count: totalAllUserIds,
      userIdsCount: userIds.length
    })
    
    // Тест 3: Показать детали событий для каждого user_id
    const detailsByUserId = []
    for (const userIdRow of allUserIds) {
      const uid = userIdRow.user_id
      
      const detailQuery = `
        SELECT 
          ts,
          user_id,
          user_email,
          urlPath,
          action_param1
        FROM chatium_ai.access_log
        WHERE user_id = '${uid.replace(/'/g, "''")}'
        ORDER BY ts DESC
      `
      
      const detailResult = await gcQueryAi(ctx, detailQuery)
      const events = detailResult.rows || []
      
      detailsByUserId.push({
        user_id: uid,
        eventsCount: events.length,
        eventsWithEmail: events.filter(e => e.user_email && e.user_email !== '').length,
        eventsWithoutEmail: events.filter(e => !e.user_email || e.user_email === '').length,
        sampleEvents: events.slice(0, 3)
      })
    }
    
    results.tests.push({ 
      step: 4, 
      description: 'Details by each user_id', 
      details: detailsByUserId
    })
    
    // Вывод
    results.tests.push({
      step: 5,
      description: 'Conclusion',
      summary: {
        email,
        foundUserIds: userIds.length,
        totalEvents: totalAllUserIds,
        details: detailsByUserId.map(d => ({
          user_id: d.user_id,
          events: d.eventsCount,
          withEmail: d.eventsWithEmail,
          withoutEmail: d.eventsWithoutEmail
        }))
      }
    })
    
    return {
      success: true,
      results
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Тестовый эндпоинт для диагностики проблемы с подсчетом событий
export const apiTestUserEventsCountRoute = app.get('/test-user-events-count', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { email = 'gurovairina@inbox.ru' } = req.query
  
  const results = {
    email: email,
    tests: [] as any[],
    conclusion: null as any
  }
  
  try {
    const escapedEmail = String(email).replace(/'/g, "''")
    
    // Тест 1: Найдем все идентификаторы пользователя
    results.tests.push({ test: 1, name: 'Find user identifiers' })
    
    const findIdentifiersQuery = `
      SELECT DISTINCT
        user_id,
        user_email,
        uid,
        gc_visitor_id
      FROM chatium_ai.access_log
      WHERE user_email IS NOT NULL
        AND user_email != ''
        AND (
          user_email = '${escapedEmail}'
          OR lowerUTF8(user_email) = lowerUTF8('${escapedEmail}')
        )
      LIMIT 1
    `
    
    const identifiersResult = await gcQueryAi(ctx, findIdentifiersQuery)
    const identifiers = identifiersResult.rows?.[0]
    
    if (!identifiers) {
      return {
        success: false,
        error: 'User not found in database',
        results
      }
    }
    
    results.tests.push({ 
      test: 2, 
      name: 'User identifiers found', 
      identifiers: {
        user_id: identifiers.user_id || null,
        user_email: identifiers.user_email || null,
        uid: identifiers.uid || null,
        gc_visitor_id: identifiers.gc_visitor_id || null
      }
    })
    
    // Тест 2: Считаем события ТОЛЬКО по email
    const emailOnlyQuery = `
      SELECT COUNT(*) as total
      FROM chatium_ai.access_log
      WHERE user_email = '${identifiers.user_email?.replace(/'/g, "''")}'
    `
    
    const emailOnlyResult = await gcQueryAi(ctx, emailOnlyQuery)
    const emailOnlyCount = Number(emailOnlyResult.rows?.[0]?.total) || 0
    
    results.tests.push({ 
      test: 3, 
      name: 'Events count by EMAIL only', 
      count: emailOnlyCount
    })
    
    // Тест 3: Считаем события по ВСЕМ идентификаторам
    const conditions: string[] = []
    
    if (identifiers.user_email) {
      conditions.push(`user_email = '${identifiers.user_email.replace(/'/g, "''")}'`)
    }
    
    if (identifiers.user_id) {
      conditions.push(`user_id = '${identifiers.user_id.replace(/'/g, "''")}'`)
    }
    
    if (identifiers.uid) {
      conditions.push(`uid = '${identifiers.uid.replace(/'/g, "''")}'`)
    }
    
    if (identifiers.gc_visitor_id) {
      conditions.push(`gc_visitor_id = ${identifiers.gc_visitor_id}`)
    }
    
    const allIdentifiersQuery = `
      SELECT COUNT(*) as total
      FROM chatium_ai.access_log
      WHERE ${conditions.join(' OR ')}
    `
    
    const allIdentifiersResult = await gcQueryAi(ctx, allIdentifiersQuery)
    const allIdentifiersCount = Number(allIdentifiersResult.rows?.[0]?.total) || 0
    
    results.tests.push({ 
      test: 4, 
      name: 'Events count by ALL identifiers', 
      count: allIdentifiersCount,
      query: allIdentifiersQuery
    })
    
    // Тест 4: Вызовем новый API
    const apiResult = await apiGetUserEventsCountRoute.run(ctx, { email } as any)
    
    results.tests.push({ 
      test: 5, 
      name: 'apiGetUserEventsCountRoute result', 
      success: apiResult.success,
      count: apiResult.count || 0
    })
    
    // Вывод
    results.conclusion = {
      status: allIdentifiersCount > emailOnlyCount ? 'FIXED' : 'OK',
      message: allIdentifiersCount > emailOnlyCount 
        ? `Found ${allIdentifiersCount} events total (was ${emailOnlyCount} by email only). Fix working!`
        : `All ${allIdentifiersCount} events have email. No additional events found by uid/gc_visitor_id.`,
      emailOnlyCount,
      allIdentifiersCount,
      difference: allIdentifiersCount - emailOnlyCount
    }
    
    return {
      success: true,
      results
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      results
    }
  }
})

// API эндпоинт для включения автоматической синхронизации пользователей
export const apiEnableUserSyncRoute = app.post('/enable-user-sync', async (ctx) => {
  requireAccountRole(ctx, 'Admin')
  
  try {
    // Подписываемся на событие создания пользователей в GetCourse
    await subscribeToMetricEvents(ctx, ['event://getcourse/user/created'])
    
    ctx.account.log('[Analytics] Subscribed to GetCourse user/created events', {
      level: 'info',
      json: { subscribedAt: new Date() }
    })
    
    return {
      success: true,
      message: 'Successfully subscribed to GetCourse user/created events'
    }
  } catch (error: any) {
    ctx.account.log('[Analytics] Failed to subscribe to events', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// API эндпоинт для отключения автоматической синхронизации
export const apiDisableUserSyncRoute = app.post('/disable-user-sync', async (ctx) => {
  requireAccountRole(ctx, 'Admin')
  
  try {
    await unsubscribeFromMetricEvents(ctx, 'event://getcourse/user/created')
    
    ctx.account.log('[Analytics] Unsubscribed from GetCourse user/created events', {
      level: 'info',
      json: { unsubscribedAt: new Date() }
    })
    
    return {
      success: true,
      message: 'Successfully unsubscribed from GetCourse user/created events'
    }
  } catch (error: any) {
    ctx.account.log('[Analytics] Failed to unsubscribe from events', {
      level: 'error',
      json: { error: error.message }
    })
    
    return {
      success: false,
      error: error.message
    }
  }
})

// Хук для обработки событий метрик (GetCourse events)
app.accountHook('metric-event', async (ctx, { event }) => {
  // Импортируем таблицу для сохранения событий
  const { MetricEventsTable } = await import('../tables/metric-events.table')
  
  // Логируем в оба места для отладки
  ctx.console.log('[Analytics] metric-event hook triggered', event)
  
  ctx.account.log('[Analytics] Metric event received', {
    level: 'info',
    json: { 
      urlPath: event.urlPath,
      hasUserEmail: !!event.user_email,
      eventKeys: Object.keys(event || {})
    }
  })
  
  // Сохраняем событие в Heap для просмотра
  try {
    await MetricEventsTable.create(ctx, {
      urlPath: event.urlPath || 'unknown',
      userEmail: event.user_email || undefined,
      userId: event.user_id || undefined,
      eventData: JSON.stringify(event),
      receivedAt: new Date()
    })
    
    ctx.account.log('[Analytics] Metric event saved to Heap', {
      level: 'info',
      json: { urlPath: event.urlPath }
    })
  } catch (saveError: any) {
    ctx.account.log('[Analytics] Failed to save metric event', {
      level: 'error',
      json: { error: saveError.message }
    })
  }
  
  // Обрабатываем событие создания пользователя в GetCourse
  if (event.urlPath === 'event://getcourse/user/created') {
    ctx.account.log('[Analytics] Processing GetCourse user/created event', {
      level: 'info',
      json: { 
        email: event.user_email,
        firstName: event.user_first_name,
        lastName: event.user_last_name
      }
    })
    
    if (event.user_email) {
      try {
        await handleUserRegistrationEvent(ctx, {
          email: event.user_email,
          firstName: event.user_first_name || undefined,
          lastName: event.user_last_name || undefined,
          phone: event.user_phone || undefined,
          uid: event.uid || undefined
        })
        
        ctx.account.log('[Analytics] User created/updated from GetCourse event', {
          level: 'info',
          json: { email: event.user_email }
        })
      } catch (error: any) {
        ctx.account.log('[Analytics] Error creating user from GetCourse event', {
          level: 'error',
          json: { 
            email: event.user_email,
            error: error.message,
            stack: error.stack
          }
        })
      }
    }
  }
})
