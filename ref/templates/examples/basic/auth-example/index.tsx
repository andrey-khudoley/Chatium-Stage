// @shared
import { jsx } from "@app/html-jsx"
import { requireRealUser, requireAccountRole } from '@app/auth'
import AuthPage from './AuthPage.vue'

// Главная страница - доступна всем
export const authExampleRoute = app.get('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Примеры авторизации</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com/3.4.16"></script>
        <script>{`
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#3b82f6',
                }
              }
            }
          }
        `}</script>
      </head>
      <body>
        <AuthPage />
      </body>
    </html>
  )
})

// Профиль - только для авторизованных пользователей
export const profileRoute = app.get('/profile', async (ctx, req) => {
  requireRealUser(ctx)
  
  return (
    <html>
      <head>
        <title>Профиль пользователя</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://cdn.tailwindcss.com/3.4.16.min.css" rel="stylesheet" />
      </head>
      <body class="bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">
              Профиль пользователя: {ctx.user.displayName}
            </h1>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Имя:</label>
                <p className="mt-1 text-gray-900">{ctx.user.firstName || 'Не указано'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Фамилия:</label>
                <p className="mt-1 text-gray-900">{ctx.user.lastName || 'Не указано'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Email:</label>
                <p className="mt-1 text-gray-900">{ctx.user.confirmedEmail || 'Не подтвержден'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Телефон:</label>
                <p className="mt-1 text-gray-900">{ctx.user.confirmedPhone || 'Не подтвержден'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Роль:</label>
                <p className="mt-1 text-gray-900">{ctx.user.accountRole}</p>
              </div>
              
              {ctx.user.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Аватар:</label>
                  <img src={ctx.user.imageUrl} alt="Avatar" className="mt-1 w-20 h-20 rounded-full" />
                </div>
              )}
              
              <div className="pt-4">
                <a href="/" className="text-blue-600 hover:text-blue-800 mr-4">На главную</a>
                <form method="post" action="/s/auth/sign-out" className="inline">
                  <button type="submit" className="text-red-600 hover:text-red-800">
                    Выйти
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
})

// Админ-панель - только для администраторов
export const adminRoute = app.get('/admin', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  return (
    <html>
      <head>
        <title>Админ-панель</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://cdn.tailwindcss.com/3.4.16.min.css" rel="stylesheet" />
      </head>
      <body class="bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Админ-панель</h1>
            <p className="text-lg text-gray-700 mb-6">
              Добро пожаловать, {ctx.user.displayName}! 
              У вас есть права администратора.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Управление пользователями</h2>
                <p className="text-gray-600 mb-4">Просмотр и управление всеми пользователями системы</p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Управление
                </button>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Статистика</h2>
                <p className="text-gray-600 mb-4">Просмотр статистики и аналитики</p>
                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                  Просмотр
                </button>
              </div>
            </div>
            
            <div className="mt-6">
              <a href="/" className="text-blue-600 hover:text-blue-800 mr-4">На главную</a>
              <a href="/profile" className="text-blue-600 hover:text-blue-800">В профиль</a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
})