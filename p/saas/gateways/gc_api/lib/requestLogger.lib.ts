import * as settingsLib from './settings.lib'
import * as requestLogRepo from '../repos/requestLog.repo'

export async function writeRequestLog(
  ctx: app.Ctx,
  row: {
    correlationId: string
    schoolId: string
    op: string
    circuit: string
    status: 'success' | 'error'
    gcStatusCode?: number
    latencyMs: number
    errorCode?: string
    errorMessage?: string
    args?: unknown
  }
): Promise<void> {
  const configuredLevel = await settingsLib.getLogLevel(ctx)
  const includeArgs = configuredLevel === 'Debug'
  await requestLogRepo.create(ctx, {
    correlationId: row.correlationId,
    schoolId: row.schoolId,
    op: row.op,
    circuit: row.circuit,
    status: row.status,
    gcStatusCode: row.gcStatusCode,
    latencyMs: row.latencyMs,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    args: includeArgs ? row.args : undefined,
    createdAt: Date.now()
  })
}
