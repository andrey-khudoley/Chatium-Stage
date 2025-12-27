// @shared-route

import { ChannelLinks } from './tables/channel-links.table'
import { ChannelLinkAnalytics } from './tables/channel-link-analytics.table'
import { BotTokens } from './tables/bot-tokens.table'
import { Debug } from './shared/debug'
import { applyDebugLevel } from './lib/logging'
import { request } from '@app/request'

/**
 * GET /link/:linkId
 * Обработчик перехода по отслеживаемой ссылке
 * 
 * Логика:
 * 1. Получаем query параметры из URL
 * 2. Ждём инициализации системы трафика (window.clrtUid)
 * 3. Записываем переход в аналитику с uid и query параметрами
 * 4. Проверяем, не был ли уже переход с этим uid (уникальные переходы)
 * 5. Создаём ссылку для вступления в Telegram через Bot API
 * 6. Редиректим пользователя на созданную ссылку
 */
export const linkRedirectRoute = app.html('/link/:linkId', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'link-redirect')
    Debug.info(ctx, '[link-redirect] Начало обработки перехода по ссылке')
    
    const { linkId } = req.params
    
    if (!linkId || !linkId.trim()) {
      Debug.warn(ctx, '[link-redirect] ID ссылки не предоставлен')
      return (
        <html>
          <head>
            <title>Ошибка</title>
            <meta charset="UTF-8" />
          </head>
          <body>
            <h1>Ссылка не найдена</h1>
          </body>
        </html>
      )
    }
    
    // Получаем ссылку из базы
    const link = await ChannelLinks.findById(ctx, linkId.trim())
    
    if (!link) {
      Debug.warn(ctx, `[link-redirect] Ссылка ${linkId} не найдена`)
      return (
        <html>
          <head>
            <title>Ошибка</title>
            <meta charset="UTF-8" />
          </head>
          <body>
            <h1>Ссылка не найдена</h1>
          </body>
        </html>
      )
    }
    
    // Получаем query параметры из URL
    const queryParams: Record<string, string> = {}
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (value && typeof value === 'string') {
          queryParams[key] = value
        }
      }
    }
    
    const queryParamsJson = JSON.stringify(queryParams)
    
    // Получаем информацию о боте
    const bot = await BotTokens.findById(ctx, link.botId)
    
    if (!bot) {
      Debug.error(ctx, `[link-redirect] Бот ${link.botId} не найден`, 'E_BOT_NOT_FOUND')
      return (
        <html>
          <head>
            <title>Ошибка</title>
            <meta charset="UTF-8" />
          </head>
          <body>
            <h1>Ошибка конфигурации</h1>
          </body>
        </html>
      )
    }
    
    // Получаем IP адрес и User-Agent
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    const referer = req.headers['referer'] || ''
    
    // Возвращаем HTML страницу, которая:
    // 1. Ждёт инициализации системы трафика (window.clrtUid)
    // 2. Отправляет uid на сервер через API
    // 3. Получает ссылку для вступления в Telegram
    // 4. Редиректит пользователя
    
    return (
      <html>
        <head>
          <title>Перенаправление...</title>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>{`
            body {
              margin: 0;
              padding: 0;
              background: #0a0a0a;
              color: #e8e8e8;
              font-family: 'Share Tech Mono', 'Courier New', monospace;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              text-align: center;
            }
            .loader {
              font-size: 1.2rem;
              letter-spacing: 0.1em;
            }
            .spinner {
              border: 2px solid #2a2a2a;
              border-top: 2px solid #d3234b;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 1rem;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </head>
        <body>
          <div class="loader">
            <div class="spinner"></div>
            <div>Перенаправление...</div>
          </div>
          <script dangerouslySetInnerHTML={{
            __html: `
              (async function() {
                // Ждём инициализации системы трафика
                let attempts = 0
                const maxAttempts = 50 // 5 секунд максимум
                
                function waitForClrtUid() {
                  return new Promise((resolve) => {
                    const checkInterval = setInterval(() => {
                      attempts++
                      if (window.clrtUid) {
                        clearInterval(checkInterval)
                        resolve(window.clrtUid)
                      } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval)
                        // Если uid не получен, генерируем временный
                        const tempUid = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
                        resolve(tempUid)
                      }
                    }, 100)
                  })
                }
                
                try {
                  // Ждём инициализации
                  const uid = await waitForClrtUid()
                  
                  // Отправляем данные на сервер
                  const response = await fetch('/api/channel-links/track', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      linkId: '${linkId}',
                      uid: uid,
                      queryParams: ${JSON.stringify(queryParams)},
                      userAgent: navigator.userAgent,
                      referer: document.referer
                    })
                  })
                  
                  const result = await response.json()
                  
                  if (result.success && result.inviteLink) {
                    // Редиректим на ссылку для вступления в Telegram
                    window.location.href = result.inviteLink
                  } else {
                    // Если ошибка, редиректим на целевую ссылку
                    window.location.href = '${link.targetUrl}'
                  }
                } catch (error) {
                  console.error('Ошибка при обработке перехода:', error)
                  // В случае ошибки редиректим на целевую ссылку
                  window.location.href = '${link.targetUrl}'
                }
              })()
            `
          }} />
        </body>
      </html>
    )
  } catch (error: any) {
    Debug.error(ctx, `[link-redirect] Ошибка: ${error.message}`, 'E_LINK_REDIRECT')
    Debug.error(ctx, `[link-redirect] Stack trace: ${error.stack || 'N/A'}`)
    
    return (
      <html>
        <head>
          <title>Ошибка</title>
          <meta charset="UTF-8" />
        </head>
        <body>
          <h1>Произошла ошибка</h1>
        </body>
      </html>
    )
  }
})

