// @shared-route
import { requireAnyUser } from '@app/auth'
import * as loggerLib from '../../lib/logger.lib'

const LOG_PATH = 'api/tests/list'

/**
 * GET /api/tests/list — каталог тестов: список категорий и тестов.
 * Для авторизованных пользователей.
 */
export const listTestsRoute = app.get('/', async (ctx, req) => {
  requireAnyUser(ctx)

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Запрос каталога тестов`,
    payload: {}
  })

  const categories = [
    {
      id: 'endpoints-check',
      title: 'Проверка эндпоинтов',
      tests: [
        { id: 'health', title: 'Health check' },
        { id: 'ping', title: 'Ping' }
      ]
    }
  ]

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Каталог отдан`,
    payload: { categoriesCount: categories.length }
  })

  return { success: true, categories }
})
