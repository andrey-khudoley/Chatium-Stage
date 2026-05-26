// @shared
/**
 * Wire-форма каталога операций для UI и SSR-пропсов. Зеркалит типы `OperationSummary` из
 * `lib/gateway/operationsCatalog.ts`, но без зависимости от `@app/schema` (только plain JSON).
 *
 * Этот файл — единственный канал передачи каталога на клиент. Никаких рантайм-валидаторов здесь нет.
 */

export type GcContour = 'new' | 'legacy'
export type OpAvailability = 'enabled' | 'beta' | 'disabled' | 'unsupported'
export type HttpMethod = 'GET' | 'POST'
export type ArgsFieldType = 'string' | 'number' | 'boolean' | 'array' | 'object'

export type ArgsFieldSchema = {
  name: string
  type: ArgsFieldType
  required: boolean
  description?: string
  items?: ArgsFieldSchema
}

export type ArgsSchemaJson = {
  fields: ArgsFieldSchema[]
}

export type OperationSummary = {
  op: string
  httpMethod: HttpMethod
  contour: GcContour
  availability: OpAvailability
  argsSchema: ArgsSchemaJson
}
