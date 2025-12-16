// @shared-route
import SettingsTable from '../tables/settings.table'

export const apiGetSettingsRoute = app.get('/list', async (ctx) => {
  // Проверяем, что таблица инициализирована
  if (!SettingsTable) {
    return { success: true, settings: [] }
  }
  
  try {
    const settings = await SettingsTable.findAll(ctx, {
      order: [{ key: 'asc' }],
      limit: 1000
    })
    
    return { success: true, settings: settings || [] }
  } catch (error) {
    console.error('Ошибка при загрузке настроек:', error)
    return { success: true, settings: [] }
  }
})

export const apiUpdateSettingRoute = app.post('/update', async (ctx, req) => {
  const { key, value, description } = req.body
  
  if (!key || value === undefined) {
    return { success: false, error: 'Необходимы параметры key и value' }
  }
  
  if (!SettingsTable) {
    return { success: false, error: 'Таблица настроек не инициализирована' }
  }
  
  try {
    const existing = await SettingsTable.findOneBy(ctx, { key })
    
    if (existing) {
      await SettingsTable.update(ctx, {
        id: existing.id,
        value,
        description: description || existing.description
      })
    } else {
      await SettingsTable.create(ctx, {
        key,
        value,
        description: description || ''
      })
    }
    
    return { success: true }
  } catch (error) {
    console.error('Ошибка при сохранении настройки:', error)
    return { success: false, error: 'Ошибка при сохранении настройки' }
  }
})

export const apiDeleteSettingRoute = app.post('/delete', async (ctx, req) => {
  const { key } = req.body
  
  if (!key) {
    return { success: false, error: 'Необходим параметр key' }
  }
  
  if (!SettingsTable) {
    return { success: false, error: 'Таблица настроек не инициализирована' }
  }
  
  try {
    const existing = await SettingsTable.findOneBy(ctx, { key })
    
    if (existing) {
      await SettingsTable.delete(ctx, existing.id)
    }
    
    return { success: true }
  } catch (error) {
    console.error('Ошибка при удалении настройки:', error)
    return { success: false, error: 'Ошибка при удалении настройки' }
  }
})

