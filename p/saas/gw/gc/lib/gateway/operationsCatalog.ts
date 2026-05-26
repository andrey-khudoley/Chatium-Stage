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
  ArgsFieldSchema,
  ArgsSchemaJson,
  ArgsTreeNode,
  ArgsTreeField,
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
        s.object({
          offerId: s.number().optional(),
          price: s.number().optional(),
          quantity: s.number().optional()
        })
      )
    }),
    argsSchema: {
      fields: [
        { name: 'dealId', type: 'number', required: true },
        {
          name: 'positions',
          type: 'array',
          required: true,
          items: { name: 'item', type: 'object', required: true }
        }
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
        {
          name: 'positionIds',
          type: 'array',
          required: true,
          items: { name: 'item', type: 'number', required: true }
        }
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
        {
          name: 'tags',
          type: 'array',
          required: false,
          items: { name: 'item', type: 'string', required: true }
        }
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
        {
          name: 'transport',
          type: 'array',
          required: true,
          items: { name: 'item', type: 'number', required: true }
        },
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
      fields: [
        {
          name: 'groups',
          type: 'array',
          required: true,
          items: { name: 'item', type: 'number', required: true }
        }
      ]
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
      fields: [
        {
          name: 'groups',
          type: 'array',
          required: true,
          items: { name: 'item', type: 'number', required: true }
        }
      ]
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
      fields: [
        {
          name: 'groups',
          type: 'array',
          required: true,
          items: { name: 'item', type: 'number', required: true }
        }
      ]
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
      fields: [
        {
          name: 'customFields',
          type: 'object',
          required: true,
          description: 'произвольная структура'
        }
      ]
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
      fields: [
        {
          name: 'ids',
          type: 'array',
          required: true,
          items: { name: 'item', type: 'number', required: true }
        }
      ]
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
    availability: 'disabled',
    legacyImportAction: 'add',
    // Назначения полей — по официальной документации GetCourse (getcourse.ru/help/api, /pl/api/users).
    argsValidator: s.object(
      {
        params: s
          .object(
            {
              user: s
                .object(
                  {
                    email: s
                      .string()
                      .describe('Email пользователя — обязателен, ключ идентификации'),
                    phone: s.string().describe('Телефон пользователя').optional(),
                    first_name: s.string().describe('Имя пользователя').optional(),
                    last_name: s.string().describe('Фамилия пользователя').optional(),
                    city: s.string().describe('Город проживания').optional(),
                    country: s.string().describe('Страна').optional(),
                    group_name: s
                      .array(s.string())
                      .describe('Массив названий групп для добавления пользователя')
                      .optional(),
                    addfields: s
                      .any()
                      .describe('Дополнительные поля пользователя (произвольные)')
                      .optional()
                  },
                  passthrough
                )
                .describe('Данные пользователя'),
              system: s
                .any()
                .describe(
                  'Системные параметры импорта: refresh_if_exists, partner_email, user_status и др.'
                )
                .optional(),
              session: s
                .any()
                .describe('Данные сессии/источника (utm-метки, ip и т. п.)')
                .optional()
            },
            passthrough
          )
          .describe('Корневой объект импорта пользователя GetCourse (/pl/api/users)')
      },
      passthrough
    ),
    argsSchema: {
      fields: [
        {
          name: 'params',
          type: 'object',
          required: true,
          description: 'Корневой объект импорта пользователя: user / system / session'
        }
      ]
    }
  },
  {
    op: 'createDeal',
    contour: 'legacy',
    httpMethod: 'POST',
    pathTemplate: '/deals',
    availability: 'enabled',
    legacyImportAction: 'add',
    // Назначения полей — по официальной документации GetCourse (getcourse.ru/help/api, /pl/api/deals).
    argsValidator: s.object(
      {
        params: s
          .object(
            {
              user: s
                .object(
                  {
                    email: s
                      .string()
                      .describe('Email клиента — обязателен, ключ идентификации пользователя'),
                    phone: s.string().describe('Телефон клиента').optional(),
                    first_name: s.string().describe('Имя клиента').optional(),
                    last_name: s.string().describe('Фамилия клиента').optional()
                  },
                  passthrough
                )
                .describe('Данные покупателя (владельца заказа)'),
              deal: s
                .object(
                  {
                    offer_code: s
                      .string()
                      .describe('Символьный код предложения (offer); альтернатива offer_id')
                      .optional(),
                    offer_id: s.number().describe('ID предложения (offer) в GetCourse').optional(),
                    deal_number: s
                      .string()
                      .describe('Номер заказа — для привязки/редактирования существующей сделки')
                      .optional(),
                    deal_cost: s.number().describe('Сумма заказа').optional(),
                    deal_status: s
                      .string()
                      .describe('Статус сделки: new, payed, cancelled, in_work и др.')
                      .optional(),
                    deal_is_paid: s.string().describe('Признак оплаты заказа (да/нет)').optional(),
                    deal_currency: s
                      .string()
                      .describe('Код валюты заказа (RUB, USD, EUR…)')
                      .optional(),
                    funnel_id: s.number().describe('ID воронки (доски продаж)').optional(),
                    funnel_stage_id: s.number().describe('ID этапа воронки').optional()
                  },
                  passthrough
                )
                .describe('Данные заказа/сделки'),
              system: s
                .any()
                .describe(
                  'Системные параметры импорта: refresh_if_exists, multiple_offers, return_payment_link, partner_email и др.'
                )
                .optional()
            },
            passthrough
          )
          .describe('Корневой объект импорта сделки GetCourse (/pl/api/deals)')
      },
      passthrough
    ),
    argsSchema: {
      fields: [
        {
          name: 'params',
          type: 'object',
          required: true,
          description: 'Корневой объект импорта сделки: user / deal / system'
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
        // bracket-ключи GC (created_at[from]/[to]) — невалидные имена Heap.Object,
        // проходят через passthrough; описаны в argsSchema для UI-формы.
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
        // bracket-ключи GC (created_at[from]/[to], added_at[from]/[to]) — невалидные имена
        // Heap.Object, проходят через passthrough; описаны в argsSchema для UI-формы.
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
        // bracket-ключи GC (created_at[from]/[to], payed_at[from]/[to]) — невалидные имена
        // Heap.Object, проходят через passthrough; описаны в argsSchema для UI-формы.
        status: s.string().optional(),
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
        // bracket-ключи GC (created_at[from]/[to], status_changed_at[from]/[to]) — невалидные
        // имена Heap.Object, проходят через passthrough; описаны в argsSchema для UI-формы.
        status: s.string().optional()
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

/**
 * Структурная (JSON-Schema-подобная) проекция рантайм-валидатора `@app/schema`:
 * у каждого `ZType` есть `type` ('object'/'array'/'string'/'number'/'integer'/'boolean'),
 * у `ZObject` — `properties` + `required` + `additionalProperties`, у `ZArray` — `items`.
 * Необязательность определяется отсутствием имени в `required` родителя.
 */
type RawSchema = {
  type?: string
  properties?: Record<string, RawSchema | undefined>
  required?: string[]
  items?: RawSchema
  additionalProperties?: boolean
  description?: string
}

/** Рекурсивно переводит рантайм-валидатор в сериализуемое дерево формата запроса. */
function schemaToArgsNode(schema: RawSchema | undefined): ArgsTreeNode {
  if (!schema || typeof schema !== 'object') return { kind: 'any' }
  if (schema.type === 'object') {
    const required = new Set(schema.required ?? [])
    const props = schema.properties ?? {}
    const fields: ArgsTreeField[] = Object.keys(props).map((name) => ({
      name,
      required: required.has(name),
      description: props[name]?.description,
      node: schemaToArgsNode(props[name])
    }))
    return { kind: 'object', fields, additionalProperties: schema.additionalProperties !== false }
  }
  if (schema.type === 'array') {
    return { kind: 'array', items: schemaToArgsNode(schema.items) }
  }
  if (
    schema.type === 'string' ||
    schema.type === 'number' ||
    schema.type === 'integer' ||
    schema.type === 'boolean'
  ) {
    return { kind: 'scalar', type: schema.type }
  }
  return { kind: 'any' }
}

/**
 * Назначение полей GetCourse по официальной документации (getcourse.ru/help/api): fallback-подписи
 * для полей, у которых нет явного `.describe()` в валидаторе и описания в `argsSchema`. Ключ — имя поля.
 */
const FIELD_DESCRIPTIONS: Record<string, string> = {
  // Идентификаторы сущностей
  dealId: 'ID сделки в GetCourse',
  userId: 'ID пользователя в GetCourse',
  user_id: 'ID пользователя в GetCourse',
  dialogId: 'ID диалога',
  chatId: 'ID чата',
  lessonId: 'ID урока',
  lessonAnswerId: 'ID ответа на задание урока',
  offerId: 'ID предложения (offer)',
  groupId: 'ID группы',
  managerId: 'ID менеджера',
  manager_user_id: 'ID пользователя-менеджера сделки',
  moderatorId: 'ID модератора',
  newDepartmentId: 'ID нового отдела (куда переводится диалог)',
  templateId: 'ID шаблона (например, диплома)',
  productId: 'ID продукта',
  webinarId: 'ID вебинара',
  commentId: 'ID комментария',
  exportId: 'ID задания экспорта (для получения результата)',
  replyToUserId: 'ID пользователя, которому адресован ответ',
  // Списки идентификаторов
  ids: 'Список идентификаторов',
  positionIds: 'Список ID позиций сделки',
  positions: 'Позиции сделки (массив объектов)',
  idgrouplist: 'Список ID групп (через запятую)',
  groups: 'Список групп',
  tags: 'Теги',
  customFields: 'Пользовательские (дополнительные) поля',
  // Контакт/профиль
  email: 'Email пользователя',
  phone: 'Телефон',
  first_name: 'Имя',
  last_name: 'Фамилия',
  userName: 'Имя пользователя',
  city: 'Город',
  country: 'Страна',
  gender: 'Пол',
  birthday: 'Дата рождения',
  // Тексты/комментарии
  text: 'Текст',
  comment: 'Комментарий',
  commentText: 'Текст комментария',
  cancel_reason_comment: 'Комментарий причины отмены сделки',
  // Статусы/типы/действия (значение зависит от операции)
  status: 'Статус (допустимые значения зависят от операции)',
  type: 'Тип (допустимые значения зависят от операции)',
  action: 'Выполняемое действие',
  userType: 'Тип пользователя',
  replyToUserType: 'Тип пользователя, которому адресован ответ',
  value: 'Значение (например, сумма для операции с балансом)',
  number: 'Номер (например, номер диплома)',
  trainingName: 'Название тренинга',
  allowDuplicates: 'Разрешить дубликаты',
  isPrivateReply: 'Приватный ответ',
  user_in_group: 'Фильтр: пользователь состоит в группе',
  transport: 'Канал доставки (transport)',
  uri: 'URI/адрес',
  event_id: 'ID события',
  event_object_id: 'ID объекта события',
  webinarLaunchNumber: 'Номер запуска вебинара',
  // Пагинация
  limit: 'Максимум записей в ответе (постранично)',
  offset: 'Смещение выборки (постранично)',
  // Фильтры по датам (bracket-параметры GetCourse)
  'created_at[from]': 'Фильтр по дате создания: начало периода',
  'created_at[to]': 'Фильтр по дате создания: конец периода',
  'added_at[from]': 'Фильтр по дате добавления: начало периода',
  'added_at[to]': 'Фильтр по дате добавления: конец периода',
  'payed_at[from]': 'Фильтр по дате оплаты: начало периода',
  'payed_at[to]': 'Фильтр по дате оплаты: конец периода',
  'status_changed_at[from]': 'Фильтр по дате смены статуса: начало периода',
  'status_changed_at[to]': 'Фильтр по дате смены статуса: конец периода'
}

/** Узел дерева из плоского описателя `argsSchema` (для полей, задокументированных только в нём). */
function argsFieldToNode(field: ArgsFieldSchema): ArgsTreeNode {
  if (field.type === 'array') {
    return { kind: 'array', items: field.items ? argsFieldToNode(field.items) : { kind: 'any' } }
  }
  if (field.type === 'object') {
    return { kind: 'object', fields: [], additionalProperties: true }
  }
  return { kind: 'scalar', type: field.type }
}

/** Рекурсивно проставляет fallback-подписи из `FIELD_DESCRIPTIONS` полям без описания. */
function fillFieldDescriptions(node: ArgsTreeNode): void {
  if (node.kind === 'object') {
    for (const field of node.fields) {
      if (!field.description) field.description = FIELD_DESCRIPTIONS[field.name]
      fillFieldDescriptions(field.node)
    }
  } else if (node.kind === 'array') {
    fillFieldDescriptions(node.items)
  }
}

/**
 * Дерево формата запроса из `argsValidator` (вся вложенность) + поля, задокументированные только
 * в `argsSchema` (bracket-параметры GC через passthrough), + наложение UI-описаний и словаря.
 */
function buildArgsTree(validator: AnyArgsValidator, argsSchema: ArgsSchemaJson): ArgsTreeNode {
  const node = schemaToArgsNode(validator as unknown as RawSchema)
  if (node.kind === 'object') {
    // Описания верхнего уровня из argsSchema (в валидаторе их нет).
    for (const field of node.fields) {
      if (!field.description) {
        const fromSchema = argsSchema.fields.find((f) => f.name === field.name)?.description
        if (fromSchema) field.description = fromSchema
      }
    }
    // Поля, описанные только в argsSchema (passthrough-параметры GC), которых нет в валидаторе.
    const present = new Set(node.fields.map((f) => f.name))
    for (const sf of argsSchema.fields) {
      if (!present.has(sf.name)) {
        node.fields.push({
          name: sf.name,
          required: sf.required,
          description: sf.description,
          node: argsFieldToNode(sf)
        })
      }
    }
  }
  fillFieldDescriptions(node)
  return node
}

/** Преобразование каталога в wire-форму для клиента (SSR-пропсы, GET /v1/operations). */
export function toOperationSummaries(): OperationSummary[] {
  return operationsCatalog.map((e) => ({
    op: e.op,
    httpMethod: e.httpMethod,
    contour: e.contour,
    availability: e.availability,
    argsSchema: e.argsSchema,
    argsTree: buildArgsTree(e.argsValidator, e.argsSchema)
  }))
}
