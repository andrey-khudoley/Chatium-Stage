import { requireAccountRole } from '@app/auth'
import { gcQueryAi } from '@gc-mcp-server/sdk'

// @shared-route
export const apiRecentVisitsRoute = app.get('/recent-visits', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo, url } = req.query
 
  let whereClause = `
    startsWith(urlPath, 'https')
    AND dt BETWEEN '${dateFrom || '2024-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `
  
  if (url && url.trim()) {
    whereClause += ` AND (url ILIKE '%${url.trim()}%' OR urlPath ILIKE '%${url.trim()}%')`
  }

  const query = `
    SELECT 
      ts,
      url,
      urlPath,
      COALESCE(user_first_name, '') || ' ' || COALESCE(user_last_name, '') as user_name,
      user_type,
      COALESCE(ua_device_type, '') || ' ' || COALESCE(ua_device_brand, '') || ' ' || COALESCE(ua_os_name, '') as device_info,
      COALESCE(location_city, '') || ' ' || COALESCE(location_country, '') as location,
      uid || '-' || toString(ts) as id
    FROM 
      chatium_ai.access_log
    WHERE
      ${whereClause}
    ORDER BY 
      ts DESC
    LIMIT 50
  `
  
  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiDailyStatsRoute = app.get('/daily-stats', async (ctx, req) => {
  const { dateFrom, dateTo, url } = req.query
  
  let whereClause = `
    startsWith(urlPath, 'https')
    AND dt BETWEEN '${dateFrom || '2024-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `
  
  if (url && url.trim()) {
    whereClause += ` AND (url ILIKE '%${url.trim()}%' OR urlPath ILIKE '%${url.trim()}%')`
  }

  const query = `
    SELECT 
      toDate(dt) as date,
      COUNT() as visits_count,
      uniq(resolved_user_id) as users_count,
      uniq(uid) as sessions_count
    FROM 
      chatium_ai.access_log
    WHERE
      ${whereClause}
    GROUP BY 
      date
    ORDER BY 
      date DESC
  `
  
  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiPopularPagesRoute = app.get('/popular-pages', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo, url } = req.query
  
  let whereClause = `
    startsWith(urlPath, 'https')
    AND dt BETWEEN '${dateFrom || '2024-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `
  
  if (url && url.trim()) {
    whereClause += ` AND (url ILIKE '%${url.trim()}%' OR urlPath ILIKE '%${url.trim()}%')`
  }

  const query = `
    WITH total_visits AS (
      SELECT COUNT() as total_count
      FROM chatium_ai.access_log
      WHERE ${whereClause}
    )
    SELECT 
      url,
      COUNT() as visits_count,
      uniq(resolved_user_id) as users_count,
      ROUND((COUNT() * 100.0) / (SELECT total_count FROM total_visits), 2) as percentage
    FROM 
      chatium_ai.access_log
    WHERE
      ${whereClause}
    GROUP BY 
      url
    ORDER BY 
      visits_count DESC
    LIMIT 20
  `
  
  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiLandingPagesRoute = app.get('/landing-pages', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo, url } = req.query
  
  let whereClause = `
    startsWith(urlPath, 'https')
    AND dt BETWEEN '${dateFrom || '2024-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `
  
  if (url && url.trim()) {
    whereClause += ` AND (url ILIKE '%${url.trim()}%' OR urlPath ILIKE '%${url.trim()}%')`
  }

  const query = `
    WITH landing_sessions AS (
      SELECT 
        uid,
        url,
        ts,
        ROW_NUMBER() OVER (PARTITION BY uid ORDER BY ts ASC) as visit_rank
      FROM chatium_ai.access_log
      WHERE ${whereClause}
    ),
    session_behavior AS (
      SELECT 
        l.url,
        l.uid,
        COUNT(*) OVER (PARTITION BY l.uid) as session_pages,
        MIN(b.view_total_duration) as avg_duration
      FROM landing_sessions l
      LEFT JOIN chatium_ai.behaviour2_log b ON b.uid = l.uid AND b.url = l.url
      WHERE l.visit_rank = 1
    )
    SELECT 
      url,
      COUNT(*) as new_sessions,
      ROUND(AVG(CASE WHEN session_pages = 1 THEN 100.0 ELSE 0.0 END), 2) as bounce_rate,
      AVG(COALESCE(avg_duration, 0)) as avg_duration
    FROM session_behavior
    GROUP BY url
    ORDER BY new_sessions DESC
    LIMIT 20
  `
  
  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiEntryPagesRoute = app.post('/entry-pages', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo, urlFilter } = req.body;
  
  let whereClause = "startsWith(urlPath, 'https')";
  
  if (dateFrom && dateTo) {
    whereClause += ` AND dt BETWEEN '${dateFrom}' AND '${dateTo}'`;
  }
  
  if (urlFilter) {
    whereClause += ` AND urlPath LIKE '%${urlFilter}%'`;
  }

  const query = `
    SELECT 
      urlPath as url,
      COUNT() as entry_count,
      uniq(resolved_user_id) as unique_visitors
    FROM (
      SELECT 
        urlPath,
        resolved_user_id,
        uid,
        ROW_NUMBER() OVER (PARTITION BY uid ORDER BY ts64 ASC) as rn
      FROM chatium_ai.access_log
      WHERE ${whereClause}
    ) t
    WHERE rn = 1
    GROUP BY urlPath
    ORDER BY entry_count DESC
    LIMIT 50
  `;
  return await gcQueryAi(ctx, query);
});