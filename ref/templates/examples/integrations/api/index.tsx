// @shared-route
import { request } from '@app/request'

// Интеграция с Telegram API
export const sendTelegramMessageRoute = app.post('/integrations/telegram/send', async (ctx, req) => {
  const { botToken, chatId, message, parseMode = 'HTML' } = req.body

  try {
    const response = await request({
      url: `https://api.telegram.org/bot${botToken}/sendMessage`,
      method: 'post',
      json: {
        chat_id: chatId,
        text: message,
        parse_mode: parseMode,
      },
    })

    return {
      success: true,
      data: response.body,
      message: 'Сообщение отправлено в Telegram'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при отправке в Telegram'
    }
  }
})

// Интеграция с VK API
export const sendVKPostRoute = app.post('/integrations/vk/post', async (ctx, req) => {
  const { accessToken, groupId, message, photos = [] } = req.body

  try {
    let attachments = ''

    // Загрузка фото если есть
    if (photos.length > 0) {
      for (const photoUrl of photos) {
        const uploadUrl = `https://api.vk.com/method/photos.getWallUploadServer?access_token=${accessToken}&group_id=${groupId}&v=5.131`
        const uploadServer = await request({ url: uploadUrl, method: 'get' })

        const photoResponse = await request({
          url: uploadServer.body.response.upload_url,
          method: 'post',
          form: {}
        })

        const savePhoto = await request({
          url: `https://api.vk.com/method/photos.saveWallPhoto?access_token=${accessToken}&group_id=${groupId}&v=5.131`,
          method: 'post',
          form: {
            server: photoResponse.body.server,
            photo: photoResponse.body.photo,
            hash: photoResponse.body.hash,
          }
        })

        attachments += `photo${savePhoto.body.response[0].owner_id}_${savePhoto.body.response[0].id},`
      }
    }

    const postUrl = `https://api.vk.com/method/wall.post?access_token=${accessToken}&owner_id=-${groupId}&from_group=1&message=${encodeURIComponent(message)}&attachments=${attachments}&v=5.131`
    const response = await request({ url: postUrl, method: 'get' })

    return {
      success: true,
      data: response.body,
      message: 'Пост опубликован в ВКонтакте'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при публикации в ВКонтакте'
    }
  }
})

// Интеграция с Slack API
export const sendSlackMessageRoute = app.post('/integrations/slack/send', async (ctx, req) => {
  const { webhookUrl, channel, message, username = 'Chatium Bot' } = req.body

  try {
    const response = await request({
      url: webhookUrl,
      method: 'post',
      json: {
        channel: channel,
        username: username,
        text: message,
      },
    })

    return {
      success: true,
      data: response.body,
      message: 'Сообщение отправлено в Slack'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при отправке в Slack'
    }
  }
})

// Интеграция с WhatsApp API (провайдер пример)
export const sendWhatsAppMessageRoute = app.post('/integrations/whatsapp/send', async (ctx, req) => {
  const { apiKey, phoneNumber, message, templateName, templateData } = req.body

  try {
    // Пример с использованием условного API WhatsApp
    const response = await request({
      url: 'https://api.whatsapp.com/v1/messages',
      method: 'post',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      json: {
        to: `whatsapp:${phoneNumber}`,
        type: templateName ? 'template' : 'text',
        ...(templateName ? {
          template: {
            name: templateName,
            language: { code: 'ru' },
            components: [{ type: 'body', parameters: templateData || [] }]
          }
        } : {
          text: { body: message }
        })
      },
    })

    return {
      success: true,
      data: response.body,
      message: 'Сообщение отправлено в WhatsApp'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при отправке в WhatsApp'
    }
  }
})

// Интеграция с Trello API
export const createTrelloCardRoute = app.post('/integrations/trello/card', async (ctx, req) => {
  const { apiKey, token, boardId, listId, cardName, cardDescription, dueDate } = req.body

  try {
    const response = await request({
      url: `https://api.trello.com/1/cards?idList=${listId}&key=${apiKey}&token=${token}`,
      method: 'post',
      form: {
        name: cardName,
        desc: cardDescription || '',
        due: dueDate || undefined,
        idBoard: boardId,
      },
    })

    return {
      success: true,
      data: response.body,
      message: 'Карточка создана в Trello'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при создании карточки в Trello'
    }
  }
})

// Интеграция с GitHub API
export const createGitHubIssueRoute = app.post('/integrations/github/issue', async (ctx, req) => {
  const { accessToken, owner, repo, title, body, labels = [] } = req.body

  try {
    const response = await request({
      url: `https://api.github.com/repos/${owner}/${repo}/issues`,
      method: 'post',
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      },
      json: {
        title: title,
        body: body || '',
        labels: labels,
      },
    })

    return {
      success: true,
      data: response.body,
      message: 'Issue создан в GitHub'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при создании Issue в GitHub'
    }
  }
})

// Интеграция с Google Sheets API (через Google Apps Script)
export const appendToGoogleSheetsRoute = app.post('/integrations/googlesheets/append', async (ctx, req) => {
  const { scriptUrl, sheetName, data } = req.body

  try {
    // Вызов Google Apps Script через GET с параметрами
    const response = await request({
      url: scriptUrl,
      method: 'get',
      searchParams: {
        action: 'append',
        sheet: sheetName,
        data: JSON.stringify(data),
      },
    })

    return {
      success: true,
      data: response.body,
      message: 'Данные добавлены в Google Sheets'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при добавлении данных в Google Sheets'
    }
  }
})

// Интеграция с email (отправка через внешний сервис)
export const sendEmailRoute = app.post('/integrations/email/send', async (ctx, req) => {
  const { to, subject, html, text, fromName, replyTo } = req.body

  try {
    // Пример с использованием условного Email API
    const response = await request({
      url: 'https://api.email-service.com/v1/send',
      method: 'post',
      headers: {
        'Authorization': `Bearer ${ctx.account.config.emailApiKey || 'demo-key'}`,
      },
      json: {
        from: {
          email: 'noreply@chatium.ru',
          name: fromName || 'Chatium',
        },
        to: [{ email: to }],
        reply_to: replyTo ? { email: replyTo } : undefined,
        subject: subject,
        html: html,
        text: text || html.replace(/<[^>]*>/g, ''),
      },
    })

    return {
      success: true,
      data: response.body,
      message: 'Email отправлен'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при отправке email'
    }
  }
})