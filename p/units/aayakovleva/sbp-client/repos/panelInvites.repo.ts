/**
 * Репозиторий пригласительных токенов (ADR 0003, implementation-plan §1.11.3).
 *
 * Слой работы с БД: только Heap-операции, без бизнес-логики.
 *
 * Уникальность `token` — на уровне приложения (`accountNanoid` + параллельные
 * потребления защищены `runWithExclusiveLock` в `lib/access/invites`).
 */

import PanelInvites, { type PanelInvitesRow } from '../tables/panelInvites.table'
import * as loggerLib from '../lib/logger.lib'

const LOG_MODULE = 'repos/panelInvites.repo'

export async function findByToken(
  ctx: app.Ctx,
  token: string
): Promise<PanelInvitesRow | null> {
  return PanelInvites.findOneBy(ctx, { token })
}

export async function findById(
  ctx: app.Ctx,
  id: string
): Promise<PanelInvitesRow | null> {
  const rows = await PanelInvites.findAll(ctx, { where: { id }, limit: 1 })
  return rows.length > 0 ? rows[0] : null
}

export type CreateInvitePayload = {
  token: string
  createdByUserId: string
  createdAt: number
  expiresAt: number
  note?: string
}

export async function create(
  ctx: app.Ctx,
  payload: CreateInvitePayload
): Promise<PanelInvitesRow> {
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create entry`,
    // токен в логи не пишем (§1.11.5)
    payload: { createdByUserId: payload.createdByUserId, hasNote: !!payload.note }
  })
  const data: Record<string, unknown> = {
    token: payload.token,
    createdByUserId: payload.createdByUserId,
    createdAt: payload.createdAt,
    expiresAt: payload.expiresAt
  }
  if (payload.note !== undefined) {
    data.note = payload.note
  }
  const row = await PanelInvites.create(ctx, data as Parameters<typeof PanelInvites.create>[1])
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] create exit`,
    payload: { inviteId: row.id }
  })
  return row
}

/** Пометить инвайт использованным. */
export async function markUsed(
  ctx: app.Ctx,
  inviteId: string,
  usedByUserId: string,
  usedAt: number
): Promise<void> {
  await PanelInvites.update(ctx, {
    id: inviteId,
    usedAt,
    usedByUserId
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] markUsed`,
    payload: { inviteId, usedByUserId }
  })
}

/** Отозвать инвайт Admin'ом. */
export async function revokeById(
  ctx: app.Ctx,
  inviteId: string,
  revokedAt: number
): Promise<void> {
  await PanelInvites.update(ctx, {
    id: inviteId,
    revokedAt
  })
  await loggerLib.writeServerLog(ctx, {
    severity: 6,
    message: `[${LOG_MODULE}] revokeById`,
    payload: { inviteId }
  })
}

/** Все инвайты (для списка в админке), свежие первыми. */
export async function findAll(ctx: app.Ctx): Promise<PanelInvitesRow[]> {
  return PanelInvites.findAll(ctx, {
    order: [{ createdAt: 'desc' }]
  })
}

/** Удалить инвайт по id (используется в тестах для очистки). */
export async function deleteById(ctx: app.Ctx, id: string): Promise<void> {
  await PanelInvites.delete(ctx, id)
}
