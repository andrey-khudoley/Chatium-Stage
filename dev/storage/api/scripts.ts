// @shared-route
import { requireAnyUser } from '@app/auth'
import ScriptsTable, { ScriptRecord } from '../tables/scripts.table'

// Получить список всех скриптов
export const apiGetScriptsListRoute = app.get('/list', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const scripts = await ScriptsTable.findAll(ctx, {
      order: [['createdAt', 'DESC']]
    })
    
    return {
      success: true,
      scripts
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Создать новый скрипт
export const apiCreateScriptRoute = app.post('/create', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { name, description, type, content } = req.body
    
    // Проверка обязательных полей
    if (!name || !type || !content) {
      return {
        success: false,
        error: 'Имя, тип и контент обязательны'
      }
    }
    
    // Проверка уникальности имени
    const existing = await ScriptsTable.findOneBy(ctx, { name })
    if (existing) {
      return {
        success: false,
        error: 'Скрипт с таким именем уже существует'
      }
    }
    
    const script = await ScriptsTable.create(ctx, {
      name,
      description: description || '',
      type,
      content
    })
    
    // Формируем ссылку для использования (с тильдой согласно file-based роутингу)
    const url = type === 'script' 
      ? `${ctx.account.url('/dev/storage/serve~')}${name}.js`
      : `${ctx.account.url('/dev/storage/serve~')}${name}.css`
    
    return {
      success: true,
      script,
      url
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Обновить скрипт
export const apiUpdateScriptRoute = app.post('/update', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { id, name, description, type, content } = req.body
    
    if (!id) {
      return {
        success: false,
        error: 'ID обязателен'
      }
    }
    
    const script = await ScriptsTable.findById(ctx, id)
    if (!script) {
      return {
        success: false,
        error: 'Скрипт не найден'
      }
    }
    
    // Если меняется имя, проверяем уникальность
    if (name && name !== script.name) {
      const existing = await ScriptsTable.findOneBy(ctx, { name })
      if (existing) {
        return {
          success: false,
          error: 'Скрипт с таким именем уже существует'
        }
      }
    }
    
    const updated = await ScriptsTable.update(ctx, {
      id,
      name: name || script.name,
      description: description !== undefined ? description : script.description,
      type: type || script.type,
      content: content !== undefined ? content : script.content
    })
    
    // Формируем ссылку для использования (с тильдой согласно file-based роутингу)
    const finalType = type || script.type
    const finalName = name || script.name
    const url = finalType === 'script' 
      ? `${ctx.account.url('/dev/storage/serve~')}${finalName}.js`
      : `${ctx.account.url('/dev/storage/serve~')}${finalName}.css`
    
    return {
      success: true,
      script: updated,
      url
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Удалить скрипт
export const apiDeleteScriptRoute = app.post('/delete', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { id } = req.body
    
    if (!id) {
      return {
        success: false,
        error: 'ID обязателен'
      }
    }
    
    await ScriptsTable.delete(ctx, id)
    
    return {
      success: true
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Получить скрипт по ID
export const apiGetScriptByIdRoute = app.get('/get/:id', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { id } = req.params
    
    const script = await ScriptsTable.findById(ctx, id)
    
    if (!script) {
      return {
        success: false,
        error: 'Скрипт не найден'
      }
    }
    
    // Формируем ссылку для использования (с тильдой согласно file-based роутингу)
    const url = script.type === 'script' 
      ? `${ctx.account.url('/dev/storage/serve~')}${script.name}.js`
      : `${ctx.account.url('/dev/storage/serve~')}${script.name}.css`
    
    return {
      success: true,
      script,
      url
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Загрузить файл
export const apiUploadFileRoute = app.post('/upload', async (ctx, req) => {
  try {
    requireAnyUser(ctx)
    
    const { filename, content } = req.body
    
    // Проверка обязательных полей
    if (!filename || !content) {
      return {
        success: false,
        error: 'Имя файла и содержимое обязательны'
      }
    }
    
    // Определяем тип файла по расширению
    const extension = filename.toLowerCase().split('.').pop()
    let type: string
    let name: string
    
    if (extension === 'js') {
      type = 'script'
      name = filename.replace(/\.js$/i, '')
    } else if (extension === 'css') {
      type = 'style'
      name = filename.replace(/\.css$/i, '')
    } else {
      return {
        success: false,
        error: 'Поддерживаются только файлы .js и .css'
      }
    }
    
    // Проверка уникальности имени
    const existing = await ScriptsTable.findOneBy(ctx, { name })
    if (existing) {
      return {
        success: false,
        error: 'Скрипт с таким именем уже существует'
      }
    }
    
    // Создаём запись в базе
    const script = await ScriptsTable.create(ctx, {
      name,
      description: `Загружен из файла ${filename}`,
      type,
      content
    })
    
    // Формируем ссылку для использования
    const url = type === 'script' 
      ? `${ctx.account.url('/dev/storage/serve~')}${name}.js`
      : `${ctx.account.url('/dev/storage/serve~')}${name}.css`
    
    return {
      success: true,
      script,
      url
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})

