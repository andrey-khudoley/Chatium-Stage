// @shared-route
/**
 * API для управления файлами и изображениями
 * Предоставляет методы для загрузки, скачивания, обработки файлов
 */

/**
 * POST /files/upload
 * Загружает файл в файловое хранилище Chatium
 * @param req.files.file Файл для загрузки
 * @returns Информация о загруженном файле
 */
export const uploadFileRoute = app.post('/files/upload', async (ctx, req) => {
  try {
    const file = req.files?.file
    
    if (!file) {
      return { success: false, error: 'Файл не найден' }
    }

    const uploadResult = await ctx.storage.uploadFile({
      name: file.name,
      type: file.type,
      data: file.data
    })

    return {
      success: true,
      file: {
        id: uploadResult.fileId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadResult.url,
        thumbnailUrl: uploadResult.thumbnailUrl
      },
      message: 'Файл успешно загружен'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при загрузке файла'
    }
  }
})

/**
 * POST /files/upload-image
 * Загружает изображение с валидацией и созданием превью
 * @param req.files.image Изображение для загрузки
 * @returns Информация об изображении и его превью
 */
export const uploadImageRoute = app.post('/files/upload-image', async (ctx, req) => {
  try {
    const file = req.files?.image
    
    if (!file) {
      return { success: false, error: 'Изображение не найдено' }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Недопустимый тип изображения' }
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return { success: false, error: 'Размер файла превышает 10 МБ' }
    }

    const uploadResult = await ctx.storage.uploadFile({
      name: file.name,
      type: file.type,
      data: file.data
    })

    return {
      success: true,
      image: {
        id: uploadResult.fileId,
        name: file.name,
        originalUrl: uploadResult.url,
        width: uploadResult.width,
        height: uploadResult.height,
        size: file.size
      },
      message: 'Изображение успешно загружено'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при загрузке изображения'
    }
  }
})

/**
 * GET /files/:fileId/info
 * Получает информацию о файле
 * @param params.fileId ID файла
 * @returns Информация о файле
 */
export const getFileInfoRoute = app.get('/files/:fileId/info', async (ctx, req) => {
  try {
    const { fileId } = req.params
    
    const fileInfo = await ctx.storage.getFileInfo(fileId)
    
    if (!fileInfo) {
      return { success: false, error: 'Файл не найден' }
    }

    return {
      success: true,
      file: fileInfo
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при получении информации о файле'
    }
  }
})

/**
 * GET /files/:fileId/download
 * Скачивает файл
 * @param params.fileId ID файла
 * @returns Поток файла
 */
export const downloadFileRoute = app.get('/files/:fileId/download', async (ctx, req) => {
  try {
    const { fileId } = req.params
    
    const fileStream = await ctx.storage.getFileStream(fileId)
    
    if (!fileStream) {
      return { success: false, error: 'Файл не найден' }
    }

    const fileInfo = await ctx.storage.getFileInfo(fileId)
    
    ctx.resp.setHeader('Content-Type', fileInfo.type)
    ctx.resp.setHeader('Content-Disposition', `attachment; filename="${fileInfo.name}"`)
    ctx.resp.setHeader('Content-Length', fileInfo.size)
    
    return ctx.resp.send(fileStream)
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при скачивании файла'
    }
  }
})

/**
 * DELETE /files/:fileId
 * Удаляет файл
 * @param params.fileId ID файла
 * @returns Результат удаления
 */
export const deleteFileRoute = app.delete('/files/:fileId', async (ctx, req) => {
  try {
    const { fileId } = req.params
    
    await ctx.storage.deleteFile(fileId)
    
    return {
      success: true,
      message: 'Файл успешно удален'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при удалении файла'
    }
  }
})

/**
 * GET /files
 * Получает список файлов пользователя
 * @param query.limit Максимальное количество файлов
 * @param query.offset Смещение для пагинации
 * @param query.type Фильтр по типу файла
 * @returns Список файлов и информация о пагинации
 */
export const listFilesRoute = app.get('/files', async (ctx, req) => {
  try {
    const { limit = 50, offset = 0, type } = req.query
    
    const files = await ctx.storage.listFiles({
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      filter: type ? { type } : {}
    })
    
    return {
      success: true,
      files: files,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: files.length === parseInt(limit as string)
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при получении списка файлов'
    }
  }
})

/**
 * POST /files/:fileId/thumbnail
 * Создает превью изображения
 * @param params.fileId ID файла
 * @param body.width Ширина превью
 * @param body.height Высота превью
 * @param body.quality Качество (1-100)
 * @returns URL превью
 */
export const createImageThumbnailRoute = app.post('/files/:fileId/thumbnail', async (ctx, req) => {
  try {
    const { fileId } = req.params
    const { width, height, quality = 80 } = req.body
    
    if (!width || !height) {
      return { success: false, error: 'Не указаны размеры превью' }
    }

    const thumbnail = await ctx.storage.createThumbnail(fileId, parseInt(width), parseInt(height), {
      quality: parseInt(quality)
    })

    return {
      success: true,
      thumbnail: {
        url: thumbnail.url,
        width: thumbnail.width,
        height: thumbnail.height
      },
      message: 'Превью успешно создано'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при создании превью'
    }
  }
})

/**
 * POST /files/:fileId/process
 * Обрабатывает и оптимизирует изображение
 * @param params.fileId ID файла
 * @param body.width Целевая ширина
 * @param body.height Целевая высота
 * @param body.quality Качество (1-100)
 * @param body.format Формат вывода (jpeg, png, webp)
 * @returns ID обработанного изображения
 */
export const processImageRoute = app.post('/files/:fileId/process', async (ctx, req) => {
  try {
    const { fileId } = req.params
    const { 
      width, 
      height, 
      quality = 80, 
      format = 'jpeg'
    } = req.body

    const imageInfo = await ctx.storage.getFileInfo(fileId)
    
    if (!imageInfo.type.startsWith('image/')) {
      return { success: false, error: 'Файл не является изображением' }
    }

    const thumbnail = await ctx.storage.createThumbnail(
      fileId, 
      width ? parseInt(width) : undefined, 
      height ? parseInt(height) : undefined,
      { quality: parseInt(quality), format }
    )

    return {
      success: true,
      originalFileId: fileId,
      processedUrl: thumbnail.url,
      processing: {
        width: width || 'auto',
        height: height || 'auto',
        quality: quality,
        format: format
      },
      message: 'Изображение успешно обработано'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при обработке изображения'
    }
  }
})

/**
 * POST /files/upload-multiple
 * Загружает несколько файлов одновременно
 * @param req.files.files Массив файлов для загрузки
 * @returns Результаты загрузки каждого файла
 */
export const uploadMultipleFilesRoute = app.post('/files/upload-multiple', async (ctx, req) => {
  try {
    const files = req.files?.files
    
    if (!files || (Array.isArray(files) && files.length === 0)) {
      return { success: false, error: 'Файлы не найдены' }
    }

    const uploadResults = []
    const errors = []
    const fileArray = Array.isArray(files) ? files : [files]

    for (let i = 0; i < fileArray.length; i++) {
      try {
        const file = fileArray[i]
        const uploadResult = await ctx.storage.uploadFile({
          name: file.name,
          type: file.type,
          data: file.data
        })

        uploadResults.push({
          index: i,
          name: file.name,
          size: file.size,
          id: uploadResult.fileId,
          url: uploadResult.url
        })
      } catch (error) {
        errors.push({
          index: i,
          name: fileArray[i].name,
          error: error instanceof Error ? error.message : 'Ошибка загрузки'
        })
      }
    }

    return {
      success: true,
      uploaded: uploadResults,
      failed: errors,
      total: fileArray.length,
      message: `Загружено ${uploadResults.length} из ${fileArray.length} файлов`
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка при загрузке файлов'
    }
  }
})
