// @shared
import { jsx } from "@app/html-jsx"

/**
 * Главная страница примера интеграции с Getcourse
 */
export const getcourseExampleRoute = app.get('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Getcourse API Integration - Примеры</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* TailwindCSS */}
        <script src="https://cdn.tailwindcss.com/3.4.16"></script>
        <script>{`
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  primary: '#3b82f6',
                  secondary: '#8b5cf6',
                  accent: '#10b981',
                }
              }
            }
          }
        `}</script>

        {/* FontAwesome Icons */}
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" rel="stylesheet" />
        
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          body { font-family: 'Inter', sans-serif; }
        `}</style>
      </head>
      <body class="bg-gray-50">
        <div class="min-h-screen">
          {/* Header */}
          <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <a href="/doc/templates" class="text-gray-600 hover:text-primary transition mr-4">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Назад к примерам
                  </a>
                </div>
                <div class="text-sm text-gray-500">
                  <i class="fas fa-graduation-cap mr-2"></i>
                  Интеграция с Getcourse
                </div>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section class="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="text-center">
                <div class="inline-block p-4 bg-white/10 rounded-full mb-6">
                  <i class="fas fa-graduation-cap text-6xl"></i>
                </div>
                <h1 class="text-5xl font-bold mb-4">
                  Интеграция с Getcourse API
                </h1>
                <p class="text-xl text-purple-100 max-w-3xl mx-auto">
                  Полноценная интеграция с платформой Getcourse для работы с пользователями, 
                  заказами, продуктами и аналитикой
                </p>
              </div>
            </div>
          </section>

          {/* Features Grid */}
          <section class="py-16 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Возможности интеграции
              </h2>
              <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <FeatureCard
                  icon="fa-users"
                  title="Пользователи"
                  description="Получение списка пользователей, поиск, фильтрация"
                  color="blue"
                />
                <FeatureCard
                  icon="fa-shopping-cart"
                  title="Заказы"
                  description="Создание и управление заказами, история покупок"
                  color="green"
                />
                <FeatureCard
                  icon="fa-box"
                  title="Продукты"
                  description="Список продуктов и курсов, информация о ценах"
                  color="purple"
                />
                <FeatureCard
                  icon="fa-chart-line"
                  title="Аналитика"
                  description="События, статистика, отслеживание активности"
                  color="orange"
                />
              </div>
            </div>
          </section>

          {/* API Endpoints */}
          <section class="py-16 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Доступные API эндпоинты
              </h2>
              
              <div class="space-y-6">
                {/* Users */}
                <EndpointCard
                  method="GET"
                  path="/users"
                  title="Получить список пользователей"
                  description="Возвращает список пользователей Getcourse с возможностью фильтрации"
                  params={[
                    { name: 'page', type: 'number', description: 'Номер страницы' },
                    { name: 'limit', type: 'number', description: 'Количество записей на странице' }
                  ]}
                />
                
                {/* User by ID */}
                <EndpointCard
                  method="GET"
                  path="/user/:userId"
                  title="Получить пользователя по ID"
                  description="Возвращает подробную информацию о пользователе"
                />
                
                {/* Orders */}
                <EndpointCard
                  method="GET"
                  path="/orders"
                  title="Получить список заказов"
                  description="Возвращает список всех заказов с фильтрацией по статусу"
                  params={[
                    { name: 'page', type: 'number', description: 'Номер страницы' },
                    { name: 'status', type: 'string', description: 'Статус заказа' }
                  ]}
                />
                
                {/* Create Order */}
                <EndpointCard
                  method="POST"
                  path="/create-order"
                  title="Создать новый заказ"
                  description="Создает новый заказ в системе Getcourse"
                  isPost={true}
                />
                
                {/* Products */}
                <EndpointCard
                  method="GET"
                  path="/products"
                  title="Получить список продуктов"
                  description="Возвращает список всех продуктов и курсов"
                />
                
                {/* Events */}
                <EndpointCard
                  method="GET"
                  path="/events"
                  title="Получить события"
                  description="Возвращает список событий пользователей для аналитики"
                  params={[
                    { name: 'userId', type: 'string', description: 'ID пользователя' },
                    { name: 'eventType', type: 'string', description: 'Тип события' }
                  ]}
                />
              </div>
            </div>
          </section>

          {/* Configuration */}
          <section class="py-16 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Конфигурация
              </h2>
              
              <div class="max-w-3xl mx-auto">
                <div class="bg-gray-800 text-gray-100 rounded-lg p-6 overflow-x-auto">
                  <pre class="text-sm">{`// GetcourseAnalytics.ts

interface GetcourseConfig {
  baseUrl: string      // URL вашего аккаунта Getcourse
  apiToken: string     // API токен из настроек
  accountName: string  // Название аккаунта
}

// Пример использования
const config: GetcourseConfig = {
  baseUrl: 'https://your-account.getcourse.ru',
  apiToken: 'your_api_token_here',
  accountName: 'your-account'
}

const getcourseAPI = new GetcourseAPI(config)`}</pre>
                </div>
              </div>
            </div>
          </section>

          {/* Example Usage */}
          <section class="py-16 bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Пример использования
              </h2>
              
              <div class="max-w-3xl mx-auto space-y-6">
                <div>
                  <h3 class="text-xl font-semibold text-gray-800 mb-4">
                    <i class="fas fa-code mr-2 text-blue-600"></i>
                    Получение списка пользователей
                  </h3>
                  <div class="bg-gray-800 text-gray-100 rounded-lg p-6 overflow-x-auto">
                    <pre class="text-sm">{`import { request } from "@app/request"

// GET запрос к API
const response = await request({
  url: './users',
  method: 'get',
  searchParams: {
    page: '1',
    limit: '20'
  }
})

const { users, pagination } = response.body
console.log(\`Получено \${users.length} пользователей\`)`}</pre>
                  </div>
                </div>

                <div>
                  <h3 class="text-xl font-semibold text-gray-800 mb-4">
                    <i class="fas fa-shopping-cart mr-2 text-green-600"></i>
                    Создание заказа
                  </h3>
                  <div class="bg-gray-800 text-gray-100 rounded-lg p-6 overflow-x-auto">
                    <pre class="text-sm">{`const response = await request({
  url: './create-order',
  method: 'post',
  json: {
    email: 'user@example.com',
    product_id: '12345',
    amount: 5000,
    currency: 'RUB'
  }
})

if (response.body.success) {
  console.log('Заказ создан:', response.body.data)
} else {
  console.error('Ошибка:', response.body.error)
}`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer class="bg-gray-800 text-white py-8">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p class="text-gray-400 text-sm">
                <i class="fas fa-book mr-2"></i>
                Для получения API токена войдите в настройки вашего аккаунта Getcourse
              </p>
              <div class="mt-4">
                <a 
                  href="/doc/templates" 
                  class="text-blue-400 hover:text-blue-300 transition"
                >
                  <i class="fas fa-arrow-left mr-2"></i>
                  Вернуться к примерам
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
})

/**
 * Компонент карточки возможности
 */
const FeatureCard = (props: {
  icon: string
  title: string
  description: string
  color: 'blue' | 'green' | 'purple' | 'orange'
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50'
  }
  
  return (
    <div class="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div class={`inline-flex p-3 rounded-lg mb-4 ${colorClasses[props.color]}`}>
        <i class={`fas ${props.icon} text-2xl`}></i>
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-2">{props.title}</h3>
      <p class="text-gray-600 text-sm">{props.description}</p>
    </div>
  )
}

/**
 * Компонент карточки API эндпоинта
 */
const EndpointCard = (props: {
  method: string
  path: string
  title: string
  description: string
  params?: Array<{ name: string; type: string; description: string }>
  isPost?: boolean
}) => {
  const methodColor = props.isPost ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
  
  return (
    <div class="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div class="flex items-start justify-between mb-4">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <span class={`px-3 py-1 rounded text-xs font-bold ${methodColor}`}>
              {props.method}
            </span>
            <code class="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
              {props.path}
            </code>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-1">{props.title}</h3>
          <p class="text-gray-600 text-sm">{props.description}</p>
        </div>
      </div>
      
      {props.params && props.params.length > 0 && (
        <div class="mt-4 pt-4 border-t">
          <h4 class="text-sm font-semibold text-gray-700 mb-2">Параметры:</h4>
          <div class="space-y-2">
            {props.params.map(param => (
              <div key={param.name} class="flex items-start text-sm">
                <code class="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs mr-2">
                  {param.name}
                </code>
                <span class="text-gray-500 text-xs mr-2">({param.type})</span>
                <span class="text-gray-600 text-xs">{param.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

