// @shared
import { jsx } from "@app/html-jsx"
import UnitTestsPage from './pages/UnitTestsPage.vue'
import { tailwindScript, cssVariables, commonStyles, preloaderStyles } from '../styles'

export const testsPageRoute = app.html('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Unit Tests - AI Ассистент</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        {/* TailwindCSS */}
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <script>{tailwindScript}</script>
        
        {/* FontAwesome */}
        <link href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" rel="stylesheet" />
        
        {/* Стили */}
        <style type="text/tailwindcss">{cssVariables}</style>
        <style>{commonStyles}</style>
        <style>{preloaderStyles}</style>
        
        {/* Скрипт прелоадера */}
        <script>{`
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
              const preloader = document.getElementById('preloader')
              if (preloader) {
                preloader.classList.add('fade-out')
                setTimeout(function() {
                  preloader.remove()
                }, 300)
              }
            }, 500)
          })
        `}</script>
      </head>
      <body>
        {/* Прелоадер */}
        <div id="preloader" class="preloader">
          <div class="flex flex-col items-center">
            <div class="preloader-spinner"></div>
            <p class="preloader-text mt-4">Загрузка тестов...</p>
          </div>
        </div>
        
        {/* Основной контент */}
        <UnitTestsPage />
      </body>
    </html>
  )
})

export default testsPageRoute

