<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center py-4">
          <a :href="indexPageRoute.url()" class="flex items-center text-blue-600 hover:text-blue-800">
            <i class="fas fa-arrow-left mr-2"></i>
            Главная
          </a>
          <h1 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-wpforms mr-2 text-blue-600"></i>
            Примеры форм
          </h1>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid gap-8">
        
        <!-- Contact Form -->
        <ExampleSection title="Форма обратной связи">
          <div class="bg-white rounded-lg shadow border p-6">
            <form @submit.prevent="submitContactForm" class="space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                  <input v-model="contactForm.name" type="text" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input v-model="contactForm.email" type="email" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Тема</label>
                <select v-model="contactForm.topic" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="general">Общий вопрос</option>
                  <option value="support">Техническая поддержка</option>
                  <option value="partnership">Партнерство</option>
                  <option value="complaint">Жалоба</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Сообщение *</label>
                <textarea v-model="contactForm.message" required rows="4" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600">
                  <span class="mr-2">Категория:</span>
                  <StatusBadge status="info">{{ contactForm.topic }}</StatusBadge>
                </div>
                <button type="submit" :disabled="contactFormLoading"
                        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors">
                  <i class="fas fa-paper-plane mr-2"></i>
                  {{ contactFormLoading ? 'Отправка...' : 'Отправить' }}
                </button>
              </div>
            </form>
            
            <div v-if="contactFormResult" class="mt-6 p-4 rounded-lg" :class="contactFormResult.success === true ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <h4 class="font-semibold mb-2" :class="contactFormResult.success === true ? 'text-green-800' : 'text-red-800'">
                {{ contactFormResult.success === true ? '✅ Успешно' : '❌ Ошибка' }}
              </h4>
              <p class="text-sm" :class="contactFormResult.success === true ? 'text-green-600' : 'text-red-600'">
                {{ contactFormResult.message }}
              </p>
            </div>
          </div>
        </ExampleSection>

        <!-- Registration Form -->
        <ExampleSection title="Форма регистрации">
          <div class="bg-white rounded-lg shadow border p-6">
            <form @submit.prevent="submitRegistration" class="space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                  <input v-model="registerForm.firstName" type="text" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Фамилия *</label>
                  <input v-model="registerForm.lastName" type="text" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
              </div>
              
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input v-model="registerForm.email" type="email" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                  <input v-model="registerForm.phone" type="tel" placeholder="+7 (999) 123-45-67"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
                <input v-model="registerForm.password" type="password" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <p class="text-xs text-gray-500 mt-1">Минимум 8 символов</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль *</label>
                  <input v-model="registerForm.confirmPassword" type="password" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                </div>
              
              <div class="flex items-center">
                <input v-model="registerForm.agree" type="checkbox" id="terms" required class="mr-2">
                <label for="terms" class="text-sm text-gray-600">
                  Я согласен с <a href="/terms" class="text-blue-600 hover:underline">условиями использования</a>
                </label>
              </div>
              
              <div>
                <button type="submit" :disabled="registerFormLoading"
                        class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors">
                  <i class="fas fa-user-plus mr-2"></i>
                  {{ registerFormLoading ? 'Регистрация...' : 'Зарегистрироваться' }}
                </button>
              </div>
            </form>
            
            <div v-if="registerFormResult" class="mt-6 p-4 rounded-lg" :class="registerFormResult.success === true ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
              <h4 class="font-semibold mb-2" :class="registerFormResult.success === true ? 'text-green-800' : 'text-red-800'">
                {{ registerFormResult.success === true ? '✅ Успешно' : '❌ Ошибка' }}
              </h4>
              <p class="text-sm" :class="registerFormResult.success === true ? 'text-green-600' : 'text-red-600'">
                {{ registerFormResult.message }}
              </p>
            </div>
          </div>
        </ExampleSection>

        <!-- Quiz Form -->
        <ExampleSection title="Квиз-форма">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-6">
              <h3 class="text-lg font-semibold mb-2">Тест по знанию Chatium</h3>
              <p class="text-gray-600">Ответьте на несколько вопросов, чтобы определить ваш уровень знаний</p>
            </div>
            
            <form @submit.prevent="submitQuiz" class="space-y-6">
              <!-- Question 1 -->
              <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">1. Что такое Chatium?</h4>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input v-model="quiz.answers[0]" type="radio" value="frontend" class="mr-2">
                    <span>Фреймворк для создания фронтенд-приложений</span>
                  </label>
                  <label class="flex items-center">
                    <input v-model="quiz.answers[0]" type="radio" value="backend" class="mr-2">
                    <span>Платформа для создания веб-приложений с бэкендом</span>
                  </label>
                  <label class="flex items-center">
                    <input v-model="quiz.answers[0]" type="radio" value="cms" class="mr-2">
                    <span>Система управления контентом</span>
                  </label>
                </div>
              </div>
              
              <!-- Question 2 -->
              <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">2. Какие фреймворки поддерживаются?</h4>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input v-model="quiz.answers[1]" type="radio" value="react" class="mr-2">
                    <span>Только React</span>
                  </label>
                  <label class="flex items-center">
                    <input v-model="quiz.answers[1]" type="radio" value="vue" class="mr-2">
                    <span>Только Vue.js</span>
                  </label>
                  <label class="flex items-center">
                    <input v-model="quiz.answers[1]" type="radio" value="multiple" class="mr-2">
                    <span>Vue.js, React и другие</span>
                  </label>
                </div>
              </div>
              
              <!-- Question 3 -->
              <div class="border rounded-lg p-4">
                <h4 class="font-medium mb-3">3. Как работают таблицы данных?</h4>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input v-model="quiz.answers[2]" type="radio" value="external" class="mr-2">
                    <span>Только внешние таблицы</span>
                  </label>
                  <label class="flex items-center">
                    <input v-model="quiz.answers[2]" type="radio" value="internal" class="mr-2">
                    <span>Только внутренние Heap Tables</span>
                  </label>
                  <label class="flex items-center">
                    <input v-model="quiz.answers[2]" type="radio" value="both" class="mr-2">
                    <span>Внутренние и внешние таблицы</span>
                  </label>
                </div>
              </div>
              
              <div>
                <button type="submit" :disabled="quizFormLoading"
                        class="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors">
                  <i class="fas fa-check-circle mr-2"></i>
                  {{ quizFormLoading ? 'Проверка...' : 'Проверить ответы' }}
                </button>
              </div>
            </form>
            
            <div v-if="quizResult" class="mt-6 p-4 rounded-lg" :class="getQuizResultClass(quizResult.qualification)">
              <h4 class="font-semibold mb-2">
                {{ getQuizResultEmoji(quizResult.qualification) }}
                Ваш результат: {{ quizResult.score }}%
              </h4>
              <p class="text-sm font-medium mb-2">
                Квалификация: {{ getQuizResultText(quizResult.qualification) }}
              </p>
              <StatusBadge :status="getQuizResultStatus(quizResult.qualification)">
                {{ quizResult.qualification.toUpperCase() }}
              </StatusBadge>
            </div>
          </div>
        </ExampleSection>

        <!-- Multi-step Form -->
        <ExampleSection title="Многошаговая форма">
          <div class="bg-white rounded-lg shadow border p-6">
            <div class="mb-6">
              <!-- Progress Steps -->
              <div class="flex items-center justify-between mb-6">
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                       :class="currentStep.value >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'">
                    1
                  </div>
                  <span class="ml-2 font-medium" :class="currentStep.value >= 1 ? 'text-blue-600' : 'text-gray-500'">
                    Личные данные
                  </span>
                </div>
                <div class="flex-1 h-1 mx-4 bg-gray-200">
                  <div class="h-full bg-blue-600 transition-all duration-300" :style="{width: ((currentStep.value - 1) / 2 * 100) + '%'}"></div>
                </div>
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                       :class="currentStep.value >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'">
                    2
                  </div>
                  <span class="ml-2 font-medium" :class="currentStep.value >= 2 ? 'text-blue-600' : 'text-gray-500'">
                    Тариф
                  </span>
                </div>
                <div class="flex-1 h-1 mx-4 bg-gray-200">
                  <div class="h-full bg-blue-600 transition-all duration-300" :style="{width: ((currentStep.value - 2) / 2 * 100) + '%'}"></div>
                </div>
                <div class="flex items-center">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                       :class="currentStep.value >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'">
                    3
                  </div>
                  <span class="ml-2 font-medium" :class="currentStep.value >= 3 ? 'text-blue-600' : 'text-gray-500'">
                    Подтверждение
                  </span>
                </div>
              </div>
              
              <!-- Step Content -->
              <form @submit.prevent="submitMultiStepForm">
                <!-- Step 1: Personal Data -->
                <div v-if="currentStep.value === 1" class="space-y-4">
                  <h3 class="text-lg font-semibold">Личные данные</h3>
                  <div class="grid md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Имя *</label>
                      <input v-model="multiStepForm.name" type="text" required 
                             class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input v-model="multiStepForm.email" type="email" required 
                             class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    </div>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Компания</label>
                    <input v-model="multiStepForm.company" type="text" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  </div>
                </div>
                
                <!-- Step 2: Plan Selection -->
                <div v-if="currentStep.value === 2" class="space-y-4">
                  <h3 class="text-lg font-semibold">Выберите тариф</h3>
                  <div class="grid md:grid-cols-3 gap-4">
                    <label v-for="plan in plans" :key="plan.id" 
                           class="border rounded-lg p-4 cursor-pointer hover:border-blue-500 transition-colors"
                           :class="multiStepForm.plan === plan.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300'">
                      <div>
                        <input v-model="multiStepForm.plan" :value="plan.id" type="radio" class="mr-2">
                        <strong>{{ plan.name }}</strong>
                      </div>
                      <div class="text-2xl font-bold my-2">{{ plan.price }}</div>
                      <ul class="text-sm text-gray-600 space-y-1">
                        <li v-for="feature in plan.features" :key="feature">
                          <i class="fas fa-check text-green-500 mr-1"></i>
                          {{ feature }}
                        </li>
                      </ul>
                    </label>
                  </div>
                </div>
                
                <!-- Step 3: Confirmation -->
                <div v-if="currentStep.value === 3" class="space-y-4">
                  <h3 class="text-lg font-semibold">Подтверждение</h3>
                  <div class="bg-gray-50 rounded-lg p-4">
                    <div class="space-y-2">
                      <div><strong>Имя:</strong> {{ multiStepForm.name }}</div>
                      <div><strong>Email:</strong> {{ multiStepForm.email }}</div>
                      <div v-if="multiStepForm.company"><strong>Компания:</strong> {{ multiStepForm.company }}</div>
                      <div><strong>Тариф:</strong> {{ plans.find(p => p.id === multiStepForm.plan)?.name }}</div>
                      <div><strong>Цена:</strong> {{ plans.find(p => p.id === multiStepForm.plan)?.price }}</div>
                    </div>
                  </div>
                  <div>
                    <label class="flex items-center">
                      <input v-model="multiStepForm.confirm" type="checkbox" class="mr-2">
                      <span class="text-sm text-gray-600">Подтверждаю правильность данных</span>
                    </label>
                  </div>
                </div>
                
                <!-- Navigation Buttons -->
                <div class="flex justify-between mt-6">
                  <button v-if="currentStep.value > 1" type="button" @click="previousStep"
                          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i>
                    Назад
                  </button>
                  <div v-else></div>
                  
                  <div v-if="currentStep.value < 3">
                    <button type="button" @click="nextStep"
                            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Далее
                      <i class="fas fa-arrow-right ml-2"></i>
                    </button>
                  </div>
                  <div v-else>
                    <button type="submit" :disabled="!multiStepForm.confirm || multiStepFormLoading"
                            class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors">
                      <i class="fas fa-check mr-2"></i>
                      {{ multiStepFormLoading ? 'Отправка...' : 'Завершить' }}
                    </button>
                  </div>
                </div>
              </form>
              
              <div v-if="multiStepResult" class="mt-6 p-4 rounded-lg" :class="multiStepResult.success === true ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
                <h4 class="font-semibold mb-2" :class="multiStepResult.success === true ? 'text-green-800' : 'text-red-800'">
                  {{ multiStepResult.success === true ? '✅ Успешно' : '❌ Ошибка' }}
                </h4>
                <p class="text-sm" :class="multiStepResult.success === true ? 'text-green-600' : 'text-red-600'">
                  {{ multiStepResult.message }}
                </p>
              </div>
            </div>
          </div>
        </ExampleSection>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ExampleSection, StatusBadge } from "../../shared/components"
import { submitQuizRoute, contactFormRoute, registerUserRoute } from "../../integrations/analytics/events"
import { indexPageRoute } from '../../../index'

const currentStep = ref(1)
const contactFormLoading = ref(false)
const registerFormLoading = ref(false)
const quizFormLoading = ref(false)
const multiStepFormLoading = ref(false)

const contactForm = ref({
  name: '',
  email: '',
  topic: 'general',
  message: ''
})

const registerForm = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agree: false
})

const quiz = ref({
  answers: ['', '', '']
})

const multiStepForm = ref({
  name: '',
  email: '',
  company: '',
  plan: '',
  confirm: false
})

const plans = [
  {
    id: 'basic',
    name: 'Базовый',
    price: '990₽/мес',
    features: ['10 пользователей', '1 ГБ хранилище', 'Базовая поддержка']
  },
  {
    id: 'pro',
    name: 'Про',
    price: '2990₽/мес',
    features: ['50 пользователей', '10 ГБ хранилище', 'Приоритетная поддержка']
  },
  {
    id: 'enterprise',
    name: 'Корпоративный',
    price: 'По запросу',
    features: ['Безлимитные пользователи', 'Безлимитное хранилище', 'Выделенная поддержка']
  }
]

const contactFormResult = ref(null)
const registerFormResult = ref(null)
const quizResult = ref(null)
const multiStepResult = ref(null)

/**
 * Отправляет форму обратной связи
 */
async function submitContactForm() {
  contactFormLoading.value = true
  try {
    const result = await contactFormRoute.run(ctx, {
      name: contactForm.value.name,
      email: contactForm.value.email,
      topic: contactForm.value.topic,
      message: contactForm.value.message
    })
    
    contactFormResult.value = result
    if (result.success) {
      contactForm.value = {
        name: '',
        email: '',
        topic: 'general',
        message: ''
      }
    }
  } catch (error) {
    contactFormResult.value = {
      success: false,
      message: 'Ошибка при отправке формы'
    }
  } finally {
    contactFormLoading.value = false
  }
}

/**
 * Отправляет форму регистрации
 */
async function submitRegistration() {
  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    registerFormResult.value = {
      success: false,
      message: 'Пароли не совпадают'
    }
    return
  }
  
  registerFormLoading.value = true
  try {
    const result = await registerUserRoute.run(ctx, {
      firstName: registerForm.value.firstName,
      lastName: registerForm.value.lastName,
      email: registerForm.value.email,
      phone: registerForm.value.phone
    })
    
    registerFormResult.value = result
    if (result.success) {
      registerForm.value = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agree: false
      }
    }
  } catch (error) {
    registerFormResult.value = {
      success: false,
      message: 'Ошибка при регистрации'
    }
  } finally {
    registerFormLoading.value = false
  }
}

/**
 * Отправляет квиз и проверяет ответы
 */
async function submitQuiz() {
  if (quiz.value.answers.includes('')) {
    quizResult.value = {
      success: false,
      message: 'Пожалуйста, ответьте на все вопросы'
    }
    return
  }
  
  quizFormLoading.value = true
  try {
    const correctAnswers = ['backend', 'multiple', 'both']
    let score = 0
    
    correctAnswers.forEach((correct, index) => {
      if (quiz.value.answers[index] === correct) {
        score++
      }
    })
    
    const scorePercent = Math.round((score / 3) * 100)
    
    const result = await submitQuizRoute.run(ctx, {
      answers: quiz.value.answers,
      quizName: 'chatium-knowledge',
      score: scorePercent
    })
    
    quizResult.value = {
      success: true,
      score: scorePercent,
      qualification: result.qualification
    }
  } catch (error) {
    quizResult.value = {
      success: false,
      message: 'Ошибка при проверке ответов'
    }
  } finally {
    quizFormLoading.value = false
  }
}

/**
 * Переходит на следующий шаг формы с валидацией
 */
function nextStep() {
  if (currentStep.value === 1) {
    if (!multiStepForm.value.name || !multiStepForm.value.email) {
      return
    }
  } else if (currentStep.value === 2) {
    if (!multiStepForm.value.plan) {
      return
    }
  }
  currentStep.value += 1
}

/**
 * Переходит на предыдущий шаг формы
 */
function previousStep() {
  currentStep.value -= 1
}

/**
 * Отправляет многошаговую форму
 */
async function submitMultiStepForm() {
  multiStepFormLoading.value = true
  try {
    multiStepResult.value = {
      success: true,
      message: 'Форма успешно отправлена! Мы свяжемся с вами в ближайшее время.'
    }
    
    multiStepForm.value = {
      name: '',
      email: '',
      company: '',
      plan: '',
      confirm: false
    }
    currentStep.value = 1
  } catch (error) {
    multiStepResult.value = {
      success: false,
      message: 'Ошибка при отправке формы'
    }
  } finally {
    multiStepFormLoading.value = false
  }
}

/**
 * Возвращает CSS класс для результата квиза
 */
function getQuizResultClass(qualification) {
  return qualification === 'expert' ? 'bg-green-50 border border-green-200' :
         qualification === 'intermediate' ? 'bg-yellow-50 border border-yellow-200' :
         'bg-red-50 border border-red-200'
}

/**
 * Возвращает статус для результата квиза
 */
function getQuizResultStatus(qualification) {
  return qualification === 'expert' ? 'success' :
         qualification === 'intermediate' ? 'warning' :
         'error'
}

/**
 * Возвращает текст квалификации
 */
function getQuizResultText(qualification) {
  return qualification === 'expert' ? 'Эксперт' :
         qualification === 'intermediate' ? 'Средний уровень' :
         'Новичок'
}

/**
 * Возвращает эмодзи для результата квиза
 */
function getQuizResultEmoji(qualification) {
  return qualification === 'expert' ? '🏆' :
         qualification === 'intermediate' ? '👍' :
         '📚'
}
</script>