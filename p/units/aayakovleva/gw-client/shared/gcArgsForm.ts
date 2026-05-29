// @shared
/**
 * Обёртка над GC-shared `requestTestForm.ts`: реэкспорт чистых функций модели формы
 * (без HTTP/fetch и DOM) для динамического рендера формы GC-операций по `argsTree`.
 *
 * Импортируется только из серверных `.ts`-файлов клиента (`pages/sbpHomePageMixin.ts`,
 * `lib/gateway/gcOperationsLoader.ts`). В `.vue`-компоненты этот файл не импортируется —
 * рендерер `HomeGcRequestForm.vue` работает с готовыми `FormRow`-структурами по
 * соглашению о форме, не подтягивая cross-project граф зависимостей.
 *
 * Типы `ArgsTreeNode`/`ArgsTreeField` дублированы локально (wire-зеркало), чтобы
 * `shared/operationsClientCatalog.ts` не зависел напрямую от `p/saas/gw/gc/`.
 */

export {
  buildFormRows,
  buildArgsObject,
  buildFieldErrors,
  jsonPlaceholder,
  type FormRow,
  type FormGroup,
  type FormLeaf,
  type LeafInput
} from '../../../../../p/saas/gw/gc/shared/requestTestForm'

/** Wire-зеркало `ArgsTreeNode` из `p/saas/gw/gc/shared/operationsCatalogShared.ts`. */
export type ArgsTreeNode =
  | { kind: 'object'; fields: ArgsTreeField[]; additionalProperties: boolean }
  | { kind: 'array'; items: ArgsTreeNode }
  | { kind: 'scalar'; type: string }
  | { kind: 'any' }

/** Wire-зеркало `ArgsTreeField`. */
export type ArgsTreeField = {
  name: string
  required: boolean
  description?: string
  node: ArgsTreeNode
}
