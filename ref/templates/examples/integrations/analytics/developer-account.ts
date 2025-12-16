// @shared
/**
 * Пример работы с аккаунтом разработчика (queryAi)
 * Этот подход подходит для внутренних инструментов компании,
 * где все пользователи работают с одним GetCourse аккаунтом
 */

import { queryAi } from '@traffic/sdk'
import { requireAccountRole } from '@app/auth'

// ============== GETCOURSE АНАЛИТИКА (Аккаунт разработчика) ==============

/**
 * GET /api/dev-account/orders
 * Получает заказы из аккаунта разработчика
 * Все пользователи видят данные одного аккаунта
 * Query: dateFrom, dateTo, limit
 */
export const apiDevAccountOrdersRoute = app.query(s => ({
  dateFrom: s.string().optional(),
  dateTo: s.string().optional(),
  limit: s.number().default(100)
})).get('/orders', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { dateFrom, dateTo, limit } = req.query
  
  try {
    const query = `
      SELECT 
        action_param1 as deal_id,
        action_param1_float as amount,
        action_param3 as status,
        title as offer_name,
        user_email,
        dt as created_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated'
        ${dateFrom ? `AND dt >= '${dateFrom}'` : ''}
        ${dateTo ? `AND dt <= '${dateTo}'` : ''}
      ORDER BY dt DESC
      LIMIT ${limit}
    `
    
    // Данные из аккаунта разработчика
    const result = await queryAi(ctx, query)
    
    return {
      success: true,
      orders: result.rows || [],
      note: 'Данные из аккаунта разработчика'
    }
  } catch (error: any) {
    return { success: false, error: error.message, orders: [] }
  }
})

/**
 * GET /api/dev-account/orders-stats
 * Статистика заказов из аккаунта разработчика
 * Query: dateFrom, dateTo
 */
export const apiDevAccountOrdersStatsRoute = app.query(s => ({
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
    
    const result = await queryAi(ctx, query)
    const stats = result.rows?.[0]
    
    return {
      success: true,
      stats: {
        totalOrders: stats?.total_orders || 0,
        totalAmount: stats?.total_amount || 0,
        paidOrders: stats?.paid_orders || 0,
        paidAmount: stats?.paid_amount || 0,
        conversion: stats?.conversion || 0
      },
      note: 'Данные из аккаунта разработчика'
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

// ============== TRAFFIC АНАЛИТИКА (Аккаунт разработчика) ==============

/**
 * GET /api/dev-account/traffic-stats
 * Статистика трафика из аккаунта разработчика
 * Query: dateFrom, dateTo
 */
export const apiDevAccountTrafficStatsRoute = app.query(s => ({
  dateFrom: s.string().optional(),
  dateTo: s.string().optional()
})).get('/traffic-stats', async (ctx, req) => {
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
    
    const result = await queryAi(ctx, query)
    const stats = result.rows?.[0]
    
    return {
      success: true,
      stats: {
        totalPageviews: stats?.total_pageviews || 0,
        uniqueVisitors: stats?.unique_visitors || 0,
        sessions: stats?.sessions || 0
      },
      note: 'Данные из аккаунта разработчика'
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})

/**
 * GET /api/dev-account/popular-pages
 * Топ популярных страниц из аккаунта разработчика
 * Query: limit
 */
export const apiDevAccountPopularPagesRoute = app.query(s => ({
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
    
    const result = await queryAi(ctx, query)
    
    return {
      success: true,
      pages: result.rows || [],
      note: 'Данные из аккаунта разработчика'
    }
  } catch (error: any) {
    return { success: false, error: error.message, pages: [] }
  }
})

