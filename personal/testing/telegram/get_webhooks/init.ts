import { cleanupOldWebhooksJob } from './jobs/cleanup'
import { pollTelegramWebhooksJob } from './jobs/pollTelegram'
import Webhooks from './tables/webhooks.table'

// Инициализация при старте приложения
app.accountHook('@start', async (ctx) => {
  // Инициализируем таблицу вебхуков (создастся при первом использовании)
  try {
    await Webhooks.countBy(ctx, {})
    ctx.account.log('Таблица вебхуков инициализирована', {
      level: 'info'
    })
  } catch (error: any) {
    ctx.account.log('Ошибка инициализации таблицы вебхуков', {
      level: 'error',
      json: { error: String(error) }
    })
  }
  
  // Планируем джоб очистки на ближайшее 3:00
  const now = new Date()
  const todayAt3 = new Date()
  todayAt3.setHours(3, 0, 0, 0)
  
  const tomorrowAt3 = new Date()
  tomorrowAt3.setDate(tomorrowAt3.getDate() + 1)
  tomorrowAt3.setHours(3, 0, 0, 0)
  
  // Если уже прошло 3:00 сегодня, планируем на завтра
  const nextRun = now < todayAt3 ? todayAt3 : tomorrowAt3
  
  await cleanupOldWebhooksJob.scheduleJobAt(ctx, nextRun, {})
  
  ctx.account.log('Джоб очистки старых вебхуков инициализирован', {
    level: 'info',
    json: {
      nextRun: nextRun.toISOString()
    }
  })
})

