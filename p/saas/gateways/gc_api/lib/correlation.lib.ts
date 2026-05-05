import { accountNanoid } from '@app/nanoid'

export function newCorrelationId(ctx: app.Ctx): string {
  return `req_${accountNanoid(ctx)}`
}
