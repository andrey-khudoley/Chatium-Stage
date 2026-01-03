// @shared-route

import { revokeLinksJob } from './jobs/revoke-links.job'
import { Debug } from './shared/debug'
import { applyDebugLevel } from './lib/logging'

/**
 * Инициализация при старте приложения
 * Запускает job для отзыва ссылок один раз для первого выполнения
 * 
 * Примечание: job сам планирует следующие выполнения при каждом запуске,
 * поэтому здесь используется scheduleJobAsap для первого запуска,
 * что предотвращает дублирование расписаний.
 */
app.accountHook('@start', async (ctx) => {
  try {
    await applyDebugLevel(ctx, 'init')
    Debug.info(ctx, '[init] Инициализация системы аналитики ссылок')
    
    // Запускаем job один раз для первого выполнения
    // Job сам будет планировать следующие выполнения
    await revokeLinksJob.scheduleJobAsap(ctx, {})
    
    Debug.info(ctx, '[init] Job для отзыва ссылок запущен для первого выполнения')
  } catch (error: any) {
    Debug.error(ctx, `[init] Ошибка инициализации job для отзыва ссылок: ${error.message}`, 'E_INIT_REVOKE_LINKS')
    Debug.error(ctx, `[init] Stack trace: ${error.stack || 'N/A'}`)
  }
})
