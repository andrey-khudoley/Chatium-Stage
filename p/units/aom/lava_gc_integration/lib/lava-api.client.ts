import { request } from '@app/request'
import { normalizeLavaBaseUrlInput } from '../shared/lavaBaseUrl'
import * as loggerLib from './logger.lib'

const LOG_MODULE = 'lib/lava-api.client'

export type LavaCatalogRow = {
  productId: string
  productTitle: string
  offerId: string
  offerName: string
}

/**
 * Список пар продукт/оффер из GET /api/v2/products (с пагинацией по nextPage).
 */
export async function fetchLavaProductsCatalog(
  ctx: app.Ctx,
  params: { baseUrl: string; apiKey: string }
): Promise<{ rows: LavaCatalogRow[] }> {
  const base = normalizeLavaBaseUrlInput(params.baseUrl)
  const apiKey = params.apiKey.trim()
  if (!apiKey) {
    throw new Error('Не указан API-ключ Lava')
  }

  const rows: LavaCatalogRow[] = []
  let nextUrl: string | null = `${base}/api/v2/products`
  const maxPages = 30
  let page = 0

  while (nextUrl && page < maxPages) {
    page += 1
    const response = await request(ctx, {
      url: nextUrl,
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json'
      },
      throwHttpErrors: false,
      timeout: 20000
    })

    if (response.statusCode !== 200) {
      const snippet =
        typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body ?? '')
      throw new Error(`Lava ответила ${response.statusCode}: ${snippet.slice(0, 400)}`)
    }

    const parsed = response.body as {
      items?: Array<{ type?: string; data?: Record<string, unknown> }>
      nextPage?: string | null
    }

    const items = Array.isArray(parsed?.items) ? parsed.items : []
    for (const item of items) {
      const itemType = String(item?.type ?? '').toUpperCase()
      if (itemType !== 'PRODUCT' || !item.data || typeof item.data !== 'object') continue
      const data = item.data as {
        id?: string
        title?: string | null
        offers?: Array<{ id?: string; name?: string | null }> | null
      }
      const pid = data.id
      if (!pid) continue
      const title = data.title ?? ''
      const offers = Array.isArray(data.offers) ? data.offers : []
      for (const off of offers) {
        if (off?.id) {
          rows.push({
            productId: pid,
            productTitle: title,
            offerId: off.id,
            offerName: off.name ?? ''
          })
        }
      }
    }

    nextUrl =
      parsed?.nextPage && typeof parsed.nextPage === 'string' && parsed.nextPage.length > 0
        ? parsed.nextPage
        : null
  }

  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] fetchLavaProductsCatalog`,
    payload: { base, rowsCount: rows.length, pages: page }
  })

  return { rows }
}
