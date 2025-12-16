// @shared
import { jsx } from "@app/html-jsx"

// Импортируем все роуты примеров
import { landingPageExampleRoute } from './examples/basic/landing-page'
import { authExampleRoute } from './examples/basic/auth-example'
import { formsExampleRoute } from './examples/basic/forms'
import { heapTablesExampleRoute } from './examples/data/heap-tables'
import { externalTablesUIRoute } from './examples/data/external-tables-example'
import { restApiExampleRoute } from './examples/api/rest-endpoints/demo'
import { getcourseExampleRoute } from './examples/integrations/getcourse'
import { websocketExampleRoute } from './examples/integrations/websocket/demo'
import { filesExampleRoute } from './examples/integrations/files/demo'
import { apiExampleRoute } from './examples/integrations/api/demo'

/**
 * Главная страница проекта с примерами и ссылками на все категории
 */
export const templatesIndexPageRoute = app.get('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Примеры и шаблоны кода Chatium</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="/s/metric/clarity.js"></script>
        
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
        <style type="text/tailwindcss">{`
          body {
            --color-primary: #3b82f6;
            --color-secondary: #8b5cf6;
            --color-accent: #10b981;
          }
        `}</style>

        {/* Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style type="text/tailwindcss">{`
          --font-sans: Inter, sans-serif;
        `}</style>

        {/* FontAwesome Icons */}
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" rel="stylesheet" />
      </head>
      <body class="bg-gray-50">
        <div class="min-h-screen">
          {/* Header */}
          <header class="bg-white shadow-sm border-b">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="flex justify-between items-center py-6">
                <div class="flex items-center">
                  <div class="text-2xl font-bold text-primary">
                    <i class="fas fa-code mr-2"></i>
                    Chatium Examples
                  </div>
                </div>
                <nav class="flex space-x-6">
                  <a href="#examples" class="text-gray-600 hover:text-primary transition">Примеры</a>
                  <a href="#docs" class="text-gray-600 hover:text-primary transition">Документация</a>
                  <a href="#about" class="text-gray-600 hover:text-primary transition">О проекте</a>
                </nav>
              </div>
            </div>
          </header>

          {/* Hero Section */}
          <section class="bg-gradient-to-r from-primary to-secondary text-white py-20">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 class="text-5xl font-bold mb-6">
                Коллекция примеров кода Chatium
              </h1>
              <p class="text-xl mb-8 max-w-3xl mx-auto">
                Исчерпывающая подборка практических примеров для разработки на платформе Chatium. 
                От базовых компонентов до сложных интеграций - всё, что нужно для создания современных приложений.
              </p>
              <div class="flex justify-center space-x-4">
                <a href="#examples" class="bg-white text-primary px-8 py-3 rounded-lg text-lg hover:bg-gray-100 transition font-semibold">
                  <i class="fas fa-rocket mr-2"></i>
                  Начать изучение
                </a>
                <a href="https://github.com/chatium/examples" class="border-2 border-white px-8 py-3 rounded-lg text-lg hover:bg-white hover:text-primary transition font-semibold">
                  <i class="fab fa-github mr-2"></i>
                  GitHub
                </a>
              </div>
            </div>
          </section>

          {/* Features */}
          <section class="py-16 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Что включено в эту коллекцию
              </h2>
              <div class="grid md:grid-cols-3 gap-8">
                <div class="text-center">
                  <div class="text-5xl text-primary mb-4">
                    <i class="fas fa-laptop-code"></i>
                  </div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-2">Ready-to-Use код</h3>
                  <p class="text-gray-600">
                    Все примеры протестированы и готовы к использованию в production среде
                  </p>
                </div>
                <div class="text-center">
                  <div class="text-5xl text-secondary mb-4">
                    <i class="fas fa-brain"></i>
                  </div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-2">Лучшие практики</h3>
                  <p class="text-gray-600">
                    Код написан с использованием современных подходов и паттернов разработки
                  </p>
                </div>
                <div class="text-center">
                  <div class="text-5xl text-accent mb-4">
                    <i class="fas fa-puzzle-piece"></i>
                  </div>
                  <h3 class="text-xl font-semibold text-gray-900 mb-2">Модульность</h3>
                  <p class="text-gray-600">
                    Легко комбинировать примеры для создания сложных решений
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Examples Categories */}
          <section id="examples" class="py-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Категории примеров
              </h2>
              
              {/* Basic Examples */}
              <div class="mb-12">
                <h3 class="text-2xl font-semibold text-gray-800 mb-6">
                  <i class="fas fa-book mr-2 text-primary"></i>
                  Базовые примеры
                </h3>
                <div class="grid md:grid-cols-2 gap-6">
                  <ExampleCard
                    title="Landing Page"
                    description="Современный лендинг с TailwindCSS, адаптивным дизайном, продуктовыми карточками и ценами"
                    icon="fa-solid fa-globe"
                    route={landingPageExampleRoute}
                    tags={["Vue", "TailwindCSS", "Responsive"]}
                  />
                  <ExampleCard
                    title="Авторизация и пользователи"
                    description="Примеры работы с пользователями, разные уровни доступа, middleware"
                    icon="fa-solid fa-user-shield"
                    route={authExampleRoute}
                    tags={["Authentication", "Middleware", "Roles"]}
                  />
                  <ExampleCard
                    title="Формы и валидация"
                    description="Примеры создания форм с валидацией, обработкой данных и отправкой"
                    icon="fa-solid fa-keyboard"
                    route={formsExampleRoute}
                    tags={["Forms", "Validation", "Input"]}
                  />
                </div>
              </div>

              {/* Data Examples */}
              <div class="mb-12">
                <h3 class="text-2xl font-semibold text-gray-800 mb-6">
                  <i class="fas fa-database mr-2 text-secondary"></i>
                  Работа с данными
                </h3>
                <div class="grid md:grid-cols-2 gap-6">
                  <ExampleCard
                    title="Heap Tables CRUD"
                    description="Полный набор CRUD операций с таблицами, фильтрация, сортировка, пагинация"
                    icon="fa-solid fa-table"
                    route={heapTablesExampleRoute}
                    tags={["CRUD", "Database", "Pagination"]}
                  />
                  <ExampleCard
                    title="External Tables"
                    description="Работа с таблицами из других воркспейсов, синхронизация данных"
                    icon="fa-solid fa-link"
                    route={externalTablesUIRoute}
                    tags={["External Data", "Sync", "Integration"]}
                  />
                </div>
              </div>

              {/* API Examples */}
              <div class="mb-12">
                <h3 class="text-2xl font-semibold text-gray-800 mb-6">
                  <i class="fas fa-cogs mr-2 text-accent"></i>
                  API и маршрутизация
                </h3>
                <div class="grid md:grid-cols-2 gap-6">
                  <ExampleCard
                    title="REST API"
                    description="Примеры создания RESTful эндпоинтов, валидация, обработка ошибок"
                    icon="fa-solid fa-server"
                    route={restApiExampleRoute}
                    tags={["REST", "API", "Validation"]}
                  />
                  <ExampleCard
                    title="Route Parameters"
                    description="Работа с параметрами маршрутов, query параметрами, middleware"
                    icon="fa-solid fa-route"
                    route={restApiExampleRoute}
                    tags={["Routing", "Parameters", "Middlewares"]}
                  />
                </div>
              </div>

              {/* Integrations */}
              <div class="mb-12">
                <h3 class="text-2xl font-semibold text-gray-800 mb-6">
                  <i class="fas fa-plug mr-2 text-indigo-600"></i>
                  Интеграции
                </h3>
                <div class="grid md:grid-cols-2 gap-6">
                  <ExampleCard
                    title="Getcourse API"
                    description="Полноценная интеграция с Getcourse, аналитика, синхронизация пользователей"
                    icon="fa-solid fa-graduation-cap"
                    route={getcourseExampleRoute}
                    tags={["Getcourse", "Analytics", "Sync"]}
                  />
                  <ExampleCard
                    title="WebSocket & Real-time"
                    description="Real-time коммуникации, чаты, уведомления и live-обновления данных"
                    icon="fa-solid fa-circle-nodes"
                    route={websocketExampleRoute}
                    tags={["WebSocket", "Real-time", "Chat"]}
                  />
                  <ExampleCard
                    title="Работа с файлами"
                    description="Загрузка, хранение и управление файлами, изображениями и документами"
                    icon="fa-solid fa-file-upload"
                    route={filesExampleRoute}
                    tags={["Files", "Upload", "Storage"]}
                  />
                  <ExampleCard
                    title="API Integration"
                    description="Примеры интеграции с внешними API сервисами"
                    icon="fa-solid fa-network-wired"
                    route={apiExampleRoute}
                    tags={["API", "Integration", "HTTP"]}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Quick Start Guide */}
          <section class="py-16 bg-gray-100">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Как начать работать с примерами
              </h2>
              <div class="grid md:grid-cols-4 gap-8">
                <div class="text-center">
                  <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    1
                  </div>
                  <h3 class="font-semibold text-gray-900 mb-2">Выберите пример</h3>
                  <p class="text-gray-600 text-sm">
                    Найдите нужный пример в зависимости от вашей задачи и требований
                  </p>
                </div>
                <div class="text-center">
                  <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    2
                  </div>
                  <h3 class="font-semibold text-gray-900 mb-2">Скопируйте код</h3>
                  <p class="text-gray-600 text-sm">
                    Скопируйте пример в ваш проект или используйте его как шаблон
                  </p>
                </div>
                <div class="text-center">
                  <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    3
                  </div>
                  <h3 class="font-semibold text-gray-900 mb-2">Адаптируйте</h3>
                  <p class="text-gray-600 text-sm">
                    Модифицируйте код под ваши конкретные требования и дизайн
                  </p>
                </div>
                <div class="text-center">
                  <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    4
                  </div>
                  <h3 class="font-semibold text-gray-900 mb-2">Развертывание</h3>
                  <p class="text-gray-600 text-sm">
                    Запустите приложение и наслаждайтесь результатом
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Technologies */}
          <section id="docs" class="py-16 bg-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 class="text-3xl font-bold text-center text-gray-900 mb-12">
                Используемые технологии
              </h2>
              <div class="grid md:grid-cols-3 gap-8">
                <div class="text-center p-6 border rounded-lg">
                  <div class="text-4xl text-green-600 mb-4">
                    <i class="fab fa-vuejs"></i>
                  </div>
                  <h3 class="font-semibold text-gray-900 mb-2">Vue.js 3</h3>
                  <p class="text-gray-600 text-sm">
                    Composition API, реактивность, современная экосистема
                  </p>
                </div>
                <div class="text-center p-6 border rounded-lg">
                  <div class="text-4xl text-blue-600 mb-4">
                    <i class="fab fa-js"></i>
                  </div>
                  <h3 class="font-semibold text-gray-900 mb-2">TypeScript</h3>
                  <p class="text-gray-600 text-sm">
                    Полная типизация, безопасность кода, улучшенная разработка
                  </p>
                </div>
                <div class="text-center p-6 border rounded-lg">
                  <div class="text-4xl text-cyan-600 mb-4">
                    <i class="fab fa-css3"></i>
                  </div>
                  <h3 class="font-semibold text-gray-900 mb-2">TailwindCSS</h3>
                  <p class="text-gray-600 text-sm">
                    Utility-first CSS, адаптивный дизайн, кастомные темы
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer id="about" class="bg-gray-800 text-white py-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="grid md:grid-cols-4 gap-8">
                <div>
                  <h3 class="text-xl font-bold mb-4">Chatium Examples</h3>
                  <p class="text-gray-400 text-sm">
                    Коллекция практических примеров для разработки на платформе Chatium
                  </p>
                </div>
                <div>
                  <h4 class="font-semibold mb-4">Категории</h4>
                  <ul class="space-y-2 text-gray-400 text-sm">
                    <li><a href="#examples" class="hover:text-white transition">Базовые примеры</a></li>
                    <li><a href="#examples" class="hover:text-white transition">Работа с данными</a></li>
                    <li><a href="#examples" class="hover:text-white transition">API</a></li>
                    <li><a href="#examples" class="hover:text-white transition">Интеграции</a></li>
                  </ul>
                </div>
                <div>
                  <h4 class="font-semibold mb-4">Технологии</h4>
                  <ul class="space-y-2 text-gray-400 text-sm">
                    <li><a href="#docs" class="hover:text-white transition">Vue.js</a></li>
                    <li><a href="#docs" class="hover:text-white transition">TypeScript</a></li>
                    <li><a href="#docs" class="hover:text-white transition">TailwindCSS</a></li>
                    <li><a href="#docs" class="hover:text-white transition">Chatium</a></li>
                  </ul>
                </div>
                <div>
                  <h4 class="font-semibold mb-4">Ресурсы</h4>
                  <ul class="space-y-2 text-gray-400 text-sm">
                    <li><a href="https://github.com/chatium/examples" class="hover:text-white transition">GitHub</a></li>
                    <li><a href="https://docs.chatium.ru" class="hover:text-white transition">Документация</a></li>
                    <li><a href="https://chatium.ru" class="hover:text-white transition">Chatium</a></li>
                    <li><a href="/README.md" class="hover:text-white transition">Описание проекта</a></li>
                  </ul>
                </div>
              </div>
              <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
                <p>&copy; 2024 Chatium. Все примеры предоставлены "как есть" для образовательных целей.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
})

/**
 * Компонент карточки примера с описанием, иконой и тегами
 */
const ExampleCard = (props: {
  title: string
  description: string
  icon: string
  route: any
  tags: string[]
}) => {
  return (
    <div class="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
      <div class="flex items-start mb-4">
        <div class="text-3xl text-primary mr-4">
          <i class={props.icon}></i>
        </div>
        <div class="flex-1">
          <h4 class="text-xl font-semibold text-gray-900 mb-2">{props.title}</h4>
          <p class="text-gray-600 mb-4">{props.description}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            {props.tags.map(tag => (
              <span key={tag} class="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {tag}
              </span>
            ))}
          </div>
          <a 
            href={props.route.url()}
            class="text-primary hover:text-blue-600 font-medium"
          >
            Посмотреть пример →
          </a>
        </div>
      </div>
    </div>
  )
}
