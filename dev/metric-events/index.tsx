// @shared
import { jsx } from '@app/html-jsx'
import { requireRealUser } from '@app/auth'
import HomePage from './pages/HomePage.vue'
import { applyDebugLevel } from './lib/logging'
import { Debug } from './shared/debug'

export const indexPageRoute = app.html('/', async (ctx, req) => {
  requireRealUser(ctx)
  
  return (
    <html>
      <head>
        <title>Metric Events - Подписка на события</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        
        {/* TailwindCSS CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        
        {/* FontAwesome CDN */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
        
        <style>{`
          body {
            --color-primary: #3b82f6;
            --color-secondary: #8b5cf6;
          }
        `}</style>
      </head>
      <body>
        <HomePage />
      </body>
    </html>
  )
})

// Обработчик всех входящих metric-событий
app.accountHook('metric-event', async (ctx, { event }) => {
  // Применяем текущий уровень логирования
  await applyDebugLevel(ctx, 'metric-event')
  
  // Логируем событие
  const eventJson = JSON.stringify(event, null, 2)
  Debug.info(ctx, `Получено metric-событие:\n${eventJson}`)
})
