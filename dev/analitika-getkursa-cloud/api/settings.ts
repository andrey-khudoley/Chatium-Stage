// @shared
import { requireAccountRole } from '@app/auth'
import TAnalitikaGetkursaCloudSettingsKv8 from '../tables/settings.table'

/**
 * Получить значение настройки по ключу
 * GET /api/settings~get?key=settingKey
 */
// @shared-route
export const getSettingRoute = app.get('/get', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const key = req.query.key as string
  if (!key) {
    return { error: 'Key parameter is required' }
  }

  const setting = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key })
  
  return { 
    success: true,
    key,
    value: setting?.value || null 
  }
})

/**
 * Получить все настройки
 * GET /api/settings~all
 */
// @shared-route
export const getAllSettingsRoute = app.get('/all', async (ctx) => {
  requireAccountRole(ctx, 'Admin')
  
  const result = await TAnalitikaGetkursaCloudSettingsKv8.searchBy(ctx, {
    query: '' as any
  })
  
  return { 
    success: true,
    settings: result.map((s: any) => ({ key: s.key, value: s.value }))
  }
})

/**
 * Сохранить или обновить настройку
 * POST /api/settings~save
 * Body: { key: string, value: string }
 */
// @shared-route
export const saveSettingRoute = app.post('/save', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { key, value } = req.body
  
  if (!key) {
    return { error: 'Key is required' }
  }

  // Создаем или обновляем настройку используя createOrUpdateBy
  const setting = await TAnalitikaGetkursaCloudSettingsKv8.createOrUpdateBy(
    ctx, 
    'key',  // Имя поля для поиска уникальной записи
    { key, value }  // Данные для создания/обновления
  )
  
  return { 
    success: true,
    key,
    value,
    id: setting?.id
  }
})

/**
 * Удалить настройку по ключу
 * POST /api/settings~delete
 */
// @shared-route
export const deleteSettingRoute = app.post('/delete', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const key = req.query.key as string
  if (!key) {
    return { error: 'Key parameter is required' }
  }

  const setting = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key })
  
  if (setting) {
    // Удаляем запись по ID
    const heapId = (setting as any).id
    if (heapId) {
      await TAnalitikaGetkursaCloudSettingsKv8.delete(ctx, heapId)
      return { 
        success: true,
        message: `Setting with key "${key}" deleted` 
      }
    }
  }
  
  return { 
    success: false,
    message: `Setting with key "${key}" not found` 
  }
})
