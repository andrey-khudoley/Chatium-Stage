/**
 * Запись маппинга для op addUser (должна совпадать с config/gc-op-http-mapping.json и docs/gateway/gc-op-http-mapping.json).
 * Используется legacy-клиентом и каталогом; статический TS вместо ES-import JSON (manual §3.1–3.2).
 */
export const GW_ADD_USER_MAPPING = {
  op: 'addUser',
  contour: 'legacy' as const,
  httpMethod: 'POST' as const,
  pathTemplate: '/users',
  legacyImportAction: 'add' as const,
  availability: 'enabled' as const
}
