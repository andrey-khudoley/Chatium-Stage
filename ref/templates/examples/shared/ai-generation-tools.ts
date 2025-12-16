// @shared
import { request } from "@app/request"
import { requireRealUser } from '@app/auth'
import { writeWorkspaceEvent } from '@start/sdk'

/**
 * Интерфейсы для AI генерации текста
 */
export interface AIGenerationRequest {
  prompt: string
  model?: string
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
}

/**
 * Интерфейсы для AI генерации изображений
 */
export interface AIImageGenerationRequest {
  prompt: string
  width?: number
  height?: number
  style?: string
  quality?: string
}

/**
 * Интерфейсы для анализа текста
 */
export interface AIAnalysisRequest {
  content: string
  type: 'sentiment' | 'summary' | 'keywords' | 'categories'
  options?: Record<string, any>
}

/**
 * Интерфейсы для chat completion
 */
export interface AIChatCompletionRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
  model?: string
  maxTokens?: number
  temperature?: number
}

/**
 * Интерфейсы для семантического поиска
 */
export interface AISearchRequest {
  query: string
  context?: string
  searchType?: 'semantic' | 'keyword' | 'hybrid'
  topK?: number
}

/**
 * Класс для работы с AI утилитами
 * Предоставляет методы для текстовой генерации, создания изображений,
 * анализа текста и других AI операций
 */
export class AITools {
  private baseUrl: string
  private apiKey: string
  
  /**
   * Конструктор AITools
   * @param config Конфигурация с базовым URL и API ключом
   */
  constructor(config: { baseUrl?: string; apiKey?: string } = {}) {
    this.baseUrl = config.baseUrl || 'https://api.chatium.ai'
    this.apiKey = config.apiKey || 'your-api-key'
  }
  
  /**
   * Генерирует текст на основе промпта
   * @param request Параметры генерации текста
   * @returns Сгенерированный текст
   * @throws Выбрасывает ошибку при неудаче генерации
   */
  async generateText(request: AIGenerationRequest): Promise<string> {
    try {
      const response = await request({
        url: `${this.baseUrl}/v1/chat/completions`,
        method: 'post',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        json: {
          model: request.model || 'gpt-3.5-turbo',
          messages: [
            ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
            { role: 'user', content: request.prompt }
          ],
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7
        },
        responseType: 'json',
        throwHttpErrors: true
      })
      
      return response.body.choices[0].message.content
    } catch (error) {
      throw new Error(`Failed to generate text: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  /**
   * Генерирует изображение на основе текстового описания
   * @param request Параметры генерации изображения
   * @returns URL сгенерированного изображения
   * @throws Выбрасывает ошибку при неудаче генерации
   */
  async generateImage(request: AIImageGenerationRequest): Promise<string> {
    try {
      const response = await request({
        url: `${this.baseUrl}/v1/images/generations`,
        method: 'post',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        json: {
          prompt: request.prompt,
          n: 1,
          size: `${request.width || 512}x${request.height || 512}`,
          style: request.style || 'natural',
          quality: request.quality || 'standard'
        },
        responseType: 'json',
        throwHttpErrors: true
      })
      
      return response.body.data[0].url
    } catch (error) {
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  /**
   * Анализирует текст по различным критериям
   * @param request Параметры анализа текста
   * @returns Результаты анализа в виде объекта
   * @throws Выбрасывает ошибку при неудаче анализа
   */
  async analyzeText(request: AIAnalysisRequest): Promise<Record<string, any>> {
    try {
      let analysisPrompt = ''
      
      switch (request.type) {
        case 'sentiment':
          analysisPrompt = `Проанализируй тональность следующего текста и оцени по шкале от -1 (очень негативный) до 1 (очень позитивный). Верни JSON с полями: sentiment, confidence, highlights. Текст: "${request.content}"`
          break
        case 'summary':
          analysisPrompt = `Сократи следующий текст до 2-3 предложений, сохранив основную суть. Текст: "${request.content}"`
          break
        case 'keywords':
          analysisPrompt = `Извлеки 5-7 ключевых слов и фраз из следующего текста. Верни как массив строк. Текст: "${request.content}"`
          break
        case 'categories':
          analysisPrompt = `Классифицируй следующий текст по категориям. Верни JSON с полями: primary_category, secondary_categories (массив), confidence. Текст: "${request.content}"`
          break
      }
      
      const result = await this.generateText({
        prompt: analysisPrompt,
        systemPrompt: 'Ты - профессиональный аналитик текста. Отвечай кратко и точно.',
        temperature: 0.1
      })
      
      try {
        return JSON.parse(result)
      } catch {
        return { result }
      }
    } catch (error) {
      throw new Error(`Failed to analyze text: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  /**
   * Выполняет chat completion - диалог с моделью
   * @param request Параметры чата
   * @returns Ответ от модели
   * @throws Выбрасывает ошибку при неудаче
   */
  async chatCompletion(request: AIChatCompletionRequest): Promise<string> {
    try {
      const response = await request({
        url: `${this.baseUrl}/v1/chat/completions`,
        method: 'post',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        json: {
          model: request.model || 'gpt-3.5-turbo',
          messages: request.messages,
          max_tokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7
        },
        responseType: 'json',
        throwHttpErrors: true
      })
      
      return response.body.choices[0].message.content
    } catch (error) {
      throw new Error(`Failed to complete chat: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  /**
   * Выполняет семантический поиск
   * @param request Параметры поиска
   * @returns Массив результатов поиска
   * @throws Выбрасывает ошибку при неудаче поиска
   */
  async semanticSearch(request: AISearchRequest): Promise<Array<{ content: string; score: number; metadata?: Record<string, any> }>> {
    try {
      const response = await request({
        url: `${this.baseUrl}/v1/search`,
        method: 'post',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        json: {
          query: request.query,
          context: request.context,
          search_type: request.searchType || 'semantic',
          top_k: request.topK || 5
        },
        responseType: 'json',
        throwHttpErrors: true
      })
      
      return response.body.results
    } catch (error) {
      throw new Error(`Failed to perform semantic search: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  
  /**
   * Генерирует продающее описание для товара
   * @param product Информация о товаре
   * @returns Сгенерированное описание
   */
  async generateProductDescription(product: {
    name: string
    category?: string
    features?: string[]
    targetAudience?: string
  }): Promise<string> {
    const prompt = `
Напиши продающее описание для товара:
Название: ${product.name}
Категория: ${product.category || 'Не указана'}
Особенности: ${product.features?.join(', ') || 'Не указаны'}
Целевая аудитория: ${product.targetAudience || 'Не указана'}

Описание должно быть:
1. Привлекательным и убедительным
2. Выделять ключевые преимущества
3. Быть ориентированным на целевую аудиторию
4. Содержать призыв к действию
Объем: 150-200 слов.
`
    
    return this.generateText({
      prompt,
      systemPrompt: 'Ты - копирайтер с многолетним опытом в интернет-маркетинге.',
      temperature: 0.8
    })
  }
  
  /**
   * Генерирует SEO оптимизированный контент
   * @param params Параметры генерации контента
   * @returns Сгенерированный контент
   */
  async generateSEOContent(params: {
    keyword: string
    contentType: 'blog' | 'product' | 'landing' | 'article'
    tone: 'professional' | 'friendly' | 'persuasive'
    length?: number
    additionalKeywords?: string[]
  }): Promise<string> {
    const length = params.length || (params.contentType === 'blog' ? 800 : 300)
    
    const prompt = `
Напиши SEO оптимизированный контент на основе:
Основной ключ: ${params.keyword}
Дополнительные ключи: ${params.additionalKeywords?.join(', ') || 'Нет'}
Тип контента: ${params.contentType}
Тон: ${params.tone}
Объем: ~${length} слов

Требования:
- Используй основной ключ в заголовке и подзаголовках
- Равномерно распредели ключевые слова по тексту
- Структурируй текст для легкого чтения
- Создай ценность для читателя
`
    
    return this.generateText({
      prompt,
      systemPrompt: 'Ты - SEO специалист и контент-маркетолог.',
      temperature: 0.6
    })
  }
  
  /**
   * Генерирует маркетинговые тексты
   * @param params Параметры маркетингового текста
   * @returns Сгенерированный маркетинговый текст
   */
  async generateMarketingCopy(params: {
    product: string
    targetAudience: string
    uniqueSellingPoint: string
    callToAction: string
    format: 'social' | 'email' | 'landing' | 'ad'
  }): Promise<string> {
    const prompt = `
Создай маркетинговый текст для:
Продукт: ${params.product}
Целевая аудитория: ${params.targetAudience}
Уникальное преимущество: ${params.uniqueSellingPoint}
Призыв к действию: ${params.callToAction}
Формат: ${params.format}

Текст должен быть:
- Эмоционально привлекательным
- Четко доносить ценность
- Включать сильный призыв к действию
- Адаптирован под выбранную платформу
`
    
    return this.generateText({
      prompt,
      systemPrompt: 'Ты - профильный маркетолог с опытом в создании конверсионных текстов.',
      temperature: 0.9
    })
  }
}

/** Экспортный инстанс AITools по умолчанию */
export const aiTools = new AITools()

// ============== API ROUTES ==============

/**
 * POST /generate/text
 * Генерирует текст на основе промпта
 */
// @shared-route
export const aiGenerateTextRoute = app.post('/generate/text', async (ctx, req) => {
  requireRealUser(ctx)
  
  try {
    const result = await aiTools.generateText(req.body)
    
    await writeWorkspaceEvent(ctx, 'ai_text_generated', {
      action_params: {
        prompt: req.body.prompt?.substring(0, 100),
        model: req.body.model,
        length: result.length
      },
      user: {
        id: ctx.user.id,
        name: ctx.user.displayName
      }
    })
    
    return {
      success: true,
      result,
      metadata: {
        length: result.length,
        tokens: result.split(' ').length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})

/**
 * POST /generate/image
 * Генерирует изображение на основе текстового описания
 */
// @shared-route
export const aiGenerateImageRoute = app.post('/generate/image', async (ctx, req) => {
  requireRealUser(ctx)
  
  try {
    const imageUrl = await aiTools.generateImage(req.body)
    
    await writeWorkspaceEvent(ctx, 'ai_image_generated', {
      action_params: {
        prompt: req.body.prompt?.substring(0, 100),
        width: req.body.width,
        height: req.body.height
      },
      user: {
        id: ctx.user.id,
        name: ctx.user.displayName
      }
    })
    
    return {
      success: true,
      imageUrl,
      metadata: {
        dimensions: `${req.body.width || 512}x${req.body.height || 512}`
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})

/**
 * POST /analyze/text
 * Анализирует текст по различным критериям
 */
// @shared-route
export const aiAnalyzeTextRoute = app.post('/analyze/text', async (ctx, req) => {
  requireRealUser(ctx)
  
  try {
    const result = await aiTools.analyzeText(req.body)
    
    return {
      success: true,
      result,
      metadata: {
        type: req.body.type,
        contentLength: req.body.content?.length || 0
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})

/**
 * POST /generate/product-description
 * Генерирует описание для товара
 */
// @shared-route
export const aiProductDescriptionRoute = app.post('/generate/product-description', async (ctx, req) => {
  requireRealUser(ctx)
  
  try {
    const result = await aiTools.generateProductDescription(req.body)
    
    return {
      success: true,
      description: result,
      metadata: {
        length: result.length,
        product: req.body.name
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})

/**
 * POST /generate/marketing-copy
 * Генерирует маркетинговый текст
 */
// @shared-route
export const aiMarketingCopyRoute = app.post('/generate/marketing-copy', async (ctx, req) => {
  requireRealUser(ctx)
  
  try {
    const result = await aiTools.generateMarketingCopy(req.body)
    
    return {
      success: true,
      copy: result,
      metadata: {
        format: req.body.format,
        product: req.body.product
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})

/**
 * POST /chat
 * Выполняет чат диалог с AI
 */
// @shared-route
export const aiChatRoute = app.post('/chat', async (ctx, req) => {
  requireRealUser(ctx)
  
  try {
    const result = await aiTools.chatCompletion(req.body)
    
    return {
      success: true,
      response: result
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})

/**
 * POST /search
 * Выполняет семантический поиск
 */
// @shared-route
export const aiSearchRoute = app.post('/search', async (ctx, req) => {
  requireRealUser(ctx)
  
  try {
    const result = await aiTools.semanticSearch(req.body)
    
    return {
      success: true,
      results: result,
      metadata: {
        query: req.body.query,
        resultCount: result.length
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    }
  }
})

// ============== AI UTILITIES ==============

/**
 * Вспомогательные утилиты для работы с AI
 */
export const aiUtils = {
  /**
   * Очищает HTML теги из текста
   * @param html HTML строка
   * @returns Текст без тегов
   */
  stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '')
  },
  
  /**
   * Ограничивает длину текста
   * @param text Исходный текст
   * @param maxLength Максимальная длина
   * @param suffix Суффикс для обрезанного текста
   * @returns Обрезанный текст
   */
  truncateText(text: string, maxLength: number, suffix = '...'): string {
    return text.length > maxLength ? text.substring(0, maxLength - suffix.length) + suffix : text
  },
  
  /**
   * Экранирует специальные символы в промпте
   * @param prompt Исходный промпт
   * @returns Экранированный промпт
   */
  escapePrompt(prompt: string): string {
    return prompt.replace(/[\\"']/g, '\\$&')
  },
  
  /**
   * Валидирует контент перед отправкой
   * @param content Контент для валидации
   * @param type Тип контента
   * @returns Результаты валидации
   */
  validateContent(content: string, type = 'text'): { valid: boolean; issues: string[] } {
    const issues = []
    
    if (content.length < 10) {
      issues.push('Контент слишком короткий (минимум 10 символов)')
    }
    
    if (content.length > 10000) {
      issues.push('Контент слишком длинный (максимум 10000 символов)')
    }
    
    if (type === 'text' && !/[\wа-яё\s]/.test(content)) {
      issues.push('Контент должен содержать текстовые символы')
    }
    
    return {
      valid: issues.length === 0,
      issues
    }
  },
  
  /**
   * Форматирует результаты AI в разные форматы
   * @param results Результаты для форматирования
   * @param format Требуемый формат
   * @returns Отформатированный результат
   */
  formatResults(results: any, format: 'json' | 'text' | 'markdown'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(results, null, 2)
      case 'markdown':
        if (Array.isArray(results)) {
          return results.map(item => `- ${item}`).join('\n')
        }
        if (typeof results === 'object') {
          return Object.entries(results).map(([key, value]) => `**${key}**: ${value}`).join('\n')
        }
        return String(results)
      default:
        return String(results)
    }
  }
}
