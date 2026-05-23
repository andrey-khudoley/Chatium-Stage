// @ts-ignore модуль подключается платформой снаружи (@start/sdk)
import { getWorkspaceEventUrl, writeWorkspaceEvent } from '@start/sdk'

import type { V1TuneResponse } from './v1TuneResponse'

let workspaceEventTypesPrepared = false

async function ensureGatewayWorkspaceEventTypes(ctx: app.Ctx): Promise<void> {
  if (workspaceEventTypesPrepared) return
  try {
    await getWorkspaceEventUrl(ctx, 'gateway_gc.invoke.completed')
    await getWorkspaceEventUrl(ctx, 'gateway_gc.operations.catalog_served')
    workspaceEventTypesPrepared = true
  } catch {
    /* повторим при следующем запросе */
  }
}

function parseV1Payload(rawHttpBody: string): {
  ok: boolean
  requestId?: string
  errorCode?: string
  gcSemanticRule?: string
  gcHttpStatus?: number
} {
  try {
    const j = JSON.parse(rawHttpBody) as {
      ok?: unknown
      requestId?: unknown
      error?: { code?: unknown; details?: { gcRule?: unknown; gcHttpStatus?: unknown } }
    }
    const ok = j.ok === true
    const requestId = typeof j.requestId === 'string' ? j.requestId : undefined
    let errorCode: string | undefined
    let gcSemanticRule: string | undefined
    let gcHttpStatus: number | undefined
    if (!ok && j.error && typeof j.error === 'object') {
      const c = j.error.code
      if (typeof c === 'string') errorCode = c
      const det = j.error.details
      if (det && typeof det === 'object') {
        if (typeof det.gcRule === 'string') gcSemanticRule = det.gcRule
        if (typeof det.gcHttpStatus === 'number') gcHttpStatus = det.gcHttpStatus
      }
    }
    return { ok, requestId, errorCode, gcSemanticRule, gcHttpStatus }
  } catch {
    return { ok: false }
  }
}

/** После ответа клиенту по /v1/{op} (manual §7.3). Не бросает — не ломает HTTP. */
export async function emitGatewayInvokeCompletedEvent(
  ctx: app.Ctx,
  input: {
    started: number
    op: string
    incomingMethod: string
    contour?: string
    availability?: string
    response: V1TuneResponse
    /** Когда задано — переопределяет gcHttpStatus, разобранный из тела (например, для успешных ответов). */
    gcHttpStatusOverride?: number
  }
): Promise<void> {
  try {
    await ensureGatewayWorkspaceEventTypes(ctx)
    const parsed = parseV1Payload(input.response.rawHttpBody)
    const durationMs = Date.now() - input.started
    await writeWorkspaceEvent(ctx, 'gateway_gc.invoke.completed', {
      requestId: parsed.requestId,
      op: input.op,
      incomingMethod: input.incomingMethod,
      contour: input.contour,
      availability: input.availability,
      clientHttpStatus: input.response.statusCode,
      ok: parsed.ok,
      errorCode: parsed.errorCode,
      durationMs,
      gcHttpStatus: input.gcHttpStatusOverride ?? parsed.gcHttpStatus,
      gcSemanticRule: parsed.gcSemanticRule
    })
  } catch {
    /* mute */
  }
}

/** После успешного GET /v1/operations (manual §7.3). */
export async function emitGatewayOperationsCatalogServedEvent(
  ctx: app.Ctx,
  input: {
    started: number
    requestId: string
    operationsCount: number
    catalogSchemaVersion: number
    response: V1TuneResponse
  }
): Promise<void> {
  try {
    await ensureGatewayWorkspaceEventTypes(ctx)
    await writeWorkspaceEvent(ctx, 'gateway_gc.operations.catalog_served', {
      requestId: input.requestId,
      operationsCount: input.operationsCount,
      catalogSchemaVersion: input.catalogSchemaVersion,
      clientHttpStatus: input.response.statusCode,
      ok: parseV1Payload(input.response.rawHttpBody).ok
    })
  } catch {
    /* mute */
  }
}
