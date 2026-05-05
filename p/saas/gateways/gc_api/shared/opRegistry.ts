// @shared
/** Рестр op v0 → HTTP new API (path/method) или Legacy path/action. Источник: gc-unified-op-registry-v0 + OpenAPI /pl/postback/redoc/schema */

export type OpCircuit = 'new' | 'legacy'

export interface OpDefinition {
  op: string
  circuit: OpCircuit
  description: string
  gcMethod?: 'GET' | 'POST'
  gcPath?: string
  /** Полный путь после домена школы, напр. /pl/api/users */
  legacyPath?: string
  legacyAction?: string
  deprecated?: boolean
}

export const OP_REGISTRY: readonly OpDefinition[] = [
  { op: 'setUri', circuit: 'new', description: 'Установить URI для приёма событий (вебхуки)', gcMethod: 'POST', gcPath: '/set-uri' },
  { op: 'getAllGroups', circuit: 'new', description: 'Все группы пользователей', gcMethod: 'GET', gcPath: '/common/get-groups' },
  {
    op: 'getAllPersonalManagers',
    circuit: 'new',
    description: 'Все персональные менеджеры',
    gcMethod: 'GET',
    gcPath: '/common/get-personal-managers'
  },
  { op: 'getTrainings', circuit: 'new', description: 'Все тренинги', gcMethod: 'GET', gcPath: '/common/get-trainings' },
  { op: 'getDealFields', circuit: 'new', description: 'Поля заказа по ID', gcMethod: 'GET', gcPath: '/deal/get-fields' },
  { op: 'getDealCustomFields', circuit: 'new', description: 'Кастомные поля заказа', gcMethod: 'GET', gcPath: '/deal/get-custom-fields' },
  { op: 'getDealComments', circuit: 'new', description: 'Комментарии к заказу', gcMethod: 'GET', gcPath: '/deal/get-comments' },
  { op: 'getDealCalls', circuit: 'new', description: 'Звонки по заказу', gcMethod: 'GET', gcPath: '/deal/get-calls' },
  { op: 'getDealCancelReasons', circuit: 'new', description: 'Причины отмены', gcMethod: 'GET', gcPath: '/deal/get-cancel-reasons' },
  { op: 'getDealsTags', circuit: 'new', description: 'Заказы с тегами', gcMethod: 'GET', gcPath: '/deal/get-deals-tags' },
  { op: 'addCommentToDeal', circuit: 'new', description: 'Комментарий к заказу', gcMethod: 'POST', gcPath: '/deal/add-comment' },
  { op: 'addDealPositions', circuit: 'new', description: 'Добавить позиции в заказ', gcMethod: 'POST', gcPath: '/deal/add-positions' },
  { op: 'removeDealPositions', circuit: 'new', description: 'Удалить позиции из заказа', gcMethod: 'POST', gcPath: '/deal/remove-positions' },
  { op: 'updateDealFields', circuit: 'new', description: 'Обновить поля заказа', gcMethod: 'POST', gcPath: '/deal/update-fields' },
  { op: 'getDialogHistory', circuit: 'new', description: 'История диалога', gcMethod: 'GET', gcPath: '/dialog/get-history' },
  { op: 'addCommentToDialog', circuit: 'new', description: 'Комментарий в диалог', gcMethod: 'POST', gcPath: '/dialog/add-comment' },
  { op: 'changeDepartment', circuit: 'new', description: 'Сменить отдел диалога', gcMethod: 'POST', gcPath: '/dialog/change-department' },
  { op: 'closeDialog', circuit: 'new', description: 'Закрыть диалог', gcMethod: 'POST', gcPath: '/dialog/close' },
  { op: 'getLessonAnswers', circuit: 'new', description: 'Ответы на урок', gcMethod: 'GET', gcPath: '/lesson/get-answers' },
  {
    op: 'addCommentToLessonAnswer',
    circuit: 'new',
    description: 'Комментарий к ответу на урок',
    gcMethod: 'POST',
    gcPath: '/lesson/add-comment-to-lesson-answer'
  },
  { op: 'changeStatusAnswers', circuit: 'new', description: 'Изменить статус ответа', gcMethod: 'POST', gcPath: '/lesson/change-status-answers' },
  { op: 'addNote', circuit: 'new', description: 'Заметка к диалогу', gcMethod: 'POST', gcPath: '/note/add' },
  { op: 'getOffers', circuit: 'new', description: 'Все предложения', gcMethod: 'GET', gcPath: '/offer/get-offers' },
  { op: 'getOfferById', circuit: 'new', description: 'Предложение по ID', gcMethod: 'GET', gcPath: '/offer/get-offer-by-id' },
  { op: 'getOffersTags', circuit: 'new', description: 'Предложения с тегами', gcMethod: 'GET', gcPath: '/offer/get-offers-tags' },
  { op: 'getUserFields', circuit: 'new', description: 'Поля пользователя', gcMethod: 'GET', gcPath: '/user/get-fields' },
  { op: 'getUserCustomFields', circuit: 'new', description: 'Кастомные поля пользователя', gcMethod: 'GET', gcPath: '/user/get-custom-fields' },
  { op: 'getUserDeals', circuit: 'new', description: 'Заказы пользователя', gcMethod: 'GET', gcPath: '/user/get-deals' },
  { op: 'getUserDiplomas', circuit: 'new', description: 'Дипломы', gcMethod: 'GET', gcPath: '/user/get-diplomas' },
  { op: 'getUserGroups', circuit: 'new', description: 'Группы пользователя', gcMethod: 'GET', gcPath: '/user/get-groups' },
  { op: 'getUserBalance', circuit: 'new', description: 'Баланс', gcMethod: 'GET', gcPath: '/user/get-balance' },
  { op: 'getUserPurchases', circuit: 'new', description: 'Покупки', gcMethod: 'GET', gcPath: '/user/get-purchases' },
  { op: 'getUserTrainings', circuit: 'new', description: 'Тренинги пользователя', gcMethod: 'GET', gcPath: '/user/get-trainings' },
  { op: 'getUserSchedule', circuit: 'new', description: 'Расписание', gcMethod: 'GET', gcPath: '/user/get-schedule' },
  { op: 'getUserGoalRecords', circuit: 'new', description: 'Записи целей', gcMethod: 'GET', gcPath: '/user/get-goal-records' },
  { op: 'getUserAnswers', circuit: 'new', description: 'Ответы', gcMethod: 'GET', gcPath: '/user/get-answers' },
  { op: 'getUserLessonAnswers', circuit: 'new', description: 'Ответы на уроки', gcMethod: 'GET', gcPath: '/user/get-lesson-answers' },
  {
    op: 'getUserByTelegramChatId',
    circuit: 'new',
    description: 'Пользователь по Telegram chat id',
    gcMethod: 'GET',
    gcPath: '/user/get-user-by-telegram-chat-id'
  },
  { op: 'addUserBalance', circuit: 'new', description: 'Начислить баланс', gcMethod: 'POST', gcPath: '/user/add-balance' },
  { op: 'addUserGroups', circuit: 'new', description: 'Добавить в группы', gcMethod: 'POST', gcPath: '/user/add-groups' },
  { op: 'removeUserGroups', circuit: 'new', description: 'Удалить из групп', gcMethod: 'POST', gcPath: '/user/remove-groups' },
  { op: 'setUserGroups', circuit: 'new', description: 'Установить состав групп', gcMethod: 'POST', gcPath: '/user/set-groups' },
  { op: 'setPersonalManager', circuit: 'new', description: 'Назначить персонального менеджера', gcMethod: 'POST', gcPath: '/user/set-personal-manager' },
  { op: 'updateUserFields', circuit: 'new', description: 'Обновить поля пользователя', gcMethod: 'POST', gcPath: '/user/update-fields' },
  { op: 'updateUserCustomFields', circuit: 'new', description: 'Обновить кастомные поля', gcMethod: 'POST', gcPath: '/user/update-custom-fields' },
  { op: 'createDiploma', circuit: 'new', description: 'Создать диплом', gcMethod: 'POST', gcPath: '/user/create-diploma' },
  { op: 'getAllWebinars', circuit: 'new', description: 'Все вебинары', gcMethod: 'GET', gcPath: '/webinar/get-all-webinars' },
  { op: 'getWebinarsByIds', circuit: 'new', description: 'Вебинары по списку ID', gcMethod: 'POST', gcPath: '/webinar/get-webinars-by-ids' },
  { op: 'addCommentToWebinar', circuit: 'new', description: 'Комментарий в чат вебинара', gcMethod: 'POST', gcPath: '/webinar/add-comment' },
  { op: 'moderateWebinarComment', circuit: 'new', description: 'Модерация сообщения в чате', gcMethod: 'POST', gcPath: '/webinar/moderation-comment' },
  { op: 'moderateWebinarUser', circuit: 'new', description: 'Модерация пользователя вебинара', gcMethod: 'POST', gcPath: '/webinar/moderation-user' },
  { op: 'addUser', circuit: 'legacy', description: 'Создать/обновить пользователя (импорт)', legacyPath: '/pl/api/users', legacyAction: 'add' },
  { op: 'createDeal', circuit: 'legacy', description: 'Создать сделку (импорт)', legacyPath: '/pl/api/deals', legacyAction: 'add' },
  {
    op: 'exportUsers',
    circuit: 'legacy',
    description: 'Экспорт пользователей',
    legacyPath: '/pl/api/account/users',
    legacyAction: 'export'
  },
  {
    op: 'exportGroupUsers',
    circuit: 'legacy',
    description: 'Экспорт пользователей группы',
    legacyPath: '/pl/api/account/users',
    legacyAction: 'export_group'
  },
  {
    op: 'exportDeals',
    circuit: 'legacy',
    description: 'Экспорт сделок',
    legacyPath: '/pl/api/account/deals',
    legacyAction: 'export'
  },
  {
    op: 'exportPayments',
    circuit: 'legacy',
    description: 'Экспорт платежей',
    legacyPath: '/pl/api/account/payments',
    legacyAction: 'export'
  },
  {
    op: 'getCustomFields',
    circuit: 'legacy',
    description: 'Доп. поля аккаунта',
    legacyPath: '/pl/api/account',
    legacyAction: 'get_custom_fields'
  },
  {
    op: 'getExportResult',
    circuit: 'legacy',
    description: 'Результат экспорта по ID',
    legacyPath: '/pl/api/account',
    legacyAction: 'get_export_result'
  }
] as const

const byOp = new Map<string, OpDefinition>()
for (const d of OP_REGISTRY) {
  byOp.set(d.op, d)
}

export function getOpDefinition(op: string): OpDefinition | undefined {
  return byOp.get(op)
}

export function listOpIds(): string[] {
  return OP_REGISTRY.map((r) => r.op)
}
