<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <nav class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <div class="text-2xl font-bold text-primary">Chatium</div>
          <div class="hidden md:flex space-x-6">
            <a href="#features" class="text-gray-600 hover:text-primary transition">Возможности</a>
            <a href="#pricing" class="text-gray-600 hover:text-primary transition">Тарифы</a>
            <a href="#contact" class="text-gray-600 hover:text-primary transition">Контакты</a>
          </div>
          <button class="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition">
            Начать
          </button>
        </div>
      </nav>
    </header>

    <!-- Hero Section -->
    <section class="container mx-auto px-4 py-20">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h1 class="text-5xl font-bold text-gray-800 mb-6">
            Создавайте веб-приложения быстро и легко
          </h1>
          <p class="text-xl text-gray-600 mb-8">
            Платформа Chatium позволяет разрабатывать современные приложения с использованием Vue.js и TypeScript без необходимости управлять инфраструктурой.
          </p>
          <div class="flex space-x-4">
            <button class="bg-primary text-white px-8 py-3 rounded-lg text-lg hover:bg-blue-600 transition">
              <i class="fas fa-rocket mr-2"></i>
              начать бесплатно
            </button>
            <button class="border-2 border-primary text-primary px-8 py-3 rounded-lg text-lg hover:bg-blue-50 transition">
              <i class="fas fa-play-circle mr-2"></i>
              посмотреть демо
            </button>
          </div>
        </div>
        <div class="text-center">
          <img src="https://picsum.photos/seed/chatium-hero/600/400.jpg" alt="Chatium Platform" class="rounded-lg shadow-xl" />
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 bg-white">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold text-center text-gray-800 mb-16">
          Возможности платформы
        </h2>
        <div class="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="fas fa-bolt"
            title="Быстрая разработка"
            description="Создавайте приложения с готовыми компонентами и инструментами"
          />
          <FeatureCard
            icon="fas fa-database"
            title="База данных"
            description="Встроенные таблицы для хранения и управления данными"
          />
          <FeatureCard
            icon="fas fa-shield-alt"
            title="Безопасность"
            description=" enterprise-уровень безопасности для ваших данных"
          />
          <FeatureCard
            icon="fas fa-code"
            title="Vue.js & TypeScript"
            description="Современные технологии для фронтенда"
          />
          <FeatureCard
            icon="fas fa-cogs"
            title="Автоматизация"
            description="Автоматизация бизнес-процессов и рабочих процессов"
          />
          <FeatureCard
            icon="fas fa-plug"
            title="Интеграции"
            description="Подключение внешних сервисов и API"
          />
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="py-20 bg-gray-50">
      <div class="container mx-auto px-4">
        <h2 class="text-4xl font-bold text-center text-gray-800 mb-16">
          Тарифные планы
        </h2>
        <div class="grid md:grid-cols-3 gap-8">
          <PricingCard
            title="Старт"
            price="0"
            :features="[
              'До 1000 записей в таблицах',
              '5 страниц сайта', 
              'Базовая поддержка',
              'Chatium поддомен'
            ]"
            :isPopular="false"
          />
          <PricingCard
            title="Про"
            price="49"
            :features="[
              'Неограниченные записи',
              'Безлимитное количество страниц',
              'Приоритетная поддержка',
              'Собственный домен',
              'API доступ',
              'Автоматизация'
            ]"
            :isPopular="true"
          />
          <PricingCard
            title="Enterprise"
            price="199"
            :features="[
              'Все возможности Pro',
              'Выделенная инфраструктура',
              'SLA 99.9%',
              'Персональный менеджер',
              'Кастомные интеграции'
            ]"
            :isPopular="false"
          />
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="py-20 bg-primary text-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-4xl font-bold mb-8">
          Готовы начать?
        </h2>
        <p class="text-xl mb-8">
          Присоединяйтесь к тысячам разработчиков, уже использующих Chatium
        </p>
        <button class="bg-white text-primary px-8 py-3 rounded-lg text-lg hover:bg-gray-100 transition">
          <i class="fas fa-arrow-right mr-2"></i>
          Создать аккаунт
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12">
      <div class="container mx-auto px-4">
        <div class="grid md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-xl font-bold mb-4">Chatium</h3>
            <p class="text-gray-400">
              Платформа для быстрой разработки веб-приложений
            </p>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Продукт</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white transition">Возможности</a></li>
              <li><a href="#" class="hover:text-white transition">Тарифы</a></li>
              <li><a href="#" class="hover:text-white transition">Документация</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Компания</h4>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#" class="hover:text-white transition">О нас</a></li>
              <li><a href="#" class="hover:text-white transition">Блог</a></li>
              <li><a href="#" class="hover:text-white transition">Карьера</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-semibold mb-4">Подписка</h4>
            <p class="text-gray-400 mb-4">Получайте новости и обновления</p>
            <div class="flex">
              <input 
                type="email" 
                placeholder="Email" 
                class="px-4 py-2 rounded-l-lg text-gray-800 flex-1"
              />
              <button class="bg-primary px-4 py-2 rounded-r-lg hover:bg-blue-600 transition">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
        <div class="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Chatium. Все права защищены.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import FeatureCard from './FeatureCard.vue'
import PricingCard from './PricingCard.vue'
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>