/**
 * Полная конвертация JSON Schema → ZType для динамического каталога не используется:
 * валидация invoke выполняется через `jsonSchemaValidate.lib`.
 */
import { s } from '@app/schema'

/** Заглушка под будущую генерацию ZType из OpenAPI. */
export function jsonSchemaToPermissiveBody() {
  return s.any()
}
