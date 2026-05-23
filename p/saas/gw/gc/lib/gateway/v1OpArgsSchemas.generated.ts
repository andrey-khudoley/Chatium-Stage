/**
 * Автогенерация: `node scripts/gen-v1-op-args-schemas.cjs`
 * Источники: docs/gateway/new_api_schema.json, config/gc-op-http-mapping.json + legacy-хелпер.
 */
import { s } from '@app/schema'

export type V1OpArgsSchemaMap = Record<string, ReturnType<typeof s.object>>

export const V1_OP_ARGS_SCHEMAS = {
  "setUri": s.object({
    uri: s.string(),
    event_id: s.number(),
    event_object_id: s.number()
  }),
  "getAllGroups": s.object({}),
  "getAllPersonalManagers": s.object({}),
  "getTrainings": s.object({}),
  "addCommentToDeal": s.object({
      dealId: s.number(),
      userId: s.number(),
      text: s.string()
    }),
  "addDealPositions": s.object({
      dealId: s.number(),
      positions: s.array(s.object({
      offerId: s.number().optional(),
      price: s.number().optional(),
      quantity: s.number().optional()
    }))
    }),
  "getDealCalls": s.object({
      dealId: s.number()
    }),
  "getDealCancelReasons": s.object({}),
  "getDealComments": s.object({
      dealId: s.number()
    }),
  "getDealCustomFields": s.object({
      dealId: s.number()
    }),
  "getDealsTags": s.object({
      limit: s.number().optional(),
      offset: s.number().optional()
    }),
  "getDealFields": s.object({
      dealId: s.number()
    }),
  "removeDealPositions": s.object({
      dealId: s.number(),
      positionIds: s.array(s.number())
    }),
  "updateDealFields": s.object({
      dealId: s.number(),
      manager_user_id: s.number().optional(),
      status: s.string().optional(),
      cancel_reason_comment: s.number().optional(),
      tags: s.array(s.string()).optional()
    }),
  "addCommentToDialog": s.object({
      dialogId: s.number(),
      commentText: s.string(),
      transport: s.array(s.number()),
      userId: s.number()
    }),
  "changeDepartment": s.object({
      dialogId: s.number(),
      newDepartmentId: s.number()
    }),
  "closeDialog": s.object({
      dialogId: s.number()
    }),
  "getDialogHistory": s.object({
      dialogId: s.number(),
      limit: s.number().optional()
    }),
  "addCommentToLessonAnswer": s.object({
      lessonAnswerId: s.number(),
      text: s.string(),
      userId: s.number()
    }),
  "changeStatusAnswers": s.object({
      lessonAnswerId: s.number(),
      status: s.string()
    }),
  "getLessonAnswers": s.object({
      lessonId: s.number()
    }),
  "addNote": s.object({
      dialogId: s.number(),
      text: s.string()
    }),
  "getOfferById": s.object({
      offerId: s.number()
    }),
  "getOffers": s.object({}),
  "getOffersTags": s.object({
      limit: s.number().optional(),
      offset: s.number().optional()
    }),
  "addUserBalance": s.object({
      value: s.number(),
      type: s.number(),
      comment: s.string()
    }),
  "addUserGroups": s.object({
      groups: s.array(s.number())
    }),
  "createDiploma": s.object({
      templateId: s.number(),
      number: s.string().optional(),
      trainingName: s.string().optional(),
      userName: s.string().optional(),
      allowDuplicates: s.boolean().optional()
    }),
  "getUserAnswers": s.object({}),
  "getUserBalance": s.object({}),
  "getUserCustomFields": s.object({}),
  "getUserDeals": s.object({}),
  "getUserDiplomas": s.object({}),
  "getUserFields": s.object({}),
  "getUserGoalRecords": s.object({}),
  "getUserGroups": s.object({}),
  "getUserLessonAnswers": s.object({}),
  "getUserPurchases": s.object({
      productId: s.string().optional()
    }),
  "getUserSchedule": s.object({}),
  "getUserTrainings": s.object({}),
  "getUserByTelegramChatId": s.object({
      chatId: s.number()
    }),
  "removeUserGroups": s.object({
      groups: s.array(s.number())
    }),
  "setUserGroups": s.object({
      groups: s.array(s.number())
    }),
  "setPersonalManager": s.object({
      managerId: s.number()
    }),
  "updateUserCustomFields": s.object({
      customFields: s.any()
    }),
  "updateUserFields": s.object({
      gender: s.string().optional(),
      country: s.string().optional(),
      city: s.string().optional(),
      first_name: s.string().optional(),
      last_name: s.string().optional(),
      birthday: s.string().optional(),
      comment: s.string().optional(),
      phone: s.string().optional()
    }),
  "addCommentToWebinar": s.object({
      moderatorId: s.number(),
      webinarId: s.number(),
      webinarLaunchNumber: s.number().optional(),
      text: s.string(),
      isPrivateReply: s.boolean().optional(),
      replyToUserId: s.number().optional(),
      replyToUserType: s.number().optional()
    }),
  "getAllWebinars": s.object({}),
  "getWebinarsByIds": s.object({
      ids: s.array(s.number())
    }),
  "moderateWebinarComment": s.object({
      webinarId: s.number(),
      moderatorId: s.number().optional(),
      commentId: s.number(),
      action: s.string()
    }),
  "moderateWebinarUser": s.object({
      webinarId: s.number(),
      webinarLaunchNumber: s.number().optional(),
      moderatorId: s.number().optional(),
      userId: s.number(),
      userType: s.number(),
      action: s.string()
    }),
  "addUser": s.object({
      params: s.any()
    }),
  "createDeal": s.object({
      params: s.any()
    }),
  "exportUsers": s.object({}),
  "exportGroupUsers": s.object({
      groupId: s.number()
    }),
  "exportDeals": s.object({}),
  "exportPayments": s.object({}),
  "getCustomFields": s.object({}),
  "getExportResult": s.object({
      exportId: s.number()
    }),
} as const

export type V1OpName = keyof typeof V1_OP_ARGS_SCHEMAS
