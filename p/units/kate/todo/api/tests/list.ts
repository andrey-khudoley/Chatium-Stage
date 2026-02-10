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

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Формирование categories`,
    payload: {}
  })
  const categories = [
    {
      id: 'endpoints',
      title: 'Проверка эндпоинтов',
      tests: [
        { id: 'index', title: 'Эндпоинт /' },
        { id: 'web-admin', title: 'Эндпоинт /web/admin' },
        { id: 'web-profile', title: 'Эндпоинт /web/profile' },
        { id: 'web-login', title: 'Эндпоинт /web/login' },
        { id: 'web-tests', title: 'Эндпоинт /web/tests' }
      ]
    },
    {
      id: 'settings-lib',
      title: 'Библиотека настроек',
      tests: [
        { id: 'getSettingString', title: 'getSettingString (project_name)' },
        { id: 'getLogLevel', title: 'getLogLevel' },
        { id: 'getLogsLimit', title: 'getLogsLimit' },
        { id: 'getLogWebhook', title: 'getLogWebhook' },
        { id: 'getDashboardResetAt', title: 'getDashboardResetAt' },
        { id: 'getAllSettings', title: 'getAllSettings' }
      ]
    },
    {
      id: 'settings-repo',
      title: 'Репозиторий настроек',
      tests: [
        { id: 'upsert', title: 'upsert' },
        { id: 'deleteByKey', title: 'deleteByKey' },
        { id: 'findByKey', title: 'findByKey' },
        { id: 'findAll', title: 'findAll' }
      ]
    },
    {
      id: 'logger-lib',
      title: 'Библиотека логов',
      tests: [
        { id: 'getAdminLogsSocketId', title: 'getAdminLogsSocketId' },
        { id: 'shouldLogByLevel_Info', title: 'shouldLogByLevel (Info, 6)' },
        { id: 'shouldLogByLevel_Error', title: 'shouldLogByLevel (Error, 3)' },
        { id: 'shouldLogByLevel_Disable', title: 'shouldLogByLevel (Disable, 7)' }
      ]
    },
    {
      id: 'logs-repo',
      title: 'Репозиторий логов',
      tests: [
        { id: 'create', title: 'create' },
        { id: 'findAll', title: 'findAll' },
        { id: 'findBeforeTimestamp', title: 'findBeforeTimestamp' },
        { id: 'countErrorsAfter', title: 'countErrorsAfter' },
        { id: 'countWarningsAfter', title: 'countWarningsAfter' }
      ]
    },
    {
      id: 'dashboard-lib',
      title: 'Библиотека админки',
      tests: [
        { id: 'getDashboardCounts', title: 'getDashboardCounts' },
        { id: 'resetDashboard', title: 'resetDashboard' }
      ]
    }
  ]

  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Переменные categories`,
    payload: { categoriesCount: categories.length, categoryIds: categories.map((c) => c.id) }
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_PATH}] Каталог отдан`,
    payload: { categoriesCount: categories.length }
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 7,
    message: `[${LOG_PATH}] Возврат success`,
    payload: { categoriesCount: categories.length }
  })
  return { success: true, categories }
})
