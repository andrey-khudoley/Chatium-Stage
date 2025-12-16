// @shared
import { jsx } from "@app/html-jsx"
import { requireRealUser } from '@app/auth'
import { writeWorkspaceEvent } from '@start/sdk'

// Пример 1: Базовый CRUD API
// @shared-route
export const basicCrudRoute = app.get('/basic-crud', async (ctx, req) => {
  requireRealUser(ctx)
  
  // Создание тестовой таблицы (в реальном проекте таблицы создаются через UI)
  const TestTable = {
    name: 'test_items',
    fields: ['id', 'title', 'description', 'created_at']
  }
  
  return {
    message: 'Basic CRUD API Example',
    description: 'Это базовый пример CRUD операций с пользовательскими данными',
    table: TestTable
  }
})

// Пример 2: Параметры маршрутов
// @shared-route
export { routeParamsExampleRoute } from './route-params'

// Пример 3: Middleware
const authMiddleware = app.use(async (ctx, req, next) => {
  // Middleware логика - можно добавить проверки авторизации
  await next()
})

// @shared-route
export const middlewareExampleRoute = authMiddleware.get('/middleware', async (ctx, req) => {
  return {
    message: 'Этот маршрут защищен middleware',
    user: ctx.user?.displayName || 'Anonymous'
  }
})

// Пример 4: Query параметры
// @shared-route
export const queryParamsExampleRoute = app.get('/query-params', async (ctx, req) => {
  const { search, filter, page = 1, limit = 10 } = req.query as any
  
  return {
    message: 'Пример работы с query параметрами',
    params: {
      search,
      filter,
      page: parseInt(page),
      limit: parseInt(limit)
    },
    timestamp: new Date().toISOString()
  }
})

// Пример 5: Валидация тела запроса
// @shared-route
export const requestBodyValidationRoute = app
  .body(s => ({
    title: s.string(),
    content: s.string(),
    tags: s.array(s.string()).optional(),
    published: s.boolean().optional()
  }))
  .post('/validation', async (ctx, req) => {
    await writeWorkspaceEvent(ctx, 'content_created', {
      action_params: {
        title: req.body.title,
        published: req.body.published
      },
      user: {
        id: ctx.user?.id,
        name: ctx.user?.displayName
      }
    })
    
    return {
      message: 'Данные успешно валидированы и сохранены',
      data: req.body,
      createdAt: new Date().toISOString()
    }
  })

// Пример 6: Обработка ошибок
// @shared-route
export const errorHandlingRoute = app.get('/error-demo/:type', async (ctx, req) => {
  const { type } = req.params
  
  switch (type) {
    case 'not-found':
      ctx.resp.status(404)
      return { error: 'Ресурс не найден', code: 404 }
    
    case 'forbidden':
      ctx.resp.status(403)
      return { error: 'Доступ запрещен', code: 403 }
    
    case 'server-error':
      throw new Error('Внутренняя ошибка сервера')
    
    default:
      return { message: 'Все работает хорошо', type }
  }
})

// Пример 7: JSON и текстовые ответы
// @shared-route
export const responseFormatsRoute = app.get('/response-formats', async (ctx, req) => {
  const { format } = req.query as any
  
  if (format === 'text') {
    ctx.resp.type('text/plain')
    return 'Это простой текстовый ответ'
  }
  
  if (format === 'html') {
    ctx.resp.type('text/html')
    return '<h1>HTML ответ</h1><p>Это может содержать разметку</p>'
  }
  
  return {
    formats: ['json', 'text', 'html'],
    current: 'json',
    message: 'Выберите формат через ?format=text|html'
  }
})

// Пример 8: Куки и заголовки
// @shared-route
export const cookiesHeadersRoute = app.get('/cookies-headers', async (ctx, req) => {
  // Установка куки
  if (req.query.setCookie) {
    ctx.resp.cookie('demo_cookie', req.query.setCookie, {
      maxAge: 3600000, // 1 час
      httpOnly: true,
      secure: false // только для разработки
    })
  }
  
  // Установка кастомных заголовков
  ctx.resp.setHeader('X-Custom-Header', 'chatium-demo')
  ctx.resp.setHeader('X-Timestamp', new Date().toISOString())
  
  return {
    message: 'Пример работы с куками и заголовками',
    cookies: {
      demo: ctx.req.cookie?.demo_cookie || 'не установлена',
      all: ctx.req.cookie ? Object.keys(ctx.req.cookie) : []
    },
    headers: {
      userAgent: ctx.req.headers['user-agent'],
      accept: ctx.req.headers.accept
    }
  }
})

// Пример 9: Кэширование ответов
// @shared-route
export const cachingRoute = app.get('/cache', async (ctx, req) => {
  // Установка заголовков кэширования
  ctx.resp.setHeader('Cache-Control', 'public, max-age=300') // 5 минут
  ctx.resp.setHeader('ETag', `demo-${Date.now()}`)
  
  return {
    message: 'Данные будут кэшироваться 5 минут',
    data: {
      cacheExpiry: new Date(Date.now() + 300000).toISOString(),
      generatedAt: new Date().toISOString(),
      requestId: Math.random().toString(36).substr(2, 9)
    }
  }
})

// Пример 10: Rate limiting (простая реализация)
const requestCounts = new Map()

// @shared-route
export const rateLimitRoute = app.get('/rate-limit', async (ctx, req) => {
  const clientIp = ctx.req.headers['x-forwarded-for'] || 'unknown'
  const currentMinute = Math.floor(Date.now() / 60000)
  const key = `${clientIp}-${currentMinute}`
  
  const currentCount = requestCounts.get(key) || 0
  requestCounts.set(key, currentCount + 1)
  
  if (currentCount >= 5) {
    ctx.resp.status(429)
    return { 
      error: 'Too Many Requests',
      message: 'Превышен лимит запросов (5 в минуту)',
      retryAfter: 60 - (Date.now() % 60000)
    }
  }
  
  return {
    message: 'Rate limiting пример',
    requestCount: currentCount + 1,
    limit: 5,
    window: '1 минута',
    ip: clientIp
  }
})