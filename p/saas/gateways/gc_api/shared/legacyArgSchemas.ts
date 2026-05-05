// @shared
/** Минимальные JSON Schema для Legacy op (расширяем по мере интеграции с help.getcourse.ru). */

export type JsonSchema = Record<string, unknown>

export const LEGACY_ARG_SCHEMAS: Record<string, JsonSchema> = {
  addUser: {
    type: 'object',
    description: 'Импорт пользователя (params GC)',
    properties: {
      user: { type: 'object' },
      system: { type: 'object' }
    },
    additionalProperties: true
  },
  createDeal: {
    type: 'object',
    description: 'Импорт сделки',
    properties: {
      user: { type: 'object' },
      deal: { type: 'object' },
      system: { type: 'object' },
      session: { type: 'object' }
    },
    additionalProperties: true
  },
  exportUsers: {
    type: 'object',
    additionalProperties: true
  },
  exportGroupUsers: {
    type: 'object',
    additionalProperties: true
  },
  exportDeals: {
    type: 'object',
    additionalProperties: true
  },
  exportPayments: {
    type: 'object',
    additionalProperties: true
  },
  getCustomFields: {
    type: 'object',
    additionalProperties: true
  },
  getExportResult: {
    type: 'object',
    properties: {
      export_id: { type: ['string', 'number'] },
      result_id: { type: ['string', 'number'] }
    },
    additionalProperties: true
  }
}
