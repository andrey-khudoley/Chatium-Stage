/**
 * Каталог операций gateway (SSOT). manual §3.1, §3.4, §3.5.
 *
 * Рукописный статический каталог — без автогенерации (`*.generated`). Каждая запись содержит:
 *   - `argsValidator` — рантайм-объект `s.object({...})` из `@app/schema` для серверной валидации;
 *   - `argsSchema` — plain JSON-описатель полей для UI-формы (`GET /v1/operations`).
 *
 * Wire-форма `GET /v1/operations` собирается через `toOperationSummaries()`: на клиент уходит
 * только `argsSchema`, `argsValidator` остаётся серверным.
 */

// @ts-ignore  системный модуль Chatium, локальных типов нет
import { s } from '@app/schema'
import type { ZType } from '@app/schema'
import type {
  GcContour,
  HttpMethod,
  OpAvailability,
  ArgsSchemaJson,
  OperationSummary
} from '../../shared/operationsCatalogShared'

/** Версия схемы каталога (manual §3.4). */
export const CATALOG_SCHEMA_VERSION = 1

/** Объекты `additionalProperties: true` — пропускаем неизвестные поля GC (forward-совместимость). */
const passthrough = { additionalProperties: true } as const

/**
 * Любой рантайм-валидатор `args` (`s.object` или `s.any`).
 * Базовый `ZType<any>` принимает любой конкретный `ZObject<{...}>`/`ZAny<...>`
 * (generic-типы `@app/schema` инвариантны, поэтому `ReturnType<typeof s.object>` не подходит)
 * и предоставляет нужный метод `safeParse`.
 */
type AnyArgsValidator = ZType<any>

export type OperationEntry = {
  op: string
  contour: GcContour
  httpMethod: HttpMethod
  pathTemplate: string
  availability: OpAvailability
  legacyImportAction: string | null
  argsValidator: AnyArgsValidator
  argsSchema: ArgsSchemaJson
}

/** Алиас имени для обратной совместимости импортов. */
export type OperationCatalogEntry = OperationEntry

const EMPTY_SCHEMA: ArgsSchemaJson = { fields: [] }

export const operationsCatalog: OperationEntry[] = [
  // ─── Контур new ───────────────────────────────────────────────────────────
  {
    op: 'setUri',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/set-uri',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ uri: s.string(), event_id: s.number(), event_object_id: s.number() }),
    argsSchema: {
      fields: [
        { name: 'uri', type: 'string', required: true },
        { name: 'event_id', type: 'number', required: true },
        { name: 'event_object_id', type: 'number', required: true }
      ]
    }
  },
  {
    op: 'getAllGroups',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/common/get-groups',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getAllPersonalManagers',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/common/get-personal-managers',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getTrainings',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/common/get-trainings',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'addCommentToDeal',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/deal/add-comment',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dealId: s.number(), userId: s.number(), text: s.string() }),
    argsSchema: {
      fields: [
        { name: 'dealId', type: 'number', required: true },
        { name: 'userId', type: 'number', required: true },
        { name: 'text', type: 'string', required: true }
      ]
    }
  },
  {
    op: 'addDealPositions',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/deal/add-positions',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({
      dealId: s.number(),
      positions: s.array(
        s.object({ offerId: s.number().optional(), price: s.number().optional(), quantity: s.number().optional() })
      )
    }),
    argsSchema: {
      fields: [
        { name: 'dealId', type: 'number', required: true },
        { name: 'positions', type: 'array', required: true, items: { name: 'item', type: 'object', required: true } }
      ]
    }
  },
  {
    op: 'getDealCalls',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/deal/get-calls',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dealId: s.number() }),
    argsSchema: { fields: [{ name: 'dealId', type: 'number', required: true }] }
  },
  {
    op: 'getDealCancelReasons',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/deal/get-cancel-reasons',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getDealComments',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/deal/get-comments',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dealId: s.number() }),
    argsSchema: { fields: [{ name: 'dealId', type: 'number', required: true }] }
  },
  {
    op: 'getDealCustomFields',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/deal/get-custom-fields',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dealId: s.number() }),
    argsSchema: { fields: [{ name: 'dealId', type: 'number', required: true }] }
  },
  {
    op: 'getDealsTags',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/deal/get-deals-tags',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ limit: s.number().optional(), offset: s.number().optional() }),
    argsSchema: {
      fields: [
        { name: 'limit', type: 'number', required: false },
        { name: 'offset', type: 'number', required: false }
      ]
    }
  },
  {
    op: 'getDealFields',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/deal/get-fields',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dealId: s.number() }),
    argsSchema: { fields: [{ name: 'dealId', type: 'number', required: true }] }
  },
  {
    op: 'removeDealPositions',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/deal/remove-positions',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dealId: s.number(), positionIds: s.array(s.number()) }),
    argsSchema: {
      fields: [
        { name: 'dealId', type: 'number', required: true },
        { name: 'positionIds', type: 'array', required: true, items: { name: 'item', type: 'number', required: true } }
      ]
    }
  },
  {
    op: 'updateDealFields',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/deal/update-fields',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({
      dealId: s.number(),
      manager_user_id: s.number().optional(),
      status: s.string().optional(),
      cancel_reason_comment: s.number().optional(),
      tags: s.array(s.string()).optional()
    }),
    argsSchema: {
      fields: [
        { name: 'dealId', type: 'number', required: true },
        { name: 'manager_user_id', type: 'number', required: false },
        { name: 'status', type: 'string', required: false },
        { name: 'cancel_reason_comment', type: 'number', required: false },
        { name: 'tags', type: 'array', required: false, items: { name: 'item', type: 'string', required: true } }
      ]
    }
  },
  {
    op: 'addCommentToDialog',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/dialog/add-comment',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({
      dialogId: s.number(),
      commentText: s.string(),
      transport: s.array(s.number()),
      userId: s.number()
    }),
    argsSchema: {
      fields: [
        { name: 'dialogId', type: 'number', required: true },
        { name: 'commentText', type: 'string', required: true },
        { name: 'transport', type: 'array', required: true, items: { name: 'item', type: 'number', required: true } },
        { name: 'userId', type: 'number', required: true }
      ]
    }
  },
  {
    op: 'changeDepartment',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/dialog/change-department',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dialogId: s.number(), newDepartmentId: s.number() }),
    argsSchema: {
      fields: [
        { name: 'dialogId', type: 'number', required: true },
        { name: 'newDepartmentId', type: 'number', required: true }
      ]
    }
  },
  {
    op: 'closeDialog',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/dialog/close',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dialogId: s.number() }),
    argsSchema: { fields: [{ name: 'dialogId', type: 'number', required: true }] }
  },
  {
    op: 'getDialogHistory',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/dialog/get-history',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dialogId: s.number(), limit: s.number().optional() }),
    argsSchema: {
      fields: [
        { name: 'dialogId', type: 'number', required: true },
        { name: 'limit', type: 'number', required: false }
      ]
    }
  },
  {
    op: 'addCommentToLessonAnswer',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/lesson/add-comment-to-lesson-answer',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ lessonAnswerId: s.number(), text: s.string(), userId: s.number() }),
    argsSchema: {
      fields: [
        { name: 'lessonAnswerId', type: 'number', required: true },
        { name: 'text', type: 'string', required: true },
        { name: 'userId', type: 'number', required: true }
      ]
    }
  },
  {
    op: 'changeStatusAnswers',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/lesson/change-status-answers',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ lessonAnswerId: s.number(), status: s.string() }),
    argsSchema: {
      fields: [
        { name: 'lessonAnswerId', type: 'number', required: true },
        { name: 'status', type: 'string', required: true }
      ]
    }
  },
  {
    op: 'getLessonAnswers',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/lesson/get-answers',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ lessonId: s.number() }),
    argsSchema: { fields: [{ name: 'lessonId', type: 'number', required: true }] }
  },
  {
    op: 'addNote',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/note/add',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ dialogId: s.number(), text: s.string() }),
    argsSchema: {
      fields: [
        { name: 'dialogId', type: 'number', required: true },
        { name: 'text', type: 'string', required: true }
      ]
    }
  },
  {
    op: 'getOfferById',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/offer/get-offer-by-id',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ offerId: s.number() }),
    argsSchema: { fields: [{ name: 'offerId', type: 'number', required: true }] }
  },
  {
    op: 'getOffers',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/offer/get-offers',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getOffersTags',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/offer/get-offers-tags',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ limit: s.number().optional(), offset: s.number().optional() }),
    argsSchema: {
      fields: [
        { name: 'limit', type: 'number', required: false },
        { name: 'offset', type: 'number', required: false }
      ]
    }
  },
  {
    op: 'addUserBalance',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/user/add-balance',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ value: s.number(), type: s.number(), comment: s.string() }),
    argsSchema: {
      fields: [
        { name: 'value', type: 'number', required: true },
        { name: 'type', type: 'number', required: true },
        { name: 'comment', type: 'string', required: true }
      ]
    }
  },
  {
    op: 'addUserGroups',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/user/add-groups',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ groups: s.array(s.number()) }),
    argsSchema: {
      fields: [{ name: 'groups', type: 'array', required: true, items: { name: 'item', type: 'number', required: true } }]
    }
  },
  {
    op: 'createDiploma',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/user/create-diploma',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({
      templateId: s.number(),
      number: s.string().optional(),
      trainingName: s.string().optional(),
      userName: s.string().optional(),
      allowDuplicates: s.boolean().optional()
    }),
    argsSchema: {
      fields: [
        { name: 'templateId', type: 'number', required: true },
        { name: 'number', type: 'string', required: false },
        { name: 'trainingName', type: 'string', required: false },
        { name: 'userName', type: 'string', required: false },
        { name: 'allowDuplicates', type: 'boolean', required: false }
      ]
    }
  },
  {
    op: 'getUserAnswers',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-answers',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserBalance',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-balance',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserCustomFields',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-custom-fields',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserDeals',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-deals',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserDiplomas',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-diplomas',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserFields',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-fields',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserGoalRecords',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-goal-records',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserGroups',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-groups',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserLessonAnswers',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-lesson-answers',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserPurchases',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-purchases',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ productId: s.string().optional() }),
    argsSchema: { fields: [{ name: 'productId', type: 'string', required: false }] }
  },
  {
    op: 'getUserSchedule',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-schedule',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserTrainings',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-trainings',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getUserByTelegramChatId',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/user/get-user-by-telegram-chat-id',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ chatId: s.number() }),
    argsSchema: { fields: [{ name: 'chatId', type: 'number', required: true }] }
  },
  {
    op: 'removeUserGroups',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/user/remove-groups',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ groups: s.array(s.number()) }),
    argsSchema: {
      fields: [{ name: 'groups', type: 'array', required: true, items: { name: 'item', type: 'number', required: true } }]
    }
  },
  {
    op: 'setUserGroups',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/user/set-groups',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ groups: s.array(s.number()) }),
    argsSchema: {
      fields: [{ name: 'groups', type: 'array', required: true, items: { name: 'item', type: 'number', required: true } }]
    }
  },
  {
    op: 'setPersonalManager',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/user/set-personal-manager',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ managerId: s.number() }),
    argsSchema: { fields: [{ name: 'managerId', type: 'number', required: true }] }
  },
  {
    op: 'updateUserCustomFields',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/user/update-custom-fields',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ customFields: s.any() }),
    argsSchema: {
      fields: [{ name: 'customFields', type: 'object', required: true, description: 'произвольная структура' }]
    }
  },
  {
    op: 'updateUserFields',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/user/update-fields',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({
      gender: s.string().optional(),
      country: s.string().optional(),
      city: s.string().optional(),
      first_name: s.string().optional(),
      last_name: s.string().optional(),
      birthday: s.string().optional(),
      comment: s.string().optional(),
      phone: s.string().optional()
    }),
    argsSchema: {
      fields: [
        { name: 'gender', type: 'string', required: false },
        { name: 'country', type: 'string', required: false },
        { name: 'city', type: 'string', required: false },
        { name: 'first_name', type: 'string', required: false },
        { name: 'last_name', type: 'string', required: false },
        { name: 'birthday', type: 'string', required: false },
        { name: 'comment', type: 'string', required: false },
        { name: 'phone', type: 'string', required: false }
      ]
    }
  },
  {
    op: 'addCommentToWebinar',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/webinar/add-comment',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({
      moderatorId: s.number(),
      webinarId: s.number(),
      webinarLaunchNumber: s.number().optional(),
      text: s.string(),
      isPrivateReply: s.boolean().optional(),
      replyToUserId: s.number().optional(),
      replyToUserType: s.number().optional()
    }),
    argsSchema: {
      fields: [
        { name: 'moderatorId', type: 'number', required: true },
        { name: 'webinarId', type: 'number', required: true },
        { name: 'webinarLaunchNumber', type: 'number', required: false },
        { name: 'text', type: 'string', required: true },
        { name: 'isPrivateReply', type: 'boolean', required: false },
        { name: 'replyToUserId', type: 'number', required: false },
        { name: 'replyToUserType', type: 'number', required: false }
      ]
    }
  },
  {
    op: 'getAllWebinars',
    contour: 'new',
    httpMethod: 'GET',
    pathTemplate: '/webinar/get-all-webinars',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getWebinarsByIds',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/webinar/get-webinars-by-ids',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ ids: s.array(s.number()) }),
    argsSchema: {
      fields: [{ name: 'ids', type: 'array', required: true, items: { name: 'item', type: 'number', required: true } }]
    }
  },
  {
    op: 'moderateWebinarComment',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/webinar/moderation-comment',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({
      webinarId: s.number(),
      moderatorId: s.number().optional(),
      commentId: s.number(),
      action: s.string()
    }),
    argsSchema: {
      fields: [
        { name: 'webinarId', type: 'number', required: true },
        { name: 'moderatorId', type: 'number', required: false },
        { name: 'commentId', type: 'number', required: true },
        { name: 'action', type: 'string', required: true }
      ]
    }
  },
  {
    op: 'moderateWebinarUser',
    contour: 'new',
    httpMethod: 'POST',
    pathTemplate: '/webinar/moderation-user',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({
      webinarId: s.number(),
      webinarLaunchNumber: s.number().optional(),
      moderatorId: s.number().optional(),
      userId: s.number(),
      userType: s.number(),
      action: s.string()
    }),
    argsSchema: {
      fields: [
        { name: 'webinarId', type: 'number', required: true },
        { name: 'webinarLaunchNumber', type: 'number', required: false },
        { name: 'moderatorId', type: 'number', required: false },
        { name: 'userId', type: 'number', required: true },
        { name: 'userType', type: 'number', required: true },
        { name: 'action', type: 'string', required: true }
      ]
    }
  },
  // ─── Контур legacy ────────────────────────────────────────────────────────
  {
    op: 'addUser',
    contour: 'legacy',
    httpMethod: 'POST',
    pathTemplate: '/users',
    availability: 'enabled',
    legacyImportAction: 'add',
    argsValidator: s.object(
      {
        params: s.object(
          {
            user: s.object(
              {
                email: s.string(),
                phone: s.string().optional(),
                first_name: s.string().optional(),
                last_name: s.string().optional(),
                city: s.string().optional(),
                country: s.string().optional(),
                group_name: s.array(s.string()).optional(),
                addfields: s.any().optional()
              },
              passthrough
            ),
            system: s.any().optional(),
            session: s.any().optional()
          },
          passthrough
        )
      },
      passthrough
    ),
    argsSchema: {
      fields: [
        {
          name: 'params',
          type: 'object',
          required: true,
          description: 'вложенная структура user/system/session, см. docs GetCourse'
        }
      ]
    }
  },
  {
    op: 'createDeal',
    contour: 'legacy',
    httpMethod: 'POST',
    pathTemplate: '/deals',
    availability: 'disabled',
    legacyImportAction: 'add',
    argsValidator: s.object(
      {
        params: s.object(
          {
            user: s.object(
              {
                email: s.string(),
                phone: s.string().optional(),
                first_name: s.string().optional(),
                last_name: s.string().optional()
              },
              passthrough
            ),
            deal: s.object(
              {
                offer_code: s.string().optional(),
                offer_id: s.number().optional(),
                deal_number: s.string().optional(),
                deal_cost: s.number().optional(),
                deal_status: s.string().optional(),
                deal_is_paid: s.string().optional(),
                deal_currency: s.string().optional(),
                funnel_id: s.number().optional(),
                funnel_stage_id: s.number().optional()
              },
              passthrough
            ),
            system: s.any().optional()
          },
          passthrough
        )
      },
      passthrough
    ),
    argsSchema: {
      fields: [
        {
          name: 'params',
          type: 'object',
          required: true,
          description: 'вложенная структура user/deal/system, см. docs GetCourse'
        }
      ]
    }
  },
  {
    op: 'exportUsers',
    contour: 'legacy',
    httpMethod: 'GET',
    pathTemplate: '/account/users',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object(
      {
        'created_at[from]': s.string().optional(),
        'created_at[to]': s.string().optional(),
        status: s.string().optional(),
        email: s.string().optional(),
        idgrouplist: s.string().optional()
      },
      passthrough
    ),
    argsSchema: {
      fields: [
        { name: 'created_at[from]', type: 'string', required: false },
        { name: 'created_at[to]', type: 'string', required: false },
        { name: 'status', type: 'string', required: false },
        { name: 'email', type: 'string', required: false },
        { name: 'idgrouplist', type: 'string', required: false }
      ]
    }
  },
  {
    op: 'exportGroupUsers',
    contour: 'legacy',
    httpMethod: 'GET',
    pathTemplate: '/account/groups/{groupId}/users',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object(
      {
        groupId: s.string(),
        'created_at[from]': s.string().optional(),
        'created_at[to]': s.string().optional(),
        'added_at[from]': s.string().optional(),
        'added_at[to]': s.string().optional(),
        status: s.string().optional()
      },
      passthrough
    ),
    argsSchema: {
      fields: [
        { name: 'groupId', type: 'string', required: true },
        { name: 'created_at[from]', type: 'string', required: false },
        { name: 'created_at[to]', type: 'string', required: false },
        { name: 'added_at[from]', type: 'string', required: false },
        { name: 'added_at[to]', type: 'string', required: false },
        { name: 'status', type: 'string', required: false }
      ]
    }
  },
  {
    op: 'exportDeals',
    contour: 'legacy',
    httpMethod: 'GET',
    pathTemplate: '/account/deals',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object(
      {
        'created_at[from]': s.string().optional(),
        'created_at[to]': s.string().optional(),
        status: s.string().optional(),
        'payed_at[from]': s.string().optional(),
        'payed_at[to]': s.string().optional(),
        user_in_group: s.number().optional(),
        user_id: s.number().optional()
      },
      passthrough
    ),
    argsSchema: {
      fields: [
        { name: 'created_at[from]', type: 'string', required: false },
        { name: 'created_at[to]', type: 'string', required: false },
        { name: 'status', type: 'string', required: false },
        { name: 'payed_at[from]', type: 'string', required: false },
        { name: 'payed_at[to]', type: 'string', required: false },
        { name: 'user_in_group', type: 'number', required: false },
        { name: 'user_id', type: 'number', required: false }
      ]
    }
  },
  {
    op: 'exportPayments',
    contour: 'legacy',
    httpMethod: 'GET',
    pathTemplate: '/account/payments',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object(
      {
        'created_at[from]': s.string().optional(),
        'created_at[to]': s.string().optional(),
        status: s.string().optional(),
        'status_changed_at[from]': s.string().optional(),
        'status_changed_at[to]': s.string().optional()
      },
      passthrough
    ),
    argsSchema: {
      fields: [
        { name: 'created_at[from]', type: 'string', required: false },
        { name: 'created_at[to]', type: 'string', required: false },
        { name: 'status', type: 'string', required: false },
        { name: 'status_changed_at[from]', type: 'string', required: false },
        { name: 'status_changed_at[to]', type: 'string', required: false }
      ]
    }
  },
  {
    op: 'getCustomFields',
    contour: 'legacy',
    httpMethod: 'GET',
    pathTemplate: '/account/fields',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({}, passthrough),
    argsSchema: EMPTY_SCHEMA
  },
  {
    op: 'getExportResult',
    contour: 'legacy',
    httpMethod: 'GET',
    pathTemplate: '/account/exports/{exportId}',
    availability: 'disabled',
    legacyImportAction: null,
    argsValidator: s.object({ exportId: s.string() }, passthrough),
    argsSchema: { fields: [{ name: 'exportId', type: 'string', required: true }] }
  }
]

/** Поиск записи по `op` (manual §3.5: общий источник для роута и каталога). */
export function findOperationCatalogEntry(op: string): OperationEntry | undefined {
  return operationsCatalog.find((e) => e.op === op)
}

/** Алиас `findOperationCatalogEntry` с `null` вместо `undefined` (стиль lifepay). */
export function findOperation(op: string): OperationEntry | null {
  return operationsCatalog.find((e) => e.op === op) ?? null
}

/** Преобразование каталога в wire-форму для клиента (SSR-пропсы, GET /v1/operations). */
export function toOperationSummaries(): OperationSummary[] {
  return operationsCatalog.map((e) => ({
    op: e.op,
    httpMethod: e.httpMethod,
    contour: e.contour,
    availability: e.availability,
    argsSchema: e.argsSchema
  }))
}
