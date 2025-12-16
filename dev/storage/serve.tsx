// @shared
// Роут для отдачи контента скриптов и стилей
// URL: /dev/storage/serve~{filename}.js или /dev/storage/serve~{filename}.css
import ScriptsTable from './tables/scripts.table'

export const serveScriptRoute = app.get('/:filename', async (ctx, req) => {
  const { filename } = req.params
  
  // Определяем расширение и имя файла
  const extension = filename.match(/\.(js|css)$/)?.[1]
  const name = filename.replace(/\.(js|css)$/, '')
  
  // Ищем скрипт по имени
  const script = await ScriptsTable.findOneBy(ctx, { name })
  
  if (!script) {
    return 'Script not found'
  }
  
  // Определяем Content-Type в зависимости от расширения
  let contentType = 'text/plain; charset=utf-8'
  if (extension === 'css') {
    contentType = 'text/css; charset=utf-8'
  } else if (extension === 'js') {
    contentType = 'application/javascript; charset=utf-8'
  }
  
  // Возвращаем контент с правильными заголовками
  return {
    statusCode: 200,
    rawHttpBody: script.content,
    headers: {
      'Content-Type': contentType
    }
  }
})

export default serveScriptRoute

