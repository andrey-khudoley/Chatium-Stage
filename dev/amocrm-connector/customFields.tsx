// @shared
import { jsx } from "@app/html-jsx"
import CustomFieldsPage from './pages/CustomFieldsPage.vue'
import { tailwindScript, cssVariables, commonStyles, preloaderStyles, loaderScript } from './styles'

export const customFieldsPageRoute = app.get('/', async (ctx) => {
  return (
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Дополнительные поля - AmoCRM Connector</title>
        
        {/* CSS переменные - ПЕРВЫМ ДЕЛОМ! */}
        <style>{cssVariables}</style>
        
        {/* Стили прелоадера */}
        <style>{preloaderStyles}</style>
        
        {/* TailwindCSS */}
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        
        {/* TailwindCSS конфигурация */}
        <script>{tailwindScript}</script>
        
        {/* FontAwesome */}
        <link href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" rel="stylesheet" />
        
        {/* Google Fonts - Inter */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        
        {/* Общие стили */}
        <style>{commonStyles}</style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0f172a; min-height: 100vh;">
        {/* Прелоадер - показывается сразу */}
        <div id="app-loader" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.98); backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center; z-index: 999999;">
          <div class="loader-content">
            <div class="loader-logo">
              <i class="fas fa-list-alt"></i>
            </div>
            <div class="loader-spinner">
              <div class="loader-ring"></div>
            </div>
            <p class="loader-text">Загрузка приложения...</p>
          </div>
        </div>
        
        {/* Контент - изначально скрыт */}
        <div id="app-content" style="opacity: 0;">
          <CustomFieldsPage />
        </div>
        
        {/* Скрипт для скрытия прелоадера */}
        <script>{loaderScript}</script>
      </body>
    </html>
  )
})

