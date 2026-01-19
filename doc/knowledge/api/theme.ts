// @shared-route
import { requireAccountRole } from '@app/auth'
import TKnowledgeAppSettings7Fk from '../tables/settings.table'

/**
 * Получить тему по умолчанию из настроек
 * GET /knowledge-app/api/theme~get
 */
export const getDefaultThemeRoute = app.get('/api/theme/get', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  try {
    const setting = await TKnowledgeAppSettings7Fk.findOneBy(ctx, { key: 'defaultTheme' })
    
    if (setting && (setting.value === 'light' || setting.value === 'dark')) {
      return {
        success: true,
        theme: setting.value as 'light' | 'dark'
      }
    }

    // Если настройка не найдена, возвращаем светлую тему по умолчанию
    return {
      success: true,
      theme: 'light' as const
    }
  } catch (e) {
    ctx.account.log('Error getting default theme', {
      level: 'error',
      json: { error: String(e) }
    })
    return {
      success: false,
      error: String(e),
      theme: 'light' as const
    }
  }
})

/**
 * Сохранить тему по умолчанию в настройки
 * POST /knowledge-app/api/theme~save
 * Body: { theme: 'light' | 'dark' }
 */
export const saveDefaultThemeRoute = app.post('/api/theme/save', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')

  const { theme } = req.body as { theme: string }

  // Валидация
  if (!theme || (theme !== 'light' && theme !== 'dark')) {
    return {
      success: false,
      error: 'Invalid theme value. Must be "light" or "dark"'
    }
  }

  try {
    // Используем createOrUpdateBy для создания или обновления настройки
    await TKnowledgeAppSettings7Fk.createOrUpdateBy(ctx, 'key', {
      key: 'defaultTheme',
      value: theme
    })

    ctx.account.log('Default theme saved', {
      level: 'info',
      json: { theme }
    })

    return {
      success: true,
      theme
    }
  } catch (e) {
    ctx.account.log('Error saving default theme', {
      level: 'error',
      json: { error: String(e), theme }
    })
    return {
      success: false,
      error: String(e)
    }
  }
})

