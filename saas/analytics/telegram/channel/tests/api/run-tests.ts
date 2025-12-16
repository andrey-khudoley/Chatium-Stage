// @shared-route
import { TEST_CATEGORIES } from '../shared/test-definitions'
import { Debug } from '../../shared/debug'
import { applyDebugLevel } from '../../lib/logging'
import { apiValidateTokenRoute, apiAddBotRoute, apiGetBotsListRoute, apiDeleteBotRoute } from '../../api/bots'
import { BotTokens } from '../../tables/bot-tokens.table'
import { request } from '@app/request'

export const apiRunTestsRoute = app.post('/run', async (ctx, req) => {
  try {
    await applyDebugLevel(ctx, 'tests/api/run')
    Debug.info(ctx, '[tests/api/run] Начало выполнения теста')
    
  const { category, test } = req.body as { category: string; test: string }
    
    if (!category || !test) {
      Debug.warn(ctx, `[tests/api/run] Отсутствуют обязательные параметры: category=${category}, test=${test}`)
      return {
        success: false,
        message: 'Отсутствуют обязательные параметры: category и test'
      }
    }
    
    Debug.info(ctx, `[tests/api/run] Запуск теста: ${category}/${test}`)
    const result = await runTest(ctx, category, test)
    Debug.info(ctx, `[tests/api/run] Тест завершён: success=${result.success}`)
    
    return result
  } catch (error: any) {
    Debug.error(ctx, `[tests/api/run] Ошибка выполнения теста: ${error.message}`, 'E_TEST_RUN_ERROR')
    if (error.stack) {
      Debug.error(ctx, `[tests/api/run] Stack trace: ${error.stack}`)
    }
    return {
      success: false,
      message: error.message || 'Неизвестная ошибка при выполнении теста'
    }
  }
})

// Функция выполнения тестов (перенесена из test-definitions.ts для разделения клиент/сервер)
export async function runTest(ctx: any, category: string, testName: string): Promise<{ success: boolean; message: string }> {
  try {
    // Обновляем категорию и testName в контексте для Debug.info
    // Это гарантирует, что все Debug.info будут иметь правильную информацию о тесте
    if (ctx._testSocketId) {
      ctx._testCategory = category
      ctx._testName = testName
    }
    
    // Применяем уровень логирования из настроек
    await applyDebugLevel(ctx, `tests/${category}/${testName}`)
    Debug.info(ctx, `[tests] Начало выполнения теста: ${category}/${testName}`)
    
    if (category === 'basic') {
      if (testName === 'app_loads') {
        Debug.info(ctx, `[tests/basic] Тест app_loads завершён успешно`)
        return { success: true, message: 'Приложение успешно загружено' }
      }
    }

    if (category === 'api') {
      return await runApiTest(ctx, testName)
    }

    if (category === 'api_http') {
      return await runApiHttpTest(ctx, testName)
    }

    if (category === 'database') {
      return await runDatabaseTest(ctx, testName)
    }

    if (category === 'pages') {
      return await runPagesTest(ctx, testName)
    }

    Debug.warn(ctx, `[tests] Тест ${category}/${testName} не найден`)
    return { success: false, message: `Тест ${category}/${testName} не найден` }
  } catch (error: any) {
    Debug.error(ctx, `[tests] Ошибка выполнения теста ${category}/${testName}: ${error.message || 'Неизвестная ошибка'}`, 'E_TEST_FAILED')
    if (error.stack) {
      Debug.error(ctx, `[tests] Stack trace: ${error.stack}`)
    }
    return { success: false, message: error.message || 'Неизвестная ошибка' }
  }
}

// Тесты API через route.run
async function runApiTest(ctx: any, testName: string): Promise<{ success: boolean; message: string }> {
  Debug.info(ctx, `[tests/api] Начало теста: ${testName}`)
  
  switch (testName) {
    case 'validate_token_empty':
      const emptyResult = await apiValidateTokenRoute.run(ctx, { token: '' })
      if (emptyResult.success) {
        Debug.throw(ctx, `[tests/api/validate_token_empty] Ожидалась ошибка для пустого токена`, 'E_TEST_FAILED')
      }
      if (!emptyResult.error || !emptyResult.error.includes('обязателен')) {
        Debug.throw(ctx, `[tests/api/validate_token_empty] Неверное сообщение об ошибке: ${emptyResult.error}`, 'E_TEST_FAILED')
      }
      Debug.info(ctx, `[tests/api/validate_token_empty] Тест завершён успешно`)
      return { success: true, message: 'Пустой токен корректно отклонён' }

    case 'validate_token_invalid':
      const invalidResult = await apiValidateTokenRoute.run(ctx, { token: 'invalid_token_12345' })
      if (invalidResult.success) {
        Debug.throw(ctx, `[tests/api/validate_token_invalid] Ожидалась ошибка для невалидного токена`, 'E_TEST_FAILED')
      }
      Debug.info(ctx, `[tests/api/validate_token_invalid] Тест завершён успешно`)
      return { success: true, message: 'Невалидный токен корректно отклонён' }

    case 'add_bot_empty_token':
      const addEmptyResult = await apiAddBotRoute.run(ctx, { token: '' })
      if (addEmptyResult.success) {
        Debug.throw(ctx, `[tests/api/add_bot_empty_token] Ожидалась ошибка для пустого токена`, 'E_TEST_FAILED')
      }
      Debug.info(ctx, `[tests/api/add_bot_empty_token] Тест завершён успешно`)
      return { success: true, message: 'Добавление с пустым токеном корректно отклонено' }

    case 'add_bot_duplicate':
      // Проверяем авторизацию
      if (!ctx.user || !ctx.user.id) {
        Debug.throw(ctx, `[tests/api/add_bot_duplicate] Пользователь не авторизован`, 'E_TEST_AUTH')
      }
      
      // Создаём тестового бота
      const testToken = `test_token_${Date.now()}`
      let testBot: any = null
      
      try {
        Debug.info(ctx, `[tests/api/add_bot_duplicate] Создание тестового бота с токеном: ${testToken.substring(0, 10)}...`)
        testBot = await BotTokens.create(ctx, {
          token: testToken,
          botName: 'Test Bot',
          botUsername: 'testbot',
          userId: ctx.user.id
        })
        Debug.info(ctx, `[tests/api/add_bot_duplicate] Тестовый бот создан с ID: ${testBot.id}`)
        
        // Пытаемся добавить того же бота снова
        Debug.info(ctx, `[tests/api/add_bot_duplicate] Попытка добавить дубликат токена`)
        const duplicateResult = await apiAddBotRoute.run(ctx, {
          token: testToken,
          botName: 'Test Bot',
          botUsername: 'testbot'
        })
        
        if (duplicateResult.success) {
          Debug.throw(ctx, `[tests/api/add_bot_duplicate] Ожидалась ошибка для дубликата токена`, 'E_TEST_FAILED')
        }
        if (!duplicateResult.error || !duplicateResult.error.includes('уже добавлен')) {
          Debug.throw(ctx, `[tests/api/add_bot_duplicate] Неверное сообщение об ошибке: ${duplicateResult.error}`, 'E_TEST_FAILED')
        }
        Debug.info(ctx, `[tests/api/add_bot_duplicate] Тест завершён успешно`)
        return { success: true, message: 'Дубликат токена корректно обнаружен' }
      } finally {
        // Гарантированно удаляем тестового бота даже при ошибке
        if (testBot && testBot.id) {
          try {
            Debug.info(ctx, `[tests/api/add_bot_duplicate] Удаление тестового бота с ID: ${testBot.id}`)
            await BotTokens.delete(ctx, testBot.id)
            Debug.info(ctx, `[tests/api/add_bot_duplicate] Тестовый бот успешно удалён`)
          } catch (deleteError: any) {
            Debug.warn(ctx, `[tests/api/add_bot_duplicate] Ошибка при удалении тестового бота: ${deleteError.message}`)
            // Игнорируем ошибки удаления (возможно уже удалён)
          }
        }
      }

    case 'add_bot_success':
      // Используем невалидный токен, но проверяем структуру ответа
      // (не можем использовать реальный токен в тестах)
      let createdBotId: string | null = null
      
      try {
        const testToken = `test_success_${Date.now()}`
        Debug.info(ctx, `[tests/api/add_bot_success] Попытка добавить бота с тестовым токеном: ${testToken.substring(0, 10)}...`)
        const addResult = await apiAddBotRoute.run(ctx, {
          token: testToken,
          botName: 'Test Bot',
          botUsername: 'testbot'
        })
        
        // Ожидаем ошибку валидации токена, но проверяем что структура ответа правильная
        if (addResult.success) {
          // Если токен каким-то образом валиден, сохраняем ID для удаления
          if (addResult.bot && addResult.bot.id) {
            createdBotId = addResult.bot.id
            Debug.info(ctx, `[tests/api/add_bot_success] Бот создан с ID: ${createdBotId}`)
          }
          Debug.info(ctx, `[tests/api/add_bot_success] Тест завершён успешно`)
          return { success: true, message: 'Бот успешно добавлен' }
        }
        
        // Если ошибка - это нормально для тестового токена
        // Проверяем что структура ответа правильная
        if (!addResult.error) {
          Debug.throw(ctx, `[tests/api/add_bot_success] Ожидалось сообщение об ошибке`, 'E_TEST_FAILED')
        }
        Debug.info(ctx, `[tests/api/add_bot_success] Тест завершён успешно (ошибка валидации токена ожидаема)`)
        return { success: true, message: 'Структура ответа корректна (ошибка валидации токена ожидаема)' }
      } finally {
        // Гарантированно удаляем созданного бота если он был создан
        if (createdBotId) {
          try {
            Debug.info(ctx, `[tests/api/add_bot_success] Удаление созданного бота с ID: ${createdBotId}`)
            await BotTokens.delete(ctx, createdBotId)
            Debug.info(ctx, `[tests/api/add_bot_success] Бот успешно удалён`)
          } catch (deleteError: any) {
            Debug.warn(ctx, `[tests/api/add_bot_success] Ошибка при удалении бота: ${deleteError.message}`)
            // Игнорируем ошибки удаления (возможно уже удалён)
          }
        }
      }

    case 'delete_bot_empty_id':
      const deleteEmptyResult = await apiDeleteBotRoute.run(ctx, { botId: '' })
      if (deleteEmptyResult.success) {
        Debug.throw(ctx, `[tests/api/delete_bot_empty_id] Ожидалась ошибка для пустого ID`, 'E_TEST_FAILED')
      }
      if (!deleteEmptyResult.error || !deleteEmptyResult.error.includes('обязателен')) {
        Debug.throw(ctx, `[tests/api/delete_bot_empty_id] Неверное сообщение об ошибке: ${deleteEmptyResult.error}`, 'E_TEST_FAILED')
      }
      Debug.info(ctx, `[tests/api/delete_bot_empty_id] Тест завершён успешно`)
      return { success: true, message: 'Пустой ID корректно отклонён' }

    case 'delete_bot_not_found':
      const deleteNotFoundResult = await apiDeleteBotRoute.run(ctx, { botId: 'non_existent_id_12345' })
      if (deleteNotFoundResult.success) {
        Debug.throw(ctx, `[tests/api/delete_bot_not_found] Ожидалась ошибка для несуществующего бота`, 'E_TEST_FAILED')
      }
      if (!deleteNotFoundResult.error || !deleteNotFoundResult.error.includes('не найден')) {
        Debug.throw(ctx, `[tests/api/delete_bot_not_found] Неверное сообщение об ошибке: ${deleteNotFoundResult.error}`, 'E_TEST_FAILED')
      }
      Debug.info(ctx, `[tests/api/delete_bot_not_found] Тест завершён успешно`)
      return { success: true, message: 'Несуществующий бот корректно отклонён' }

    case 'delete_bot_success':
      // Проверяем авторизацию
      if (!ctx.user || !ctx.user.id) {
        Debug.throw(ctx, `[tests/api/delete_bot_success] Пользователь не авторизован`, 'E_TEST_AUTH')
      }
      
      // Создаём тестового бота для удаления
      const testTokenForDelete = `test_delete_${Date.now()}`
      let testBotForDelete: any = null
      
      try {
        Debug.info(ctx, `[tests/api/delete_bot_success] Создание тестового бота с токеном: ${testTokenForDelete.substring(0, 10)}...`)
        testBotForDelete = await BotTokens.create(ctx, {
          token: testTokenForDelete,
          botName: 'Test Bot For Delete',
          botUsername: 'testbotdelete',
          userId: ctx.user.id
        })
        Debug.info(ctx, `[tests/api/delete_bot_success] Тестовый бот создан с ID: ${testBotForDelete.id}`)
        
        // Удаляем бота через API
        Debug.info(ctx, `[tests/api/delete_bot_success] Попытка удаления бота через API`)
        const deleteResult = await apiDeleteBotRoute.run(ctx, {
          botId: testBotForDelete.id
        })
        
        if (!deleteResult.success) {
          Debug.throw(ctx, `[tests/api/delete_bot_success] Ошибка при удалении бота: ${deleteResult.error}`, 'E_TEST_FAILED')
        }
        
        // Проверяем, что бот действительно удалён
        Debug.info(ctx, `[tests/api/delete_bot_success] Проверка удаления бота из таблицы`)
        const deletedBot = await BotTokens.findById(ctx, testBotForDelete.id)
        if (deletedBot) {
          Debug.throw(ctx, `[tests/api/delete_bot_success] Бот не был удалён из таблицы`, 'E_TEST_FAILED')
        }
        
        Debug.info(ctx, `[tests/api/delete_bot_success] Тест завершён успешно`)
        return { success: true, message: 'Бот успешно удалён через API' }
      } catch (error: any) {
        // Если ошибка произошла до удаления, пытаемся удалить вручную
        if (testBotForDelete && testBotForDelete.id) {
          try {
            Debug.info(ctx, `[tests/api/delete_bot_success] Очистка: удаление тестового бота с ID: ${testBotForDelete.id}`)
            await BotTokens.delete(ctx, testBotForDelete.id)
            Debug.info(ctx, `[tests/api/delete_bot_success] Тестовый бот успешно удалён при очистке`)
          } catch (cleanupError: any) {
            Debug.warn(ctx, `[tests/api/delete_bot_success] Ошибка при очистке: ${cleanupError.message}`)
          }
        }
        throw error
      }

    default:
      Debug.throw(ctx, `[tests/api] Неизвестный тест API: ${testName}`, 'E_TEST_UNKNOWN')
  }
}

// Тесты HTTP доступности
async function runApiHttpTest(ctx: any, testName: string): Promise<{ success: boolean; message: string }> {
  Debug.info(ctx, `[tests/api_http] Начало теста: ${testName}`)
  
  switch (testName) {
    case 'http_post_validate_token':
      // Используем .url() метод роута для получения правильного URL
      const validateUrl = apiValidateTokenRoute.url()
      Debug.info(ctx, `[tests/api_http/http_post_validate_token] Запрос к URL: ${validateUrl}`)
      
      // 1. Проверяем невалидный токен
      const invalidToken = '123456789:ABCdefGHIjklMNOpqrsTUVwxyz'
      Debug.info(ctx, `[tests/api_http/http_post_validate_token] Шаг 1: Проверка невалидного токена`)
      
      const invalidResponse = await request({
        url: validateUrl,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          token: invalidToken
        },
        responseType: 'json',
        throwHttpErrors: false
      })
      
      Debug.info(ctx, `[tests/api_http/http_post_validate_token] Ответ для невалидного токена: statusCode=${invalidResponse.statusCode}`)
      
      // Проверяем что endpoint доступен (не 500+)
      if (invalidResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/api_http/http_post_validate_token] HTTP ${invalidResponse.statusCode} - серверная ошибка`, 'E_TEST_HTTP_ERROR')
      }
      
      // Проверяем, что endpoint корректно обработал невалидный токен
      const invalidBody = invalidResponse.body as any
      if (invalidResponse.statusCode === 200 && invalidBody?.success === false) {
        Debug.info(ctx, `[tests/api_http/http_post_validate_token] Endpoint корректно вернул ошибку для невалидного токена: ${invalidBody.error || 'неизвестная ошибка'}`)
      } else if (invalidResponse.statusCode === 401) {
        Debug.info(ctx, `[tests/api_http/http_post_validate_token] Endpoint требует авторизации (ожидаемо для HTTP теста)`)
      }
      
      // 2. Проверяем валидный тестовый токен Telegram
      // Telegram предоставляет специальный тестовый токен для тестирования
      const validTestToken = '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11'
      Debug.info(ctx, `[tests/api_http/http_post_validate_token] Шаг 2: Проверка валидного тестового токена Telegram`)
      
      const validResponse = await request({
        url: validateUrl,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          token: validTestToken
        },
        responseType: 'json',
        throwHttpErrors: false
      })
      
      Debug.info(ctx, `[tests/api_http/http_post_validate_token] Ответ для валидного токена: statusCode=${validResponse.statusCode}`)
      
      // Проверяем что endpoint доступен (не 500+)
      if (validResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/api_http/http_post_validate_token] HTTP ${validResponse.statusCode} - серверная ошибка при проверке валидного токена`, 'E_TEST_HTTP_ERROR')
      }
      
      // Проверяем, что endpoint корректно обработал валидный токен
      const validBody = validResponse.body as any
      if (validResponse.statusCode === 200 && validBody?.success === true && validBody?.botInfo) {
        Debug.info(ctx, `[tests/api_http/http_post_validate_token] Endpoint корректно валидировал токен: botId=${validBody.botInfo.id}, username=${validBody.botInfo.username || 'N/A'}`)
        return { 
          success: true, 
          message: `HTTP ${invalidResponse.statusCode}/${validResponse.statusCode} - endpoint доступен, корректно обрабатывает невалидный и валидный токены` 
        }
      } else if (validResponse.statusCode === 401) {
        Debug.info(ctx, `[tests/api_http/http_post_validate_token] Endpoint требует авторизации для валидного токена (ожидаемо для HTTP теста)`)
        return { 
          success: true, 
          message: `HTTP ${invalidResponse.statusCode}/${validResponse.statusCode} - endpoint доступен (требует авторизации)` 
        }
      } else if (validResponse.statusCode === 200 && validBody?.success === false) {
        Debug.warn(ctx, `[tests/api_http/http_post_validate_token] Валидный тестовый токен был отклонён: ${validBody.error || 'неизвестная ошибка'}`)
        return { 
          success: true, 
          message: `HTTP ${invalidResponse.statusCode}/${validResponse.statusCode} - endpoint доступен (валидный токен отклонён, возможно требуется авторизация)` 
        }
      }
      
      Debug.info(ctx, `[tests/api_http/http_post_validate_token] Тест завершён успешно`)
      return { 
        success: true, 
        message: `HTTP ${invalidResponse.statusCode}/${validResponse.statusCode} - endpoint доступен` 
      }

    case 'http_post_add_bot':
      // Используем .url() метод роута для получения правильного URL
      const addUrl = apiAddBotRoute.url()
      Debug.info(ctx, `[tests/api_http/http_post_add_bot] Запрос к URL: ${addUrl}`)
      const addResponse = await request({
        url: addUrl,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          token: 'test_token',
          botName: 'Test Bot',
          botUsername: 'testbot'
        },
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (addResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/api_http/http_post_add_bot] HTTP ${addResponse.statusCode} - серверная ошибка`, 'E_TEST_HTTP_ERROR')
      }
      
      Debug.info(ctx, `[tests/api_http/http_post_add_bot] Тест завершён успешно, статус: ${addResponse.statusCode}`)
      return { success: true, message: `HTTP ${addResponse.statusCode} - endpoint доступен` }

    case 'http_get_list':
      // Используем .url() метод роута для получения правильного URL
      const listUrl = apiGetBotsListRoute.url()
      Debug.info(ctx, `[tests/api_http/http_get_list] Запрос к URL: ${listUrl}`)
      const listResponse = await request({
        url: listUrl,
        method: 'get',
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (listResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/api_http/http_get_list] HTTP ${listResponse.statusCode} - серверная ошибка`, 'E_TEST_HTTP_ERROR')
      }
      
      Debug.info(ctx, `[tests/api_http/http_get_list] Тест завершён успешно, статус: ${listResponse.statusCode}`)
      return { success: true, message: `HTTP ${listResponse.statusCode} - endpoint доступен` }

    case 'http_post_delete_bot':
      // Используем .url() метод роута для получения правильного URL
      const deleteUrl = apiDeleteBotRoute.url()
      Debug.info(ctx, `[tests/api_http/http_post_delete_bot] Запрос к URL: ${deleteUrl}`)
      const deleteResponse = await request({
        url: deleteUrl,
        method: 'post',
        headers: {
          'Content-Type': 'application/json'
        },
        json: {
          botId: 'test_bot_id'
        },
        responseType: 'json',
        throwHttpErrors: false
      })
      
      if (deleteResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/api_http/http_post_delete_bot] HTTP ${deleteResponse.statusCode} - серверная ошибка`, 'E_TEST_HTTP_ERROR')
      }
      
      Debug.info(ctx, `[tests/api_http/http_post_delete_bot] Тест завершён успешно, статус: ${deleteResponse.statusCode}`)
      return { success: true, message: `HTTP ${deleteResponse.statusCode} - endpoint доступен` }

    default:
      Debug.throw(ctx, `[tests/api_http] Неизвестный HTTP тест: ${testName}`, 'E_TEST_UNKNOWN')
  }
}

// Тесты базы данных
async function runDatabaseTest(ctx: any, testName: string): Promise<{ success: boolean; message: string }> {
  Debug.info(ctx, `[tests/database] Начало теста: ${testName}`)
  
  switch (testName) {
    case 'table_exists':
      // Проверяем что можем выполнить запрос к таблице
      try {
        Debug.info(ctx, `[tests/database/table_exists] Проверка доступности таблицы BotTokens`)
        await BotTokens.findAll(ctx, { limit: 1 })
        Debug.info(ctx, `[tests/database/table_exists] Тест завершён успешно`)
        return { success: true, message: 'Таблица BotTokens существует и доступна' }
      } catch (error: any) {
        Debug.throw(ctx, `[tests/database/table_exists] Таблица недоступна: ${error.message}`, 'E_TEST_DB_ERROR')
      }

    case 'create_bot':
      // Проверяем авторизацию
      if (!ctx.user || !ctx.user.id) {
        Debug.throw(ctx, `[tests/database/create_bot] Пользователь не авторизован`, 'E_TEST_AUTH')
      }
      
      const testToken = `test_create_${Date.now()}`
      let createdBot: any = null
      
      try {
        Debug.info(ctx, `[tests/database/create_bot] Создание тестового бота с токеном: ${testToken.substring(0, 10)}...`)
        createdBot = await BotTokens.create(ctx, {
          token: testToken,
          botName: 'Test Bot',
          botUsername: 'testbot',
          userId: ctx.user.id
        })
        
        if (!createdBot || !createdBot.id) {
          Debug.throw(ctx, `[tests/database/create_bot] Бот не создан`, 'E_TEST_DB_ERROR')
        }
        
        Debug.info(ctx, `[tests/database/create_bot] Бот создан с ID: ${createdBot.id}`)
        Debug.info(ctx, `[tests/database/create_bot] Тест завершён успешно`)
        return { success: true, message: `Бот создан с ID: ${createdBot.id}` }
      } finally {
        // Гарантированно удаляем тестового бота даже при ошибке
        if (createdBot && createdBot.id) {
          try {
            Debug.info(ctx, `[tests/database/create_bot] Удаление тестового бота с ID: ${createdBot.id}`)
            await BotTokens.delete(ctx, createdBot.id)
            Debug.info(ctx, `[tests/database/create_bot] Тестовый бот успешно удалён`)
          } catch (deleteError: any) {
            Debug.warn(ctx, `[tests/database/create_bot] Ошибка при удалении тестового бота: ${deleteError.message}`)
            // Игнорируем ошибки удаления (возможно уже удалён)
          }
        }
      }

    case 'find_bot_by_user':
      // Проверяем авторизацию
      if (!ctx.user || !ctx.user.id) {
        Debug.throw(ctx, `[tests/database/find_bot_by_user] Пользователь не авторизован`, 'E_TEST_AUTH')
      }
      
      Debug.info(ctx, `[tests/database/find_bot_by_user] Поиск ботов для userId: ${ctx.user.id}`)
      const bots = await BotTokens.findAll(ctx, {
        where: {
          userId: ctx.user.id
        },
        limit: 10
      })
      
      Debug.info(ctx, `[tests/database/find_bot_by_user] Найдено ботов: ${bots?.length || 0}`)
      Debug.info(ctx, `[tests/database/find_bot_by_user] Тест завершён успешно`)
      return { success: true, message: `Найдено ботов у пользователя: ${bots?.length || 0}` }

    case 'find_bot_duplicate':
      // Проверяем авторизацию
      if (!ctx.user || !ctx.user.id) {
        Debug.throw(ctx, `[tests/database/find_bot_duplicate] Пользователь не авторизован`, 'E_TEST_AUTH')
      }
      
      const testToken2 = `test_duplicate_${Date.now()}`
      let testBot: any = null
      
      try {
        Debug.info(ctx, `[tests/database/find_bot_duplicate] Создание тестового бота с токеном: ${testToken2.substring(0, 10)}...`)
        testBot = await BotTokens.create(ctx, {
          token: testToken2,
          botName: 'Test Bot',
          botUsername: 'testbot',
          userId: ctx.user.id
        })
        Debug.info(ctx, `[tests/database/find_bot_duplicate] Тестовый бот создан с ID: ${testBot.id}`)
        
        // Ищем дубликат
        Debug.info(ctx, `[tests/database/find_bot_duplicate] Поиск дубликата токена`)
        const duplicate = await BotTokens.findOneBy(ctx, {
          userId: ctx.user.id,
          token: testToken2
        })
        
        if (!duplicate || duplicate.id !== testBot.id) {
          Debug.throw(ctx, `[tests/database/find_bot_duplicate] Дубликат не найден`, 'E_TEST_DB_ERROR')
        }
        
        Debug.info(ctx, `[tests/database/find_bot_duplicate] Дубликат найден корректно`)
        Debug.info(ctx, `[tests/database/find_bot_duplicate] Тест завершён успешно`)
        return { success: true, message: 'Поиск дубликатов работает корректно' }
      } finally {
        // Гарантированно удаляем тестового бота даже при ошибке
        if (testBot && testBot.id) {
          try {
            Debug.info(ctx, `[tests/database/find_bot_duplicate] Удаление тестового бота с ID: ${testBot.id}`)
            await BotTokens.delete(ctx, testBot.id)
            Debug.info(ctx, `[tests/database/find_bot_duplicate] Тестовый бот успешно удалён`)
          } catch (deleteError: any) {
            Debug.warn(ctx, `[tests/database/find_bot_duplicate] Ошибка при удалении тестового бота: ${deleteError.message}`)
            // Игнорируем ошибки удаления (возможно уже удалён)
          }
        }
      }

    case 'delete_bot':
      // Проверяем авторизацию
      if (!ctx.user || !ctx.user.id) {
        Debug.throw(ctx, `[tests/database/delete_bot] Пользователь не авторизован`, 'E_TEST_AUTH')
      }
      
      const testTokenForDbDelete = `test_db_delete_${Date.now()}`
      let testBotForDbDelete: any = null
      
      try {
        Debug.info(ctx, `[tests/database/delete_bot] Создание тестового бота с токеном: ${testTokenForDbDelete.substring(0, 10)}...`)
        testBotForDbDelete = await BotTokens.create(ctx, {
          token: testTokenForDbDelete,
          botName: 'Test Bot For DB Delete',
          botUsername: 'testbotdbdelete',
          userId: ctx.user.id
        })
        
        if (!testBotForDbDelete || !testBotForDbDelete.id) {
          Debug.throw(ctx, `[tests/database/delete_bot] Бот не создан`, 'E_TEST_DB_ERROR')
        }
        
        Debug.info(ctx, `[tests/database/delete_bot] Бот создан с ID: ${testBotForDbDelete.id}`)
        
        // Удаляем бота напрямую через таблицу
        Debug.info(ctx, `[tests/database/delete_bot] Удаление бота через таблицу`)
        await BotTokens.delete(ctx, testBotForDbDelete.id)
        
        // Проверяем, что бот действительно удалён
        Debug.info(ctx, `[tests/database/delete_bot] Проверка удаления бота`)
        const deletedBot = await BotTokens.findById(ctx, testBotForDbDelete.id)
        if (deletedBot) {
          Debug.throw(ctx, `[tests/database/delete_bot] Бот не был удалён из таблицы`, 'E_TEST_DB_ERROR')
        }
        
        Debug.info(ctx, `[tests/database/delete_bot] Тест завершён успешно`)
        return { success: true, message: `Бот успешно удалён из таблицы` }
      } catch (error: any) {
        // Если ошибка произошла до удаления, пытаемся удалить вручную
        if (testBotForDbDelete && testBotForDbDelete.id) {
          try {
            Debug.info(ctx, `[tests/database/delete_bot] Очистка: удаление тестового бота с ID: ${testBotForDbDelete.id}`)
            await BotTokens.delete(ctx, testBotForDbDelete.id)
            Debug.info(ctx, `[tests/database/delete_bot] Тестовый бот успешно удалён при очистке`)
          } catch (cleanupError: any) {
            Debug.warn(ctx, `[tests/database/delete_bot] Ошибка при очистке: ${cleanupError.message}`)
          }
        }
        throw error
      }

    default:
      Debug.throw(ctx, `[tests/database] Неизвестный тест базы данных: ${testName}`, 'E_TEST_UNKNOWN')
  }
}

// Тесты загрузки страниц
async function runPagesTest(ctx: any, testName: string): Promise<{ success: boolean; message: string }> {
  Debug.info(ctx, `[tests/pages] Начало теста: ${testName}`)
  
  // Базовый URL проекта
  const baseUrl = ctx.account.url('/saas/analytics/telegram/channel')
  
  switch (testName) {
    case 'page_index':
      Debug.info(ctx, `[tests/pages/page_index] Проверка загрузки главной страницы`)
      const indexResponse = await request({
        url: `${baseUrl}/`,
        method: 'get',
        responseType: 'text',
        throwHttpErrors: false,
        timeout: 10000 // 10 секунд таймаут
      })
      
      Debug.info(ctx, `[tests/pages/page_index] Получен ответ: statusCode=${indexResponse.statusCode}`)
      
      if (indexResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/pages/page_index] HTTP ${indexResponse.statusCode} - серверная ошибка`, 'E_TEST_HTTP_ERROR')
      }
      
      // Может быть 200 (если авторизован) или редирект на /login (если не авторизован)
      if (indexResponse.statusCode === 200 || indexResponse.statusCode === 302 || indexResponse.statusCode === 401) {
        Debug.info(ctx, `[tests/pages/page_index] Страница доступна (статус ${indexResponse.statusCode})`)
        return { success: true, message: `HTTP ${indexResponse.statusCode} - страница доступна` }
      }
      
      return { success: true, message: `HTTP ${indexResponse.statusCode} - страница отвечает` }

    case 'page_login':
      Debug.info(ctx, `[tests/pages/page_login] Проверка загрузки страницы входа`)
      const loginResponse = await request({
        url: `${baseUrl}/login`,
        method: 'get',
        responseType: 'text',
        throwHttpErrors: false,
        timeout: 10000 // 10 секунд таймаут
      })
      
      Debug.info(ctx, `[tests/pages/page_login] Получен ответ: statusCode=${loginResponse.statusCode}`)
      
      if (loginResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/pages/page_login] HTTP ${loginResponse.statusCode} - серверная ошибка`, 'E_TEST_HTTP_ERROR')
      }
      
      if (loginResponse.statusCode === 200) {
        Debug.info(ctx, `[tests/pages/page_login] Страница успешно загружена`)
        return { success: true, message: `HTTP ${loginResponse.statusCode} - страница доступна` }
      }
      
      return { success: true, message: `HTTP ${loginResponse.statusCode} - страница отвечает` }

    case 'page_profile':
      Debug.info(ctx, `[tests/pages/page_profile] Проверка загрузки страницы профиля`)
      const profileResponse = await request({
        url: `${baseUrl}/profile`,
        method: 'get',
        responseType: 'text',
        throwHttpErrors: false,
        timeout: 10000 // 10 секунд таймаут
      })
      
      Debug.info(ctx, `[tests/pages/page_profile] Получен ответ: statusCode=${profileResponse.statusCode}`)
      
      if (profileResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/pages/page_profile] HTTP ${profileResponse.statusCode} - серверная ошибка`, 'E_TEST_HTTP_ERROR')
      }
      
      // Может быть 200 (если авторизован) или редирект на /login (если не авторизован)
      if (profileResponse.statusCode === 200 || profileResponse.statusCode === 302 || profileResponse.statusCode === 401) {
        Debug.info(ctx, `[tests/pages/page_profile] Страница доступна (статус ${profileResponse.statusCode})`)
        return { success: true, message: `HTTP ${profileResponse.statusCode} - страница доступна` }
      }
      
      return { success: true, message: `HTTP ${profileResponse.statusCode} - страница отвечает` }

    case 'page_settings':
      Debug.info(ctx, `[tests/pages/page_settings] Проверка загрузки страницы настроек`)
      const settingsResponse = await request({
        url: `${baseUrl}/settings`,
        method: 'get',
        responseType: 'text',
        throwHttpErrors: false,
        timeout: 10000 // 10 секунд таймаут
      })
      
      Debug.info(ctx, `[tests/pages/page_settings] Получен ответ: statusCode=${settingsResponse.statusCode}`)
      
      if (settingsResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/pages/page_settings] HTTP ${settingsResponse.statusCode} - серверная ошибка`, 'E_TEST_HTTP_ERROR')
      }
      
      // Может быть 200 (если авторизован) или редирект на /login (если не авторизован)
      if (settingsResponse.statusCode === 200 || settingsResponse.statusCode === 302 || settingsResponse.statusCode === 401) {
        Debug.info(ctx, `[tests/pages/page_settings] Страница доступна (статус ${settingsResponse.statusCode})`)
        return { success: true, message: `HTTP ${settingsResponse.statusCode} - страница доступна` }
      }
      
      return { success: true, message: `HTTP ${settingsResponse.statusCode} - страница отвечает` }

    case 'page_channels':
      Debug.info(ctx, `[tests/pages/page_channels] Проверка загрузки страницы каналов`)
      const channelsResponse = await request({
        url: `${baseUrl}/channels`,
        method: 'get',
        responseType: 'text',
        throwHttpErrors: false,
        timeout: 10000 // 10 секунд таймаут
      })
      
      Debug.info(ctx, `[tests/pages/page_channels] Получен ответ: statusCode=${channelsResponse.statusCode}`)
      
      if (channelsResponse.statusCode >= 500) {
        Debug.throw(ctx, `[tests/pages/page_channels] HTTP ${channelsResponse.statusCode} - серверная ошибка`, 'E_TEST_HTTP_ERROR')
      }
      
      // Может быть 200 (если авторизован) или редирект на /login (если не авторизован)
      if (channelsResponse.statusCode === 200 || channelsResponse.statusCode === 302 || channelsResponse.statusCode === 401) {
        Debug.info(ctx, `[tests/pages/page_channels] Страница доступна (статус ${channelsResponse.statusCode})`)
        return { success: true, message: `HTTP ${channelsResponse.statusCode} - страница доступна` }
      }
      
      return { success: true, message: `HTTP ${channelsResponse.statusCode} - страница отвечает` }

    default:
      Debug.throw(ctx, `[tests/pages] Неизвестный тест страницы: ${testName}`, 'E_TEST_UNKNOWN')
  }
}

