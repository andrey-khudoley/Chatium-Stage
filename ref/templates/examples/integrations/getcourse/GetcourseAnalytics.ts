// @shared
import { request } from "@app/request"
import { requireRealUser, requireAccountRole } from '@app/auth'
import { writeWorkspaceEvent } from '@start/sdk'

// Конфигурация для Getcourse API
interface GetcourseConfig {
  baseUrl: string
  apiToken: string
  accountName: string
}

// Типы данных для Getcourse
interface GetcourseUser {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  city?: string
  created_at: string
  last_activity?: string
}

interface GetcourseOrder {
  id: string
  user_id: string 
  product_id: string
  amount: number
  currency: string
  status: string
  created_at: string
}

interface GetcourseProduct {
  id: string
  title: string
  price: number
  currency: string
  category_id?: string
  status: string
}

interface GetcourseEvent {
  id: string
  user_id: string
  event_type: string
  data: Record<string, any>
  created_at: string
}

class GetcourseAPI {
  private config: GetcourseConfig
  
  constructor(config: GetcourseConfig) {
    this.config = config
  }
  
  // Приватный метод для выполнения запросов к API
  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    try {
      const response = await request({
        method: 'post',
        url: `${this.config.baseUrl}/${endpoint}`,
        form: {
          ...params,
          key: this.config.apiToken,
          account: this.config.accountName
        },
        responseType: 'json',
        throwHttpErrors: true
      })
      
      if (response.body.result !== 'success') {
        throw new Error(`Getcourse API error: ${response.body.error_message || 'Unknown error'}`)
      }
      
      return response.body
    } catch (error) {
      // Ошибка будет обработана на уровне вызова
      throw error
    }
  }
  
  // Получение пользователей
  async getUsers(params: {
    limit?: number
    offset?: number
    created_from?: string
    created_to?: string
    search?: string
  } = {}): Promise<GetcourseUser[]> {
    const response = await this.makeRequest('users', {
      limit: params.limit || 100,
      offset: params.offset || 0,
      created_from: params.created_from,
      created_to: params.created_to,
      search: params.search
    })
    
    return response.info || []
  }
  
  // Получение заказов
  async getOrders(params: {
    limit?: number
    offset?: number
    created_from?: string
    created_to?: string
    user_id?: string
    product_id?: string
    status?: string
  } = {}): Promise<GetcourseOrder[]> {
    const response = await this.makeRequest('orders', {
      limit: params.limit || 100,
      offset: params.offset || 0,
      created_from: params.created_from,
      created_to: params.created_to,
      user_id: params.user_id,
      product_id: params.product_id,
      status: params.status
    })
    
    return response.info || []
  }
  
  // Получение продуктов
  async getProducts(params: {
    limit?: number
    category_id?: string
    status?: string
  } = {}): Promise<GetcourseProduct[]> {
    const response = await this.makeRequest('products', {
      limit: params.limit || 100,
      category_id: params.category_id,
      status: params.status
    })
    
    return response.info || []
  }
  
  // Получение событий
  async getEvents(params: {
    limit?: number
    offset?: number
    event_type?: string
    user_id?: string
    created_from?: string
    created_to?: string
  } = {}): Promise<GetcourseEvent[]> {
    const response = await this.makeRequest('events', {
      limit: params.limit || 100,
      offset: params.offset || 0,
      event_type: params.event_type,
      user_id: params.user_id,
      created_from: params.created_from,
      created_to: params.created_to
    })
    
    return response.info || []
  }
  
  // Создание/обновление пользователя
  async upsertUser(userData: {
    email: string
    first_name?: string
    last_name?: string
    phone?: string
    city?: string
    tags?: string[]
    groups?: string[]
  }): Promise<{ user_id: string }> {
    const response = await this.makeRequest('users-add', {
      ...userData,
      tags: userData.tags ? userData.tags.join(',') : undefined,
      groups: userData.groups ? userData.groups.join(',') : undefined
    })
    
    return response
  }
  
  // Создание заказа
  async createOrder(orderData: {
    user_id?: string
    email?: string
    product_id: string
    amount?: number
    currency?: string
    comment?: string
  }): Promise<{ order_id: string }> {
    const response = await this.makeRequest('orders-add', {
      ...orderData,
      currency: orderData.currency || 'RUB'
    })
    
    return response
  }
}

// Инициализация API (обычно конфигурация хранится в настройках аккаунта)
const getcourseAPI = new GetcourseAPI({
  baseUrl: 'https://your-account.getcourse.ru/api',
  apiToken: process.env.GETCOURSE_API_KEY || 'your-api-key',
  accountName: process.env.GETCOURSE_ACCOUNT_NAME || 'your-account'
})

// API эндпоинты для работы с Getcourse

// @shared-route
export const getcourseUsersListRoute = app.get('/users', async (ctx, req) => {
  requireAccountRole(ctx, 'Staff')
  
  try {
    const users = await getcourseAPI.getUsers(req.query as any)
    
    return {
      success: true,
      data: users,
      count: users.length
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

// @shared-route
export const getcourseOrdersListRoute = app.get('/orders', async (ctx, req) => {
  requireAccountRole(ctx, 'Staff')
  
  try {
    const orders = await getcourseAPI.getOrders(req.query as any)
    
    return {
      success: true,
      data: orders,
      count: orders.length
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

// @shared-route
export const getcourseAnalyticsRoute = app.get('/analytics', async (ctx, req) => {
  requireAccountRole(ctx, 'Staff')
  
  try {
    const { period = '30days' } = req.query as any
    
    // Определяем даты для анализа
    const now = new Date()
    const periodDays = parseInt(period.replace('days', '')) || 30
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = now.toISOString().split('T')[0]
    
    // Получаем данные параллельно
    const [users, orders, products] = await Promise.all([
      getcourseAPI.getUsers({
        created_from: startDateStr,
        created_to: endDateStr,
        limit: 1000
      }),
      getcourseAPI.getOrders({
        created_from: startDateStr,
        created_to: endDateStr,
        limit: 1000
      }),
      getcourseAPI.getProducts({
        limit: 100
      })
    ])
    
    // Агрегируем данные
    const totalRevenue = orders
      .filter(order => order.status === 'paid')
      .reduce((sum, order) => sum + order.amount, 0)
    
    const paidOrdersCount = orders.filter(order => order.status === 'paid').length
    const avgOrderValue = paidOrdersCount > 0 ? totalRevenue / paidOrdersCount : 0
    
    const newUsersCount = users.length
    const conversionRate = newUsersCount > 0 ? (paidOrdersCount / newUsersCount) * 100 : 0
    
    // Распределение по статусам заказов
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Топ продукты по продажам
    const productSales = orders
      .filter(order => order.status === 'paid')
      .reduce((acc, order) => {
        acc[order.product_id] = (acc[order.product_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    
    const topProducts = Object.entries(productSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([productId, salesCount]) => {
        const product = products.find(p => p.id === productId)
        return {
          productId,
          title: product?.title || 'Неизвестный продукт',
          salesCount,
          revenue: orders
            .filter(o => o.product_id === productId && o.status === 'paid')
            .reduce((sum, o) => sum + o.amount, 0)
        }
      })
    
    // Динамика по дням
    const dailyStats = {}
    for (let i = 0; i < periodDays; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayUsers = users.filter(u => u.created_at.startsWith(dateStr))
      const dayOrders = orders.filter(o => o.created_at.startsWith(dateStr))
      const dayRevenue = dayOrders
        .filter(o => o.status === 'paid')
        .reduce((sum, o) => sum + o.amount, 0)
      
      dailyStats[dateStr] = {
        users: dayUsers.length,
        orders: dayOrders.length,
        revenue: dayRevenue
      }
    }
    
    return {
      success: true,
      data: {
        summary: {
          period,
          newUsersCount,
          totalOrders: orders.length,
          paidOrdersCount,
          totalRevenue,
          avgOrderValue,
          conversionRate
        },
        ordersByStatus,
        topProducts,
        dailyStats,
        metadata: {
          startDate: startDateStr,
          endDate: endDateStr,
          totalUsers: users.length,
          totalProducts: products.length
        }
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

// @shared-route
export const getcourseCreateUserRoute = app.post('/create-user', async (ctx, req) => {
  requireRealUser(ctx)
  
  try {
    const result = await getcourseAPI.upsertUser(req.body)
    
    await writeWorkspaceEvent(ctx, 'getcourse_user_created', {
      action_params: {
        user_id: result.user_id,
        email: req.body.email,
        first_name: req.body.first_name
      },
      user: {
        id: ctx.user.id,
        name: ctx.user.displayName
      }
    })
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

// @shared-route
export const getcourseCreateOrderRoute = app.post('/create-order', async (ctx, req) => {
  requireRealUser(ctx)
  
  try {
    const result = await getcourseAPI.createOrder(req.body)
    
    await writeWorkspaceEvent(ctx, 'getcourse_order_created', {
      action_params: {
        order_id: result.order_id,
        product_id: req.body.product_id,
        email: req.body.email,
        amount: req.body.amount
      },
      user: {
        id: ctx.user.id,
        name: ctx.user.displayName
      }
    })
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
})

// Экспорт API для использования в других модулях
export { GetcourseAPI }

// Утилиты для работы с Getcourse
export const getcourseUtils = {
  // Форматирование даты в формате Getcourse
  formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  },
  
  // Валидация email
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  // Очистка телефона от лишних символов
  cleanPhone(phone: string): string {
    return phone.replace(/[^\d+]/g, '')
  },
  
  // Расчет конверсии
  calculateConversion(orders: GetcourseOrder[], users: GetcourseUser[]): number {
    const uniqueUsersIds = new Set(users.map(u => u.id))
    const usersWithOrders = new Set(orders.map(o => o.user_id).filter(id => uniqueUsersIds.has(id)))
    return usersWithOrders.size > 0 ? (usersWithOrders.size / uniqueUsersIds.size) * 100 : 0
  }
}