import Webhooks from '../tables/webhooks.table'

// Джоб для очистки старых событий (старше 7 дней)
export const cleanupOldWebhooksJob = app.job('/cleanup-old-webhooks', async (ctx) => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const oldWebhooks = await Webhooks.findAll(ctx, {
    where: {
      receivedAt: {
        $lt: sevenDaysAgo
      }
    },
    limit: 1000
  })
  
  let deletedCount = 0
  for (const webhook of oldWebhooks) {
    try {
      await Webhooks.delete(ctx, webhook.id)
      deletedCount++
    } catch (error: any) {
      ctx.account.log('Ошибка при удалении старого вебхука', {
        level: 'error',
        json: {
          id: webhook.id,
          error: String(error)
        }
      })
    }
  }
  
  ctx.account.log('Очистка старых вебхуков завершена', {
    level: 'info',
    json: {
      deletedCount,
      threshold: sevenDaysAgo.toISOString()
    }
  })
  
  // Планируем следующую очистку на завтра в 3:00
  const now = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(3, 0, 0, 0)
  
  // Если уже прошло 3:00 сегодня, планируем на сегодня в 3:00
  const todayAt3 = new Date()
  todayAt3.setHours(3, 0, 0, 0)
  
  const nextRun = now < todayAt3 ? todayAt3 : tomorrow
  
  await cleanupOldWebhooksJob.scheduleJobAt(ctx, nextRun, {})
})

