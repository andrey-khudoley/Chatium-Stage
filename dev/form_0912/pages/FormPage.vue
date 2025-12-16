<template>
  <div class="gradient-bg min-h-screen flex items-center justify-center form-container">
    <!-- Декоративные элементы -->
    <div class="decorative-element decorative-element-1"></div>
    <div class="decorative-element decorative-element-2"></div>
    
    <div class="form-wrapper">
      <!-- Форма -->
      <div class="card">
        <!-- Заголовок формы -->
        <div class="form-header">
          <h1 class="form-title" style="color: var(--color-text);">
            Гранты на «Ключ.Академия»
          </h1>
        </div>

        <!-- Информационный текст -->
        <div class="info-text">
          <p class="info-paragraph" style="color: var(--color-text-secondary);">
            Знаю, что некоторые из вас очень хотят попасть на обучение, но не все могут в связи с разными причинами.
          </p>
          <p class="info-paragraph" style="color: var(--color-text-secondary);">
            Этот поток последний до конца следующего года, поэтому хочу дать возможность попасть на курс всем, кому действительно это нужно.
          </p>
          <p class="info-paragraph" style="color: var(--color-text-secondary);">
            Я дарю 5 мест на этот поток «Ключ. Академия» с грантами.
          </p>
          <p class="info-paragraph" style="color: var(--color-text-secondary);">
            Гранты дают скидки от 10 до 50% на курс. Скидки считаются от текущей цены курса, указанной на сайте.
          </p>
          <ul class="grant-list">
            <li>1 место — 50%</li>
            <li>2 место — 40%</li>
            <li>3 место — 35%</li>
            <li>4 место — 20%</li>
            <li>5 место — 10%</li>
          </ul>
          <p class="info-paragraph" style="color: var(--color-text-secondary);">
            Отвечайте на все вопросы максимально подробно, я и моя команда будем все читать
          </p>
          <p class="info-paragraph" style="color: var(--color-text-secondary);">
            Обязательно потом отвечайте моей команде, когда они будут с вами связываться, иначе ваше место может перейти другому
          </p>
          <p class="info-paragraph deadline" style="color: var(--color-text); font-weight: 600;">
            Дедлайн заполнения - 48 часов
          </p>
        </div>
        
        <!-- Форма -->
        <form @submit.prevent="handleSubmit" class="form-content">
          <!-- Контейнер для полей ввода -->
          <div class="form-fields">
            <!-- Имя и фамилия -->
            <div class="form-field">
              <label class="block text-sm font-semibold mb-2 flex items-center" style="color: var(--color-text);">
                <span class="required-asterisk">*</span>
                Ваше имя и фамилия
              </label>
              <input 
                v-model="form.fullName" 
                type="text" 
                class="input" 
                :class="{ 'input-error': fullNameError }"
                placeholder="Например: Иван Иванов"
                required
                :disabled="loading"
                @blur="validateFullName"
                @input="handleFullNameInput"
              />
              <p v-if="fullNameError" class="text-xs mt-1.5 ml-1" style="color: var(--color-danger);">
                {{ fullNameError }}
              </p>
            </div>

            <!-- Номер телефона -->
            <div class="form-field">
              <label class="block text-sm font-semibold mb-2 flex items-center" style="color: var(--color-text);">
                <span class="required-asterisk">*</span>
                Номер телефона
              </label>
              <input 
                v-model="form.phone" 
                type="tel" 
                class="input" 
                :class="{ 'input-error': phoneError }"
                placeholder="+7 (999) 123-45-67"
                required
                :disabled="loading"
                @blur="validatePhone"
                @input="handlePhoneInput"
              />
              <p v-if="phoneError" class="text-xs mt-1.5 ml-1" style="color: var(--color-danger);">
                {{ phoneError }}
              </p>
            </div>

            <!-- Почта -->
            <div class="form-field">
              <label class="block text-sm font-semibold mb-2 flex items-center" style="color: var(--color-text);">
                <span class="required-asterisk">*</span>
                Почта
              </label>
              <input 
                v-model="form.email" 
                type="email" 
                class="input" 
                :class="{ 'input-error': emailError }"
                placeholder="Например: ivan@example.com"
                required
                :disabled="loading"
                @blur="validateEmail"
                @input="handleEmailInput"
              />
              <p v-if="emailError" class="text-xs mt-1.5 ml-1" style="color: var(--color-danger);">
                {{ emailError }}
              </p>
            </div>

            <!-- Ник в телеграм -->
            <div class="form-field">
              <label class="block text-sm font-semibold mb-2 flex items-center" style="color: var(--color-text);">
                <span class="required-asterisk">*</span>
                Ник в телеграм через @
              </label>
              <input 
                v-model="form.telegramNick" 
                type="text" 
                class="input" 
                :class="{ 'input-error': telegramNickError }"
                placeholder="@username"
                required
                :disabled="loading"
                @blur="validateTelegramNick"
                @input="handleTelegramNickInput"
              />
              <p v-if="telegramNickError" class="text-xs mt-1.5 ml-1" style="color: var(--color-danger);">
                {{ telegramNickError }}
              </p>
            </div>

            <!-- Ситуация в недвижимости -->
            <div class="form-field">
              <label class="block text-sm font-semibold mb-2 flex items-center" style="color: var(--color-text);">
                <span class="required-asterisk">*</span>
                Расскажите подробнее про свою ситуацию в сфере недвижимости
              </label>
              <textarea 
                v-model="form.realEstateSituation" 
                class="textarea" 
                :class="{ 'textarea-error': realEstateSituationError }"
                placeholder="Опишите вашу ситуацию..."
                required
                :disabled="loading"
                @blur="validateRealEstateSituation"
                @input="handleRealEstateSituationInput"
              ></textarea>
              <p v-if="realEstateSituationError" class="text-xs mt-1.5 ml-1" style="color: var(--color-danger);">
                {{ realEstateSituationError }}
              </p>
            </div>

            <!-- Желаемый результат -->
            <div class="form-field">
              <label class="block text-sm font-semibold mb-2 flex items-center" style="color: var(--color-text);">
                <span class="required-asterisk">*</span>
                А к какому результату хотели бы прийти?
              </label>
              <textarea 
                v-model="form.desiredResult" 
                class="textarea" 
                :class="{ 'textarea-error': desiredResultError }"
                placeholder="Опишите желаемый результат..."
                required
                :disabled="loading"
                @blur="validateDesiredResult"
                @input="handleDesiredResultInput"
              ></textarea>
              <p v-if="desiredResultError" class="text-xs mt-1.5 ml-1" style="color: var(--color-danger);">
                {{ desiredResultError }}
              </p>
            </div>

            <!-- Почему должны получить грант -->
            <div class="form-field">
              <label class="block text-sm font-semibold mb-2 flex items-center" style="color: var(--color-text);">
                Почему именно вы должны получить грант на мою программу «Ключ. Академия»?
              </label>
              <textarea 
                v-model="form.whyDeserveGrant" 
                class="textarea" 
                placeholder="Опишите, почему вы должны получить грант..."
                :disabled="loading"
              ></textarea>
            </div>
          </div>

          <!-- Сообщение об успехе -->
          <div v-if="success" class="message-box success-message">
            <div class="flex items-center gap-3">
              <i class="fas fa-check-circle text-2xl" style="color: var(--color-success)"></i>
              <div>
                <p class="font-semibold" style="color: var(--color-text);">Отлично!</p>
                <p class="text-sm" style="color: var(--color-text-secondary);">Ваша заявка успешно отправлена</p>
              </div>
            </div>
          </div>

          <!-- Сообщение об ошибке -->
          <div v-if="error" class="message-box error-message">
            <div class="flex items-center gap-3">
              <i class="fas fa-exclamation-triangle text-2xl" style="color: var(--color-danger)"></i>
              <div>
                <p class="font-semibold" style="color: var(--color-text);">Ошибка</p>
                <p class="text-sm" style="color: var(--color-text-secondary);">{{ error }}</p>
                <p class="text-xs mt-1" style="color: #999;">Проверьте консоль браузера (F12) для подробностей</p>
              </div>
            </div>
          </div>

          <!-- Кнопка отправки -->
          <button 
            type="submit" 
            class="btn btn-primary submit-button"
            :disabled="loading"
          >
            <i v-if="loading" class="fas fa-spinner animate-spin mr-3"></i>
            <i v-else class="fas fa-paper-plane mr-3"></i>
            {{ loading ? 'Отправка...' : 'Отправить заявку' }}
          </button>

          <!-- Дополнительная информация -->
          <div class="form-footer">
            <div class="flex items-center justify-center gap-2 text-sm">
              <i class="fas fa-lock" style="color: var(--color-text-secondary)"></i>
              <span style="color: var(--color-text-secondary);">Ваши данные в безопасности</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
console.log('[FormPage] Script setup: начало выполнения компонента')

import { ref, onMounted, onErrorCaptured, watch } from 'vue'
console.log('[FormPage] Script setup: Vue импортирован')

import { apiSubmitRoute } from '../api/submit'
console.log('[FormPage] Script setup: apiSubmitRoute импортирован:', typeof apiSubmitRoute !== 'undefined')

console.log('[FormPage] Script setup: проверка ctx')
console.log('[FormPage] Script setup: typeof ctx:', typeof ctx)
if (typeof window !== 'undefined') {
  console.log('[FormPage] Script setup: window.location:', window.location.href)
}

console.log('[FormPage] Script setup: определение переменных формы')

// Сначала объявляем все переменные
const form = ref({
  fullName: '',
  phone: '',
  email: '',
  telegramNick: '',
  realEstateSituation: '',
  desiredResult: '',
  whyDeserveGrant: ''
})

const loading = ref(false)
const success = ref(false)
const error = ref(null)

// Ошибки валидации
const fullNameError = ref(null)
const phoneError = ref(null)
const emailError = ref(null)
const telegramNickError = ref(null)
const realEstateSituationError = ref(null)
const desiredResultError = ref(null)

// Теперь можно использовать переменные в watch
// Отслеживание изменений error для логирования
watch(error, (newValue, oldValue) => {
  console.log('[FormPage] watch error: изменение error.value')
  console.log('[FormPage] watch error: старое значение:', oldValue)
  console.log('[FormPage] watch error: новое значение:', newValue)
  if (newValue) {
    console.error('[FormPage] watch error: установлена ошибка:', newValue)
    console.error('[FormPage] watch error: стек вызова:', new Error().stack)
  }
}, { immediate: true })

// Перехват ошибок Vue
onErrorCaptured((err, instance, info) => {
  console.error('[FormPage] onErrorCaptured: перехвачена ошибка Vue:', err)
  console.error('[FormPage] onErrorCaptured: тип ошибки:', typeof err)
  console.error('[FormPage] onErrorCaptured: сообщение:', err instanceof Error ? err.message : String(err))
  console.error('[FormPage] onErrorCaptured: стек:', err instanceof Error ? err.stack : 'нет стека')
  console.error('[FormPage] onErrorCaptured: информация:', info)
  console.error('[FormPage] onErrorCaptured: компонент:', instance)
  return false
})

onMounted(() => {
  console.log('[FormPage] onMounted: компонент смонтирован')
  console.log('[FormPage] onMounted: typeof ctx:', typeof ctx)
  console.log('[FormPage] onMounted: apiSubmitRoute:', typeof apiSubmitRoute !== 'undefined' ? 'определен' : 'НЕ ОПРЕДЕЛЕН')
  
  if (typeof ctx === 'undefined') {
    console.error('[FormPage] onMounted: ВНИМАНИЕ! ctx НЕ ОПРЕДЕЛЕН! Это может привести к ошибкам при отправке формы.')
  }
  
  // Глобальный обработчик ошибок
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('[FormPage] window.onerror: перехвачена глобальная ошибка:', event.error)
      console.error('[FormPage] window.onerror: сообщение:', event.message)
      console.error('[FormPage] window.onerror: источник:', event.filename, ':', event.lineno, ':', event.colno)
    })
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('[FormPage] window.onunhandledrejection: необработанное обещание:', event.reason)
      console.error('[FormPage] window.onunhandledrejection: promise:', event.promise)
    })
  }
})

// Валидация имени
function validateFullName() {
  const value = form.value.fullName.trim()
  
  if (!value) {
    fullNameError.value = 'Обязательное поле'
    return false
  }
  
  fullNameError.value = null
  return true
}

function handleFullNameInput() {
  if (fullNameError.value) {
    validateFullName()
  }
}

// Валидация телефона
function validatePhone() {
  const value = form.value.phone.trim()
  
  if (!value) {
    phoneError.value = 'Обязательное поле'
    return false
  }
  
  // Простая валидация телефона (минимум 10 цифр)
  const digitsOnly = value.replace(/\D/g, '')
  if (digitsOnly.length < 10) {
    phoneError.value = 'Введите корректный номер телефона'
    return false
  }
  
  phoneError.value = null
  return true
}

function handlePhoneInput() {
  if (phoneError.value) {
    validatePhone()
  }
}

// Валидация email
function validateEmail() {
  const value = form.value.email.trim()
  
  if (!value) {
    emailError.value = 'Обязательное поле'
    return false
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    emailError.value = 'Пожалуйста, введите корректный email'
    return false
  }
  
  emailError.value = null
  return true
}

function handleEmailInput() {
  if (emailError.value) {
    validateEmail()
  }
}

// Валидация телеграм ника
function validateTelegramNick() {
  const value = form.value.telegramNick.trim()
  
  if (!value) {
    telegramNickError.value = 'Обязательное поле'
    return false
  }
  
  // Проверка на наличие @ в начале
  if (!value.startsWith('@')) {
    telegramNickError.value = 'Ник должен начинаться с @'
    return false
  }
  
  // Минимум 5 символов (@ + минимум 4 символа)
  if (value.length < 5) {
    telegramNickError.value = 'Ник слишком короткий'
    return false
  }
  
  telegramNickError.value = null
  return true
}

function handleTelegramNickInput() {
  if (telegramNickError.value) {
    validateTelegramNick()
  }
}

// Валидация ситуации в недвижимости
function validateRealEstateSituation() {
  const value = form.value.realEstateSituation.trim()
  
  if (!value) {
    realEstateSituationError.value = 'Обязательное поле'
    return false
  }
  
  if (value.length < 20) {
    realEstateSituationError.value = 'Пожалуйста, опишите подробнее (минимум 20 символов)'
    return false
  }
  
  realEstateSituationError.value = null
  return true
}

function handleRealEstateSituationInput() {
  if (realEstateSituationError.value) {
    validateRealEstateSituation()
  }
}

// Валидация желаемого результата
function validateDesiredResult() {
  const value = form.value.desiredResult.trim()
  
  if (!value) {
    desiredResultError.value = 'Обязательное поле'
    return false
  }
  
  if (value.length < 20) {
    desiredResultError.value = 'Пожалуйста, опишите подробнее (минимум 20 символов)'
    return false
  }
  
  desiredResultError.value = null
  return true
}

function handleDesiredResultInput() {
  if (desiredResultError.value) {
    validateDesiredResult()
  }
}

// Обработка отправки формы
async function handleSubmit() {
  console.log('[FormPage] handleSubmit: начало отправки формы')
  
  loading.value = true
  success.value = false
  error.value = null
  
  console.log('[FormPage] handleSubmit: данные формы:', {
    fullName: form.value.fullName ? 'заполнено' : 'пусто',
    phone: form.value.phone ? 'заполнено' : 'пусто',
    email: form.value.email || 'пусто',
    telegramNick: form.value.telegramNick ? 'заполнено' : 'пусто',
    realEstateSituation: form.value.realEstateSituation ? 'заполнено' : 'пусто',
    desiredResult: form.value.desiredResult ? 'заполнено' : 'пусто',
    whyDeserveGrant: form.value.whyDeserveGrant ? 'заполнено' : 'пусто'
  })
  
  // Валидация всех полей
  console.log('[FormPage] handleSubmit: начало валидации полей')
  const isValid = 
    validateFullName() &&
    validatePhone() &&
    validateEmail() &&
    validateTelegramNick() &&
    validateRealEstateSituation() &&
    validateDesiredResult()
  
  console.log('[FormPage] handleSubmit: результат валидации:', isValid)
  console.log('[FormPage] handleSubmit: ошибки полей:', {
    fullName: fullNameError.value,
    phone: phoneError.value,
    email: emailError.value,
    telegramNick: telegramNickError.value,
    realEstateSituation: realEstateSituationError.value,
    desiredResult: desiredResultError.value
  })
  
  if (!isValid) {
    console.warn('[FormPage] handleSubmit: валидация не пройдена, прекращаем отправку')
    loading.value = false
    error.value = 'Пожалуйста, заполните все обязательные поля корректно'
    return
  }
  
  try {
    console.log('[FormPage] handleSubmit: валидация пройдена, начинаем отправку данных на сервер')
    
    if (typeof ctx === 'undefined') {
      const errorMsg = 'ctx не определен. Невозможно отправить форму.'
      console.error('[FormPage] handleSubmit: КРИТИЧЕСКАЯ ОШИБКА:', errorMsg)
      throw new Error(errorMsg)
    }
    
    if (typeof apiSubmitRoute === 'undefined') {
      const errorMsg = 'apiSubmitRoute не определен. Невозможно отправить форму.'
      console.error('[FormPage] handleSubmit: КРИТИЧЕСКАЯ ОШИБКА:', errorMsg)
      throw new Error(errorMsg)
    }
    
    console.log('[FormPage] handleSubmit: проверка ctx:', typeof ctx !== 'undefined' ? 'определен' : 'НЕ ОПРЕДЕЛЕН')
    console.log('[FormPage] handleSubmit: проверка apiSubmitRoute:', typeof apiSubmitRoute !== 'undefined' ? 'определен' : 'НЕ ОПРЕДЕЛЕН')
    
    const requestData = {
      fullName: form.value.fullName.trim(),
      phone: form.value.phone.trim(),
      email: form.value.email.trim(),
      telegramNick: form.value.telegramNick.trim(),
      realEstateSituation: form.value.realEstateSituation.trim(),
      desiredResult: form.value.desiredResult.trim(),
      whyDeserveGrant: form.value.whyDeserveGrant.trim() || undefined
    }
    
    console.log('[FormPage] handleSubmit: данные для отправки:', {
      ...requestData,
      realEstateSituation: `length=${requestData.realEstateSituation.length}`,
      desiredResult: `length=${requestData.desiredResult.length}`,
      whyDeserveGrant: requestData.whyDeserveGrant ? `length=${requestData.whyDeserveGrant.length}` : 'не заполнено'
    })
    
    console.log('[FormPage] handleSubmit: вызов apiSubmitRoute.run() с ctx и requestData')
    console.log('[FormPage] handleSubmit: typeof apiSubmitRoute.run:', typeof apiSubmitRoute.run)
    
    const data = await apiSubmitRoute.run(ctx, requestData)
    
    console.log('[FormPage] handleSubmit: получен ответ от сервера:', data)
    
    if (!data.success) {
      console.error('[FormPage] handleSubmit: сервер вернул ошибку:', data.error)
      throw new Error(data.error || 'Ошибка при отправке заявки')
    }
    
    console.log('[FormPage] handleSubmit: заявка успешно создана, ID:', data.id)
    success.value = true
    
    // Очистка формы через 3 секунды
    setTimeout(() => {
      console.log('[FormPage] handleSubmit: очистка формы через 3 секунды')
      form.value = {
        fullName: '',
        phone: '',
        email: '',
        telegramNick: '',
        realEstateSituation: '',
        desiredResult: '',
        whyDeserveGrant: ''
      }
      success.value = false
    }, 3000)
    
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e)
    const errorStack = e instanceof Error ? e.stack : 'нет стека'
    
    console.error('[FormPage] handleSubmit: ОШИБКА при отправке формы:', errorMessage)
    console.error('[FormPage] handleSubmit: стек ошибки:', errorStack)
    console.error('[FormPage] handleSubmit: полный объект ошибки:', e)
    console.error('[FormPage] handleSubmit: тип ошибки:', typeof e)
    console.error('[FormPage] handleSubmit: ctx доступен:', typeof ctx !== 'undefined')
    console.error('[FormPage] handleSubmit: apiSubmitRoute доступен:', typeof apiSubmitRoute !== 'undefined')
    
    error.value = errorMessage || 'Ошибка при отправке заявки. Попробуйте позже.'
    setTimeout(() => {
      error.value = null
    }, 5000)
  } finally {
    loading.value = false
    console.log('[FormPage] handleSubmit: завершение обработки, loading = false')
  }
}
</script>

<style>
/* === АДАПТИВНАЯ ФОРМА === */

/* Общий контейнер формы */
.form-container {
  padding: 1rem;
  position: relative;
  overflow: hidden;
}

/* Декоративные элементы */
.decorative-element {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.decorative-element-1 {
  top: 10%;
  left: 5%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(212, 184, 150, 0.08) 0%, transparent 70%);
}

.decorative-element-2 {
  bottom: 10%;
  right: 5%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(200, 168, 128, 0.06) 0%, transparent 70%);
}

/* Обёртка формы */
.form-wrapper {
  width: 100%;
  max-width: 900px;
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Шапка формы */
.form-header {
  margin-bottom: 2rem;
  text-align: center;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0;
  line-height: 1.2;
}

/* Информационный текст */
.info-text {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: var(--color-button-light);
  border-radius: 1rem;
}

.info-paragraph {
  margin-bottom: 1rem;
  line-height: 1.6;
  font-size: 0.9375rem;
}

.info-paragraph:last-of-type {
  margin-bottom: 1.5rem;
}

.info-paragraph.deadline {
  margin-top: 1.5rem;
  margin-bottom: 0;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.grant-list {
  list-style: none;
  padding-left: 0;
  margin: 1rem 0;
}

.grant-list li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.grant-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--color-primary);
  font-weight: bold;
  font-size: 1.2rem;
}

/* Контент формы */
.form-content {
  display: flex;
  flex-direction: column;
}

/* Контейнер полей */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-field {
  flex: 1;
  min-width: 0;
}

.required-asterisk {
  color: var(--color-danger);
  margin-right: 0.25rem;
}

/* Сообщения */
.message-box {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid;
  margin-bottom: 1.25rem;
}

.success-message {
  background: rgba(122, 155, 92, 0.1);
  border-color: var(--color-success);
}

.error-message {
  background: rgba(184, 92, 92, 0.1);
  border-color: var(--color-danger);
}

/* Кнопка отправки */
.submit-button {
  width: 100%;
  font-size: 1.125rem;
}

/* Футер формы */
.form-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
}

/* === ПОРТРЕТНАЯ ОРИЕНТАЦИЯ (МОБИЛЬНЫЕ) === */
@media (orientation: portrait) {
  .form-container {
    padding: 0.75rem;
  }
  
  .form-wrapper {
    max-width: 100%;
    width: 100%;
  }
  
  .card {
    padding: 2rem 1.5rem !important;
    max-width: 100%;
    width: 100%;
  }
  
  .form-title {
    font-size: 1.75rem;
  }
  
  .info-text {
    padding: 1.25rem;
  }
  
  .info-paragraph {
    font-size: 0.875rem;
  }
}

/* === АЛЬБОМНАЯ ОРИЕНТАЦИЯ (ДЕСКТОП) === */
@media (orientation: landscape) {
  .form-container {
    padding: 2rem;
  }
  
  .form-wrapper {
    max-width: 900px;
    width: 100%;
  }
  
  .card {
    width: 100% !important;
    padding: 3rem !important;
  }
  
  .form-fields {
    gap: 1.75rem;
  }
}

/* === АДАПТАЦИЯ ПОД МАЛЕНЬКИЕ ЭКРАНЫ === */
@media (max-width: 900px) and (orientation: landscape) {
  .card {
    padding: 2rem 1.5rem !important;
  }
  
  .form-title {
    font-size: 1.75rem;
  }
  
  .info-text {
    padding: 1.25rem;
  }
}

/* === АДАПТАЦИЯ ПОД ОЧЕНЬ МАЛЕНЬКИЕ ЭКРАНЫ === */
@media (max-width: 640px) {
  .form-container {
    padding: 0.5rem;
  }
  
  .card {
    padding: 1.5rem 1rem !important;
    border-radius: 1.25rem !important;
  }
  
  .form-title {
    font-size: 1.5rem;
  }
  
  .info-text {
    padding: 1rem;
  }
  
  .info-paragraph {
    font-size: 0.8125rem;
  }
  
  .form-fields {
    gap: 1.25rem;
  }
  
  .submit-button {
    font-size: 1rem;
    padding: 1rem 2rem;
  }
}

/* === АДАПТАЦИЯ ПОД БОЛЬШИЕ ЭКРАНЫ === */
@media (min-width: 1200px) and (orientation: landscape) {
  .form-wrapper {
    max-width: 1000px;
    width: 100%;
  }
  
  .card {
    padding: 3.5rem !important;
  }
  
  .form-fields {
    gap: 2rem;
  }
}
</style>

