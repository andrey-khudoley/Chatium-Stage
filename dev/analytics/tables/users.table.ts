import { Heap } from '@app/heap'

export const AnalyticsUsersTable = Heap.Table(
  'analytics_users',
  {
    email: Heap.String({ 
      customMeta: { title: 'Email' },
      searchable: { langs: ['ru', 'en'], embeddings: false }
    }),
    firstName: Heap.Optional(
      Heap.String({ 
        customMeta: { title: 'Имя' },
        searchable: { langs: ['ru'], embeddings: false }
      })
    ),
    lastName: Heap.Optional(
      Heap.String({ 
        customMeta: { title: 'Фамилия' },
        searchable: { langs: ['ru'], embeddings: false }
      })
    ),
    uid: Heap.Optional(
      Heap.String({ 
        customMeta: { title: 'UID сессии' }
      })
    ),
    phone: Heap.Optional(
      Heap.String({ 
        customMeta: { title: 'Телефон' }
      })
    ),
    registrationDate: Heap.DateTime({ 
      customMeta: { title: 'Дата регистрации' }
    }),
    lastEventDate: Heap.Optional(
      Heap.DateTime({ 
        customMeta: { title: 'Дата последнего события' }
      })
    ),
    eventsCount: Heap.Number({ 
      customMeta: { title: 'Количество событий' },
      defaultValue: 1
    })
  },
  { 
    customMeta: { 
      title: 'Пользователи аналитики',
      description: 'Таблица для хранения информации о зарегистрированных пользователях из событий'
    }
  }
)

export default AnalyticsUsersTable

export type AnalyticsUsersTableRow = typeof AnalyticsUsersTable.T
export type AnalyticsUsersTableRowJson = typeof AnalyticsUsersTable.JsonT

