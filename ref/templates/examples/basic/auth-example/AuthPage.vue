<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-primary">Примеры авторизации</h1>
          <div class="space-x-4">
            <a href="/" class="text-gray-600 hover:text-primary">Главная</a>
            <template v-if="hasUser">
              <a href="/profile" class="text-gray-600 hover:text-primary">Профиль</a>
              <a href="/admin" v-if="isAdmin" class="text-gray-600 hover:text-primary">Админ</a>
              <form method="post" action="/s/auth/sign-out" class="inline">
                <button type="submit" class="text-red-600 hover:text-red-800">Выйти</button>
              </form>
            </template>
            <a v-else href="/s/auth/signin?back=/" class="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600">
              Войти
            </a>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- User Info Card -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8" v-if="hasUser">
          <h2 class="text-2xl font-bold mb-4">Информация о пользователе</h2>
          <div class="grid md:grid-cols-2 gap-4">
            <div>
              <p class="text-gray-600">Имя:</p>
              <p class="font-semibold">{{ user.displayName }}</p>
            </div>
            <div>
              <p class="text-gray-600">ID:</p>
              <p class="font-mono text-sm">{{ user.id }}</p>
            </div>
            <div>
              <p class="text-gray-600">Роль:</p>
              <p class="font-semibold">{{ user.accountRole }}</p>
            </div>
            <div>
              <p class="text-gray-600">Тип:</p>
              <p class="font-semibold">{{ user.type }}</p>
            </div>
            <div>
              <p class="text-gray-600">Email:</p>
              <p class="font-semibold">{{ user.confirmedEmail || 'Не подтвержден' }}</p>
            </div>
            <div>
              <p class="text-gray-600">Телефон:</p>
              <p class="font-semibold">{{ user.confirmedPhone || 'Не подтвержден' }}</p>
            </div>
          </div>
          
          <div class="mt-6 flex space-x-4">
            <a href="/profile" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              <i class="fas fa-user mr-2"></i>
              Профиль
            </a>
            <a href="/admin" v-if="isAdmin" class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              <i class="fas fa-cog mr-2"></i>
              Админ-панель
            </a>
          </div>
        </div>

        <!-- Welcome Card for non-authenticated users -->
        <div class="bg-white rounded-lg shadow-md p-8 text-center" v-else>
          <h2 class="text-3xl font-bold mb-4">Добро пожаловать!</h2>
          <p class="text-gray-600 mb-6">
            Этот пример демонстрирует различные уровни доступа в системе:
          </p>
          
          <div class="grid md:grid-cols-3 gap-6 mt-8">
            <div class="bg-gray-50 p-6 rounded-lg">
              <div class="text-3xl mb-4">🌐</div>
              <h3 class="font-semibold mb-2">Публичный доступ</h3>
              <p class="text-gray-600 text-sm">
                Эта страница доступна всем пользователям
              </p>
            </div>
            
            <div class="bg-blue-50 p-6 rounded-lg">
              <div class="text-3xl mb-4">👤</div>
              <h3 class="font-semibold mb-2">Авторизованные</h3>
              <p class="text-gray-600 text-sm">
                Требуется авторизация для доступа к профилю
              </p>
            </div>
            
            <div class="bg-purple-50 p-6 rounded-lg">
              <div class="text-3xl mb-4">👑</div>
              <h3 class="font-semibold mb-2">Администраторы</h3>
              <p class="text-gray-600 text-sm">
                Только для пользователей с правами администратора
              </p>
            </div>
          </div>
          
          <div class="mt-8">
            <a href="/s/auth/signin?back=/" class="bg-primary text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-600">
              <i class="fas fa-sign-in-alt mr-2"></i>
              Войти в систему
            </a>
          </div>
        </div>

        <!-- Feature Cards -->
        <div class="grid md:grid-cols-2 gap-6 mt-8" v-if="hasUser">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 class="font-semibold text-blue-800 mb-2">
              <i class="fas fa-user-circle mr-2"></i>
              Профиль пользователя
            </h3>
            <p class="text-gray-700 mb-4">
              Страница профиля доступна только авторизованным пользователям
            </p>
            <a href="/profile" class="text-blue-600 hover:text-blue-800 font-medium">
              Перейти в профиль →
            </a>
          </div>

          <div class="bg-purple-50 border border-purple-200 rounded-lg p-6" v-if="isAdmin">
            <h3 class="font-semibold text-purple-800 mb-2">
              <i class="fas fa-shield-alt mr-2"></i>
              Админ-панель
            </h3>
            <p class="text-gray-700 mb-4">
              Доступна только пользователям с ролью администратора
            </p>
            <a href="/admin" class="text-purple-600 hover:text-purple-800 font-medium">
              Перейти в админ-панель →
            </a>
          </div>
          
          <div class="bg-gray-100 border border-gray-300 rounded-lg p-6" v-if="!isAdmin">
            <h3 class="font-semibold text-gray-700 mb-2">
              <i class="fas fa-lock mr-2"></i>
              Админ-панель
            </h3>
            <p class="text-gray-600 mb-4">
              У вас недостаточно прав для доступа к админ-панели
            </p>
            <span class="text-gray-500 text-sm">
              Требуется роль: Admin (ваша роль: {{ user.accountRole }})
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

// Композаблы для работы с пользователем
const user = ref(ctx.user || null)
const hasUser = computed(() => !!user.value)
const isAdmin = computed(() => user.value?.is('Admin') || false)

// Monitor auth state changes
onMounted(() => {
  // В реальном приложении здесь может быть логика отслеживания состояния авторизации
  console.log('Current user:', user.value)
})
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>