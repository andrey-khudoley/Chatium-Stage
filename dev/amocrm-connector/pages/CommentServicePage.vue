<template>
  <div class="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
    <ThemeToggle />
    
    <div class="container py-6 max-w-6xl">
      <!-- Хлебные крошки -->
      <div class="mb-6">
        <a :href="indexPageUrl" class="text-[var(--color-primary)] hover:opacity-70 flex items-center gap-2">
          <i class="fas fa-arrow-left"></i>
          Назад к главной
        </a>
      </div>
      
      <!-- Заголовок страницы -->
      <header class="text-center mb-8 mt-4">
        <div class="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg">
          <i class="fas fa-comment-dots text-2xl text-white"></i>
        </div>
        <h1 class="text-4xl font-bold mb-3 text-[var(--color-text)]">
          Комментарии в AmoCRM
        </h1>
        <p class="text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
          Автоматическое добавление комментариев со ссылками на оплату в сделки AmoCRM
        </p>
      </header>
      
      <!-- Переключатель сервиса -->
      <div class="card mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold mb-2">Статус сервиса</h2>
            <p class="text-[var(--color-text-secondary)]">
              {{ serviceEnabled ? 'Сервис активен - комментарии добавляются автоматически' : 'Сервис выключен' }}
            </p>
          </div>
          <button 
            @click="toggleService" 
            :disabled="loadingStatus"
            class="btn"
            :class="serviceEnabled ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'"
          >
            <i class="fas mr-2" :class="serviceEnabled ? 'fa-stop' : 'fa-play'"></i>
            {{ serviceEnabled ? 'Выключить' : 'Включить' }}
          </button>
        </div>
      </div>
      
      <!-- Редактор шаблона комментария -->
      <div class="card mb-8">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
          <i class="fas fa-edit" style="color: var(--color-primary)"></i>
          Шаблон комментария
        </h2>
        
        <!-- Уведомление об успехе -->
        <div v-if="templateSuccessMessage" class="mb-4 p-4 rounded-lg flex items-center gap-3" style="background: var(--color-success-light); border: 1px solid var(--color-success);">
          <i class="fas fa-check-circle text-xl" style="color: var(--color-success)"></i>
          <p style="color: var(--color-success); font-weight: 500;">{{ templateSuccessMessage }}</p>
          <button @click="templateSuccessMessage = ''" class="ml-auto" style="color: var(--color-success);">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Уведомление об ошибке -->
        <div v-if="templateErrorMessage" class="mb-4 p-4 rounded-lg flex items-center gap-3" style="background: var(--color-danger-light); border: 1px solid var(--color-danger);">
          <i class="fas fa-exclamation-triangle text-xl" style="color: var(--color-danger)"></i>
          <p style="color: var(--color-danger); font-weight: 500;">{{ templateErrorMessage }}</p>
          <button @click="templateErrorMessage = ''" class="ml-auto" style="color: var(--color-danger);">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="mb-4">
          <p class="text-[var(--color-text-secondary)] mb-4">
            Используйте переменную <code class="px-2 py-1 rounded" style="background: var(--color-bg-secondary); color: var(--color-primary)">{paymentUrl}</code> для вставки ссылки на оплату
          </p>
          
          <textarea
            v-model="commentTemplate"
            rows="6"
            class="input w-full font-mono"
            placeholder="Введите шаблон комментария..."
          ></textarea>
        </div>
        
        <div class="flex gap-3">
          <button 
            @click="saveTemplate" 
            :disabled="loadingTemplate || !commentTemplate.trim()"
            class="btn btn-primary"
          >
            <i class="fas fa-save mr-2"></i>
            {{ loadingTemplate ? 'Сохранение...' : 'Сохранить шаблон' }}
          </button>
          
          <button 
            @click="resetTemplate" 
            class="btn"
            style="background: var(--color-border);"
          >
            <i class="fas fa-undo mr-2"></i>
            Сбросить
          </button>
        </div>
      </div>
      
      <!-- Таблица логов -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold flex items-center gap-3">
            <i class="fas fa-list" style="color: var(--color-primary)"></i>
            Логи комментариев
          </h2>
          <div class="flex gap-3">
            <button 
              @click="loadLogs" 
              :disabled="loadingLogs"
              class="btn"
              style="background: var(--color-border);"
            >
              <i class="fas fa-sync mr-2" :class="{ 'animate-spin': loadingLogs }"></i>
              Обновить
            </button>
            <button 
              @click="clearAllLogs" 
              :disabled="loadingLogs || logs.length === 0"
              class="btn bg-red-600 hover:bg-red-700"
            >
              <i class="fas fa-trash mr-2"></i>
              Очистить все
            </button>
          </div>
        </div>
        
        <!-- Состояние загрузки -->
        <div v-if="loadingLogs && logs.length === 0" class="text-center py-12">
          <i class="fas fa-spinner animate-spin text-4xl" style="color: var(--color-primary)"></i>
          <p class="mt-4 text-[var(--color-text-secondary)]">Загрузка логов...</p>
        </div>
        
        <!-- Состояние ошибки -->
        <div v-else-if="logsError" class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl mb-4" style="color: var(--color-danger)"></i>
          <p style="color: var(--color-danger)">{{ logsError }}</p>
        </div>
        
        <!-- Пустое состояние -->
        <div v-else-if="logs.length === 0" class="text-center py-12">
          <i class="fas fa-inbox text-4xl mb-4 text-[var(--color-text-tertiary)]"></i>
          <p class="text-[var(--color-text-secondary)]">Логи отсутствуют</p>
          <p class="text-sm text-[var(--color-text-tertiary)] mt-2">
            Комментарии будут добавляться автоматически после получения ссылок на оплату
          </p>
        </div>
        
        <!-- Таблица с логами -->
        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Дата/время</th>
                <th>ID сделки</th>
                <th>Email</th>
                <th>Комментарий</th>
                <th>Ссылка на оплату</th>
                <th>Статус</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td>{{ formatDate(log.createdAt) }}</td>
                <td>
                  <span class="font-mono text-sm">{{ log.leadId }}</span>
                </td>
                <td>
                  <span class="text-sm">{{ log.email || '-' }}</span>
                </td>
                <td>
                  <div class="max-w-xs">
                    <p class="text-sm truncate" :title="log.commentText">
                      {{ log.commentText }}
                    </p>
                  </div>
                </td>
                <td>
                  <a 
                    v-if="log.paymentUrl" 
                    :href="log.paymentUrl" 
                    target="_blank"
                    class="text-[var(--color-primary)] hover:opacity-70 text-sm"
                  >
                    <i class="fas fa-external-link-alt mr-1"></i>
                    Открыть
                  </a>
                  <span v-else class="text-[var(--color-text-tertiary)]">-</span>
                </td>
                <td>
                  <span 
                    class="px-3 py-1 rounded-full text-sm font-medium"
                    :class="getStatusClass(log.status)"
                  >
                    {{ getStatusText(log.status) }}
                  </span>
                </td>
                <td>
                  <div class="flex gap-2">
                    <button
                      v-if="log.status === 'error'"
                      @click="retryComment(log.id)"
                      :disabled="retryingLogId === log.id"
                      class="text-[var(--color-primary)] hover:opacity-70"
                      title="Повторить"
                    >
                      <i class="fas fa-redo" :class="{ 'animate-spin': retryingLogId === log.id }"></i>
                    </button>
                    <button
                      @click="showLogDetails(log)"
                      class="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                      title="Подробности"
                    >
                      <i class="fas fa-info-circle"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          
          <!-- Информация о количестве -->
          <div class="mt-4 text-sm text-[var(--color-text-secondary)] text-center">
            Показано {{ logs.length }} из {{ totalLogs }} записей
          </div>
        </div>
      </div>
    </div>
    
    <!-- Модальное окно с деталями лога -->
    <div v-if="selectedLog" class="modal-overlay" @click.self="selectedLog = null">
      <div class="modal-content">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-[var(--color-text)]">
            Детали лога
          </h3>
          <button @click="selectedLog = null" class="text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">ID сделки</label>
            <p class="font-mono text-lg">{{ selectedLog.leadId }}</p>
          </div>
          
          <div v-if="selectedLog.email">
            <label class="block text-sm font-medium mb-1">Email</label>
            <p>{{ selectedLog.email }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Текст комментария</label>
            <p class="whitespace-pre-wrap p-3 rounded" style="background: var(--color-bg-secondary)">{{ selectedLog.commentText }}</p>
          </div>
          
          <div v-if="selectedLog.paymentUrl">
            <label class="block text-sm font-medium mb-1">Ссылка на оплату</label>
            <a :href="selectedLog.paymentUrl" target="_blank" class="text-[var(--color-primary)] hover:opacity-70 break-all">
              {{ selectedLog.paymentUrl }}
            </a>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Статус</label>
            <span 
              class="px-3 py-1 rounded-full text-sm font-medium"
              :class="getStatusClass(selectedLog.status)"
            >
              {{ getStatusText(selectedLog.status) }}
            </span>
          </div>
          
          <div v-if="selectedLog.amocrmNoteId">
            <label class="block text-sm font-medium mb-1">ID комментария в AmoCRM</label>
            <p class="font-mono">{{ selectedLog.amocrmNoteId }}</p>
          </div>
          
          <div v-if="selectedLog.errorMessage">
            <label class="block text-sm font-medium mb-2" style="color: var(--color-danger)">Ошибка</label>
            <div class="p-4 rounded-lg border-2" style="background: var(--color-danger-light); border-color: var(--color-danger); color: var(--color-danger);">
              <div class="flex items-start gap-3">
                <i class="fas fa-exclamation-circle text-xl flex-shrink-0 mt-0.5"></i>
                <p class="flex-1 break-words">{{ selectedLog.errorMessage }}</p>
              </div>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium mb-1">Дата создания</label>
            <p>{{ formatDate(selectedLog.createdAt) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ThemeToggle from '../components/ThemeToggle.vue';
import { indexPageRoute } from '../index';
import {
  apiGetCommentServiceStatusRoute,
  apiToggleCommentServiceRoute,
  apiGetCommentTemplateRoute,
  apiSaveCommentTemplateRoute,
  apiGetCommentLogsRoute,
  apiRetryCommentRoute,
  apiClearCommentLogsRoute
} from '../api/commentService';

// Состояние сервиса
const serviceEnabled = ref(false);
const loadingStatus = ref(false);

// Шаблон комментария
const commentTemplate = ref('');
const loadingTemplate = ref(false);
const defaultTemplate = 'Ссылка на оплату: {paymentUrl}\n\nСпасибо за ваш заказ!';
const templateSuccessMessage = ref('');
const templateErrorMessage = ref('');

// Логи
const logs = ref<any[]>([]);
const totalLogs = ref(0);
const loadingLogs = ref(false);
const logsError = ref('');
const selectedLog = ref<any>(null);
const retryingLogId = ref<string | null>(null);

const indexPageUrl = computed(() => indexPageRoute.url())

// Загрузка статуса сервиса
async function loadStatus() {
  try {
    loadingStatus.value = true;
    const data = await apiGetCommentServiceStatusRoute.run(ctx);
    
    if (data.success) {
      serviceEnabled.value = data.enabled;
    }
  } catch (error) {
    console.error('Ошибка загрузки статуса:', error);
  } finally {
    loadingStatus.value = false;
  }
}

// Переключение сервиса
async function toggleService() {
  try {
    loadingStatus.value = true;
    templateSuccessMessage.value = '';
    templateErrorMessage.value = '';
    
    const data = await apiToggleCommentServiceRoute.run(ctx, {
      enabled: !serviceEnabled.value
    });
    
    if (data.success) {
      serviceEnabled.value = data.enabled;
      templateSuccessMessage.value = serviceEnabled.value ? 'Сервис успешно включен' : 'Сервис успешно выключен';
      setTimeout(() => templateSuccessMessage.value = '', 5000);
    } else {
      templateErrorMessage.value = 'Ошибка: ' + data.error;
    }
  } catch (error) {
    console.error('Ошибка переключения сервиса:', error);
    templateErrorMessage.value = 'Ошибка переключения сервиса';
  } finally {
    loadingStatus.value = false;
  }
}

// Загрузка шаблона
async function loadTemplate() {
  try {
    loadingTemplate.value = true;
    const data = await apiGetCommentTemplateRoute.run(ctx);
    
    if (data.success) {
      commentTemplate.value = data.template;
    }
  } catch (error) {
    console.error('Ошибка загрузки шаблона:', error);
  } finally {
    loadingTemplate.value = false;
  }
}

// Сохранение шаблона
async function saveTemplate() {
  try {
    loadingTemplate.value = true;
    templateSuccessMessage.value = '';
    templateErrorMessage.value = '';
    
    const data = await apiSaveCommentTemplateRoute.run(ctx, {
      template: commentTemplate.value
    });
    
    if (data.success) {
      templateSuccessMessage.value = 'Шаблон успешно сохранен';
      setTimeout(() => templateSuccessMessage.value = '', 5000);
    } else {
      templateErrorMessage.value = 'Ошибка: ' + data.error;
    }
  } catch (error) {
    console.error('Ошибка сохранения шаблона:', error);
    templateErrorMessage.value = 'Ошибка сохранения шаблона: ' + error.message;
  } finally {
    loadingTemplate.value = false;
  }
}

// Сброс шаблона
function resetTemplate() {
  commentTemplate.value = defaultTemplate;
}

// Загрузка логов
async function loadLogs() {
  try {
    loadingLogs.value = true;
    logsError.value = '';
    
    const data = await apiGetCommentLogsRoute.run(ctx, { limit: 50 });
    
    if (data.success) {
      logs.value = data.logs;
      totalLogs.value = data.total;
    } else {
      logsError.value = data.error;
    }
  } catch (error) {
    console.error('Ошибка загрузки логов:', error);
    logsError.value = 'Ошибка загрузки логов';
  } finally {
    loadingLogs.value = false;
  }
}

// Повторная отправка комментария
async function retryComment(logId: string) {
  if (!confirm('Повторить отправку комментария?')) {
    return;
  }
  
  try {
    retryingLogId.value = logId;
    templateSuccessMessage.value = '';
    templateErrorMessage.value = '';
    
    const data = await apiRetryCommentRoute.run(ctx, { logId });
    
    if (data.success) {
      templateSuccessMessage.value = 'Комментарий успешно добавлен повторно';
      setTimeout(() => templateSuccessMessage.value = '', 5000);
      await loadLogs();
    } else {
      templateErrorMessage.value = 'Ошибка: ' + data.error;
    }
  } catch (error) {
    console.error('Ошибка повторной отправки:', error);
    templateErrorMessage.value = 'Ошибка повторной отправки: ' + error.message;
  } finally {
    retryingLogId.value = null;
  }
}

// Очистка всех логов
async function clearAllLogs() {
  if (!confirm('Вы уверены, что хотите удалить все логи? Это действие необратимо.')) {
    return;
  }
  
  try {
    loadingLogs.value = true;
    templateSuccessMessage.value = '';
    templateErrorMessage.value = '';
    
    const data = await apiClearCommentLogsRoute.run(ctx);
    
    if (data.success) {
      templateSuccessMessage.value = `Удалено ${data.deletedCount} записей`;
      setTimeout(() => templateSuccessMessage.value = '', 5000);
      await loadLogs();
    } else {
      templateErrorMessage.value = 'Ошибка: ' + data.error;
    }
  } catch (error) {
    console.error('Ошибка очистки логов:', error);
    templateErrorMessage.value = 'Ошибка очистки логов: ' + error.message;
  } finally {
    loadingLogs.value = false;
  }
}

// Показать детали лога
function showLogDetails(log: any) {
  selectedLog.value = log;
}

// Форматирование даты
function formatDate(dateString: string) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Получение класса для статуса
function getStatusClass(status: string) {
  switch (status) {
    case 'success':
      return 'bg-green-600 text-white';
    case 'error':
      return 'bg-red-600 text-white';
    case 'pending':
      return 'bg-yellow-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
}

// Получение текста статуса
function getStatusText(status: string) {
  switch (status) {
    case 'success':
      return 'Успешно';
    case 'error':
      return 'Ошибка';
    case 'pending':
      return 'В обработке';
    default:
      return status;
  }
}

// Инициализация
onMounted(async () => {
  await Promise.all([
    loadStatus(),
    loadTemplate(),
    loadLogs()
  ]);
});
</script>

