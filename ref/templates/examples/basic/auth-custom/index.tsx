// @shared
import { jsx } from "@app/html-jsx"
import { getEnabledAuthProviders } from '@app/auth/provider'
import { tailwindScript, cssVariables, commonStyles } from './styles'
import LoginPage from './LoginPage.vue'

/**
 * Главный роут страницы авторизации
 * Показывает кастомную форму входа с поддержкой:
 * - SMS/Email авторизации
 * - Авторизации по паролю
 * - Telegram OAuth
 * - Темной/светлой темы
 */
export const loginPageRoute = app.html('/', async (ctx, req) => {
  const back = (req.query.back as string) || '/'
  
  // Получение доступных провайдеров авторизации
  const providers = await getEnabledAuthProviders(ctx)
  
  return (
    <html>
      <head>
        <title>Вход в систему</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
        
        {/* TailwindCSS */}
        <script src="/s/static/lib/tailwind.3.4.16.min.js"></script>
        <script dangerouslySetInnerHTML={{ __html: tailwindScript }} />
        
        {/* FontAwesome */}
        <link href="/s/static/lib/fontawesome/6.7.2/css/all.min.css" rel="stylesheet" />
        
        {/* CSS переменные */}
        <style type="text/tailwindcss">{cssVariables}</style>
        
        {/* Общие стили */}
        <style>{commonStyles}</style>
        
        {/* Скрипт темы (загружается синхронно для предотвращения мигания) */}
        <script>{`
          // Инициализация темы
          function initTheme() {
            const savedTheme = localStorage.getItem('theme')
            const isDark = savedTheme === 'dark' || 
              (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)
            
            if (isDark) {
              document.documentElement.classList.add('dark')
            }
            
            updateThemeIcon(isDark)
          }
          
          function updateThemeIcon(isDark) {
            const icon = document.querySelector('.theme-toggle i')
            if (icon) {
              icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon'
            }
          }
          
          function toggleTheme() {
            const isDark = document.documentElement.classList.toggle('dark')
            localStorage.setItem('theme', isDark ? 'dark' : 'light')
            updateThemeIcon(isDark)
          }
          
          // Инициализация при загрузке
          initTheme()
        `}</script>
      </head>
      <body>
        {/* Кнопка переключения темы */}
        <button class="theme-toggle" onclick="toggleTheme()">
          <i class="fas fa-moon"></i>
        </button>
        
        {/* Контейнер формы входа */}
        <div class="login-container">
          <LoginPage providers={providers} back={back} />
        </div>
      </body>
    </html>
  )
})

export default loginPageRoute

