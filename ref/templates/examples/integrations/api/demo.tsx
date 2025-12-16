// @shared
import { jsx } from "@app/html-jsx"

/**
 * Главная страница примеров API интеграций
 */
export const apiExampleRoute = app.get('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>API Integration Examples</title>
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
                  <a href="/doc/templates" class="text-gray-600 hover:text-primary transition mr-4">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Назад к примерам
                  </a>
                </div>
                <div class="text-sm text-gray-500">
                  <i class="fas fa-network-wired mr-2"></i>
                  API Интеграции
                </div>
              </div>
            </div>
          </header>

          {/* Hero */}
          <section class="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <div class="inline-block p-4 bg-white/10 rounded-full mb-6">
                <i class="fas fa-plug text-6xl"></i>
              </div>
              <h1 class="text-5xl font-bold mb-4">
                API Интеграции
              </h1>
              <p class="text-xl text-blue-100 max-w-3xl mx-auto">
                Примеры интеграций с популярными внешними API сервисами: 
                Telegram, VK, Email, и другие
              </p>
            </div>
          </section>

          {/* Examples */}
          <section class="py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Доступные примеры
              </h2>
              
              <div class="grid md:grid-cols-2 gap-6">
                <div class="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div class="flex items-start">
                    <div class="text-3xl text-blue-600 mr-4">
                      <i class="fab fa-telegram"></i>
                    </div>
                    <div>
                      <h3 class="text-xl font-semibold text-gray-900 mb-2">Telegram Bot API</h3>
                      <p class="text-gray-600 mb-4">
                        Отправка сообщений, работа с ботами, обработка callback
                      </p>
                      <code class="text-sm bg-gray-100 px-2 py-1 rounded">
                        POST /integrations/telegram/send
                      </code>
                    </div>
                  </div>
                </div>

                <div class="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div class="flex items-start">
                    <div class="text-3xl text-blue-800 mr-4">
                      <i class="fab fa-vk"></i>
                    </div>
                    <div>
                      <h3 class="text-xl font-semibold text-gray-900 mb-2">VK API</h3>
                      <p class="text-gray-600 mb-4">
                        Публикация постов, работа с группами, получение информации
                      </p>
                      <code class="text-sm bg-gray-100 px-2 py-1 rounded">
                        POST /integrations/vk/post
                      </code>
                    </div>
                  </div>
                </div>

                <div class="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div class="flex items-start">
                    <div class="text-3xl text-red-600 mr-4">
                      <i class="fas fa-envelope"></i>
                    </div>
                    <div>
                      <h3 class="text-xl font-semibold text-gray-900 mb-2">Email (SMTP)</h3>
                      <p class="text-gray-600 mb-4">
                        Отправка email через SMTP, работа с шаблонами
                      </p>
                      <code class="text-sm bg-gray-100 px-2 py-1 rounded">
                        POST /integrations/email/send
                      </code>
                    </div>
                  </div>
                </div>

                <div class="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <div class="flex items-start">
                    <div class="text-3xl text-green-600 mr-4">
                      <i class="fab fa-whatsapp"></i>
                    </div>
                    <div>
                      <h3 class="text-xl font-semibold text-gray-900 mb-2">WhatsApp Business API</h3>
                      <p class="text-gray-600 mb-4">
                        Отправка сообщений через WhatsApp Business
                      </p>
                      <code class="text-sm bg-gray-100 px-2 py-1 rounded">
                        POST /integrations/whatsapp/send
                      </code>
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


