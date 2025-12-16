// @shared
import { jsx } from "@app/html-jsx"
import { requireAccountRole } from '@app/auth'

/**
 * ВАЖНО: Работа с внешними таблицами из пользовательского кода
 * пока не реализована в платформе Chatium.
 * 
 * Этот пример показывает концепцию, но не является рабочим кодом.
 * 
 * Для работы с данными из других воркспейсов используйте:
 * 1. API endpoints в смежных воркспейсах
 * 2. Прямые HTTP запросы между воркспейсами
 * 3. Общие таблицы в родительском воркспейсе
 */

// Информационная страница о работе с внешними таблицами
export const externalTablesUIRoute = app.html('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>External Tables - Информация</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com/3.4.16"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" rel="stylesheet" />
      </head>
      <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center p-4">
          <div class="max-w-3xl w-full">
            {/* Info Card */}
            <div class="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header */}
              <div class="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
                <div class="flex items-center justify-center mb-4">
                  <i class="fas fa-database text-6xl opacity-80"></i>
                </div>
                <h1 class="text-3xl font-bold text-center mb-2">
                  Работа с внешними таблицами
                </h1>
                <p class="text-center text-blue-100">
                  Информация о доступе к данным из других воркспейсов
                </p>
              </div>

              {/* Content */}
              <div class="p-8">
                {/* Warning Notice */}
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <i class="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm text-yellow-700">
                        <strong>Важно:</strong> Прямой доступ к внешним таблицам из пользовательского кода 
                        пока не реализован в платформе Chatium.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Current Status */}
                <div class="mb-8">
                  <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                    Текущий статус
                  </h2>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <ul class="space-y-2 text-gray-700">
                      <li class="flex items-start">
                        <i class="fas fa-times-circle text-red-500 mt-1 mr-3"></i>
                        <span>Модуль <code class="bg-gray-200 px-2 py-1 rounded text-sm">@app/external-tables</code> не существует</span>
                      </li>
                      <li class="flex items-start">
                        <i class="fas fa-times-circle text-red-500 mt-1 mr-3"></i>
                        <span>Функции <code class="bg-gray-200 px-2 py-1 rounded text-sm">listExternalTables()</code> и <code class="bg-gray-200 px-2 py-1 rounded text-sm">readExternalTable()</code> недоступны</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Alternative Solutions */}
                <div class="mb-8">
                  <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                    Альтернативные решения
                  </h2>
                  
                  <div class="space-y-4">
                    {/* Solution 1 */}
                    <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 class="font-semibold text-gray-800 mb-2 flex items-center">
                        <span class="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">1</span>
                        API Endpoints в смежных воркспейсах
                      </h3>
                      <p class="text-gray-600 text-sm ml-11">
                        Создайте API endpoints в смежном воркспейсе и вызывайте их через HTTP запросы.
                      </p>
                      <div class="mt-3 ml-11">
                        <code class="block bg-gray-800 text-gray-100 p-3 rounded text-xs overflow-x-auto">
{`// В смежном воркспейсе /dev/analytics
export const dataRoute = app.get('/api/data', async (ctx) => {
  const data = await MyTable.findAll(ctx, {limit: 100})
  return { data }
})

// В вашем воркспейсе
import { request } from "@app/request"
const response = await request({
  url: 'https://your-domain.ru/dev/analytics/api/data',
  method: 'get'
})`}
                        </code>
                      </div>
                    </div>

                    {/* Solution 2 */}
                    <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 class="font-semibold text-gray-800 mb-2 flex items-center">
                        <span class="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">2</span>
                        Использование общих таблиц
                      </h3>
                      <p class="text-gray-600 text-sm ml-11">
                        Создайте таблицы в родительском воркспейсе, доступном для всех дочерних воркспейсов.
                      </p>
                    </div>

                    {/* Solution 3 */}
                    <div class="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 class="font-semibold text-gray-800 mb-2 flex items-center">
                        <span class="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm font-bold">3</span>
                        Синхронизация данных через Jobs
                      </h3>
                      <p class="text-gray-600 text-sm ml-11">
                        Настройте периодическую синхронизацию данных между воркспейсами через отложенные задачи (Jobs).
                      </p>
                    </div>
                  </div>
                </div>

                {/* Example Code */}
                <div class="mb-6">
                  <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <i class="fas fa-code text-green-500 mr-2"></i>
                    Пример рабочего решения
                  </h2>
                  <div class="bg-gray-800 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre class="text-xs">{`// Смежный воркспейс: /dev/analytics/api/products.ts
import ProductsTable from "../tables/products.table"

export const apiProductsRoute = app.get('/api/products', async (ctx, req) => {
  const { limit = 100, offset = 0 } = req.query
  const products = await ProductsTable.findAll(ctx, {
    limit: Number(limit),
    offset: Number(offset)
  })
  return { products }
})

// Ваш воркспейс: /your-workspace/api/sync.ts
import { request } from "@app/request"

export const syncProductsRoute = app.post('/sync-products', async (ctx, req) => {
  try {
    const response = await request({
      url: 'https://your-domain.ru/dev/analytics/api/products',
      method: 'get',
      searchParams: {
        limit: '100',
        offset: '0'
      }
    })
    
    // Обработка полученных данных
    const products = response.body.products
    
    // Сохранение в локальную таблицу если нужно
    // for (const product of products) {
    //   await LocalProductsTable.create(ctx, product)
    // }
    
    return { success: true, count: products.length }
  } catch (error) {
    return { success: false, error: error.message }
  }
})`}</pre>
                  </div>
                </div>

                {/* Back Button */}
                <div class="flex justify-center pt-4">
                  <a 
                    href="/"
                    class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <i class="fas fa-arrow-left mr-2"></i>
                    Вернуться к примерам
                  </a>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div class="mt-6 text-center text-sm text-gray-600">
              <p>
                <i class="fas fa-question-circle mr-1"></i>
                Нужна помощь? Обратитесь в поддержку Chatium для получения актуальной информации о работе с данными.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
})
