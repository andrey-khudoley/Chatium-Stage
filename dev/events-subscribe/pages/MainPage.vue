<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <i class="fas fa-bell text-primary text-2xl mr-3"></i>
            <span class="text-xl font-bold text-gray-800">События</span>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600">
              <i class="fas fa-user mr-1"></i>
              {{ ctx.user?.displayName }}
            </span>
          </div>
        </div>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          <i class="fas fa-stream text-primary mr-3"></i>
          Система мониторинга событий
        </h1>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Подписывайтесь на события из трафика и GetCourse, отслеживайте их в режиме реального времени
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-8 mb-12">
        <div class="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
          <div class="flex items-start mb-4">
            <i class="fas fa-chart-line text-4xl text-blue-500 mr-4"></i>
            <div>
              <h2 class="text-2xl font-semibold text-gray-800 mb-2">События трафика</h2>
              <p class="text-gray-600">
                Отслеживайте просмотры страниц, регистрации пользователей и пользовательские действия на вашем сайте
              </p>
            </div>
          </div>
          <ul class="space-y-2 text-gray-600 ml-16">
            <li><i class="fas fa-check text-green-500 mr-2"></i>Просмотры страниц (pageview)</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>Регистрации (registration)</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>Отправка форм (form_submit)</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>Клики по кнопкам и ссылкам</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>Работа с видео и корзиной</li>
            <li class="text-sm text-gray-500 italic">И еще 15+ типов событий...</li>
          </ul>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
          <div class="flex items-start mb-4">
            <i class="fas fa-graduation-cap text-4xl text-purple-500 mr-4"></i>
            <div>
              <h2 class="text-2xl font-semibold text-gray-800 mb-2">События GetCourse</h2>
              <p class="text-gray-600">
                Мониторьте создание заказов, изменение статусов, оплаты и действия пользователей в GetCourse
              </p>
            </div>
          </div>
          <ul class="space-y-2 text-gray-600 ml-16">
            <li><i class="fas fa-check text-green-500 mr-2"></i>Создание и оплата заказов</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>Регистрации пользователей</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>Прохождение уроков и тренингов</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>Привязка чат-ботов (Telegram, VK, WhatsApp)</li>
            <li><i class="fas fa-check text-green-500 mr-2"></i>Работа с вебинарами и сертификатами</li>
            <li class="text-sm text-gray-500 italic">И еще 20+ типов событий...</li>
          </ul>
        </div>
      </div>

      <div class="grid md:grid-cols-2 gap-6">
        <a 
          :href="settingsPageRoute.url()" 
          class="block bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-primary"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-semibold text-gray-800 mb-2">
                <i class="fas fa-cog text-primary mr-3"></i>
                Настройки подписок
              </h3>
              <p class="text-gray-600">
                Управляйте подписками на события
              </p>
            </div>
            <i class="fas fa-arrow-right text-3xl text-primary"></i>
          </div>
        </a>

        <a 
          :href="monitorPageRoute.url()" 
          class="block bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-secondary"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-2xl font-semibold text-gray-800 mb-2">
                <i class="fas fa-tv text-secondary mr-3"></i>
                Мониторинг событий
              </h3>
              <p class="text-gray-600">
                Просмотр событий в реальном времени
              </p>
            </div>
            <i class="fas fa-arrow-right text-3xl text-secondary"></i>
          </div>
        </a>
      </div>

      <div class="mt-12 bg-blue-50 rounded-lg p-8 border border-blue-200">
        <div class="flex items-start">
          <i class="fas fa-info-circle text-3xl text-blue-500 mr-4 mt-1"></i>
          <div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">Как это работает?</h3>
            <ol class="space-y-2 text-gray-700">
              <li><strong>1.</strong> Перейдите в настройки и подпишитесь на интересующие вас события</li>
              <li><strong>2.</strong> Откройте страницу мониторинга для просмотра событий в реальном времени</li>
              <li><strong>3.</strong> События обновляются автоматически через WebSocket соединение</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { settingsPageRoute } from '../settings'
import { monitorPageRoute } from '../monitor'
</script>