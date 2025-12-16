// @shared-route
/**
 * API для отслеживания событий и аналитики Workspace
 * Регистрирует события пользователей для анализа поведения
 * 
 * Этот файл показывает примеры работы с writeWorkspaceEvent для записи
 * пользовательских событий вашего приложения (не GetCourse и не трафик)
 */

import { writeWorkspaceEvent, getWorkspaceEventUrl } from '@start/sdk'
import { sendNotificationToAccountOwners } from "@user-notifier/sdk"

// ============== WORKSPACE СОБЫТИЯ ==============

/**
 * Регистрирует доступные события в системе
 * Эти события будут видны в AI агентах и админке
 */
app.accountHook('@start/agent/events', async (ctx, params) => {
  return [{
    name: 'Пользователь зарегистрировался',
    url: await getWorkspaceEventUrl(ctx, 'user_registered'),
  }, {
    name: 'Заполнена форма обратной связи',
    url: await getWorkspaceEventUrl(ctx, 'contact_form_submitted'),
  }, {
    name: 'Создан новый заказ',
    url: await getWorkspaceEventUrl(ctx, 'order_created'),
  }, {
    name: 'Заполнена форма с ответами',
    url: await getWorkspaceEventUrl(ctx, 'answers_filled'),
  }, {
    name: 'Отправлена заявка',
    url: await getWorkspaceEventUrl(ctx, 'lead_submitted'),
  }, {
    name: 'Пройден квиз',
    url: await getWorkspaceEventUrl(ctx, 'quiz_completed'),
  }]
})

/**
 * POST /auth/register
 * Обработчик регистрации пользователя
 * @param body.firstName Имя пользователя
 * @param body.lastName Фамилия пользователя
 * @param body.email Email пользователя
 * @param body.phone Телефон пользователя
 * @returns Результат регистрации
 */
export const registerUserRoute = app.post('/auth/register', async (ctx, req) => {
  const { firstName, lastName, email, phone } = req.body

  try {
    await writeWorkspaceEvent(ctx, 'user_registered', {
      user: {
        email: email,
        phone: phone,
        firstName: firstName,
        lastName: lastName,
      },
      action_params: {
        registration_source: 'web_form',
        user_agent: ctx.req.headers['user-agent']
      },
      action_param1: 'web_registration',
      uid: ctx.session?.id,
      utm_source: ctx.req.query.utm_source,
      utm_medium: ctx.req.query.utm_medium,
      utm_campaign: ctx.req.query.utm_campaign,
    })

    await sendNotificationToAccountOwners(ctx, {
      title: "Новый пользователь зарегистрирован",
      html: `<h2>Регистрация нового пользователя</h2>
             <p><strong>Имя:</strong> ${firstName} ${lastName}</p>
             <p><strong>Email:</strong> ${email}</p>
             <p><strong>Телефон:</strong> ${phone}</p>`,
      plain: `Новый пользователь: ${firstName} ${lastName}, ${email}, ${phone}`,
      md: `**Новый пользователь:** ${firstName} ${lastName}\n📧 ${email}\n📱 ${phone}`,
    })

    return { success: true, message: 'Регистрация успешна' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка регистрации'
    }
  }
})

/**
 * POST /contact
 * Обработчик формы обратной связи
 * @param body.name Имя отправителя
 * @param body.email Email отправителя
 * @param body.message Текст сообщения
 * @param body.topic Тема сообщения
 * @returns Результат отправки
 */
export const contactFormRoute = app.post('/contact', async (ctx, req) => {
  const { name, email, message, topic } = req.body

  try {
    await writeWorkspaceEvent(ctx, 'contact_form_submitted', {
      user: {
        email: email,
        firstName: name,
      },
      action_params: {
        topic: topic,
        message_length: message.length,
        page: ctx.req.headers.referer || 'direct'
      },
      action_param1: topic,
      action_param2: 'contact_form',
      uid: ctx.session?.id,
    })

    await sendNotificationToAccountOwners(ctx, {
      title: `Новое сообщение с формы обратной связи: ${topic}`,
      html: `<h2>Сообщение от ${name}</h2>
             <p><strong>Тема:</strong> ${topic}</p>
             <p><strong>Email:</strong> ${email}</p>
             <div style="background: #f5f5f5; padding: 15px; margin-top: 10px;">
               <strong>Сообщение:</strong><br>${message.replace(/\n/g, '<br>')}
             </div>`,
      plain: `Сообщение от ${name} (${email}) по теме "${topic}": ${message}`,
      md: `**Сообщение от** ${name} (${email})\n\n**Тема:** ${topic}\n\n**Сообщение:**\n${message}`,
    })

    return { success: true, message: 'Сообщение отправлено' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка отправки'
    }
  }
})

/**
 * POST /orders
 * Обработчик создания нового заказа
 * @param body.items Массив товаров в заказе
 * @param body.customerEmail Email клиента
 * @param body.customerName Имя клиента
 * @param body.total Сумма заказа
 * @returns Результат создания заказа
 */
export const createOrderRoute = app.post('/orders', async (ctx, req) => {
  const { items, customerEmail, customerName, total } = req.body

  try {
    await writeWorkspaceEvent(ctx, 'order_created', {
      user: {
        email: customerEmail,
        firstName: customerName,
      },
      action_params: {
        total_amount: total,
        item_count: items.length,
        items: items.map((item: any) => item.name)
      },
      action_param1: 'order_completed',
      action_param1_int: Math.round(total),
      action_param2_int: items.length,
      uid: ctx.session?.id,
      utm_source: ctx.req.query.utm_source,
      utm_medium: ctx.req.query.utm_medium,
    })

    await sendNotificationToAccountOwners(ctx, {
      title: `Новый заказ на сумму ${total}₽`,
      html: `<h2>Новый заказ</h2>
             <p><strong>Клиент:</strong> ${customerName} (${customerEmail})</p>
             <p><strong>Сумма:</strong> ${total}₽</p>
             <p><strong>Товаров:</strong> ${items.length}</p>
             <ul>${items.map((item: any) => `<li>${item.name} - ${item.price}₽</li>`).join('')}</ul>`,
      plain: `Новый заказ от ${customerName} (${customerEmail}) на сумму ${total}₽. Товаров: ${items.length}`,
      md: `## Новый заказ\n\n**Клиент:** ${customerName} (${customerEmail})\n**Сумма:** ${total}₽\n**Товары:** ${items.length}\n${items.map((item: any) => `- ${item.name} - ${item.price}₽`).join('\n')}`,
    })

    return { success: true, orderId: 123, message: 'Заказ создан' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка создания заказа'
    }
  }
})

/**
 * POST /track/pageview
 * Отслеживает просмотры страниц
 * @param body.page URL страницы
 * @param body.title Заголовок страницы
 * @param body.referrer Реферер
 * @returns Результат отслеживания
 */
export const trackPageViewRoute = app.post('/track/pageview', async (ctx, req) => {
  const { page, title, referrer } = req.body

  try {
    await writeWorkspaceEvent(ctx, 'page_view', {
      action_params: {
        page: page,
        title: title,
        referrer: referrer,
      },
      action_param1: page,
      uid: ctx.session?.id,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка отслеживания'
    }
  }
})

/**
 * POST /track/action
 * Отслеживает действия пользователя
 * @param body.action Тип действия
 * @param body.element HTML элемент
 * @param body.page Страница
 * @param body.data Дополнительные данные
 * @returns Результат отслеживания
 */
export const trackUserActionRoute = app.post('/track/action', async (ctx, req) => {
  const { action, element, page, data } = req.body

  try {
    await writeWorkspaceEvent(ctx, 'user_action', {
      action_params: {
        action_type: action,
        element_type: element,
        page: page,
        data: data,
      },
      action_param1: action,
      action_param2: element,
      uid: ctx.session?.id,
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка отслеживания'
    }
  }
})

/**
 * POST /quiz/submit
 * Обработчик результатов квиза
 * @param body.answers Ответы на вопросы
 * @param body.quizName Название квиза
 * @param body.score Количество правильных ответов
 * @returns Результаты и квалификация
 */
export const submitQuizRoute = app.post('/quiz/submit', async (ctx, req) => {
  const { answers, quizName, score } = req.body
  const user = ctx.user

  try {
    await writeWorkspaceEvent(ctx, 'quiz_completed', {
      user: user ? {
        email: user.confirmedEmail,
        firstName: user.firstName,
        lastName: user.lastName,
      } : undefined,
      action_params: {
        quiz_name: quizName,
        score: score,
        total_questions: answers.length,
        answers: answers,
      },
      action_param1: quizName,
      action_param1_int: score,
      action_param2_int: answers.length,
      uid: ctx.session?.id,
    })

    if (score >= 80) {
      await sendNotificationToAccountOwners(ctx, {
        title: `Пользователь отлично прошел квиз!`,
        html: `<h2>Отличный результат!</h2>
               <p>Пользователь ${user?.displayName || 'Аноним'} прошел квиз "${quizName}" с результатом ${score}%</p>`,
        plain: `Отличный результат: ${user?.displayName || 'Аноним'} прошел квиз "${quizName}" с результатом ${score}%`,
        md: `## Отличный результат!\n\n**Пользователь:** ${user?.displayName || 'Аноним'}\n**Квиз:** ${quizName}\n**Результат:** ${score}%`,
      })
    }

    return { success: true, score, qualification: score >= 80 ? 'expert' : score >= 60 ? 'intermediate' : 'beginner' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка обработки квиза'
    }
  }
})

// ============== КЛИЕНТСКИЕ СОБЫТИЯ (window.clrtTrack) ==============

/**
 * Пример Vue компонента с клиентским трекингом событий
 * Сохраните как ClientTrackingExample.vue
 */
export const vueClientTrackingExample = `
<template>
  <div class="page">
    <h1>Пример клиентского трекинга</h1>
    
    <!-- Кнопки с трекингом -->
    <button @click="trackButtonClick('cta-primary')" class="btn-primary">
      Главная кнопка
    </button>
    
    <button @click="trackButtonClick('cta-secondary')" class="btn-secondary">
      Вторичная кнопка
    </button>
    
    <!-- Ссылка с трекингом -->
    <a href="/page" @click="trackLinkClick('/page', 'Internal link')">
      Перейти на страницу
    </a>
    
    <!-- Форма с трекингом -->
    <form @submit.prevent="handleFormSubmit">
      <input v-model="formData.email" type="email" placeholder="Email" />
      <button type="submit">Отправить</button>
    </form>
    
    <!-- Видео с трекингом -->
    <video 
      ref="videoPlayer"
      @play="trackVideoPlay"
      @pause="trackVideoPause"
      @ended="trackVideoComplete"
      src="/video.mp4"
      controls
    ></video>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const formData = ref({ email: '' })
const videoPlayer = ref(null)
const scrollDepth = ref(0)

// Трекинг при монтировании страницы
onMounted(() => {
  // Записываем событие загрузки страницы
  window.clrtTrack({
    url: 'event://custom/page-loaded',
    action: 'pageview',
    action_param1: window.location.pathname
  })
  
  // Отслеживание прокрутки
  window.addEventListener('scroll', handleScroll)
})

// Трекинг кликов по кнопкам
function trackButtonClick(buttonName) {
  window.clrtTrack({
    url: 'event://custom/button-click',
    action: 'button_click',
    action_param1: buttonName,
    action_param2: window.location.pathname
  })
}

// Трекинг кликов по ссылкам
function trackLinkClick(url, linkText) {
  window.clrtTrack({
    url: 'event://custom/link-click',
    action: 'link_click',
    action_param1: url,
    action_param2: linkText
  })
}

// Трекинг отправки формы
function handleFormSubmit() {
  window.clrtTrack({
    url: 'event://custom/form-submit',
    action: 'form_submit',
    action_param1: 'email-form',
    action_param2: formData.value.email
  })
}

// Трекинг видео
function trackVideoPlay() {
  window.clrtTrack({
    url: 'event://custom/video-play',
    action: 'video_play',
    action_param1: '/video.mp4'
  })
}

function trackVideoPause() {
  window.clrtTrack({
    url: 'event://custom/video-pause',
    action: 'video_pause',
    action_param1: '/video.mp4',
    action_param2: String(Math.round(videoPlayer.value?.currentTime || 0))
  })
}

function trackVideoComplete() {
  window.clrtTrack({
    url: 'event://custom/video-complete',
    action: 'video_complete',
    action_param1: '/video.mp4'
  })
}

// Трекинг прокрутки страницы
function handleScroll() {
  const currentDepth = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  )
  
  if (currentDepth > scrollDepth.value) {
    scrollDepth.value = currentDepth
    
    // Трекаем каждые 25%
    if ([25, 50, 75, 100].includes(currentDepth)) {
      window.clrtTrack({
        url: 'event://custom/scroll-depth',
        action: 'scroll',
        action_param1: currentDepth + '%'
      })
    }
  }
}
</script>
`

// ============== UTM МЕТКИ ==============

/**
 * POST /api/track/lead-with-utm
 * Пример записи события с UTM метками
 * Body: { name, email, phone, message, utmSource, utmMedium, utmCampaign, clrtUid }
 */
export const trackLeadWithUtmRoute = app.post('/track/lead-with-utm', async (ctx, req) => {
  const { name, email, phone, message, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, clrtUid } = req.body
  
  try {
    await writeWorkspaceEvent(ctx, 'lead_submitted', {
      user: {
        email,
        phone,
        firstName: name
      },
      action_param1: 'lead_form',
      action_param2: email,
      action_param3: phone,
      uid: clrtUid,
      // ⚠️ ВАЖНО: Всегда передавайте UTM метки если есть
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_term: utmTerm,
      utm_content: utmContent,
      action_params: {
        message,
        message_length: message?.length || 0,
        page: ctx.req.headers.referer || 'direct'
      }
    })
    
    return { success: true, message: 'Заявка записана с UTM метками' }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})
