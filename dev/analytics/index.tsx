// @shared
import { jsx } from "@app/html-jsx";
import { requireAccountRole } from '@app/auth';
import MetricEventsTable from './tables/metric-events.table';
import DashboardHome from './pages/DashboardHome.vue';
import EventsDashboard from './pages/EventsDashboard.vue';
import AllUsers from './pages/AllUsers.vue';
import Settings from './pages/Settings.vue';
import MetricEvents from './pages/MetricEvents.vue';
import './api/users.ts';  // Импортируем для регистрации хуков
import './api/events.ts';
import './api/metric-events.ts';
import './tests/ai.tsx';  // Импортируем роут для тестов

// Export index route for access in other modules
export const indexPageRoute = app.get("/", async (ctx) => {
  // Require Admin role to access analytics system
  requireAccountRole(ctx, 'Admin');

  return (
    <html>
      <head>
        <title>Система аналитики</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script src="/s/metric/clarity.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: #f7fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body>
        <DashboardHome />
      </body>
    </html>
  );
});

// Export events dashboard route
export const eventsDashboardRoute = app.get("/events", async (ctx) => {
  // Require Admin role to access events dashboard
  requireAccountRole(ctx, 'Admin');

  return (
    <html>
      <head>
        <title>Обзор событий - Система аналитики</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script src="/s/metric/clarity.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: #f7fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body>
        <EventsDashboard />
      </body>
    </html>
  );
});

// Export all users page route
export const allUsersRoute = app.get("/users", async (ctx) => {
  // Require Admin role to access users page
  // requireAccountRole(ctx, 'Admin'); // REMOVED: No authorization required

  return (
    <html>
      <head>
        <title>Все пользователи - Система аналитики</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script src="/s/metric/clarity.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: #f7fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body>
        <AllUsers />
      </body>
    </html>
  );
});

// Export settings page route
export const settingsRoute = app.get("/settings", async (ctx) => {
  // Require Admin role to access settings page
  requireAccountRole(ctx, 'Admin');

  return (
    <html>
      <head>
        <title>Настройки - Система аналитики</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script src="/s/metric/clarity.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <style>{`
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: #f7fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          }
          
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body>
        <Settings />
      </body>
    </html>
  );
});

// Export metric events monitor route
export const metricEventsRoute = app.get("/metric-events", async (ctx) => {
  // Require Admin role
  requireAccountRole(ctx, 'Admin');

  return (
    <html>
      <head>
        <title>Metric Events - Система аналитики</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        <script src="/s/metric/clarity.js"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body>
        <MetricEvents />
      </body>
    </html>
  );
});

// Metric Events Hook - автоматическая подписка на события
// Этот hook срабатывает при ЛЮБОМ событии в системе Chatium (включая GetCourse)
app.accountHook('@start/after-event-write', async (ctx, params: any) => {
  try {
    // Парсим данные события - они могут быть в разных форматах
    const urlPath = params.url || params.urlPath || params.path || params.eventType || 'unknown';
    const userId = params.resolved_user_id || params.userId || params.user_id || undefined;
    const userEmail = params.user_email || params.userEmail || params.email || undefined;
    const eventData = params;
    const timestamp = params.timestamp || params.dt || new Date();
    
    // Сохраняем событие в MetricEventsTable
    const savedEvent = await MetricEventsTable.create(ctx, {
      urlPath: String(urlPath).toLowerCase(),
      userId: userId ? String(userId) : undefined,
      userEmail: userEmail ? String(userEmail).toLowerCase() : undefined,
      eventData: JSON.stringify(eventData),
      receivedAt: timestamp instanceof Date ? timestamp : new Date(timestamp)
    });
    
    ctx.account.log('[Analytics] Metric event recorded', {
      level: 'debug',
      json: {
        eventId: savedEvent.id,
        urlPath,
        userId,
        userEmail
      }
    });
    
  } catch (error: any) {
    // Логируем ошибку но не прерываем обработку события
    ctx.account.log('[Analytics] Failed to record metric event', {
      level: 'warn',
      json: { 
        error: error.message,
        paramsKeys: Object.keys(params || {})
      }
    });
  }
});
