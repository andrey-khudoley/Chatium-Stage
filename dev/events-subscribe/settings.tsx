// @shared
import { jsx } from "@app/html-jsx"
import { requireRealUser } from '@app/auth'
import SettingsPage from './pages/SettingsPage.vue'

export const settingsPageRoute = app.get('/', async (ctx, req) => {
  requireRealUser(ctx)
  
  return (
    <html>
      <head>
        <title>Настройки подписок</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <link href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" rel="stylesheet" />
        <script>{`
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#3b82f6',
                  secondary: '#8b5cf6',
                }
              }
            }
          }
        `}</script>
        <style type="text/tailwindcss">{`
          body {
            --color-primary: #3b82f6;
            --color-secondary: #8b5cf6;
            --color-accent: #10b981;
            --color-dark: #111827;
            --color-light: #f9fafb;
          }
        `}</style>
      </head>
      <body>
        <SettingsPage />
      </body>
    </html>
  )
})
