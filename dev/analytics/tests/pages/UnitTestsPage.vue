<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-md border-b-4 border-blue-600">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <i class="fas fa-flask text-blue-600 text-2xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-gray-800">Unit Tests - Система аналитики</h1>
              <p class="text-sm text-gray-600">F-1.1: Базовая инфраструктура</p>
            </div>
          </div>
          
          <button 
            @click="runAllTests"
            :disabled="running"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <i :class="['fas', running ? 'fa-spinner fa-spin' : 'fa-play']"></i>
            <span>{{ running ? 'Выполняется...' : 'Запустить все тесты' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="testsCompleted" class="bg-white border-b border-gray-200">
      <div class="container mx-auto px-4 py-4">
        <div class="grid grid-cols-4 gap-4">
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-800">{{ totalTests }}</div>
            <div class="text-sm text-gray-600">Всего тестов</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-green-600">{{ passedTests }}</div>
            <div class="text-sm text-gray-600">Пройдено</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-red-600">{{ failedTests }}</div>
            <div class="text-sm text-gray-600">Провалено</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-gray-600">{{ duration }}мс</div>
            <div class="text-sm text-gray-600">Время выполнения</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Categories -->
    <div class="container mx-auto px-4 py-6">
      <div v-for="category in testCategories" :key="category.name" class="mb-6 bg-white rounded-lg shadow-md overflow-hidden">
        <!-- Category Header -->
        <div 
          class="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-pointer"
          @click="toggleCategory(category.name)"
        >
          <div class="flex items-center space-x-3">
            <i :class="['fas', category.icon, 'text-blue-600']"></i>
            <h2 class="text-lg font-semibold text-gray-800">{{ category.title }}</h2>
            <span class="text-sm text-gray-500">({{ category.tests.length }} тестов)</span>
          </div>
          
          <div class="flex items-center space-x-4">
            <div v-if="getCategoryStats(category.name).total > 0" class="flex items-center space-x-2 text-sm">
              <span class="text-green-600">
                <i class="fas fa-check-circle"></i> {{ getCategoryStats(category.name).passed }}
              </span>
              <span class="text-red-600">
                <i class="fas fa-times-circle"></i> {{ getCategoryStats(category.name).failed }}
              </span>
            </div>
            
            <button
              @click.stop="runCategoryTests(category.name)"
              :disabled="running"
              class="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <i class="fas fa-play mr-1"></i>
              Запустить
            </button>
            
            <i :class="['fas', expandedCategories[category.name] ? 'fa-chevron-up' : 'fa-chevron-down', 'text-gray-400']"></i>
          </div>
        </div>

        <!-- Tests List -->
        <div v-if="expandedCategories[category.name]" class="p-4 space-y-3">
          <div 
            v-for="test in category.tests" 
            :key="test.name"
            :class="[
              'p-4 rounded-lg border-2 transition-all',
              test.status === 'passed' ? 'bg-green-50 border-green-200' :
              test.status === 'failed' ? 'bg-red-50 border-red-200' :
              test.status === 'running' ? 'bg-blue-50 border-blue-200' :
              'bg-gray-50 border-gray-200'
            ]"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <i 
                    :class="[
                      'fas',
                      test.status === 'passed' ? 'fa-check-circle text-green-600' :
                      test.status === 'failed' ? 'fa-times-circle text-red-600' :
                      test.status === 'running' ? 'fa-spinner fa-spin text-blue-600' :
                      'fa-circle text-gray-400'
                    ]"
                  ></i>
                  <h3 class="font-semibold text-gray-800">{{ test.name }}</h3>
                </div>
                
                <p class="text-sm text-gray-600 mb-2">{{ test.description }}</p>
                
                <!-- Success -->
                <div v-if="test.status === 'passed'" class="text-sm text-green-700">
                  <i class="fas fa-info-circle mr-1"></i>
                  Тест пройден успешно
                  <span v-if="test.duration" class="ml-2 text-gray-500">({{ test.duration }}мс)</span>
                </div>
                
                <!-- Error -->
                <div v-if="test.status === 'failed'" class="space-y-2">
                  <div class="text-sm text-red-700">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    {{ test.error || 'Тест провален' }}
                  </div>
                  <div v-if="test.details" class="text-xs bg-red-100 p-2 rounded font-mono text-red-800 whitespace-pre-wrap">
                    {{ test.details }}
                  </div>
                </div>
              </div>
              
              <button
                @click="runSingleTest(category.name, test.name)"
                :disabled="running || test.status === 'running'"
                class="ml-4 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <i class="fas fa-redo mr-1"></i>
                Повторить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { apiGetTestsListRoute, apiRunSingleTestRoute } from '../api/run-tests'

const testCategories = ref([])
const running = ref(false)
const testsCompleted = ref(false)
const duration = ref(0)

const expandedCategories = reactive({})

// Загружаем список тестов при монтировании
onMounted(async () => {
  try {
    const result = await apiGetTestsListRoute.run(ctx)
    if (result.success) {
      testCategories.value = result.categories.map(cat => ({
        ...cat,
        tests: cat.tests.map(t => ({
          ...t,
          status: 'pending',
          error: '',
          details: '',
          duration: 0
        }))
      }))
      
      // Раскрываем все категории по умолчанию
      result.categories.forEach(cat => {
        expandedCategories[cat.name] = true
      })
    }
  } catch (error) {
    console.error('Ошибка загрузки тестов:', error)
  }
})

// Выполнить все тесты
async function runAllTests() {
  running.value = true
  testsCompleted.value = false
  const startTime = Date.now()
  
  // Сбрасываем все тесты
  testCategories.value.forEach(category => {
    category.tests.forEach(test => {
      test.status = 'pending'
      test.error = ''
      test.details = ''
      test.duration = 0
    })
  })
  
  // Запускаем тесты по категориям
  for (const category of testCategories.value) {
    await runCategoryTests(category.name, false)
  }
  
  duration.value = Date.now() - startTime
  testsCompleted.value = true
  running.value = false
}

// Запуск категории
async function runCategoryTests(categoryName, setRunning = true) {
  if (setRunning) running.value = true
  
  const category = testCategories.value.find(c => c.name === categoryName)
  if (!category) {
    if (setRunning) running.value = false
    return
  }
  
  for (const test of category.tests) {
    await runTest(categoryName, test.name)
  }
  
  if (setRunning) running.value = false
}

// Запуск одного теста
async function runSingleTest(categoryName, testName) {
  running.value = true
  await runTest(categoryName, testName)
  running.value = false
}

// Выполнение теста
async function runTest(categoryName, testName) {
  const category = testCategories.value.find(c => c.name === categoryName)
  if (!category) return
  
  const test = category.tests.find(t => t.name === testName)
  if (!test) return
  
  test.status = 'running'
  test.error = ''
  test.details = ''
  
  const startTime = Date.now()
  
  try {
    const result = await apiRunSingleTestRoute.run(ctx, {
      category: categoryName,
      testName: testName
    })
    
    if (result.success) {
      test.status = 'passed'
    } else {
      test.status = 'failed'
      test.error = result.error || 'Тест провален'
      test.details = result.stack || ''
    }
  } catch (error) {
    test.status = 'failed'
    test.error = error.message || 'Неизвестная ошибка'
    test.details = error.stack || ''
  }
  
  test.duration = Date.now() - startTime
}

// Переключение категории
function toggleCategory(name) {
  expandedCategories[name] = !expandedCategories[name]
}

// Статистика категории
function getCategoryStats(categoryName) {
  const category = testCategories.value.find(c => c.name === categoryName)
  if (!category) return { total: 0, passed: 0, failed: 0 }
  
  return {
    total: category.tests.length,
    passed: category.tests.filter(t => t.status === 'passed').length,
    failed: category.tests.filter(t => t.status === 'failed').length
  }
}

// Computed свойства для статистики
const totalTests = computed(() => {
  return testCategories.value.reduce((sum, cat) => sum + cat.tests.length, 0)
})

const passedTests = computed(() => {
  return testCategories.value.reduce((sum, cat) => {
    return sum + cat.tests.filter(t => t.status === 'passed').length
  }, 0)
})

const failedTests = computed(() => {
  return testCategories.value.reduce((sum, cat) => {
    return sum + cat.tests.filter(t => t.status === 'failed').length
  }, 0)
})
</script>

<style scoped>
/* Tailwind classes are used directly in template */
</style>

