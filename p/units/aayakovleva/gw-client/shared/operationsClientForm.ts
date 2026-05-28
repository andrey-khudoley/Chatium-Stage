// @shared
/**
 * Хелперы для UI-формы «Создать запрос»: группировка операций по гейтвеям,
 * парсинг composite-ключа `gatewayId:op`, генерация пустого состояния формы,
 * клиентская валидация и сборка финального `args` для `POST /api/lp/invoke`.
 *
 * Каталог операций живёт в `operationsClientCatalog.ts`; этот файл — только
 * чистые функции преобразования каталога/состояния. Без зависимостей от Vue.
 */

import type { GatewayId } from './invokeApi'
import {
  OPERATIONS_CLIENT_CATALOG,
  type ClientFieldDefaultSource,
  type ClientOperationDescriptor
} from './operationsClientCatalog'

export type OperationGroupForUi = {
  gatewayId: GatewayId
  label: string
  operations: ClientOperationDescriptor[]
}

/** Человеческое имя гейтвея для optgroup. */
export function gatewayLabel(gatewayId: GatewayId): string {
  if (gatewayId === 'lifepay') return 'LifePay'
  if (gatewayId === 'lavatop') return 'Lava.Top'
  return gatewayId
}

/** Список групп для дропдауна (порядок — фиксированный, как в каталоге). */
export function groupOperationsForUi(): OperationGroupForUi[] {
  const groups = new Map<GatewayId, ClientOperationDescriptor[]>()
  for (const op of OPERATIONS_CLIENT_CATALOG) {
    const list = groups.get(op.gatewayId) || []
    list.push(op)
    groups.set(op.gatewayId, list)
  }
  return Array.from(groups.entries()).map(([gatewayId, operations]) => ({
    gatewayId,
    label: gatewayLabel(gatewayId),
    operations
  }))
}

/** Найти описание операции по composite-ключу. */
export function findClientOperation(
  gatewayId: GatewayId,
  op: string
): ClientOperationDescriptor | null {
  return OPERATIONS_CLIENT_CATALOG.find((e) => e.gatewayId === gatewayId && e.op === op) ?? null
}

/**
 * Идентификатор пары gateway+op в форме строки `${gatewayId}:${op}`. Удобно
 * для значения select'а (нативный value не поддерживает объекты).
 */
export function operationKey(gatewayId: GatewayId, op: string): string {
  return `${gatewayId}:${op}`
}

/** Парсинг ключа дропдауна в пару. */
export function parseOperationKey(key: string): { gatewayId: GatewayId; op: string } | null {
  const idx = key.indexOf(':')
  if (idx <= 0) return null
  const gw = key.slice(0, idx)
  const op = key.slice(idx + 1)
  if (gw !== 'lifepay' && gw !== 'lavatop') return null
  if (!op) return null
  return { gatewayId: gw, op }
}

/**
 * Начальное состояние data() HomePage для формы «Создать запрос»: пара
 * `{ currentOperationKey, requestForm }`, посчитанная по первому descriptor'у
 * каталога. Используется в HomePage.data() (spread), чтобы не дублировать
 * логику инициализации между data() и `onChangeOperationKey`.
 */
export function buildInitialRequestState(
  ssrDefaults: Partial<Record<ClientFieldDefaultSource, string>>
): { currentOperationKey: string; requestForm: Record<string, string> } {
  const first = OPERATIONS_CLIENT_CATALOG[0]
  if (!first) {
    return { currentOperationKey: '', requestForm: {} }
  }
  return {
    currentOperationKey: operationKey(first.gatewayId, first.op),
    requestForm: buildEmptyForm(first, ssrDefaults)
  }
}

/**
 * Пустая форма для выбранной операции: все поля = '' либо defaultValue.
 * Динамические defaults (webhookUrl/webhookUrlLavatop) подставляются
 * вызывающим компонентом из его SSR-пропсов.
 */
export function buildEmptyForm(
  descriptor: ClientOperationDescriptor,
  ssrDefaults: Partial<Record<ClientFieldDefaultSource, string>>
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of descriptor.fields) {
    if (f.defaultFromProp && ssrDefaults[f.defaultFromProp]) {
      out[f.name] = ssrDefaults[f.defaultFromProp] as string
      continue
    }
    if (f.defaultValue !== undefined) {
      out[f.name] = f.defaultValue
      continue
    }
    out[f.name] = ''
  }
  return out
}

/**
 * Базовая клиентская валидация: required-поля не пусты, числа — числа,
 * JSON-поля парсятся. Возвращает map `fieldName → текст ошибки` (пустой
 * объект = всё валидно).
 */
export function validateForm(
  descriptor: ClientOperationDescriptor,
  form: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const f of descriptor.fields) {
    const raw = (form[f.name] ?? '').toString()
    const trimmed = raw.trim()
    if (f.required && !trimmed) {
      errors[f.name] = 'Обязательное поле'
      continue
    }
    if (!trimmed) continue
    if (f.type === 'number') {
      const num = Number(trimmed)
      if (!Number.isFinite(num)) {
        errors[f.name] = 'Ожидается число'
        continue
      }
      if (typeof f.numberMin === 'number' && num < f.numberMin) {
        errors[f.name] = `Минимум ${f.numberMin}`
      }
    } else if (f.type === 'json') {
      try {
        JSON.parse(trimmed)
      } catch {
        errors[f.name] = 'Невалидный JSON'
      }
    } else if (f.type === 'email') {
      if (!/^.+@.+\..+$/.test(trimmed)) {
        errors[f.name] = 'Ожидается email'
      }
    }
  }
  return errors
}

/**
 * Сборка готового объекта `args` для `POST /api/lp/invoke`. Числовые поля
 * переводятся в `number`, JSON-поля — парсятся. Пустые опциональные поля
 * пропускаются (не отправляются в gateway).
 */
export function buildArgs(
  descriptor: ClientOperationDescriptor,
  form: Record<string, string>
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of descriptor.fields) {
    const raw = (form[f.name] ?? '').toString()
    const trimmed = raw.trim()
    if (!trimmed) {
      if (!f.required) continue
      out[f.name] = trimmed
      continue
    }
    if (f.type === 'number') {
      const num = Number(trimmed)
      out[f.name] = Number.isFinite(num) ? num : trimmed
    } else if (f.type === 'json') {
      try {
        out[f.name] = JSON.parse(trimmed)
      } catch {
        out[f.name] = trimmed
      }
    } else {
      out[f.name] = trimmed
    }
  }
  return out
}
