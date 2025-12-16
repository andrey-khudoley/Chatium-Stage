// @shared
import { jsx } from "@app/html-jsx"
import { z } from "@app/validation" // предполагаем наличие библиотеки валидации

// Примеры работы с параметрами маршрутов

// 1. Простой параметр
// @shared-route
export const routeParamsExampleRoute = app.get('/params-example/:id', async (ctx, req) => {
  const { id } = req.params
  const { search, filter } = req.query as any
  
  return {
    message: 'Пример работы с параметрами маршрута',
    params: {
      id,
      search,
      filter
    },
    usage: {
      url: '/params-example/123?search=test&filter=active',
      combined: `${id}${search ? `?search=${search}` : ''}${filter ? `&filter=${filter}` : ''}`
    }
  }
})

// 2. Множественные параметры
// @shared-route
export const multipleParamsRoute = app.get('/users/:userId/posts/:postId', async (ctx, req) => {
  const { userId, postId } = req.params
  const { comment, version } = req.query as any
  
  return {
    message: 'Пост пользователя',
    data: {
      user: { id: userId },
      post: { id: postId },
      comment,
      version: version || 'latest'
    }
  }
})

// 3. Опциональные параметры (через query)
// @shared-route
export const optionalParamsRoute = app.get('/search/:query', async (ctx, req) => {
  const { query } = req.params
  const { 
    page = 1, 
    limit = 20, 
    sort = 'relevance',
    filters,
    fields = 'all'
  } = req.query as any
  
  // Парсинг фильтров из JSON строки
  const parsedFilters = filters ? JSON.parse(filters) : {}
  
  return {
    query,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit)
    },
    options: {
      sort,
      fields,
      filters: parsedFilters
    },
    results: [
      `Результат для "${query}"`,
      `Страница ${page}`,
      `Сортировка: ${sort}`
    ]
  }
})

// 4. Параметры с валидацией
// @shared-route
export const validatedParamsRoute = app.get('/validate/:type/:id', async (ctx, req) => {
  const { type, id } = req.params
  
  // Валидация типа
  const allowedTypes = ['user', 'post', 'comment', 'file']
  if (!allowedTypes.includes(type)) {
    ctx.resp.status(400)
    return { error: `Неверный тип. Допустимые: ${allowedTypes.join(', ')}` }
  }
  
  // Валидация ID (должен быть валидным UUID или числом)
  if (type === 'user') {
    // Проверка что ID это email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(id)) {
      ctx.resp.status(400)
      return { error: 'ID пользователя должен быть email адресом' }
    }
  } else {
    // Проверка что ID это UUID или число
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    const numberRegex = /^\d+$/
    
    if (!uuidRegex.test(id) && !numberRegex.test(id)) {
      ctx.resp.status(400)
      return { error: 'ID должен быть UUID или числом' }
    }
  }
  
  return {
    message: 'Валидация пройдена',
    data: { type, id },
    validation: 'success'
  }
})

// 5. Параметры с дефолтными значениями
// @shared-route
export const defaultParamsRoute = app.get('/reports/:category/:period', async (ctx, req) => {
  const { category, period } = req.params
  const { 
    format = 'json',
    includeDetails = 'false',
    dateFrom,
    dateTo
  } = req.query as any
  
  // Дефолтные периоды
  const dateDefaults = {
    daily: { days: 1 },
    weekly: { days: 7 },
    monthly: { days: 30 },
    yearly: { days: 365 }
  }
  
  let fromDate = dateFrom ? new Date(dateFrom) : new Date()
  if (!dateFrom && dateDefaults[period]) {
    fromDate.setDate(fromDate.getDate() - dateDefaults[period].days)
  }
  
  let toDate = dateTo ? new Date(dateTo) : new Date()
  
  return {
    report: {
      category,
      period,
      format,
      includeDetails: includeDetails === 'true'
    },
    dateRange: {
      from: fromDate.toISOString(),
      to: toDate.toISOString()
    },
    sampleData: {
      total: Math.floor(Math.random() * 1000),
      items: Math.floor(Math.random() * 10),
      revenue: Math.random() * 100000
    }
  }
})

// 6. Сложный роут с множественными параметрами
// @shared-route
export const complexRoute = app.get('/api/v2/:version/organizations/:orgId/projects/:projectId/resources/:resourceType/:resourceId/actions/:actionId', async (ctx, req) => {
  const { 
    version, 
    orgId, 
    projectId, 
    resourceType, 
    resourceId, 
    actionId 
  } = req.params
  
  const { 
    timeout = '30s',
    async = 'false',
    webhook,
    preview = 'false'
  } = req.query as any
  
  return {
    api: {
      version: `v${version}`,
      endpoint: 'resource action'
    },
    context: {
      organization: orgId,
      project: projectId,
      resource: {
        type: resourceType,
        id: resourceId
      },
      action: actionId
    },
    options: {
      timeout,
      async: async === 'true',
      webhook: webhook ? decodeURIComponent(webhook) : null,
      preview: preview === 'true'
    }
  }
})

// 7. Динамическая обработка параметров
// @shared-route
export const dynamicParamsRoute = app.get('/dynamic/*', async (ctx, req) => {
  // * захватывает все что после /dynamic/
  const fullPath = req.params[0] // все что было после *
  
  const segments = fullPath.split('/').filter(Boolean)
  
  return {
    fullPath,
    segments,
    first: segments[0],
    last: segments[segments.length - 1],
    count: segments.length,
    reconstructed: '/' + segments.join('/')
  }
})

// 8. Параметры с обработкой специальных символов
// @shared-route
export const specialCharsRoute = app.get('/decode/:encoded', async (ctx, req) => {
  // Параметры URL автоматически декодируются
  const { encoded } = req.params
  
  // Дополнительная обработка если нужно
  const decoded = decodeURIComponent(encoded)
  const reEncoded = encodeURIComponent(decoded)
  
  return {
    original: req.params.encoded,
    decoded,
    reEncoded,
    specialChars: {
      space: decoded.includes(' '),
      slash: decoded.includes('/'),
      question: decoded.includes('?'),
      hash: decoded.includes('#')
    }
  }
})

// 9. RESTful роуты для CRUD
// @shared-route
export class restfulRoutes {
  // GET /items - список
  static listRoute = app.get('/items', async (ctx, req) => {
    const { page = 1, limit = 20, sort } = req.query as any
    return { action: 'list', page, limit, sort }
  })
  
  // GET /items/:id - детальная информация
  static getRoute = app.get('/items/:id', async (ctx, req) => {
    const { id } = req.params
    return { action: 'get', id }
  })
  
  // POST /items - создание
  static createRoute = app.post('/items', async (ctx, req) => {
    return { action: 'create', data: req.body }
  })
  
  // PUT /items/:id - обновление
  static updateRoute = app.put('/items/:id', async (ctx, req) => {
    const { id } = req.params
    return { action: 'update', id, data: req.body }
  })
  
  // PATCH /items/:id - частичное обновление
  static patchRoute = app.patch('/items/:id', async (ctx, req) => {
    const { id } = req.params
    return { action: 'patch', id, data: req.body }
  })
  
  // DELETE /items/:id - удаление
  static deleteRoute = app.delete('/items/:id', async (ctx, req) => {
    const { id } = req.params
    return { action: 'delete', id }
  })
}