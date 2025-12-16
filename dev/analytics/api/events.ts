// @shared-route
import { requireAccountRole } from '@app/auth'
import { gcQueryAi } from '@gc-mcp-server/sdk'

/**
 * API эндпоинт для получения событий из ClickHouse
 * 
 * Параметры:
 * - dateFrom: начальная дата (YYYY-MM-DD)
 * - dateTo: конечная дата (YYYY-MM-DD)
 * - limit: количество записей (по умолчанию 50)
 * - offset: смещение для пагинации (по умолчанию 0)
 */
export const apiGetEventsRoute = app.get('/list', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  // Параметры запроса с значениями по умолчанию
  const {
    dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo = new Date().toISOString().split('T')[0],
    limit = 50,
    offset = 0
  } = req.query

  try {
    // SQL запрос для получения последних событий
    const query = `
      SELECT 
        ts,
        dt,
        urlPath,
        action_param1,
        action_param2,
        action_param3,
        action_param1_float,
        action_param1_int,
        user_id,
        user_email,
        user_first_name,
        user_last_name,
        title,
        action_params
      FROM chatium_ai.access_log
      WHERE dt BETWEEN '${dateFrom}' AND '${dateTo}'
      ORDER BY ts DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    ctx.account.log('Fetching events from ClickHouse', {
      level: 'info',
      json: { dateFrom, dateTo, limit, offset }
    })

    const result = await gcQueryAi(ctx, query)

    return {
      success: true,
      events: result.rows || [],
      count: result.rows?.length || 0,
      filters: {
        dateFrom,
        dateTo,
        limit,
        offset
      }
    }
  } catch (error: any) {
    ctx.account.log('Failed to fetch events', {
      level: 'error',
      json: { 
        error: error.message,
        dateFrom,
        dateTo
      }
    })

    return {
      success: false,
      error: error.message,
      events: [],
      count: 0
    }
  }
})

/**
 * API эндпоинт для получения агрегированной статистики событий
 * 
 * Параметры:
 * - dateFrom: начальная дата
 * - dateTo: конечная дата
 */
export const apiGetEventStatsRoute = app.get('/stats', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const {
    dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo = new Date().toISOString().split('T')[0]
  } = req.query

  try {
    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT urlPath) as unique_event_types,
        toDate(MIN(ts)) as first_event_date,
        toDate(MAX(ts)) as last_event_date
      FROM chatium_ai.access_log
      WHERE dt BETWEEN '${dateFrom}' AND '${dateTo}'
    `

    const result = await gcQueryAi(ctx, query)
    const stats = result.rows?.[0]

    return {
      success: true,
      stats: {
        totalEvents: stats?.total_events || 0,
        uniqueUsers: stats?.unique_users || 0,
        uniqueEventTypes: stats?.unique_event_types || 0,
        firstEventDate: stats?.first_event_date || null,
        lastEventDate: stats?.last_event_date || null
      }
    }
  } catch (error: any) {
    ctx.account.log('Failed to fetch event stats', {
      level: 'error',
      json: { error: error.message }
    })

    return {
      success: false,
      error: error.message,
      stats: null
    }
  }
})

/**
 * API эндпоинт для получения событий конкретного пользователя по email
 * 
 * Параметры:
 * - email: email пользователя (обязательный)
 * - limit: количество записей (по умолчанию 100)
 * - offset: смещение для пагинации (по умолчанию 0)
 */
export const apiGetUserEventsRoute = app.get('/user-events', async (ctx, req) => {
  // requireAccountRole(ctx, 'Admin') // REMOVED: No authorization required

  const {
    email,
    limit = 100,
    offset = 0
  } = req.query

  if (!email) {
    return {
      success: false,
      error: 'Email parameter is required',
      events: [],
      count: 0,
      totalCount: 0
    }
  }

  try {
    const escapedEmail = String(email).trim().replace(/'/g, "''")
    
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
        events: [],
        count: 0,
        totalCount: 0,
        filters: { email, limit: parseInt(String(limit)), offset: parseInt(String(offset)) }
      }
    }
    
    // Шаг 2: Получаем события по ВСЕМ resolved_user_id
    const userIdsConditions = userIds.map(uid => {
      const escapedUid = uid.replace(/'/g, "''")
      return `(COALESCE(resolved_user_id, user_id) = '${escapedUid}')`
    }).join(' OR ')
    
    const eventsQuery = `
      SELECT 
        ts,
        dt,
        urlPath,
        action_param1,
        action_param2,
        action_param3,
        action_param1_float,
        action_param1_int,
        user_id,
        user_email,
        user_first_name,
        user_last_name,
        title,
        action_params
      FROM chatium_ai.access_log
      WHERE ${userIdsConditions}
      ORDER BY ts DESC
      LIMIT ${parseInt(String(limit))}
      OFFSET ${parseInt(String(offset))}
    `
    
    const result = await gcQueryAi(ctx, eventsQuery)
    const events = result.rows || []
    
    // Шаг 3: Считаем общее количество событий
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chatium_ai.access_log
      WHERE ${userIdsConditions}
    `
    
    const countResult = await gcQueryAi(ctx, countQuery)
    const totalCount = Number(countResult.rows?.[0]?.total) || 0

    ctx.account.log('Fetching user events from ClickHouse', {
      level: 'info',
      json: { 
        email,
        userIds,
        eventsFound: events.length,
        totalCount
      }
    })

    return {
      success: true,
      events,
      count: events.length,
      totalCount,
      filters: {
        email,
        limit: parseInt(String(limit)),
        offset: parseInt(String(offset))
      }
    }
  } catch (error: any) {
    ctx.account.log('Failed to fetch user events', {
      level: 'error',
      json: { 
        error: error.message,
        email
      }
    })

    return {
      success: false,
      error: error.message,
      events: [],
      count: 0,
      totalCount: 0
    }
  }
})

/**
 * Тестовый эндпоинт для отладки запроса событий пользователя
 * Проверяет разные варианты SQL запросов и возвращает детальную информацию
 */
export const apiTestUserEventsRoute = app.get('/test-user-events', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const { email = 'gurovairina@inbox.ru' } = req.query
  
  // Сначала попробуем найти реальный email в базе
  const findEmailQuery = `
    SELECT DISTINCT user_email
    FROM chatium_ai.access_log
    WHERE user_email LIKE '%gurovairina%'
    LIMIT 5
  `
  
  let actualEmails: string[] = []
  try {
    const findResult = await gcQueryAi(ctx, findEmailQuery)
    actualEmails = findResult.rows?.map((r: any) => r.user_email) || []
  } catch (e) {
    // Ignore
  }
  
  const escapedEmail = String(email).trim().replace(/'/g, "''")
  
  const tests = {
    email: email,
    escapedEmail: escapedEmail,
    actualEmails: actualEmails,
    results: {} as any
  }
  
  // Тест 0: Проверим все найденные email
  if (actualEmails.length > 0) {
    tests.results.foundEmails = {
      success: true,
      emails: actualEmails,
      count: actualEmails.length
    }
    
    // Попробуем запросы для каждого найденного email
    for (const actualEmail of actualEmails) {
      const actualEscaped = actualEmail.replace(/'/g, "''")
      const testQuery = `
        SELECT COUNT(*) as total
        FROM chatium_ai.access_log
        WHERE user_email = '${actualEscaped}'
      `
      
      try {
        const testResult = await gcQueryAi(ctx, testQuery)
        const count = Number(testResult.rows?.[0]?.total) || 0
        
        if (!tests.results.byActualEmail) {
          tests.results.byActualEmail = {}
        }
        
        tests.results.byActualEmail[actualEmail] = {
          success: true,
          count: count,
          query: `user_email = '${actualEscaped}'`
        }
      } catch (e: any) {
        if (!tests.results.byActualEmail) {
          tests.results.byActualEmail = {}
        }
        tests.results.byActualEmail[actualEmail] = {
          success: false,
          error: e.message
        }
      }
    }
  }

  try {
    // Тест 1: Простой запрос без lowerUTF8
    const query1 = `
      SELECT 
        ts,
        urlPath,
        user_email,
        user_first_name,
        user_last_name
      FROM chatium_ai.access_log
      WHERE user_email = '${escapedEmail}'
      ORDER BY ts DESC
      LIMIT 10
    `
    
    try {
      const result1 = await gcQueryAi(ctx, query1)
      tests.results.simpleQuery = {
        success: true,
        rowsCount: result1.rows?.length || 0,
        rows: result1.rows || []
      }
    } catch (e: any) {
      tests.results.simpleQuery = {
        success: false,
        error: e.message
      }
    }

    // Тест 2: Запрос с lowerUTF8
    const query2 = `
      SELECT 
        ts,
        urlPath,
        user_email,
        user_first_name,
        user_last_name
      FROM chatium_ai.access_log
      WHERE lowerUTF8(user_email) = lowerUTF8('${escapedEmail}')
      ORDER BY ts DESC
      LIMIT 10
    `
    
    try {
      const result2 = await gcQueryAi(ctx, query2)
      tests.results.lowerUTF8Query = {
        success: true,
        rowsCount: result2.rows?.length || 0,
        rows: result2.rows || []
      }
    } catch (e: any) {
      tests.results.lowerUTF8Query = {
        success: false,
        error: e.message
      }
    }

    // Тест 3: Запрос с проверкой на NULL
    const query3 = `
      SELECT 
        ts,
        urlPath,
        user_email,
        user_first_name,
        user_last_name
      FROM chatium_ai.access_log
      WHERE user_email IS NOT NULL
        AND user_email != ''
        AND lowerUTF8(user_email) = lowerUTF8('${escapedEmail}')
      ORDER BY ts DESC
      LIMIT 10
    `
    
    try {
      const result3 = await gcQueryAi(ctx, query3)
      tests.results.withNullCheck = {
        success: true,
        rowsCount: result3.rows?.length || 0,
        rows: result3.rows || []
      }
    } catch (e: any) {
      tests.results.withNullCheck = {
        success: false,
        error: e.message
      }
    }

    // Тест 4: Посмотрим все уникальные email, содержащие "gurovairina"
    const query4 = `
      SELECT DISTINCT user_email
      FROM chatium_ai.access_log
      WHERE user_email LIKE '%gurovairina%'
      ORDER BY user_email
      LIMIT 20
    `
    
    try {
      const result4 = await gcQueryAi(ctx, query4)
      tests.results.similarEmails = {
        success: true,
        rowsCount: result4.rows?.length || 0,
        emails: result4.rows?.map((r: any) => r.user_email) || []
      }
    } catch (e: any) {
      tests.results.similarEmails = {
        success: false,
        error: e.message
      }
    }

    // Тест 5: Посмотрим все события для этого email без ограничений
    const query5 = `
      SELECT 
        ts,
        urlPath,
        user_email,
        user_first_name,
        user_last_name,
        length(user_email) as email_length,
        hex(user_email) as email_hex
      FROM chatium_ai.access_log
      WHERE user_email LIKE '%gurovairina%'
      ORDER BY ts DESC
      LIMIT 20
    `
    
    try {
      const result5 = await gcQueryAi(ctx, query5)
      tests.results.allSimilar = {
        success: true,
        rowsCount: result5.rows?.length || 0,
        rows: result5.rows || []
      }
    } catch (e: any) {
      tests.results.allSimilar = {
        success: false,
        error: e.message
      }
    }

    // Тест 6: COUNT для этого email
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chatium_ai.access_log
      WHERE user_email IS NOT NULL
        AND user_email != ''
        AND lowerUTF8(user_email) = lowerUTF8('${escapedEmail}')
    `
    
    try {
      const countResult = await gcQueryAi(ctx, countQuery)
      tests.results.count = {
        success: true,
        total: Number(countResult.rows?.[0]?.total) || 0
      }
    } catch (e: any) {
      tests.results.count = {
        success: false,
        error: e.message
      }
    }

    // Тест 7: Проверим точное совпадение с разными вариантами
    const queries = [
      { name: 'exact', query: `user_email = '${escapedEmail}'` },
      { name: 'lowerUTF8', query: `lowerUTF8(user_email) = lowerUTF8('${escapedEmail}')` },
      { name: 'like', query: `user_email LIKE '${escapedEmail}'` },
      { name: 'likeLower', query: `lowerUTF8(user_email) LIKE lowerUTF8('${escapedEmail}')` }
    ]

    tests.results.variants = {}
    for (const variant of queries) {
      const testQuery = `
        SELECT COUNT(*) as total
        FROM chatium_ai.access_log
        WHERE user_email IS NOT NULL
          AND user_email != ''
          AND ${variant.query}
      `
      
      try {
        const variantResult = await gcQueryAi(ctx, testQuery)
        tests.results.variants[variant.name] = {
          success: true,
          total: Number(variantResult.rows?.[0]?.total) || 0,
          condition: variant.query
        }
      } catch (e: any) {
        tests.results.variants[variant.name] = {
          success: false,
          error: e.message,
          condition: variant.query
        }
      }
    }

    // Тест 8: Проверим основной API эндпоинт
    try {
      const mainApiResult = await apiGetUserEventsRoute.run(ctx, {
        email: email,
        limit: 100,
        offset: 0
      } as any)
      
      tests.results.mainApiTest = {
        success: mainApiResult.success,
        eventsCount: mainApiResult.events?.length || 0,
        totalCount: mainApiResult.totalCount || 0,
        error: mainApiResult.error || null
      }
    } catch (e: any) {
      tests.results.mainApiTest = {
        success: false,
        error: e.message
      }
    }

    // Тест 9: Проверим запрос БЕЗ LIMIT для реального email
    if (actualEmails.length > 0) {
      const realEmail = actualEmails[0]
      const realEscaped = realEmail.replace(/'/g, "''")
      
      const noLimitQuery = `
        SELECT 
          ts,
          urlPath,
          user_email
        FROM chatium_ai.access_log
        WHERE user_email = '${realEscaped}'
        ORDER BY ts DESC
      `
      
      try {
        const noLimitResult = await gcQueryAi(ctx, noLimitQuery)
        tests.results.noLimitQuery = {
          success: true,
          rowsCount: noLimitResult.rows?.length || 0,
          email: realEmail
        }
      } catch (e: any) {
        tests.results.noLimitQuery = {
          success: false,
          error: e.message
        }
      }
    }

    return {
      success: true,
      tests
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      tests
    }
  }
})

/**
 * Автоматический тест для проверки работы API событий пользователя
 * Этот эндпоинт проверяет, правильно ли работает apiGetUserEventsRoute
 */
export const apiTestUserEventsWorkingRoute = app.get('/test-working', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const { email = 'gurovairina@inbox.ru' } = req.query
  
  const results = {
    email: email,
    tests: [] as any[],
    conclusion: null as any
  }

  try {
    // Тест 1: Найдем реальный email в базе
    results.tests.push({ test: 1, name: 'Find actual email in database' })
    
    const findEmailQuery = `
      SELECT DISTINCT user_email
      FROM chatium_ai.access_log
      WHERE user_email LIKE '%gurovairina%'
      LIMIT 1
    `
    
    const findResult = await gcQueryAi(ctx, findEmailQuery)
    const actualEmails = findResult.rows?.map((r: any) => r.user_email) || []
    
    if (actualEmails.length === 0) {
      return {
        success: false,
        error: 'Email not found in database',
        results
      }
    }
    
    const realEmail = actualEmails[0]
    results.tests.push({ 
      test: 2, 
      name: 'Email found', 
      providedEmail: email,
      actualEmail: realEmail,
      match: email.toLowerCase() === realEmail.toLowerCase()
    })

    // Тест 2: Посчитаем реальное количество событий
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chatium_ai.access_log
      WHERE user_email = '${realEmail.replace(/'/g, "''")}'
    `
    
    const countResult = await gcQueryAi(ctx, countQuery)
    const realTotalCount = Number(countResult.rows?.[0]?.total) || 0
    
    results.tests.push({ 
      test: 3, 
      name: 'Real events count', 
      count: realTotalCount
    })

    // Тест 3: Вызовем API эндпоинт
    results.tests.push({ test: 4, name: 'Call API endpoint' })
    
    const apiResult = await apiGetUserEventsRoute.run(ctx, {
      email: email,
      limit: 100,
      offset: 0
    } as any)
    
    results.tests.push({ 
      test: 5, 
      name: 'API result', 
      success: apiResult.success,
      apiEventsCount: apiResult.events?.length || 0,
      apiTotalCount: apiResult.totalCount || 0,
      realTotalCount: realTotalCount
    })

    // Тест 4: Сравним результаты
    const apiEventsCount = apiResult.events?.length || 0
    const apiTotalCount = apiResult.totalCount || 0
    
    const isWorking = apiEventsCount === realTotalCount && apiTotalCount === realTotalCount
    
    results.tests.push({ 
      test: 6, 
      name: 'Comparison', 
      isWorking: isWorking,
      apiEventsCount,
      realTotalCount,
      difference: realTotalCount - apiEventsCount
    })

    // Вывод
    if (isWorking) {
      results.conclusion = {
        status: 'SUCCESS',
        message: `API is working correctly. Returns ${apiEventsCount} events as expected.`
      }
    } else {
      results.conclusion = {
        status: 'FAILED',
        message: `API returns ${apiEventsCount} events, but database has ${realTotalCount} events. Difference: ${realTotalCount - apiEventsCount}`,
        providedEmail: email,
        actualEmail: realEmail
      }
    }

    return {
      success: true,
      results,
      isWorking
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      results
    }
  }
})

/**
 * Автоматический тест и исправление проблемы с событиями пользователя
 */
export const apiAutoFixUserEventsRoute = app.get('/auto-fix-user-events', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const { email = 'gurovairina@inbox.ru' } = req.query
  
  const results = {
    email: email,
    steps: [] as any[],
    solution: null as any
  }

  try {
    // Шаг 1: Найдем реальный email в базе
    results.steps.push({ step: 1, action: 'Finding actual email in database' })
    
    const findEmailQuery = `
      SELECT DISTINCT user_email
      FROM chatium_ai.access_log
      WHERE user_email LIKE '%gurovairina%'
      LIMIT 5
    `
    
    const findResult = await gcQueryAi(ctx, findEmailQuery)
    const actualEmails = findResult.rows?.map((r: any) => r.user_email) || []
    
    if (actualEmails.length === 0) {
      return {
        success: false,
        error: 'Email not found in database',
        results
      }
    }
    
    const realEmail = actualEmails[0]
    results.steps.push({ 
      step: 2, 
      action: 'Found emails', 
      emails: actualEmails,
      using: realEmail
    })

    // Шаг 2: Проверим количество событий для реального email
    const countQuery = `
      SELECT COUNT(*) as total
      FROM chatium_ai.access_log
      WHERE user_email = '${realEmail.replace(/'/g, "''")}'
    `
    
    const countResult = await gcQueryAi(ctx, countQuery)
    const totalCount = Number(countResult.rows?.[0]?.total) || 0
    
    results.steps.push({ 
      step: 3, 
      action: 'Counted events', 
      totalCount: totalCount 
    })

    // Шаг 3: Получим все события для реального email
    const allEventsQuery = `
      SELECT 
        ts,
        dt,
        urlPath,
        action_param1,
        action_param2,
        action_param3,
        action_param1_float,
        action_param1_int,
        user_id,
        user_email,
        user_first_name,
        user_last_name,
        title,
        action_params
      FROM chatium_ai.access_log
      WHERE user_email = '${realEmail.replace(/'/g, "''")}'
      ORDER BY ts DESC
      LIMIT 100
    `
    
    const eventsResult = await gcQueryAi(ctx, allEventsQuery)
    const events = eventsResult.rows || []
    
    results.steps.push({ 
      step: 4, 
      action: 'Retrieved events', 
      eventsCount: events.length 
    })

    // Шаг 4: Проверим текущий API эндпоинт
    const currentApiResult = await apiGetUserEventsRoute.run(ctx, {
      email: email,
      limit: 100,
      offset: 0
    })
    
    results.steps.push({ 
      step: 5, 
      action: 'Tested current API', 
      currentEventsCount: currentApiResult.events?.length || 0,
      expectedCount: totalCount
    })

    // Шаг 5: Определим решение
    if (currentApiResult.events?.length !== totalCount || currentApiResult.events?.length !== events.length) {
      results.solution = {
        problem: 'Email mismatch or query issue',
        actualEmail: realEmail,
        providedEmail: email,
        fix: 'Use LIKE query or exact match with actual email',
        workingQuery: allEventsQuery
      }
      
      results.steps.push({ 
        step: 6, 
        action: 'Solution found', 
        solution: results.solution 
      })
    } else {
      results.solution = {
        status: 'API is working correctly',
        eventsCount: currentApiResult.events?.length
      }
    }

    return {
      success: true,
      results,
      events: events,
      totalCount: totalCount
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      results
    }
  }
})

