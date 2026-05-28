/**
 * Диспетчер исходящих вызовов по `gatewayId`.
 *
 * Принимает идентификатор гейтвея (`'lifepay' | 'lavatop'`), выбирает
 * соответствующий клиент и делегирует ему вызов. Это точка входа для
 * `api/lp/invoke.ts` после введения многогейтвейности.
 */

import type { GatewayId } from '../../shared/invokeApi'
import { invokeLifepayGateway } from './invokeClient'
import { invokeLavatopGateway } from './lavatopClient'
import type { InvokeResult } from './invokeResult'

export async function invokeByGateway(
  ctx: app.Ctx,
  gatewayId: GatewayId,
  op: string,
  args: Record<string, unknown>
): Promise<InvokeResult> {
  switch (gatewayId) {
    case 'lifepay':
      return invokeLifepayGateway(ctx, op, args)
    case 'lavatop':
      return invokeLavatopGateway(ctx, op, args)
    default: {
      // Exhaustiveness check: при добавлении нового GatewayId компилятор
      // подсветит этот блок (никогда не должен исполниться рантайм).
      const _exhaustive: never = gatewayId
      void _exhaustive
      throw new Error(`Unknown gatewayId in invokeByGateway: ${String(gatewayId)}`)
    }
  }
}
