// @shared-route
import { requireRealUser } from '@app/auth'
import { startCompletion, CompletionCompletedBody, CompletionFailedBody } from '@start/sdk'
import * as loggerLib from '../../lib/logger.lib'
import * as tasksRepo from '../../repos/tasks.repo'
import * as settingsLib from '../../lib/settings.lib'

const LOG_PATH = 'api/tasks/ai-formulate'

type AiUpdateProject = {
  type: 'update_project'
  context: string
}

type AiUpdateTask = {
  type: 'update_task'
  taskId: string
  context?: string
  details?: string
}

type AiCreateTask = {
  type: 'create_task'
  title: string
  details?: string
  context?: string
}

type AiAction = AiUpdateProject | AiUpdateTask | AiCreateTask

type AiFormulateResponse = {
  actions: AiAction[]
  summary: string
}

/**
 * Callback при успешном завершении AI-генерации
 */
const onCompletionCompleted = app
  .function('/ai-formulate-completed')
  .body(CompletionCompletedBody)
  .handle(async (ctx, body, caller) => {
    // Проверка вызова из start app
    if (!(caller.type === 'plugin' && caller.appSlug === 'start')) {
      throw new Error('Invalid caller')
    }

    const { userId, projectId } = body.context ?? {}

    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] AI completion completed`,
      payload: { userId, projectId }
    })

    try {
      // Извлекаем текст ответа
      const messageTexts: string[] = []
      const latestMessage = body.messages[body.messages.length - 1]!
      for (const block of latestMessage.content) {
        if (block.type === 'text') {
          messageTexts.push(block.text)
        }
      }

      const responseText = messageTexts.join('\n')
      const aiResponse = JSON.parse(responseText) as AiFormulateResponse

      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] AI вернул результат`,
        payload: { actionsCount: aiResponse.actions?.length || 0 }
      })

      // Загружаем данные проекта для валидации
      const tree = await tasksRepo.getTreeForUser(ctx, userId)
      const project = tree.projects.find((p) => p.id === projectId)

      if (!project) {
        await loggerLib.writeServerLog(ctx, {
          severity: 3,
          message: `[${LOG_PATH}] Проект не найден при обработке результата`,
          payload: { projectId }
        })
        return null
      }

      // Выполняем действия
      const createdTasks: string[] = []
      const updatedTasks: string[] = []
      let projectUpdated = false

      for (const action of aiResponse.actions || []) {
        try {
          if (action.type === 'update_project') {
            await tasksRepo.updateProject(ctx, userId, project.id, {
              name: project.name,
              context: action.context
            })
            projectUpdated = true
          } else if (action.type === 'update_task') {
            const updated = await tasksRepo.updateTask(ctx, userId, action.taskId, {
              ...(action.context !== undefined ? { context: action.context } : {}),
              ...(action.details !== undefined ? { details: action.details } : {})
            })
            if (updated) {
              updatedTasks.push(updated.title)
            }
          } else if (action.type === 'create_task') {
            const created = await tasksRepo.createTask(ctx, userId, project.id, {
              title: action.title,
              details: action.details,
              context: action.context
            })
            if (created) {
              createdTasks.push(created.title)
            }
          }
        } catch (error) {
          await loggerLib.writeServerLog(ctx, {
            severity: 4,
            message: `[${LOG_PATH}] Ошибка выполнения действия`,
            payload: { action, error: String(error) }
          })
        }
      }

      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] Действия выполнены успешно`,
        payload: {
          projectUpdated,
          createdCount: createdTasks.length,
          updatedCount: updatedTasks.length,
          summary: aiResponse.summary
        }
      })
    } catch (error) {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] Ошибка обработки результата AI`,
        payload: { error: String(error) }
      })
    }

    return null
  })

/**
 * Callback при ошибке AI-генерации
 */
const onCompletionFailed = app
  .function('/ai-formulate-failed')
  .body(CompletionFailedBody)
  .handle(async (ctx, body, caller) => {
    if (!(caller.type === 'plugin' && caller.appSlug === 'start')) {
      throw new Error('Invalid caller')
    }

    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] AI completion failed`,
      payload: { error: body.error }
    })

    return null
  })

/**
 * POST /api/tasks/ai-formulate
 * Формулирует структуру задач на основе пользовательского запроса
 */
export const aiFormulateTasksRoute = app
  .body((s) => ({
    projectId: s.string(),
    userQuery: s.string()
  }))
  .post('/', async (ctx, req) => {
    const user = requireRealUser(ctx)

    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] Запрос AI-генерации задач`,
      payload: { projectId: req.body.projectId, queryLength: req.body.userQuery.length }
    })

    try {
      // Загружаем настройки AI
      const aiModel = await settingsLib.getAiModel(ctx)
      const systemPrompt = await settingsLib.getAiFormulateSystemPrompt(ctx)

      // Загружаем данные проекта и задач
      const tree = await tasksRepo.getTreeForUser(ctx, user.id)
      const project = tree.projects.find((p) => p.id === req.body.projectId)

      if (!project) {
        return { success: false, error: 'Проект не найден' }
      }

      const projectTasks = tree.tasks.filter((t) => t.projectId === req.body.projectId)

      // Формируем контекст для AI
      const contextParts: string[] = []

      contextParts.push('ТЕКУЩИЙ ПРОЕКТ:')
      contextParts.push(`Название: ${project.name}`)
      if (project.details) contextParts.push(`Детали: ${project.details}`)
      if (project.context) contextParts.push(`Контекст (служебный): ${project.context}`)

      if (projectTasks.length > 0) {
        contextParts.push('\nСУЩЕСТВУЮЩИЕ ЗАДАЧИ:')
        for (const task of projectTasks) {
          contextParts.push(`\n[ID: ${task.id}]`)
          contextParts.push(`Название: ${task.title}`)
          if (task.details) contextParts.push(`Детали: ${task.details}`)
          if (task.context) contextParts.push(`Контекст: ${task.context}`)
          contextParts.push(`Статус: ${task.status}`)
        }
      }

      contextParts.push('\nЗАПРОС ПОЛЬЗОВАТЕЛЯ:')
      contextParts.push(req.body.userQuery)

      const fullContext = contextParts.join('\n')

      await loggerLib.writeServerLog(ctx, {
        severity: 7,
        message: `[${LOG_PATH}] Отправка запроса к AI`,
        payload: { model: aiModel, contextLength: fullContext.length }
      })

      // Проверка валидности модели
      if (!aiModel || aiModel.trim() === '') {
        throw new Error('AI model is not configured')
      }

      // Вызов AI (асинхронный, результат придет в callback)
      await startCompletion(ctx, {
        onCompletionCompleted,
        onCompletionFailed,
        system: systemPrompt,
        model: aiModel,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: fullContext
              }
            ]
          }
        ],
        context: {
          userId: user.id,
          projectId: req.body.projectId
        }
      })

      await loggerLib.writeServerLog(ctx, {
        severity: 6,
        message: `[${LOG_PATH}] AI запрос отправлен, ожидаем результат в callback`,
        payload: { projectId: req.body.projectId }
      })

      return {
        success: true,
        message: 'AI обрабатывает запрос, результат будет применен автоматически. Обновите страницу через несколько секунд.'
      }
    } catch (error) {
      await loggerLib.writeServerLog(ctx, {
        severity: 3,
        message: `[${LOG_PATH}] Ошибка`,
        payload: { error: String(error) }
      })
      return { success: false, error: String(error) }
    }
  })
