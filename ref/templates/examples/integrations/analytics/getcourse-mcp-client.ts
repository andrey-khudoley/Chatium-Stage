// @shared
/**
 * Пример работы с GetCourse MCP Client (настраиваемый аккаунт)
 * Этот подход рекомендуется для SaaS приложений, где каждый пользователь
 * работает со своим GetCourse аккаунтом
 */

import { gcQueryAi, integrationIsEnabled } from '@gc-mcp-server/sdk'
import { installSupportedApp } from '@store/sdk'
import { requireAccountRole } from '@app/auth'

// ============== УСТАНОВКА И НАСТРОЙКА ==============

/**
 * POST /api/install-plugin
 * Устанавливает GetCourse MCP Server плагин
 * После установки пользователь вводит адрес сервера и API ключ своего GetCourse
 */
export const installPluginRoute = app.post('/install-plugin', async (ctx, req) => {
  try {
    const result = await installSupportedApp(ctx, 'gc-mcp-server')
    return { success: true, result }
  } catch (error: any) {
    ctx.account.log('Plugin installation failed', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: error.message }
  }
})

/**
 * GET /api/check-integration
 * Проверяет, настроен ли GetCourse MCP Client
 */
export const checkIntegrationRoute = app.get('/check-integration', async (ctx, req) => {
  const isConfigured = await integrationIsEnabled(ctx)
  
  return {
    success: true,
    isConfigured,
    message: isConfigured 
      ? 'GetCourse MCP Client настроен' 
      : 'Требуется настройка GetCourse MCP Client'
  }
})

// ============== GETCOURSE АНАЛИТИКА ==============

/**
 * GET /api/getcourse/orders
 * Получает заказы из GetCourse (из настроенного пользователем аккаунта)
 * Query: dateFrom, dateTo, limit, offset
 */
export const apiGetCourseOrdersRoute = app.query(s => ({
  dateFrom: s.string().optional(),
  dateTo: s.string().optional(),
  limit: s.number().default(100),
  offset: s.number().default(0)
})).get('/orders', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { dateFrom, dateTo, limit, offset } = req.query
  
  try {
    const query = `
      SELECT 
        action_param1 as deal_id,
        action_param3_int as order_number,
        action_param1_float as amount,
        action_param2 as currency,
        action_param3 as status,
        title as offer_name,
        user_email,
        user_first_name,
        user_last_name,
        dt as created_date,
        ts as created_time
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated'
        ${dateFrom ? `AND dt >= '${dateFrom}'` : ''}
        ${dateTo ? `AND dt <= '${dateTo}'` : ''}
      ORDER BY ts DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    
    const result = await gcQueryAi(ctx, query)
    
    return {
      success: true,
      orders: result.rows || [],
      total: result.rows?.length || 0
    }
  } catch (error: any) {
    ctx.account.log('GetCourse orders query failed', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: error.message, orders: [], total: 0 }
  }
})

/**
 * GET /api/getcourse/orders-stats
 * Получает статистику заказов с конверсией
 * Query: dateFrom, dateTo
 */
export const apiGetCourseOrdersStatsRoute = app.query(s => ({
  dateFrom: s.string().optional(),
  dateTo: s.string().optional()
})).get('/orders-stats', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { dateFrom, dateTo } = req.query
  
  try {
    const query = `
      WITH created_deals AS (
        SELECT 
          COUNT(DISTINCT action_param1) as count,
          SUM(action_param1_float) as amount
        FROM chatium_ai.access_log
        WHERE urlPath = 'event://getcourse/dealCreated'
          ${dateFrom ? `AND dt >= '${dateFrom}'` : ''}
          ${dateTo ? `AND dt <= '${dateTo}'` : ''}
      ),
      paid_deals AS (
        SELECT 
          COUNT(DISTINCT action_param1) as count,
          SUM(action_param2_float) as amount
        FROM chatium_ai.access_log
        WHERE urlPath = 'event://getcourse/dealPaid'
          ${dateFrom ? `AND dt >= '${dateFrom}'` : ''}
          ${dateTo ? `AND dt <= '${dateTo}'` : ''}
      )
      SELECT 
        c.count as total_orders,
        c.amount as total_amount,
        p.count as paid_orders,
        p.amount as paid_amount,
        ROUND((p.count * 100.0 / GREATEST(c.count, 1)), 2) as conversion
      FROM created_deals c, paid_deals p
    `
    
    const result = await gcQueryAi(ctx, query)
    const stats = result.rows?.[0]
    
    return {
      success: true,
      stats: {
        totalOrders: stats?.total_orders || 0,
        totalAmount: stats?.total_amount || 0,
        paidOrders: stats?.paid_orders || 0,
        paidAmount: stats?.paid_amount || 0,
        conversion: stats?.conversion || 0
      }
    }
  } catch (error: any) {
    ctx.account.log('GetCourse orders stats query failed', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: error.message }
  }
})

/**
 * GET /api/getcourse/users
 * Получает регистрации пользователей по дням
 * Query: dateFrom, dateTo
 */
export const apiGetCourseUsersRoute = app.query(s => ({
  dateFrom: s.string().optional(),
  dateTo: s.string().optional()
})).get('/users', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { dateFrom, dateTo } = req.query
  
  try {
    const query = `
      SELECT 
        dt as registration_date,
        COUNT(DISTINCT COALESCE(resolved_user_id, user_id)) as new_users
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/created'
        ${dateFrom ? `AND dt >= '${dateFrom}'` : ''}
        ${dateTo ? `AND dt <= '${dateTo}'` : ''}
      GROUP BY dt
      ORDER BY dt DESC
    `
    
    const result = await gcQueryAi(ctx, query)
    
    return {
      success: true,
      users: result.rows || []
    }
  } catch (error: any) {
    ctx.account.log('GetCourse users query failed', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: error.message, users: [] }
  }
})

/**
 * GET /api/getcourse/telegram-users
 * Получает статистику подключения Telegram
 */
export const apiGetCourseTelegramUsersRoute = app.get('/telegram-users', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  try {
    const query = `
      WITH all_users AS (
        SELECT DISTINCT COALESCE(resolved_user_id, user_id) as user_id
        FROM chatium_ai.access_log
        WHERE urlPath = 'event://getcourse/user/created'
      ),
      telegram_enabled AS (
        SELECT DISTINCT COALESCE(resolved_user_id, user_id) as user_id
        FROM chatium_ai.access_log
        WHERE urlPath = 'event://getcourse/user/chatbot/telegram_enabled'
      ),
      telegram_disabled AS (
        SELECT DISTINCT COALESCE(resolved_user_id, user_id) as user_id
        FROM chatium_ai.access_log
        WHERE urlPath = 'event://getcourse/user/chatbot/telegram_disabled'
      )
      SELECT 
        COUNT(DISTINCT au.user_id) as total_users,
        COUNT(DISTINCT te.user_id) as telegram_connected,
        COUNT(DISTINCT td.user_id) as telegram_disconnected,
        COUNT(DISTINCT te.user_id) - COUNT(DISTINCT td.user_id) as active_telegram
      FROM all_users au
      LEFT JOIN telegram_enabled te ON au.user_id = te.user_id
      LEFT JOIN telegram_disabled td ON au.user_id = td.user_id
    `
    
    const result = await gcQueryAi(ctx, query)
    const stats = result.rows?.[0]
    
    return {
      success: true,
      stats: {
        totalUsers: stats?.total_users || 0,
        telegramConnected: stats?.telegram_connected || 0,
        telegramDisconnected: stats?.telegram_disconnected || 0,
        activeTelegram: stats?.active_telegram || 0
      }
    }
  } catch (error: any) {
    ctx.account.log('GetCourse telegram users query failed', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: error.message }
  }
})

// ============== TRAFFIC АНАЛИТИКА ==============

/**
 * GET /api/traffic/pageviews
 * Получает статистику просмотров страниц (из настроенного аккаунта)
 * Query: dateFrom, dateTo
 */
export const apiTrafficPageviewsRoute = app.query(s => ({
  dateFrom: s.string().optional(),
  dateTo: s.string().optional()
})).get('/pageviews', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { dateFrom, dateTo } = req.query
  
  try {
    const query = `
      SELECT 
        COUNT(*) as total_pageviews,
        COUNT(DISTINCT uid) as unique_visitors,
        COUNT(DISTINCT session_id) as sessions
      FROM chatium_ai.access_log
      WHERE action = 'pageview'
        AND NOT startsWith(urlPath, 'event://getcourse/')
        ${dateFrom ? `AND dt >= '${dateFrom}'` : `AND dt >= today() - 7`}
        ${dateTo ? `AND dt <= '${dateTo}'` : ''}
    `
    
    const result = await gcQueryAi(ctx, query)
    const stats = result.rows?.[0]
    
    return {
      success: true,
      stats: {
        totalPageviews: stats?.total_pageviews || 0,
        uniqueVisitors: stats?.unique_visitors || 0,
        sessions: stats?.sessions || 0
      }
    }
  } catch (error: any) {
    ctx.account.log('Traffic pageviews query failed', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: error.message }
  }
})

/**
 * GET /api/traffic/popular-pages
 * Получает топ популярных страниц
 * Query: limit
 */
export const apiTrafficPopularPagesRoute = app.query(s => ({
  limit: s.number().default(10)
})).get('/popular-pages', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { limit } = req.query
  
  try {
    const query = `
      SELECT 
        urlPath as page_url,
        title as page_title,
        COUNT(*) as views,
        COUNT(DISTINCT uid) as unique_visitors
      FROM chatium_ai.access_log
      WHERE action = 'pageview'
        AND startsWith(urlPath, 'https')
        AND dt >= today() - 30
      GROUP BY urlPath, title
      ORDER BY views DESC
      LIMIT ${limit}
    `
    
    const result = await gcQueryAi(ctx, query)
    
    return {
      success: true,
      pages: result.rows || []
    }
  } catch (error: any) {
    return { success: false, error: error.message, pages: [] }
  }
})

