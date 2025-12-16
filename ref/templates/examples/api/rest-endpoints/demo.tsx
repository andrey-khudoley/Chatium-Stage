// @shared
import { jsx } from "@app/html-jsx"

/**
 * Демо-страница для REST API примеров
 */
export const restApiExampleRoute = app.get('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>REST API Examples</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* TailwindCSS */}
        <script src="https://cdn.tailwindcss.com/3.4.16"></script>
        {/* FontAwesome Icons */}
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" rel="stylesheet" />
        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`body { font-family: 'Inter', sans-serif; }`}</style>
      </head>
      <body class="bg-gray-50">
        <div class="min-h-screen">
          {/* Header */}
          <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <a href="/doc/templates" class="text-gray-600 hover:text-blue-600 transition mr-4">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Назад к примерам
                  </a>
                </div>
                <div class="text-sm text-gray-500">
                  <i class="fas fa-server mr-2"></i>
                  REST API Examples
                </div>
              </div>
            </div>
          </header>

          {/* Hero */}
          <section class="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div class="inline-block p-4 bg-white/10 rounded-full mb-6">
                <i class="fas fa-code text-6xl"></i>
              </div>
              <h1 class="text-5xl font-bold mb-4">
                REST API Примеры
              </h1>
              <p class="text-xl text-green-100 max-w-3xl mx-auto">
                Готовые примеры RESTful эндпоинтов: CRUD операции, валидация, 
                обработка ошибок, middleware и многое другое
              </p>
            </div>
          </section>

          {/* Examples */}
          <section class="py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Доступные эндпоинты
              </h2>
              
              <div class="space-y-4">
                <div class="bg-white border rounded-lg p-6">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <span class="px-3 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                          GET
                        </span>
                        <code class="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                          /basic-crud
                        </code>
                      </div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">Базовый CRUD</h3>
                      <p class="text-gray-600 text-sm">Пример базовых CRUD операций</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white border rounded-lg p-6">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <span class="px-3 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                          GET
                        </span>
                        <code class="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                          /query-params
                        </code>
                      </div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">Query параметры</h3>
                      <p class="text-gray-600 text-sm">Работа с параметрами запроса</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white border rounded-lg p-6">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <span class="px-3 py-1 rounded text-xs font-bold bg-green-100 text-green-700">
                          POST
                        </span>
                        <code class="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                          /validation
                        </code>
                      </div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">Валидация данных</h3>
                      <p class="text-gray-600 text-sm">Валидация тела запроса с использованием схемы</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white border rounded-lg p-6">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <span class="px-3 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                          GET
                        </span>
                        <code class="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                          /error-demo/:type
                        </code>
                      </div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">Обработка ошибок</h3>
                      <p class="text-gray-600 text-sm">Примеры различных типов ошибок и их обработка</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white border rounded-lg p-6">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <span class="px-3 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                          GET
                        </span>
                        <code class="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                          /cookies-headers
                        </code>
                      </div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">Куки и заголовки</h3>
                      <p class="text-gray-600 text-sm">Работа с HTTP куками и заголовками</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white border rounded-lg p-6">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <span class="px-3 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                          GET
                        </span>
                        <code class="text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">
                          /rate-limit
                        </code>
                      </div>
                      <h3 class="text-lg font-semibold text-gray-900 mb-1">Rate Limiting</h3>
                      <p class="text-gray-600 text-sm">Ограничение частоты запросов (5 запросов в минуту)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer class="bg-gray-800 text-white py-8">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <a 
                href="/doc/templates" 
                class="text-blue-400 hover:text-blue-300 transition"
              >
                <i class="fas fa-arrow-left mr-2"></i>
                Вернуться к примерам
              </a>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
})


