// @shared
import { jsx } from "@app/html-jsx"
import { requireAccountRole } from '@app/auth'
import CloudSettingsPage from './pages/CloudSettingsPage.vue'

export const cloudSettingsPageRoute = app.get('/', async (ctx) => {
  requireAccountRole(ctx, 'Admin')

  return (
    <html>
      <head>
        <title>Настройка данных в облаке</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="/s/metric/clarity.js"></script>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: #f7fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body>
        <CloudSettingsPage />
      </body>
    </html>
  )
})

