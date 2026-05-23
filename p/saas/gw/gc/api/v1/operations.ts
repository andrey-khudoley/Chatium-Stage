import * as loggerLib from '../../lib/logger.lib'
import { operationsCatalog, serializeArgsSchemaForCatalog } from '../../lib/gateway/operationsCatalog'
import { newGatewayRequestId } from '../../lib/gateway/requestId'
import { emitGatewayOperationsCatalogServedEvent } from '../../lib/gateway/gatewayWorkspaceEvents'
import { v1ErrorResponse, v1SuccessResponse } from '../../lib/gateway/v1TuneResponse'

const LOG_PATH = 'api/v1/operations'

/**
 * GET /v1/operations — каталог op без заголовков школы и без вызова GC (manual §3.3).
 * Источник — общий TS-модуль `lib/gateway/operationsCatalog.ts` (manual §3.1, §3.2);
 * этот же модуль использует обработчик `/v1/{op}` (manual §3.5), что гарантирует
 * совпадение схем валидации и выдачи каталога.
 */
export const gatewayOperationsRoute = app.get('/', async (ctx) => {
  const started = Date.now()
  const requestId = newGatewayRequestId()
  try {
    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] start`,
      payload: { requestId, logStage: 'operations_catalog_start' }
    })

    const operations = [...operationsCatalog.entries]
      .sort((a, b) => a.op.localeCompare(b.op))
      .map((e) => ({
        op: e.op,
        httpMethod: e.httpMethod,
        contour: e.contour,
        availability: e.availability,
        argsSchema: serializeArgsSchemaForCatalog(e.op)
      }))

    await loggerLib.writeServerLog(ctx, {
      severity: 6,
      message: `[${LOG_PATH}] ok`,
      payload: {
        requestId,
        logStage: 'operations_catalog_ok',
        operationsCount: operations.length,
        catalogSchemaVersion: operationsCatalog.schemaVersion
      }
    })

    const response = v1SuccessResponse(
      {
        catalogSchemaVersion: operationsCatalog.schemaVersion,
        operations
      },
      requestId
    )
    await emitGatewayOperationsCatalogServedEvent(ctx, {
      started,
      requestId,
      operationsCount: operations.length,
      catalogSchemaVersion: operationsCatalog.schemaVersion,
      response
    })
    return response
  } catch (e: unknown) {
    await loggerLib.writeServerLog(ctx, {
      severity: 3,
      message: `[${LOG_PATH}] internal`,
      payload: {
        requestId,
        error: e instanceof Error ? e.message : String(e)
      }
    })
    return v1ErrorResponse('OPERATIONS_INTERNAL_ERROR', requestId)
  }
})
