/**
 * API для управления сервисом комментариев AmoCRM
 * 
 * Функционал:
 * - Получение/сохранение шаблона комментария
 * - Включение/выключение сервиса
 * - Добавление комментария к сделке в AmoCRM
 * - Получение логов комментариев
 * - Повторная отправка неудачного комментария
 * - Очистка логов
 */

// @shared-route
import { request } from '@app/request';
import SettingsTable from '../tables/settings.table';
import CommentLogsTable from '../tables/comment-logs.table';

// ============================================================
// ENDPOINT: Получить статус сервиса (включен/выключен)
// ============================================================
export const apiGetCommentServiceStatusRoute = app.get('/status', async (ctx) => {
  try {
    const setting = await SettingsTable.findOneBy(ctx, {
      key: 'comment_service_enabled'
    });
    
    return {
      success: true,
      enabled: setting?.value === 'true'
    };
  } catch (error: any) {
    ctx.account.log('Ошибка получения статуса сервиса комментариев:', error.message);
    return {
      success: false,
      error: 'Ошибка получения статуса сервиса'
    };
  }
});

// ============================================================
// ENDPOINT: Включить/выключить сервис
// ============================================================
export const apiToggleCommentServiceRoute = app.post('/toggle', async (ctx, req) => {
  try {
    const { enabled } = req.body;
    
    await SettingsTable.createOrUpdateBy(ctx, 'key', {
      key: 'comment_service_enabled',
      value: enabled ? 'true' : 'false',
      description: 'Включить/выключить автоматическое добавление комментариев в AmoCRM'
    });
    
    ctx.account.log(`Сервис комментариев ${enabled ? 'включен' : 'выключен'}`);
    
    return {
      success: true,
      enabled
    };
  } catch (error: any) {
    ctx.account.log('Ошибка переключения сервиса комментариев:', error.message);
    return {
      success: false,
      error: 'Ошибка переключения сервиса'
    };
  }
});

// ============================================================
// ENDPOINT: Получить шаблон комментария
// ============================================================
export const apiGetCommentTemplateRoute = app.get('/template', async (ctx) => {
  try {
    const setting = await SettingsTable.findOneBy(ctx, {
      key: 'comment_template'
    });
    
    // Шаблон по умолчанию
    const defaultTemplate = 'Ссылка на оплату: {paymentUrl}\n\nСпасибо за ваш заказ!';
    
    return {
      success: true,
      template: setting?.value || defaultTemplate
    };
  } catch (error: any) {
    ctx.account.log('Ошибка получения шаблона комментария:', error.message);
    return {
      success: false,
      error: 'Ошибка получения шаблона'
    };
  }
});

// ============================================================
// ENDPOINT: Сохранить шаблон комментария
// ============================================================
export const apiSaveCommentTemplateRoute = app.post('/template', async (ctx, req) => {
  try {
    const { template } = req.body;
    
    if (!template || typeof template !== 'string') {
      return {
        success: false,
        error: 'Шаблон комментария обязателен'
      };
    }
    
    await SettingsTable.createOrUpdateBy(ctx, 'key', {
      key: 'comment_template',
      value: template,
      description: 'Шаблон комментария для добавления в сделки AmoCRM'
    });
    
    ctx.account.log('Шаблон комментария сохранен:', template);
    
    return {
      success: true,
      message: 'Шаблон успешно сохранен'
    };
  } catch (error: any) {
    ctx.account.log('Ошибка сохранения шаблона комментария:', error.message);
    return {
      success: false,
      error: error.message || 'Ошибка сохранения шаблона'
    };
  }
});

// ============================================================
// HELPER: Получить токен доступа AmoCRM
// ============================================================
async function getAccessToken(ctx: any) {
  const tokenSetting = await SettingsTable.findOneBy(ctx, {
    key: 'amocrm_access_token'
  });
  
  if (!tokenSetting?.value) {
    throw new Error('Токен доступа AmoCRM не найден');
  }
  
  return tokenSetting.value;
}

// ============================================================
// HELPER: Получить поддомен AmoCRM
// ============================================================
async function getSubdomain(ctx: any) {
  const subdomainSetting = await SettingsTable.findOneBy(ctx, {
    key: 'amocrm_subdomain'
  });
  
  if (!subdomainSetting?.value) {
    throw new Error('Поддомен AmoCRM не найден');
  }
  
  return subdomainSetting.value;
}

// ============================================================
// HELPER: Добавить комментарий к сделке в AmoCRM
// ============================================================
export async function addCommentToLead(
  ctx: any,
  leadId: number,
  commentText: string,
  email?: string,
  paymentUrl?: string
): Promise<{ success: boolean; noteId?: number; error?: string }> {
  try {
    const accessToken = await getAccessToken(ctx);
    const subdomain = await getSubdomain(ctx);
    
    // Формируем URL для API AmoCRM
    const apiUrl = `https://${subdomain}.amocrm.ru/api/v4/leads/${leadId}/notes`;
    
    // Подготовка данных запроса
    const requestData = [
      {
        note_type: 'common',
        params: {
          text: commentText
        }
      }
    ];
    
    ctx.account.log('Отправка комментария в AmoCRM:', {
      leadId,
      apiUrl,
      commentText: commentText.substring(0, 100) + '...'
    });
    
    // Отправка запроса к AmoCRM API
    // ВАЖНО: request() вызывается БЕЗ ctx для работы в асинхронном контексте
    const response = await request({
      url: apiUrl,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(requestData),
      responseType: 'json',
      throwHttpErrors: false
    });
    
    // Проверяем статус ответа
    if (response.statusCode !== 200 && response.statusCode !== 201) {
      const errorMessage = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
      ctx.account.log('Ошибка ответа AmoCRM:', {
        statusCode: response.statusCode,
        body: response.body
      });
      
      // Сохранение лога с ошибкой
      await CommentLogsTable.create(ctx, {
        leadId,
        email: email || null,
        commentText,
        paymentUrl: paymentUrl || null,
        amocrmNoteId: null,
        status: 'error',
        errorMessage: `HTTP ${response.statusCode}: ${errorMessage}`,
        requestData: JSON.stringify(requestData),
        responseData: errorMessage
      });
      
      return {
        success: false,
        error: `Ошибка AmoCRM API: ${response.statusCode}`
      };
    }
    
    const responseData = response.body;
    ctx.account.log('Успешный ответ AmoCRM:', responseData);
    
    // Извлекаем ID созданного комментария
    const noteId = responseData._embedded?.notes?.[0]?.id;
    
    // Сохранение успешного лога
    await CommentLogsTable.create(ctx, {
      leadId,
      email: email || null,
      commentText,
      paymentUrl: paymentUrl || null,
      amocrmNoteId: noteId || null,
      status: 'success',
      errorMessage: null,
      requestData: JSON.stringify(requestData),
      responseData: JSON.stringify(responseData)
    });
    
    return {
      success: true,
      noteId
    };
    
  } catch (error: any) {
    ctx.account.log('Исключение при добавлении комментария:', error.message);
    
    // Сохранение лога с ошибкой
    await CommentLogsTable.create(ctx, {
      leadId,
      email: email || null,
      commentText,
      paymentUrl: paymentUrl || null,
      amocrmNoteId: null,
      status: 'error',
      errorMessage: error.message,
      requestData: null,
      responseData: null
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

// ============================================================
// ENDPOINT: Добавить комментарий вручную (для тестирования)
// ============================================================
export const apiAddCommentRoute = app.post('/add-comment', async (ctx, req) => {
  try {
    const { leadId, commentText, email, paymentUrl } = req.body;
    
    if (!leadId || !commentText) {
      return {
        success: false,
        error: 'Необходимо указать leadId и commentText'
      };
    }
    
    const result = await addCommentToLead(ctx, leadId, commentText, email, paymentUrl);
    
    if (result.success) {
      return {
        success: true,
        message: 'Комментарий успешно добавлен',
        noteId: result.noteId
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error: any) {
    ctx.account.log('Ошибка добавления комментария:', error.message);
    return {
      success: false,
      error: 'Ошибка добавления комментария'
    };
  }
});

// ============================================================
// ENDPOINT: Получить логи комментариев
// ============================================================
export const apiGetCommentLogsRoute = app.get('/logs', async (ctx) => {
  try {
    const limit = parseInt(ctx.req.query.limit as string) || 50;
    const offset = parseInt(ctx.req.query.offset as string) || 0;
    
    const logs = await CommentLogsTable.findAll(ctx, {
      order: [{ createdAt: 'desc' }],
      limit,
      offset
    });
    
    // Подсчет общего количества
    const allLogs = await CommentLogsTable.findAll(ctx, {});
    
    return {
      success: true,
      logs,
      total: allLogs.length
    };
  } catch (error: any) {
    ctx.account.log('Ошибка получения логов комментариев:', error.message);
    return {
      success: false,
      error: 'Ошибка получения логов'
    };
  }
});

// ============================================================
// ENDPOINT: Повторить неудачную отправку комментария
// ============================================================
export const apiRetryCommentRoute = app.post('/logs/retry', async (ctx, req) => {
  try {
    const { logId } = req.body;
    
    if (!logId) {
      return {
        success: false,
        error: 'Необходимо указать logId'
      };
    }
    
    // Получаем лог
    const log = await CommentLogsTable.findOneBy(ctx, {
      id: logId
    });
    
    if (!log) {
      return {
        success: false,
        error: 'Лог не найден'
      };
    }
    
    // Повторная отправка комментария
    const result = await addCommentToLead(
      ctx,
      log.leadId,
      log.commentText,
      log.email || undefined,
      log.paymentUrl || undefined
    );
    
    if (result.success) {
      // Обновляем статус: удаляем старую запись и создаем новую с обновленными данными
      await CommentLogsTable.delete(ctx, logId);
      
      await CommentLogsTable.create(ctx, {
        leadId: log.leadId,
        email: log.email,
        commentText: log.commentText,
        paymentUrl: log.paymentUrl,
        amocrmNoteId: result.noteId || null,
        status: 'success',
        errorMessage: null,
        requestData: log.requestData,
        responseData: log.responseData
      });
      
      return {
        success: true,
        message: 'Комментарий успешно добавлен повторно',
        noteId: result.noteId
      };
    } else {
      return {
        success: false,
        error: result.error
      };
    }
    
  } catch (error: any) {
    ctx.account.log('Ошибка повторной отправки комментария:', error.message);
    return {
      success: false,
      error: 'Ошибка повторной отправки'
    };
  }
});

// ============================================================
// ENDPOINT: Очистить все логи
// ============================================================
export const apiClearCommentLogsRoute = app.post('/logs/clear-all', async (ctx, req) => {
  try {
    const allLogs = await CommentLogsTable.findAll(ctx, {});
    
    for (const log of allLogs) {
      await CommentLogsTable.delete(ctx, log.id);
    }
    
    ctx.account.log(`Удалено ${allLogs.length} логов комментариев`);
    
    return {
      success: true,
      deletedCount: allLogs.length
    };
  } catch (error: any) {
    ctx.account.log('Ошибка очистки логов комментариев:', error.message);
    return {
      success: false,
      error: 'Ошибка очистки логов'
    };
  }
});

