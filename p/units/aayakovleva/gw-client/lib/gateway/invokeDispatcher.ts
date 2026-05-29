/**
 * Диспетчер исходящих вызовов по `gatewayId`.
 *
 * Принимает идентификатор гейтвея (`'lifepay' | 'lavatop' | 'gc'`), выбирает
 * соответствующий клиент и делегирует ему вызов. Это точка входа для
 * `api/lp/invoke.ts` после введения многогейтвейности.
 *
 * Параметр `meta.httpMethod` нужен только для GC (динамический каталог).
 * LifePay и Lava.Top определяют метод по статическому каталогу и `meta`
 * игнорируют.
 */

import type { GatewayId } from '../../shared/invokeApi'
import { invokeLifepayGateway } from './invokeClient'
import { invokeLavatopGateway } from './lavatopClient'
import { invokeGcGateway } from './gcClient'
import type { InvokeResult } from './invokeResult'

export type InvokeMeta = {
  /** HTTP-метод upstream — обязателен для `gatewayId: 'gc'`. */
  httpMethod?: 'GET' | 'POST'
}

export async function invokeByGateway(
  ctx: app.Ctx,
  gatewayId: GatewayId,
  op: string,
  args: Record<string, unknown>,
  meta?: InvokeMeta
): Promise<InvokeResult> {
  switch (gatewayId) {
    case 'lifepay':
      return invokeLifepayGateway(ctx, op, args)
    case 'lavatop':
      return invokeLavatopGateway(ctx, op, args)
    case 'gc': {
      // httpMethod обязателен для GC — проверка стоит выше, в `api/lp/invoke.ts`.
      // Сюда `meta.httpMethod === undefined` дойти не должен. Если дошёл — это
      // ошибка вызывающего кода, валим явно, чтобы не молча мапить в POST.
      if (!meta?.httpMethod) {
        throw new Error('invokeByGateway: httpMethod is required for gatewayId="gc"')
      }
      return invokeGcGateway(ctx, op, args, meta.httpMethod)
    }
    default: {
      // Exhaustiveness check: при добавлении нового GatewayId компилятор
      // подсветит этот блок (никогда не должен исполниться рантайм).
      const _exhaustive: never = gatewayId
      void _exhaustive
      throw new Error(`Unknown gatewayId in invokeByGateway: ${String(gatewayId)}`)
    }
  }
}
