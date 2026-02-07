// @shared-route
import { findByClarityUid } from '../../repos/botTokens.repo'
import { normalizeClarityUid } from '../../lib/telegram.lib'

export const getTokenStateRoute = app.get('/', async (ctx, req) => {
  const clarityUid = normalizeClarityUid(req.query.clarityUid)

  if (!clarityUid) {
    return { success: false, error: 'Параметр clarityUid обязателен' }
  }

  const row = await findByClarityUid(ctx, clarityUid)

  return {
    success: true,
    hasToken: !!row,
    updatedAt: row?.lastUpdated ?? null
  }
})
