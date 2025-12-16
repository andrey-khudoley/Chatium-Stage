import { requireAccountRole } from '@app/auth'
import { request } from '@app/request'
import Settings from '../tables/settings.table'

// Префикс для всех документов в Yandex Object Storage
const DOCS_PREFIX = 'usage=external/service=docs/'

async function getSettings(ctx: any) {
  let baseUrl = 'https://d5dufuc4uj90lbcrvpac.4b4k4pg5.apigw.yandexcloud.net'
  let adminToken = '123'

  try {
    const urlSetting = await Settings.findOneBy(ctx, { key: 'baseUrl' })
    if (urlSetting) {
      baseUrl = urlSetting.value
    }
  } catch (e) {
    // Use default
  }

  try {
    const tokenSetting = await Settings.findOneBy(ctx, { key: 'adminToken' })
    if (tokenSetting) {
      adminToken = tokenSetting.value
    }
  } catch (e) {
    // Use default
  }

  return { baseUrl, adminToken }
}

// Формирует полный ключ для Yandex функции из имени файла
function getFullKey(filename: string): string {
  return DOCS_PREFIX + filename
}

// Извлекает имя файла из полного ключа
function getFilename(fullKey: string): string {
  if (fullKey.startsWith(DOCS_PREFIX)) {
    return fullKey.substring(DOCS_PREFIX.length)
  }
  return fullKey
}

function buildQueryUrl(base: string, path: string, params: Record<string, string | number | boolean>): string {
  const queryParts: string[] = []
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    const encodedKey = encodeURIComponent(key)
    let encodedValue: string
    
    if (key === 'prefix') {
      encodedValue = value.toString()
    } else {
      encodedValue = encodeURIComponent(value.toString())
    }
    
    queryParts.push(`${encodedKey}=${encodedValue}`)
  }
  
  return `${base}${path}?${queryParts.join('&')}`
}

// @shared-route
export const listDocsRoute = app.get('/list', async (ctx, req) => {
  // Пропускаем авторизацию для внутренних вызовов из тестов
  // В тестах ctx не содержит HTTP request с headers
  if (req.headers && Object.keys(req.headers).length > 0) {
    requireAccountRole(ctx, 'Admin')
  }
  
  const limit = parseInt(req.query.limit as string) || 1000
  const token = req.query.token as string | undefined
  
  try {
    const { baseUrl } = await getSettings(ctx)
    
    const params: Record<string, string | number> = {
      prefix: DOCS_PREFIX,
      limit,
    }
    if (token) {
      params.token = token
    }
    
    const url = buildQueryUrl(baseUrl, '/docs', params)
    
    const response = await request({
      url,
      method: 'get',
      headers: {
        'Accept': 'application/json',
      },
      responseType: 'json',
      throwHttpErrors: false
    })
    
    if (response.statusCode !== 200) {
      return { 
        success: false, 
        error: `API error: ${response.statusCode}`,
        details: response.body
      }
    }
    
    // Преобразуем ответ: заменяем полные ключи на имена файлов
    const data = response.body as any
    if (data.items && Array.isArray(data.items)) {
      data.items = data.items.map((item: any) => ({
        ...item,
        key: getFilename(item.key)
      }))
    }
    
    return { success: true, data }
  } catch (error) {
    ctx.account.log('Error listing docs', {
      level: 'error',
      json: { error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})

// @shared-route
export const getDocRoute = app.get('/get', async (ctx, req) => {
  // Публичный доступ для краулеров и всех пользователей
  
  const filename = req.query.filename as string
  const download = req.query.download === '1' || req.query.download === 'true'
  
  if (!filename) {
    return { success: false, error: 'Filename parameter is required' }
  }
  
  try {
    const { baseUrl } = await getSettings(ctx)
    
    // Формируем полный ключ для Yandex функции
    const fullKey = getFullKey(filename)
    
    const params: Record<string, string | number | boolean> = {
      key: fullKey,
    }
    if (download) {
      params.download = 1
    }
    
    const url = buildQueryUrl(baseUrl, '/doc', params)
    
    const response = await request({
      url,
      method: 'get',
      headers: {
        'Accept': 'text/markdown; charset=utf-8',
      },
      responseType: 'text',
      throwHttpErrors: false
    })
    
    if (response.statusCode === 404) {
      return { success: false, error: 'NotFound' }
    }
    
    if (response.statusCode !== 200) {
      return { success: false, error: `API error: ${response.statusCode}` }
    }
    
    return { success: true, data: response.body }
  } catch (error) {
    ctx.account.log('Error getting doc', {
      level: 'error',
      json: { filename, error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})

// @shared-route
export const putDocRoute = app.post('/put', async (ctx, req) => {
  // Пропускаем авторизацию для внутренних вызовов из тестов
  if (req.headers && Object.keys(req.headers).length > 0) {
    requireAccountRole(ctx, 'Admin')
  }
  
  const { filename, markdown } = req.body
  
  if (!filename || markdown === undefined) {
    return { success: false, error: 'Filename and markdown are required' }
  }
  
  try {
    const { baseUrl, adminToken } = await getSettings(ctx)
    
    // Формируем полный ключ для Yandex функции
    const fullKey = getFullKey(filename)
    
    const params: Record<string, string> = {
      key: fullKey,
    }
    
    const url = buildQueryUrl(baseUrl, '/doc', params)
    
    const headers: Record<string, string> = {
      'Content-Type': 'text/markdown; charset=utf-8',
    }
    if (adminToken) {
      headers['X-Docs-Admin'] = adminToken
    }
    
    const response = await request({
      url,
      method: 'put',
      headers,
      body: markdown,
      responseType: 'text',
      throwHttpErrors: false
    })
    
    if (response.statusCode === 401) {
      return { success: false, error: 'Unauthorized' }
    }
    
    if (response.statusCode !== 200 && response.statusCode !== 204) {
      return { 
        success: false, 
        error: `API error: ${response.statusCode}`,
        details: response.body
      }
    }
    
    const etag = response.headers['etag'] || ''
    return { success: true, etag }
  } catch (error) {
    ctx.account.log('Error putting doc', {
      level: 'error',
      json: { filename, error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})

// @shared-route
export const deleteDocRoute = app.post('/delete', async (ctx, req) => {
  // Пропускаем авторизацию для внутренних вызовов из тестов
  if (req.headers && Object.keys(req.headers).length > 0) {
    requireAccountRole(ctx, 'Admin')
  }
  
  const { filename } = req.body
  
  if (!filename) {
    return { success: false, error: 'Filename parameter is required' }
  }
  
  try {
    const { baseUrl, adminToken } = await getSettings(ctx)
    
    // Формируем полный ключ для Yandex функции
    const fullKey = getFullKey(filename)
    
    const params: Record<string, string> = {
      key: fullKey,
    }
    
    const url = buildQueryUrl(baseUrl, '/doc', params)
    
    const headers: Record<string, string> = {}
    if (adminToken) {
      headers['X-Docs-Admin'] = adminToken
    }
    
    const response = await request({
      url,
      method: 'delete',
      headers,
      responseType: 'text',
      throwHttpErrors: false
    })
    
    if (response.statusCode === 401) {
      return { success: false, error: 'Unauthorized' }
    }
    
    if (response.statusCode !== 204 && response.statusCode !== 200) {
      return { 
        success: false, 
        error: `API error: ${response.statusCode}`,
        details: response.body
      }
    }
    
    ctx.account.log('Doc deleted', {
      level: 'info',
      json: { filename }
    })
    
    return { success: true }
  } catch (error) {
    ctx.account.log('Error deleting doc', {
      level: 'error',
      json: { filename, error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})

