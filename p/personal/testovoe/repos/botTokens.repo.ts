import BotTokens, { type BotTokensRow } from '../tables/botTokens.table'

export async function findByClarityUid(ctx: app.Ctx, clarityUid: string): Promise<BotTokensRow | null> {
  return BotTokens.findOneBy(ctx, { clarityUid })
}

export async function saveByClarityUid(ctx: app.Ctx, clarityUid: string, token: string): Promise<void> {
  await BotTokens.createOrUpdateBy(ctx, 'clarityUid', {
    clarityUid,
    token,
    lastUpdated: Date.now()
  })
}

export async function clearByClarityUid(ctx: app.Ctx, clarityUid: string): Promise<void> {
  const rows = await BotTokens.findAll(ctx, {
    where: { clarityUid },
    limit: 1000
  })

  for (const row of rows) {
    await BotTokens.delete(ctx, row.id)
  }
}
