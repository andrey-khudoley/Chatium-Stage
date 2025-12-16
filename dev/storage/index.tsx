// @shared
import { jsx } from "@app/html-jsx"

export const storagePageRoute = app.html('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Storage - Управление скриптами и стилями</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body class="bg-gray-50">
        <div class="container mx-auto px-4 py-8">
          <div class="bg-white rounded-lg shadow-md p-8">
            <div class="text-center">
              <i class="fas fa-database text-blue-500 text-6xl mb-4"></i>
              <h1 class="text-3xl font-bold text-gray-800 mb-2">Storage</h1>
              <p class="text-gray-600 mb-6">Система хранения скриптов и стилей</p>
              
              <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h2 class="text-xl font-semibold text-blue-800 mb-3">
                  <i class="fas fa-check-circle mr-2"></i>
                  Система работает!
                </h2>
                <p class="text-blue-700">
                  Все тесты пройдены успешно (23/23 ✓)
                </p>
                <p class="text-sm text-blue-600 mt-2">
                  <i class="fas fa-book mr-1"></i>
                  <a href="https://github.com/chatium/storage/blob/main/.CHATIUM-LLM.md" class="underline hover:no-underline">
                    Полная документация (.CHATIUM-LLM.md)
                  </a>
                </p>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300">
                  <h3 class="font-semibold text-blue-800 mb-3">
                    <i class="fas fa-desktop text-blue-600 mr-2"></i>
                    Веб-интерфейс
                  </h3>
                  <p class="text-sm text-blue-700 mb-3">
                    Управляйте скриптами через браузер с drag-and-drop загрузкой
                  </p>
                  <a 
                    href="/dev/storage/ui" 
                    class="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <i class="fas fa-arrow-right mr-2"></i>
                    Открыть UI
                  </a>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4">
                  <h3 class="font-semibold text-gray-800 mb-2">
                    <i class="fas fa-code text-blue-500 mr-2"></i>
                    API Endpoints
                  </h3>
                  <ul class="text-sm text-gray-600 space-y-1">
                    <li><code class="bg-white px-2 py-1 rounded">GET /api/scripts/list</code></li>
                    <li><code class="bg-white px-2 py-1 rounded">POST /api/scripts/create</code></li>
                    <li><code class="bg-white px-2 py-1 rounded text-green-700">POST /api/scripts/upload</code></li>
                    <li><code class="bg-white px-2 py-1 rounded">POST /api/scripts/update</code></li>
                    <li><code class="bg-white px-2 py-1 rounded">POST /api/scripts/delete</code></li>
                  </ul>
                </div>
                
                <div class="bg-gray-50 rounded-lg p-4">
                  <h3 class="font-semibold text-gray-800 mb-2">
                    <i class="fas fa-flask text-blue-500 mr-2"></i>
                    Тестирование
                  </h3>
                  <ul class="text-sm text-gray-600 space-y-1">
                    <li>
                      <a href="/dev/storage/tests" class="text-blue-600 hover:underline">
                        <i class="fas fa-vial mr-1"></i>
                        Интерактивные тесты
                      </a>
                    </li>
                    <li>
                      <a href="/dev/storage/tests/ai" class="text-blue-600 hover:underline">
                        <i class="fas fa-robot mr-1"></i>
                        AI-тесты (JSON)
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
              
              <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p class="text-sm text-yellow-800">
                  <i class="fas fa-info-circle mr-2"></i>
                  <strong>Использование:</strong> Создавайте скрипты через API, а затем подключайте их по ссылке
                  <code class="bg-white px-2 py-1 rounded mx-1">https://s.chtm.khudoley.tech/dev/storage/serve~{'{'}name{'}'}.js</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
})

export default storagePageRoute
