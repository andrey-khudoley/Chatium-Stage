// @shared

export interface EventDefinition {
  name: string
  type: 'traffic' | 'getcourse'
  description: string
  urlPath?: string
  fields?: EventField[]
  example?: Record<string, any>
}

export interface EventField {
  name: string
  type: string
  description: string
  required?: boolean
  example?: any
}

export const GETCOURSE_EVENTS: EventDefinition[] = [
  // События заказов
  {
    name: 'dealCreated',
    type: 'getcourse',
    description: 'Создание заказа',
    urlPath: 'event://getcourse/dealCreated',
    fields: [
      { name: 'deal', type: 'object', description: 'Объект заказа', required: true },
      { name: 'deal.id', type: 'string', description: 'ID заказа', required: true },
      { name: 'deal.number', type: 'string', description: 'Номер заказа' },
      { name: 'deal.status', type: 'string', description: 'Статус заказа' },
      { name: 'deal.amount', type: 'number', description: 'Сумма заказа' },
      { name: 'deal.currency', type: 'string', description: 'Валюта' },
      { name: 'deal.user', type: 'object', description: 'Информация о пользователе' },
      { name: 'deal.user.id', type: 'string', description: 'ID пользователя' },
      { name: 'deal.user.email', type: 'string', description: 'Email пользователя' },
      { name: 'deal.user.first_name', type: 'string', description: 'Имя пользователя' },
      { name: 'deal.user.last_name', type: 'string', description: 'Фамилия пользователя' },
      { name: 'deal.products', type: 'array', description: 'Список продуктов в заказе' },
      { name: 'deal.created_at', type: 'datetime', description: 'Дата создания' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      deal: {
        id: '12345',
        number: 'ORD-2025-001',
        status: 'new',
        amount: 9990,
        currency: 'RUB',
        user: {
          id: '67890',
          email: 'user@example.com',
          first_name: 'John',
          last_name: 'Doe'
        },
        products: [
          {
            id: 'prod_123',
            name: 'Курс маркетинга',
            price: 9990,
            quantity: 1
          }
        ],
        created_at: '2025-01-01T12:00:00Z'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'dealStatusChanged',
    type: 'getcourse',
    description: 'Изменение статуса заказа',
    urlPath: 'event://getcourse/dealStatusChanged',
    fields: [
      { name: 'deal', type: 'object', description: 'Объект заказа', required: true },
      { name: 'deal.id', type: 'string', description: 'ID заказа', required: true },
      { name: 'deal.number', type: 'string', description: 'Номер заказа' },
      { name: 'old_status', type: 'string', description: 'Старый статус', required: true },
      { name: 'new_status', type: 'string', description: 'Новый статус', required: true },
      { name: 'user', type: 'object', description: 'Пользователь заказа' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      deal: {
        id: '12345',
        number: 'ORD-2025-001'
      },
      old_status: 'new',
      new_status: 'paid',
      user: {
        id: '67890',
        email: 'user@example.com'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'dealPaid',
    type: 'getcourse',
    description: 'Оплата заказа',
    urlPath: 'event://getcourse/dealPaid',
    fields: [
      { name: 'deal', type: 'object', description: 'Объект заказа', required: true },
      { name: 'deal.id', type: 'string', description: 'ID заказа', required: true },
      { name: 'deal.amount', type: 'number', description: 'Сумма оплаты' },
      { name: 'payment', type: 'object', description: 'Информация о платеже' },
      { name: 'payment.id', type: 'string', description: 'ID платежа' },
      { name: 'payment.method', type: 'string', description: 'Способ оплаты' },
      { name: 'payment.amount', type: 'number', description: 'Сумма платежа' },
      { name: 'payment.currency', type: 'string', description: 'Валюта платежа' },
      { name: 'payment.status', type: 'string', description: 'Статус платежа' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      deal: {
        id: '12345',
        amount: 9990
      },
      payment: {
        id: 'pay_67890',
        method: 'card',
        amount: 9990,
        currency: 'RUB',
        status: 'completed'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'dealRefund',
    type: 'getcourse',
    description: 'Возврат средств по заказу',
    urlPath: 'event://getcourse/dealRefund',
    fields: [
      { name: 'deal', type: 'object', description: 'Объект заказа', required: true },
      { name: 'deal.id', type: 'string', description: 'ID заказа', required: true },
      { name: 'refund', type: 'object', description: 'Информация о возврате' },
      { name: 'refund.amount', type: 'number', description: 'Сумма возврата' },
      { name: 'refund.reason', type: 'string', description: 'Причина возврата' },
      { name: 'refund.status', type: 'string', description: 'Статус возврата' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      deal: {
        id: '12345'
      },
      refund: {
        amount: 9990,
        reason: 'По запросу клиента',
        status: 'completed'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'dealUpdated',
    type: 'getcourse',
    description: 'Обновление заказа',
    urlPath: 'event://getcourse/dealUpdated',
    fields: [
      { name: 'deal', type: 'object', description: 'Объект заказа', required: true },
      { name: 'deal.id', type: 'string', description: 'ID заказа', required: true },
      { name: 'changes', type: 'object', description: 'Изменения в заказе', required: true },
      { name: 'user', type: 'object', description: 'Пользователь' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      deal: {
        id: '12345'
      },
      changes: {
        status: 'processing',
        comment: 'Заказ в обработке'
      },
      user: {
        id: '67890'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  
  // События пользователей
  {
    name: 'user/created',
    type: 'getcourse',
    description: 'Регистрация пользователя',
    urlPath: 'event://getcourse/user/created',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'user.email', type: 'string', description: 'Email пользователя' },
      { name: 'user.first_name', type: 'string', description: 'Имя пользователя' },
      { name: 'user.last_name', type: 'string', description: 'Фамилия пользователя' },
      { name: 'user.phone', type: 'string', description: 'Телефон пользователя' },
      { name: 'user.created_at', type: 'datetime', description: 'Дата регистрации' },
      { name: 'user.source', type: 'string', description: 'Источник регистрации' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        email: 'user@example.com',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+1234567890',
        created_at: '2025-01-01T12:00:00Z',
        source: 'website'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'user/updated',
    type: 'getcourse',
    description: 'Обновление профиля пользователя',
    urlPath: 'event://getcourse/user/updated',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'changes', type: 'object', description: 'Изменения в профиле', required: true },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      changes: {
        first_name: 'New Name',
        phone: '+9876543210'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'user/deleted',
    type: 'getcourse',
    description: 'Удаление пользователя',
    urlPath: 'event://getcourse/user/deleted',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'user.email', type: 'string', description: 'Email пользователя' },
      { name: 'reason', type: 'string', description: 'Причина удаления' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        email: 'user@example.com'
      },
      reason: 'По запросу пользователя',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  
  // События чат-ботов
  {
    name: 'user/chatbot/telegram_enabled',
    type: 'getcourse',
    description: 'Привязка Telegram',
    urlPath: 'event://getcourse/user/chatbot/telegram_enabled',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'user.telegram_id', type: 'string', description: 'Telegram ID пользователя' },
      { name: 'user.telegram_username', type: 'string', description: 'Username в Telegram' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        telegram_id: '123456789',
        telegram_username: 'john_doe'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'user/chatbot/telegram_disabled',
    type: 'getcourse',
    description: 'Отвязка Telegram',
    urlPath: 'event://getcourse/user/chatbot/telegram_disabled',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'user.telegram_id', type: 'string', description: 'Telegram ID пользователя' },
      { name: 'reason', type: 'string', description: 'Причина отвязки' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        telegram_id: '123456789'
      },
      reason: 'По запросу пользователя',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'user/chatbot/vk_enabled',
    type: 'getcourse',
    description: 'Привязка VK',
    urlPath: 'event://getcourse/user/chatbot/vk_enabled',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'user.vk_id', type: 'string', description: 'VK ID пользователя' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        vk_id: '987654321'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'user/chatbot/vk_disabled',
    type: 'getcourse',
    description: 'Отвязка VK',
    urlPath: 'event://getcourse/user/chatbot/vk_disabled',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'user.vk_id', type: 'string', description: 'VK ID пользователя' },
      { name: 'reason', type: 'string', description: 'Причина отвязки' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        vk_id: '987654321'
      },
      reason: 'По запросу пользователя',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'user/chatbot/whatsapp_enabled',
    type: 'getcourse',
    description: 'Привязка WhatsApp',
    urlPath: 'event://getcourse/user/chatbot/whatsapp_enabled',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'user.whatsapp_phone', type: 'string', description: 'WhatsApp номер пользователя' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        whatsapp_phone: '+1234567890'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'user/chatbot/whatsapp_disabled',
    type: 'getcourse',
    description: 'Отвязка WhatsApp',
    urlPath: 'event://getcourse/user/chatbot/whatsapp_disabled',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'user.whatsapp_phone', type: 'string', description: 'WhatsApp номер пользователя' },
      { name: 'reason', type: 'string', description: 'Причина отвязки' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        whatsapp_phone: '+1234567890'
      },
      reason: 'По запросу пользователя',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  
  // События групп
  {
    name: 'user/group_added',
    type: 'getcourse',
    description: 'Добавление в группу',
    urlPath: 'event://getcourse/user/group_added',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'group', type: 'object', description: 'Объект группы', required: true },
      { name: 'group.id', type: 'string', description: 'ID группы', required: true },
      { name: 'group.name', type: 'string', description: 'Название группы' },
      { name: 'group.description', type: 'string', description: 'Описание группы' },
      { name: 'added_by', type: 'object', description: 'Кто добавил' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        email: 'user@example.com'
      },
      group: {
        id: '123',
        name: 'Продвинутый маркетинг',
        description: 'Группа для опытных маркетологов'
      },
      added_by: {
        id: '111',
        name: 'Admin'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'user/group_removed',
    type: 'getcourse',
    description: 'Удаление из группы',
    urlPath: 'event://getcourse/user/group_removed',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'group', type: 'object', description: 'Объект группы', required: true },
      { name: 'group.id', type: 'string', description: 'ID группы', required: true },
      { name: 'group.name', type: 'string', description: 'Название группы' },
      { name: 'removed_by', type: 'object', description: 'Кто удалил' },
      { name: 'reason', type: 'string', description: 'Причина удаления' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      group: {
        id: '123',
        name: 'Продвинутый маркетинг'
      },
      removed_by: {
        id: '111',
        name: 'Admin'
      },
      reason: 'По запросу пользователя',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  
  // События обучения
  {
    name: 'lesson/completed',
    type: 'getcourse',
    description: 'Урок пройден',
    urlPath: 'event://getcourse/lesson/completed',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'lesson', type: 'object', description: 'Объект урока', required: true },
      { name: 'lesson.id', type: 'string', description: 'ID урока', required: true },
      { name: 'lesson.title', type: 'string', description: 'Название урока' },
      { name: 'lesson.course', type: 'object', description: 'Курс урока' },
      { name: 'lesson.course.id', type: 'string', description: 'ID курса' },
      { name: 'lesson.course.title', type: 'string', description: 'Название курса' },
      { name: 'progress', type: 'object', description: 'Прогресс обучения' },
      { name: 'progress.completion_time', type: 'number', description: 'Время прохождения (мин)' },
      { name: 'progress.score', type: 'number', description: 'Оценка' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        email: 'user@example.com'
      },
      lesson: {
        id: 'lesson_123',
        title: 'Введение в маркетинг',
        course: {
          id: 'course_456',
          title: 'Полный курс маркетинга'
        }
      },
      progress: {
        completion_time: 45,
        score: 85
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'lesson/started',
    type: 'getcourse',
    description: 'Урок начат',
    urlPath: 'event://getcourse/lesson/started',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'lesson', type: 'object', description: 'Объект урока', required: true },
      { name: 'lesson.id', type: 'string', description: 'ID урока', required: true },
      { name: 'lesson.title', type: 'string', description: 'Название урока' },
      { name: 'lesson.course', type: 'object', description: 'Курс урока' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      lesson: {
        id: 'lesson_123',
        title: 'Введение в маркетинг',
        course: {
          id: 'course_456',
          title: 'Полный курс маркетинга'
        }
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'training/completed',
    type: 'getcourse',
    description: 'Тренинг завершен',
    urlPath: 'event://getcourse/training/completed',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'training', type: 'object', description: 'Объект тренинга', required: true },
      { name: 'training.id', type: 'string', description: 'ID тренинга', required: true },
      { name: 'training.title', type: 'string', description: 'Название тренинга' },
      { name: 'training.duration', type: 'number', description: 'Длительность (часов)' },
      { name: 'completion_date', type: 'datetime', description: 'Дата завершения' },
      { name: 'certificate_issued', type: 'boolean', description: 'Выдан сертификат' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      training: {
        id: 'training_789',
        title: 'Маркетинговый тренинг',
        duration: 40
      },
      completion_date: '2025-01-01T12:00:00Z',
      certificate_issued: true,
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'training/started',
    type: 'getcourse',
    description: 'Тренинг начат',
    urlPath: 'event://getcourse/training/started',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'training', type: 'object', description: 'Объект тренинга', required: true },
      { name: 'training.id', type: 'string', description: 'ID тренинга', required: true },
      { name: 'training.title', type: 'string', description: 'Название тренинга' },
      { name: 'training.start_date', type: 'datetime', description: 'Дата начала' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      training: {
        id: 'training_789',
        title: 'Маркетинговый тренинг',
        start_date: '2025-01-01T12:00:00Z'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  
  // События заданий и тестов
  {
    name: 'task/completed',
    type: 'getcourse',
    description: 'Задание выполнено',
    urlPath: 'event://getcourse/task/completed',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'task', type: 'object', description: 'Объект задания', required: true },
      { name: 'task.id', type: 'string', description: 'ID задания', required: true },
      { name: 'task.title', type: 'string', description: 'Название задания' },
      { name: 'task.type', type: 'string', description: 'Тип задания' },
      { name: 'task.lesson', type: 'object', description: 'Урок задания' },
      { name: 'score', type: 'number', description: 'Оценка' },
      { name: 'completion_time', type: 'number', description: 'Время выполнения (мин)' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      task: {
        id: 'task_111',
        title: 'Создание маркетингового плана',
        type: 'project',
        lesson: {
          id: 'lesson_123',
          title: 'Планирование маркетинга'
        }
      },
      score: 92,
      completion_time: 120,
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'test/passed',
    type: 'getcourse',
    description: 'Тест пройден',
    urlPath: 'event://getcourse/test/passed',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'test', type: 'object', description: 'Объект теста', required: true },
      { name: 'test.id', type: 'string', description: 'ID теста', required: true },
      { name: 'test.title', type: 'string', description: 'Название теста' },
      { name: 'test.questions_count', type: 'number', description: 'Количество вопросов' },
      { name: 'score', type: 'number', description: 'Набранный балл', required: true },
      { name: 'max_score', type: 'number', description: 'Максимальный балл' },
      { name: 'percentage', type: 'number', description: 'Процент правильных ответов' },
      { name: 'passed_at', type: 'datetime', description: 'Дата прохождения' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      test: {
        id: 'test_222',
        title: 'Тест по маркетингу',
        questions_count: 20
      },
      score: 85,
      max_score: 100,
      percentage: 85,
      passed_at: '2025-01-01T12:00:00Z',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'test/failed',
    type: 'getcourse',
    description: 'Тест не пройден',
    urlPath: 'event://getcourse/test/failed',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'test', type: 'object', description: 'Объект теста', required: true },
      { name: 'test.id', type: 'string', description: 'ID теста', required: true },
      { name: 'test.title', type: 'string', description: 'Название теста' },
      { name: 'score', type: 'number', description: 'Набранный балл', required: true },
      { name: 'max_score', type: 'number', description: 'Максимальный балл' },
      { name: 'percentage', type: 'number', description: 'Процент правильных ответов' },
      { name: 'passed_at', type: 'datetime', description: 'Дата прохождения' },
      { name: 'failed_at', type: 'datetime', description: 'Время провала' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      test: {
        id: 'test_222',
        title: 'Тест по маркетингу'
      },
      score: 45,
      max_score: 100,
      percentage: 45,
      passed_at: '2025-01-01T12:00:00Z',
      failed_at: '2025-01-01T12:00:00Z',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  
  // События вебинаров
  {
    name: 'webinar/registered',
    type: 'getcourse',
    description: 'Регистрация на вебинар',
    urlPath: 'event://getcourse/webinar/registered',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'webinar', type: 'object', description: 'Объект вебинара', required: true },
      { name: 'webinar.id', type: 'string', description: 'ID вебинара', required: true },
      { name: 'webinar.title', type: 'string', description: 'Название вебинара' },
      { name: 'webinar.scheduled_at', type: 'datetime', description: 'Запланированное время' },
      { name: 'webinar.duration', type: 'number', description: 'Длительность (мин)' },
      { name: 'registration_date', type: 'datetime', description: 'Дата регистрации' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890',
        email: 'user@example.com'
      },
      webinar: {
        id: 'webinar_333',
        title: 'Вебинар по SMM',
        scheduled_at: '2025-01-15T18:00:00Z',
        duration: 90
      },
      registration_date: '2025-01-01T12:00:00Z',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'webinar/attended',
    type: 'getcourse',
    description: 'Присутствие на вебинаре',
    urlPath: 'event://getcourse/webinar/attended',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'webinar', type: 'object', description: 'Объект вебинара', required: true },
      { name: 'webinar.id', type: 'string', description: 'ID вебинара', required: true },
      { name: 'webinar.title', type: 'string', description: 'Название вебинара' },
      { name: 'attendance_time', type: 'number', description: 'Время присутствия (мин)' },
      { name: 'joined_at', type: 'datetime', description: 'Время присоединения' },
      { name: 'left_at', type: 'datetime', description: 'Время ухода' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      webinar: {
        id: 'webinar_333',
        title: 'Вебинар по SMM'
      },
      attendance_time: 85,
      joined_at: '2025-01-15T18:00:00Z',
      left_at: '2025-01-15T19:05:00Z',
      timestamp: '2025-01-15T19:05:00Z'
    }
  },
  
  // События сертификатов
  {
    name: 'certificate/issued',
    type: 'getcourse',
    description: 'Выдача сертификата',
    urlPath: 'event://getcourse/certificate/issued',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'certificate', type: 'object', description: 'Объект сертификата', required: true },
      { name: 'certificate.id', type: 'string', description: 'ID сертификата', required: true },
      { name: 'certificate.title', type: 'string', description: 'Название сертификата' },
      { name: 'certificate.course', type: 'object', description: 'Курс сертификата' },
      { name: 'certificate.course.id', type: 'string', description: 'ID курса' },
      { name: 'certificate.course.title', type: 'string', description: 'Название курса' },
      { name: 'certificate.issued_at', type: 'datetime', description: 'Дата выдачи' },
      { name: 'certificate.url', type: 'string', description: 'URL сертификата' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      certificate: {
        id: 'cert_444',
        title: 'Сертификат по маркетингу',
        course: {
          id: 'course_456',
          title: 'Полный курс маркетинга'
        },
        issued_at: '2025-01-01T12:00:00Z',
        url: 'https://example.com/certificate/cert_444'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  
  // События подписок
  {
    name: 'subscription/created',
    type: 'getcourse',
    description: 'Создание подписки',
    urlPath: 'event://getcourse/subscription/created',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'subscription', type: 'object', description: 'Объект подписки', required: true },
      { name: 'subscription.id', type: 'string', description: 'ID подписки', required: true },
      { name: 'subscription.plan', type: 'object', description: 'План подписки' },
      { name: 'subscription.plan.id', type: 'string', description: 'ID плана' },
      { name: 'subscription.plan.name', type: 'string', description: 'Название плана' },
      { name: 'subscription.amount', type: 'number', description: 'Сумма подписки' },
      { name: 'subscription.currency', type: 'string', description: 'Валюта' },
      { name: 'subscription.billing_period', type: 'string', description: 'Период billing' },
      { name: 'subscription.start_date', type: 'datetime', description: 'Дата начала' },
      { name: 'subscription.next_billing_date', type: 'datetime', description: 'Следующая оплата' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      subscription: {
        id: 'sub_555',
        plan: {
          id: 'plan_666',
          name: 'Premium'
        },
        amount: 2990,
        currency: 'RUB',
        billing_period: 'monthly',
        start_date: '2025-01-01T12:00:00Z',
        next_billing_date: '2025-02-01T12:00:00Z'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'subscription/cancelled',
    type: 'getcourse',
    description: 'Отмена подписки',
    urlPath: 'event://getcourse/subscription/cancelled',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'subscription', type: 'object', description: 'Объект подписки', required: true },
      { name: 'subscription.id', type: 'string', description: 'ID подписки', required: true },
      { name: 'subscription.plan', type: 'object', description: 'План подписки' },
      { name: 'cancellation_reason', type: 'string', description: 'Причина отмены' },
      { name: 'cancelled_at', type: 'datetime', description: 'Дата отмены' },
      { name: 'end_date', type: 'datetime', description: 'Дата окончания' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      subscription: {
        id: 'sub_555',
        plan: {
          id: 'plan_666',
          name: 'Premium'
        }
      },
      cancellation_reason: 'По запросу клиента',
      cancelled_at: '2025-01-15T12:00:00Z',
      end_date: '2025-02-01T12:00:00Z',
      timestamp: '2025-01-15T12:00:00Z'
    }
  },
  {
    name: 'subscription/payment',
    type: 'getcourse',
    description: 'Оплата подписки',
    urlPath: 'event://getcourse/subscription/payment',
    fields: [
      { name: 'user', type: 'object', description: 'Объект пользователя', required: true },
      { name: 'user.id', type: 'string', description: 'ID пользователя', required: true },
      { name: 'subscription', type: 'object', description: 'Объект подписки', required: true },
      { name: 'subscription.id', type: 'string', description: 'ID подписки', required: true },
      { name: 'payment', type: 'object', description: 'Информация о платеже', required: true },
      { name: 'payment.amount', type: 'number', description: 'Сумма платежа' },
      { name: 'payment.currency', type: 'string', description: 'Валюта' },
      { name: 'payment.method', type: 'string', description: 'Способ оплаты' },
      { name: 'payment.status', type: 'string', description: 'Статус платежа' },
      { name: 'payment.paid_at', type: 'datetime', description: 'Дата оплаты' },
      { name: 'next_billing_date', type: 'datetime', description: 'Следующая оплата' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      user: {
        id: '67890'
      },
      subscription: {
        id: 'sub_555'
      },
      payment: {
        amount: 2990,
        currency: 'RUB',
        method: 'card',
        status: 'completed',
        paid_at: '2025-01-01T12:00:00Z'
      },
      next_billing_date: '2025-02-01T12:00:00Z',
      timestamp: '2025-01-01T12:00:00Z'
    }
  }
]

export const TRAFFIC_EVENTS: EventDefinition[] = [
  {
    name: 'pageview',
    type: 'traffic',
    description: 'Просмотр страницы',
    fields: [
      { name: 'url', type: 'string', description: 'URL просмотренной страницы', required: true },
      { name: 'title', type: 'string', description: 'Заголовок страницы' },
      { name: 'referrer', type: 'string', description: 'Источник перехода' },
      { name: 'userAgent', type: 'string', description: 'User agent браузера' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      url: 'https://example.com/page',
      title: 'Страница продукта',
      referrer: 'https://google.com',
      userAgent: 'Mozilla/5.0...',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'registration',
    type: 'traffic',
    description: 'Регистрация',
    fields: [
      { name: 'userId', type: 'string', description: 'ID пользователя', required: true },
      { name: 'email', type: 'string', description: 'Email пользователя' },
      { name: 'name', type: 'string', description: 'Имя пользователя' },
      { name: 'phone', type: 'string', description: 'Телефон пользователя' },
      { name: 'source', type: 'string', description: 'Источник регистрации' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      userId: 'user_123',
      email: 'user@example.com',
      name: 'John Doe',
      phone: '+1234567890',
      source: 'google_ads',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'form_submit',
    type: 'traffic',
    description: 'Отправка формы',
    fields: [
      { name: 'formId', type: 'string', description: 'ID формы', required: true },
      { name: 'formName', type: 'string', description: 'Название формы' },
      { name: 'fields', type: 'object', description: 'Поля формы', required: true },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      formId: 'contact_form',
      formName: 'Форма обратной связи',
      fields: {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'button_click',
    type: 'traffic',
    description: 'Клик по кнопке',
    fields: [
      { name: 'buttonId', type: 'string', description: 'ID кнопки', required: true },
      { name: 'buttonText', type: 'string', description: 'Текст кнопки' },
      { name: 'pageUrl', type: 'string', description: 'URL страницы с кнопкой' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      buttonId: 'submit_btn',
      buttonText: 'Отправить',
      pageUrl: 'https://example.com/contact',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'link_click',
    type: 'traffic',
    description: 'Клик по ссылке',
    fields: [
      { name: 'linkUrl', type: 'string', description: 'URL ссылки', required: true },
      { name: 'linkText', type: 'string', description: 'Текст ссылки' },
      { name: 'pageUrl', type: 'string', description: 'URL страницы со ссылкой' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      linkUrl: 'https://example.com/product',
      linkText: 'Продукт',
      pageUrl: 'https://example.com/catalog',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'video_play',
    type: 'traffic',
    description: 'Воспроизведение видео',
    fields: [
      { name: 'videoId', type: 'string', description: 'ID видео', required: true },
      { name: 'videoTitle', type: 'string', description: 'Название видео' },
      { name: 'duration', type: 'number', description: 'Длительность видео (сек)' },
      { name: 'pageUrl', type: 'string', description: 'URL страницы с видео' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      videoId: 'video_123',
      videoTitle: 'Обучение продукту',
      duration: 300,
      pageUrl: 'https://example.com/video',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'video_pause',
    type: 'traffic',
    description: 'Пауза видео',
    fields: [
      { name: 'videoId', type: 'string', description: 'ID видео', required: true },
      { name: 'currentTime', type: 'number', description: 'Текущее время (сек)' },
      { name: 'pageUrl', type: 'string', description: 'URL страницы с видео' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      videoId: 'video_123',
      currentTime: 150,
      pageUrl: 'https://example.com/video',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'video_complete',
    type: 'traffic',
    description: 'Просмотр видео до конца',
    fields: [
      { name: 'videoId', type: 'string', description: 'ID видео', required: true },
      { name: 'totalTime', type: 'number', description: 'Общее время просмотра (сек)' },
      { name: 'pageUrl', type: 'string', description: 'URL страницы с видео' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      videoId: 'video_123',
      totalTime: 300,
      pageUrl: 'https://example.com/video',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'scroll',
    type: 'traffic',
    description: 'Прокрутка страницы',
    fields: [
      { name: 'scrollDepth', type: 'number', description: 'Глубина прокрутки (%)', required: true },
      { name: 'pageUrl', type: 'string', description: 'URL страницы' },
      { name: 'pageHeight', type: 'number', description: 'Высота страницы (px)' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      scrollDepth: 75,
      pageUrl: 'https://example.com/article',
      pageHeight: 2000,
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'download',
    type: 'traffic',
    description: 'Скачивание файла',
    fields: [
      { name: 'fileUrl', type: 'string', description: 'URL файла', required: true },
      { name: 'fileName', type: 'string', description: 'Имя файла' },
      { name: 'fileType', type: 'string', description: 'Тип файла' },
      { name: 'fileSize', type: 'number', description: 'Размер файла (bytes)' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      fileUrl: 'https://example.com/files/guide.pdf',
      fileName: 'guide.pdf',
      fileType: 'application/pdf',
      fileSize: 1024000,
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'search',
    type: 'traffic',
    description: 'Поиск',
    fields: [
      { name: 'query', type: 'string', description: 'Поисковый запрос', required: true },
      { name: 'resultsCount', type: 'number', description: 'Количество результатов' },
      { name: 'pageUrl', type: 'string', description: 'URL страницы поиска' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      query: 'курс маркетинга',
      resultsCount: 15,
      pageUrl: 'https://example.com/search',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'add_to_cart',
    type: 'traffic',
    description: 'Добавление в корзину',
    fields: [
      { name: 'productId', type: 'string', description: 'ID продукта', required: true },
      { name: 'productName', type: 'string', description: 'Название продукта' },
      { name: 'price', type: 'number', description: 'Цена' },
      { name: 'quantity', type: 'number', description: 'Количество' },
      { name: 'category', type: 'string', description: 'Категория' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      productId: 'product_123',
      productName: 'Курс по маркетингу',
      price: 9990,
      quantity: 1,
      category: 'Маркетинг',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'remove_from_cart',
    type: 'traffic',
    description: 'Удаление из корзины',
    fields: [
      { name: 'productId', type: 'string', description: 'ID продукта', required: true },
      { name: 'productName', type: 'string', description: 'Название продукта' },
      { name: 'price', type: 'number', description: 'Цена' },
      { name: 'quantity', type: 'number', description: 'Количество' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      productId: 'product_123',
      productName: 'Курс по маркетингу',
      price: 9990,
      quantity: 1,
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'checkout',
    type: 'traffic',
    description: 'Оформление заказа',
    fields: [
      { name: 'orderId', type: 'string', description: 'ID заказа', required: true },
      { name: 'totalAmount', type: 'number', description: 'Общая сумма' },
      { name: 'currency', type: 'string', description: 'Валюта' },
      { name: 'items', type: 'array', description: 'Товары в заказе' },
      { name: 'customerInfo', type: 'object', description: 'Информация о покупателе' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      orderId: 'order_123',
      totalAmount: 19980,
      currency: 'RUB',
      items: [
        {
          productId: 'product_123',
          name: 'Курс по маркетингу',
          price: 9990,
          quantity: 2
        }
      ],
      customerInfo: {
        email: 'customer@example.com',
        name: 'John Doe'
      },
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'purchase',
    type: 'traffic',
    description: 'Покупка',
    fields: [
      { name: 'orderId', type: 'string', description: 'ID заказа', required: true },
      { name: 'transactionId', type: 'string', description: 'ID транзакции' },
      { name: 'amount', type: 'number', description: 'Сумма покупки', required: true },
      { name: 'currency', type: 'string', description: 'Валюта' },
      { name: 'paymentMethod', type: 'string', description: 'Способ оплаты' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      orderId: 'order_123',
      transactionId: 'tx_456',
      amount: 19980,
      currency: 'RUB',
      paymentMethod: 'card',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'login',
    type: 'traffic',
    description: 'Вход в аккаунт',
    fields: [
      { name: 'userId', type: 'string', description: 'ID пользователя', required: true },
      { name: 'method', type: 'string', description: 'Способ входа' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      userId: 'user_123',
      method: 'email',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'logout',
    type: 'traffic',
    description: 'Выход из аккаунта',
    fields: [
      { name: 'userId', type: 'string', description: 'ID пользователя', required: true },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      userId: 'user_123',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'share',
    type: 'traffic',
    description: 'Поделиться контентом',
    fields: [
      { name: 'contentUrl', type: 'string', description: 'URL контента', required: true },
      { name: 'platform', type: 'string', description: 'Платформа/sharing' },
      { name: 'contentType', type: 'string', description: 'Тип контента' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      contentUrl: 'https://example.com/article/123',
      platform: 'facebook',
      contentType: 'article',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'comment',
    type: 'traffic',
    description: 'Комментарий',
    fields: [
      { name: 'commentId', type: 'string', description: 'ID комментария', required: true },
      { name: 'content', type: 'string', description: 'Текст комментария' },
      { name: 'authorId', type: 'string', description: 'ID автора' },
      { name: 'targetType', type: 'string', description: 'Тип объекта комментирования' },
      { name: 'targetId', type: 'string', description: 'ID объекта комментирования' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      commentId: 'comment_123',
      content: 'Отличная статья!',
      authorId: 'user_456',
      targetType: 'article',
      targetId: 'article_789',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'like',
    type: 'traffic',
    description: 'Лайк',
    fields: [
      { name: 'targetType', type: 'string', description: 'Тип объекта', required: true },
      { name: 'targetId', type: 'string', description: 'ID объекта', required: true },
      { name: 'userId', type: 'string', description: 'ID пользователя' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      targetType: 'article',
      targetId: 'article_789',
      userId: 'user_456',
      timestamp: '2025-01-01T12:00:00Z'
    }
  },
  {
    name: 'custom_action',
    type: 'traffic',
    description: 'Пользовательское действие',
    fields: [
      { name: 'actionName', type: 'string', description: 'Название действия', required: true },
      { name: 'properties', type: 'object', description: 'Свойства действия' },
      { name: 'category', type: 'string', description: 'Категория действия' },
      { name: 'timestamp', type: 'datetime', description: 'Время события', required: true }
    ],
    example: {
      actionName: 'newsletter_signup',
      properties: {
        source: 'popup',
        position: 'bottom_right'
      },
      category: 'engagement',
      timestamp: '2025-01-01T12:00:00Z'
    }
  }
]

export function getAllEvents(): EventDefinition[] {
  return [...GETCOURSE_EVENTS, ...TRAFFIC_EVENTS]
}