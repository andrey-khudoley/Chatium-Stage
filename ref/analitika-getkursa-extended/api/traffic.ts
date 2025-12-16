import { requireAccountRole } from '@app/auth'
import { gcQueryAi } from '@gc-mcp-server/sdk'

// @shared-route
export const apiChannelSubscribersRoute = app.get('/channel-subscribers', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo } = req.query

  // Count unique users who were added to group 3466714 (channel subscribers)
  const query = `
    SELECT count(DISTINCT user_id) as channel_subscribers
    FROM chatium_ai.access_log
    WHERE
      urlPath = 'event://getcourse/user/group_added'
      AND action_param1 = '3466714'
      AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `

  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiOrderDetailsRoute = app.get('/order-details', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo, statuses } = req.query

  let dateFilter = `
    AND c.creation_date BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `

  let statusFilter = ''
  if (statuses && statuses.trim()) {
    const statusList = statuses.split(',').map(s => `'${s.trim()}'`).join(',')
    statusFilter = ` AND (current_status IN (${statusList}) OR (current_status = '' AND 'new' IN (${statusList})))`
  }

  const query = `
    WITH latest_order_statuses AS (
      SELECT 
        action_param1 as deal_id,
        action_param3 as status,
        dt as status_change_date,
        ROW_NUMBER() OVER (PARTITION BY action_param1 ORDER BY ts DESC) as rn
      FROM chatium_ai.access_log 
      WHERE urlPath = 'event://getcourse/dealStatusChanged'
    ),
    order_creations AS (
      SELECT 
        action_param1 as deal_id,
        argMin(action_param3, ts) as initial_status,
        min(dt) as creation_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated'
      GROUP BY action_param1
    ),
    order_amounts AS (
      SELECT 
        action_param1 as deal_id,
        argMax(action_param1_float, ts64) as order_amount
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealMoneyValuesChanged'
      GROUP BY action_param1
    ),
    all_orders AS (
      SELECT DISTINCT action_param1 as deal_id
      FROM chatium_ai.access_log
      WHERE urlPath IN ('event://getcourse/dealCreated', 'event://getcourse/dealStatusChanged', 'event://getcourse/dealPaid', 'event://getcourse/dealMoneyValuesChanged')
      AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
    ),
    paid_orders AS (
      SELECT 
        action_param1 as deal_id,
        'payed' as paid_status, 
        max(dt) as payment_date,
        sum(CAST(COALESCE(action_param2_float, 0), 'Float64')) as total_paid
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid' 
      GROUP BY action_param1
      HAVING sum(CAST(COALESCE(action_param2_float, 0), 'Float64')) > 0
    )
    SELECT 
      ao.deal_id as order_id,
      COALESCE(c.creation_date, s.status_change_date, paid.payment_date) as creation_date,
      CAST(COALESCE(amt.order_amount, 0), 'Float64') as order_amount,
      CASE 
        WHEN s.status IS NOT NULL AND s.status_change_date >= COALESCE(paid.payment_date, '1900-01-01') 
        THEN s.status
        WHEN paid.paid_status IS NOT NULL 
        THEN paid.paid_status 
        ELSE COALESCE(NULLIF(c.initial_status, ''), 'new')
      END as current_status,
      COALESCE(paid.total_paid, 0) as total_paid,
      COALESCE(paid.payment_date, '') as payment_date
    FROM 
      all_orders ao
    LEFT JOIN order_creations c ON c.deal_id = ao.deal_id  
    LEFT JOIN order_amounts amt ON amt.deal_id = ao.deal_id
    LEFT JOIN (SELECT deal_id, status, status_change_date FROM latest_order_statuses WHERE rn = 1) s ON s.deal_id = ao.deal_id
    LEFT JOIN paid_orders paid ON paid.deal_id = ao.deal_id
    WHERE 1=1
      ${statusFilter.replace(/current_status/g, `CASE 
        WHEN s.status IS NOT NULL AND s.status_change_date >= COALESCE(paid.payment_date, '1900-01-01') 
        THEN s.status
        WHEN paid.paid_status IS NOT NULL 
        THEN paid.paid_status 
        ELSE COALESCE(NULLIF(c.initial_status, ''), 'new')
      END`)}
    ORDER BY 
      COALESCE(c.creation_date, s.status_change_date, paid.payment_date) DESC
    LIMIT 1000
  `

  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiGroupAddedUsersRoute = app.get('/group-added-users', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo } = req.query

  // Count unique users who were added to group 4457204 and find their registration date
  const query = `
    SELECT count(DISTINCT reg.user_id) as group_added_users
    FROM (
      SELECT 
        user_id,
        min(dt) as first_registration_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/created'
      GROUP BY user_id
    ) reg
    INNER JOIN chatium_ai.access_log grp ON grp.user_id = reg.user_id
    WHERE
      grp.urlPath = 'event://getcourse/user/group_added'
      AND grp.action_param1 = '4457204'
      AND reg.first_registration_date BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `

  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiRecentVisitsRoute = app.get('/recent-visits', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo, url } = req.query
 
  let whereClause = `
    startsWith(urlPath, 'https')
    AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
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
export const apiTelegramConnectedUsersRoute = app.get('/telegram-connected-users', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo } = req.query

  // Count unique users who connected Telegram and find their registration date
  const query = `
    SELECT count(DISTINCT reg.user_id) as telegram_connected_users
    FROM (
      SELECT 
        user_id,
        min(dt) as first_registration_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/created'
      GROUP BY user_id
    ) reg
    INNER JOIN chatium_ai.access_log tg ON tg.user_id = reg.user_id
    WHERE
      tg.urlPath = 'event://getcourse/user/chatbot/telegram_enabled'
      AND reg.first_registration_date BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `

  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiTelegramDisconnectedUsersRoute = app.get('/telegram-disconnected-users', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo } = req.query

  // Count unique users who disconnected Telegram and find their registration date
  const query = `
    SELECT count(DISTINCT reg.user_id) as telegram_disconnected_users
    FROM (
      SELECT 
        user_id,
        min(dt) as first_registration_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/created'
      GROUP BY user_id
    ) reg
    INNER JOIN chatium_ai.access_log tg ON tg.user_id = reg.user_id
    WHERE
      tg.urlPath = 'event://getcourse/user/chatbot/telegram_disabled'
      AND reg.first_registration_date BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `

  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiTotalUsersRoute = app.get('/total-users', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo } = req.query

  let dateFilter = `
    AND first_registration_date BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'`
  // Count only unique users (first registration for each user)
  const query = `
    WITH first_registrations AS (
      SELECT 
        user_id,
        min(dt) as first_registration_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/created'
      GROUP BY user_id
    )
    SELECT 
      count(*) as total_users
    FROM 
      first_registrations
    WHERE 1=1 ${dateFilter}
  `

  return await gcQueryAi(ctx, query)
})

// @shared-route  
export const apiOrdersSummaryRoute = app.get('/orders-summary', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo, statuses } = req.query

  let dateFilter = `
    AND c.creation_date BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `

  let statusFilter = ''
  if (statuses && statuses.trim()) {
    const statusList = statuses.split(',').map(s => `'${s.trim()}'`).join(',')
    statusFilter = ` AND (current_status IN (${statusList}) OR (current_status = '' AND 'new' IN (${statusList})))`
  }

  const query = `
    WITH latest_order_statuses AS (
      SELECT 
        action_param1 as deal_id,
        action_param3 as status,
        dt as status_change_date,
        ROW_NUMBER() OVER (PARTITION BY action_param1 ORDER BY ts DESC) as rn
      FROM chatium_ai.access_log 
      WHERE urlPath = 'event://getcourse/dealStatusChanged'
    ),
    order_creations AS (
      SELECT 
        action_param1 as deal_id,
        argMin(action_param3, ts) as initial_status,
        min(dt) as creation_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated'
      GROUP BY action_param1
    ),
    order_amounts AS (
      SELECT 
        action_param1 as deal_id,
        argMax(action_param1_float, ts64) as order_amount
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealMoneyValuesChanged'
      GROUP BY action_param1
    ),
    all_orders AS (
      SELECT DISTINCT action_param1 as deal_id
      FROM chatium_ai.access_log
      WHERE urlPath IN ('event://getcourse/dealCreated', 'event://getcourse/dealStatusChanged', 'event://getcourse/dealPaid', 'event://getcourse/dealMoneyValuesChanged')
      AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
    ),
    paid_orders AS (
      SELECT 
        action_param1 as deal_id,
        'payed' as paid_status, 
        max(dt) as payment_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid'
      GROUP BY action_param1
      HAVING sum(CAST(COALESCE(action_param2_float, 0), 'Float64')) > 0
    ),
    order_payments AS (
      SELECT 
        action_param1 as deal_id,
        sum(CAST(COALESCE(action_param2_float, 0), 'Float64')) as payment_amount
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid'
        AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
      GROUP BY action_param1
    )
    SELECT 
      COUNT() as total_orders,
      sum(CAST(COALESCE(amt.order_amount, 0), 'Float64')) as total_order_amount,
      COUNT(paid.deal_id) as total_payments,
      sum(COALESCE(p.payment_amount, 0)) as total_payment_amount,
      CASE 
        WHEN COUNT(paid.deal_id) > 0 
        THEN avg(CASE WHEN p.payment_amount > 0 THEN p.payment_amount ELSE NULL END)
        ELSE 0
      END as avg_payment_amount
    FROM 
      all_orders ao
    LEFT JOIN order_creations c ON c.deal_id = ao.deal_id
    LEFT JOIN order_amounts amt ON amt.deal_id = ao.deal_id
    LEFT JOIN (SELECT deal_id, status, status_change_date FROM latest_order_statuses WHERE rn = 1) s ON s.deal_id = ao.deal_id
    LEFT JOIN paid_orders paid ON paid.deal_id = ao.deal_id
    LEFT JOIN order_payments p ON p.deal_id = ao.deal_id
    WHERE
      COALESCE(c.creation_date, s.status_change_date, paid.payment_date) BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
      ${statusFilter.replace(/current_status/g, `CASE 
        WHEN s.status IS NOT NULL AND s.status_change_date >= COALESCE(paid.payment_date, '1900-01-01') 
        THEN s.status
        WHEN paid.paid_status IS NOT NULL 
        THEN paid.paid_status 
        ELSE COALESCE(NULLIF(c.initial_status, ''), 'new')
      END`)}
  `

  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiDailyStatsRoute = app.get('/daily-stats', async (ctx, req) => {
  const { dateFrom, dateTo, url } = req.query

  let whereClause = `
    startsWith(urlPath, 'https')
    AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
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
    AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
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
    AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
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
export const apiPaymentsByDateRoute = app.get('/payments-by-date', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo } = req.query

  let dateFilter = `
    AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `

  const query = `
    SELECT 
      dt as payment_date,
      sum(CAST(COALESCE(action_param2_float, 0), 'Float64')) as total_payment_amount
    FROM 
      chatium_ai.access_log
    WHERE
      urlPath = 'event://getcourse/dealPaid'
      ${dateFilter}
    GROUP BY 
      dt
    ORDER BY 
      dt ASC
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

// @shared-route
export const apiOrdersRoute = app.get('/orders', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo, statuses } = req.query

  let dateFilter = `
    AND c.creation_date BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `

  let statusFilter = ''
  if (statuses && statuses.trim()) {
    const statusList = statuses.split(',').map(s => `'${s.trim()}'`).join(',')
    statusFilter = ` AND (current_status IN (${statusList}) OR (current_status = '' AND 'new' IN (${statusList})))`
  }

  const query = `
    WITH latest_order_statuses AS (
      SELECT 
        action_param1 as deal_id,
        action_param3 as status,
        dt as status_change_date,
        ROW_NUMBER() OVER (PARTITION BY action_param1 ORDER BY ts DESC) as rn
      FROM chatium_ai.access_log 
      WHERE urlPath = 'event://getcourse/dealStatusChanged'
    ),
    order_creations AS (
      SELECT 
        action_param1 as deal_id,
        argMin(action_param3, ts) as initial_status,
        min(dt) as creation_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated'
      GROUP BY action_param1
    ),
    order_amounts AS (
      SELECT 
        action_param1 as deal_id,
        argMax(action_param1_float, ts64) as order_amount
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealMoneyValuesChanged'
      GROUP BY action_param1
    ),
    all_orders AS (
      SELECT DISTINCT action_param1 as deal_id
      FROM chatium_ai.access_log
      WHERE urlPath IN ('event://getcourse/dealCreated', 'event://getcourse/dealStatusChanged', 'event://getcourse/dealPaid', 'event://getcourse/dealMoneyValuesChanged')
      AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
    ),
    paid_orders AS (
      SELECT 
        action_param1 as deal_id,
        'payed' as paid_status, 
        max(dt) as payment_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid'
      GROUP BY action_param1
      HAVING sum(CAST(COALESCE(action_param2_float, 0), 'Float64')) > 0
    ),
    order_payments AS (
      SELECT 
        action_param1 as deal_id,
        sum(CAST(COALESCE(action_param2_float, 0), 'Float64')) as total_payment_amount
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid'
        AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
      GROUP BY action_param1
    )
    SELECT 
      COALESCE(c.creation_date, s.status_change_date, paid.payment_date) as order_date,
      toYear(COALESCE(c.creation_date, s.status_change_date, paid.payment_date)) as year,
      toMonth(COALESCE(c.creation_date, s.status_change_date, paid.payment_date)) as month,
      toDayOfMonth(COALESCE(c.creation_date, s.status_change_date, paid.payment_date)) as day,
      COUNT() as orders_count,
      sum(CAST(COALESCE(amt.order_amount, 0), 'Float64')) as total_amount,
      sum(COALESCE(p.total_payment_amount, 0)) as total_payment_amount,
      CASE 
        WHEN sum(COALESCE(p.total_payment_amount, 0)) > 0 
        THEN avg(CASE WHEN p.total_payment_amount > 0 THEN p.total_payment_amount ELSE NULL END)
        ELSE 0
      END as avg_payment_amount
    FROM 
      all_orders ao
    LEFT JOIN order_creations c ON c.deal_id = ao.deal_id
    LEFT JOIN order_amounts amt ON amt.deal_id = ao.deal_id
    LEFT JOIN (SELECT deal_id, status, status_change_date FROM latest_order_statuses WHERE rn = 1) s ON s.deal_id = ao.deal_id
    LEFT JOIN paid_orders paid ON paid.deal_id = ao.deal_id
    LEFT JOIN order_payments p ON p.deal_id = ao.deal_id
    WHERE
      COALESCE(c.creation_date, s.status_change_date, paid.payment_date) BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
      ${statusFilter.replace(/current_status/g, `CASE 
        WHEN s.status IS NOT NULL AND s.status_change_date >= COALESCE(paid.payment_date, '1900-01-01') 
        THEN s.status
        WHEN paid.paid_status IS NOT NULL 
        THEN paid.paid_status 
        ELSE COALESCE(NULLIF(c.initial_status, ''), 'new')
      END`)}
    GROUP BY 
      COALESCE(c.creation_date, s.status_change_date, paid.payment_date)
    ORDER BY 
      COALESCE(c.creation_date, s.status_change_date, paid.payment_date) DESC
  `

  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiUsersRegistrationRoute = app.get('/users-registration', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { dateFrom, dateTo } = req.query

  let dateFilter = `
    AND dt BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
  `

  // Count only first registration for each user by date
  const query = `
    WITH first_registrations AS (
      SELECT 
        user_id,
        min(dt) as first_registration_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/user/created'
      GROUP BY user_id
    )
    SELECT 
      first_registration_date as registration_date,
      count(*) as registrations_count
    FROM 
      first_registrations
    WHERE
      first_registration_date BETWEEN '${dateFrom || '1900-01-01'}' AND '${dateTo || new Date().toISOString().split('T')[0]}'
    GROUP BY 
      first_registration_date
    ORDER BY 
      first_registration_date ASC
  `

  return await gcQueryAi(ctx, query)
})

// @shared-route
export const apiOrderStatusRoute = app.get('/order-status/:orderId', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  const { orderId } = req.params

  const query = `
    WITH latest_status AS (
      SELECT 
        action_param1 as order_id,
        action_param3 as status,
        dt as status_change_date,
        ROW_NUMBER() OVER (PARTITION BY action_param1 ORDER BY ts DESC) as rn
      FROM chatium_ai.access_log 
      WHERE urlPath = 'event://getcourse/dealStatusChanged' 
        AND action_param1 = '${orderId}'
    ),
    order_creation AS (
      SELECT 
        action_param1 as order_id,
        action_param3 as initial_status,
        dt as creation_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealCreated' 
        AND action_param1 = '${orderId}'
    ),
    paid_order AS (
      SELECT 
        action_param1 as order_id,
        'payed' as paid_status,
        max(dt) as payment_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid' 
        AND action_param1 = '${orderId}'
    ),
    order_payments AS (
      SELECT 
        action_param1 as order_id,
        sum(CAST(COALESCE(action_param2_float, 0), 'Float64')) as total_paid,
        max(dt) as last_payment_date
      FROM chatium_ai.access_log
      WHERE urlPath = 'event://getcourse/dealPaid' 
        AND action_param1 = '${orderId}'
      GROUP BY action_param1
    )
    SELECT 
      c.order_id,
      c.creation_date,
      c.initial_status,
      CASE 
        WHEN s.status IS NOT NULL AND s.status_change_date >= COALESCE(paid.payment_date, '1900-01-01') 
        THEN s.status
        WHEN paid.paid_status IS NOT NULL 
        THEN paid.paid_status 
        ELSE c.initial_status 
      END as current_status,
      COALESCE(s.status_change_date, '1970-01-01') as last_status_change,
      COALESCE(p.total_paid, 0) as total_paid,
      COALESCE(p.last_payment_date, '1970-01-01') as last_payment_date
    FROM 
      order_creation c
    LEFT JOIN (SELECT order_id, status, status_change_date FROM latest_status WHERE rn = 1) s ON s.order_id = c.order_id
    LEFT JOIN paid_order paid ON paid.order_id = c.order_id
    LEFT JOIN order_payments p ON p.order_id = c.order_id
  `

  return await gcQueryAi(ctx, query)
})