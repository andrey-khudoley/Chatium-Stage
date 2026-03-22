import TaskClients from '../tables/task-clients.table'
import TaskProjects from '../tables/task-projects.table'
import TaskItems, { TASK_STATUSES } from '../tables/task-items.table'
import type { TaskClientDto, TaskItemDto, TaskProjectDto, TasksTreeDto, TaskStatus } from '../lib/tasks-types'

export type { TaskClientDto, TaskItemDto, TaskProjectDto, TasksTreeDto, TaskStatus } from '../lib/tasks-types'

function normalizePriority(n: number): number {
  if (!Number.isFinite(n)) return 2
  const x = Math.round(n)
  return Math.min(4, Math.max(1, x))
}

function normalizeStatus(s: string): TaskStatus {
  return TASK_STATUSES.includes(s as TaskStatus) ? (s as TaskStatus) : 'todo'
}

function rowToClient(row: { id: string; name: string; sortOrder: number }): TaskClientDto {
  return { id: row.id, name: row.name, sortOrder: row.sortOrder }
}

function rowToProject(row: {
  id: string
  clientId: string
  name: string
  sortOrder: number
}): TaskProjectDto {
  return { id: row.id, clientId: row.clientId, name: row.name, sortOrder: row.sortOrder }
}

function rowToTask(row: {
  id: string
  projectId: string
  title: string
  description: string
  priority: number
  status: string
  sortOrder: number
}): TaskItemDto {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description ?? '',
    priority: normalizePriority(row.priority),
    status: normalizeStatus(row.status),
    sortOrder: row.sortOrder
  }
}

export async function getTreeForUser(ctx: app.Ctx, userId: string): Promise<TasksTreeDto> {
  const [clients, projects, tasks] = await Promise.all([
    TaskClients.findAll(ctx, {
      where: { userId },
      order: [{ sortOrder: 'asc' }]
    }),
    TaskProjects.findAll(ctx, {
      where: { userId },
      order: [{ sortOrder: 'asc' }]
    }),
    TaskItems.findAll(ctx, {
      where: { userId },
      order: [{ sortOrder: 'asc' }]
    })
  ])

  return {
    clients: clients.map(rowToClient),
    projects: projects.map(rowToProject),
    tasks: tasks.map(rowToTask)
  }
}

async function nextClientSortOrder(ctx: app.Ctx, userId: string): Promise<number> {
  const rows = await TaskClients.findAll(ctx, {
    where: { userId },
    order: [{ sortOrder: 'desc' }],
    limit: 1
  })
  const max = rows[0]?.sortOrder ?? 0
  return max + 1
}

async function nextProjectSortOrder(ctx: app.Ctx, userId: string, clientId: string): Promise<number> {
  const rows = await TaskProjects.findAll(ctx, {
    where: { userId, clientId },
    order: [{ sortOrder: 'desc' }],
    limit: 1
  })
  const max = rows[0]?.sortOrder ?? 0
  return max + 1
}

async function nextTaskSortOrder(ctx: app.Ctx, userId: string, projectId: string): Promise<number> {
  const rows = await TaskItems.findAll(ctx, {
    where: { userId, projectId },
    order: [{ sortOrder: 'desc' }],
    limit: 1
  })
  const max = rows[0]?.sortOrder ?? 0
  return max + 1
}

async function assertClientOwner(ctx: app.Ctx, userId: string, id: string) {
  const row = await TaskClients.findById(ctx, id)
  if (!row || row.userId !== userId) return null
  return row
}

async function assertProjectOwner(ctx: app.Ctx, userId: string, id: string) {
  const row = await TaskProjects.findById(ctx, id)
  if (!row || row.userId !== userId) return null
  return row
}

async function assertTaskOwner(ctx: app.Ctx, userId: string, id: string) {
  const row = await TaskItems.findById(ctx, id)
  if (!row || row.userId !== userId) return null
  return row
}

export async function createClient(ctx: app.Ctx, userId: string, name: string): Promise<TaskClientDto> {
  const sortOrder = await nextClientSortOrder(ctx, userId)
  const row = await TaskClients.create(ctx, {
    userId,
    name: name.trim() || 'Новый клиент',
    sortOrder
  })
  return rowToClient(row)
}

export async function updateClient(
  ctx: app.Ctx,
  userId: string,
  id: string,
  data: { name: string }
): Promise<TaskClientDto | null> {
  const existing = await assertClientOwner(ctx, userId, id)
  if (!existing) return null
  const row = await TaskClients.update(ctx, { id, name: data.name.trim() || existing.name })
  return rowToClient(row)
}

export async function deleteClient(ctx: app.Ctx, userId: string, id: string): Promise<boolean> {
  const existing = await assertClientOwner(ctx, userId, id)
  if (!existing) return false

  const projects = await TaskProjects.findAll(ctx, { where: { userId, clientId: id } })
  for (const p of projects) {
    const tasks = await TaskItems.findAll(ctx, { where: { userId, projectId: p.id } })
    for (const t of tasks) {
      await TaskItems.delete(ctx, t.id)
    }
    await TaskProjects.delete(ctx, p.id)
  }
  await TaskClients.delete(ctx, id)
  return true
}

export async function createProject(
  ctx: app.Ctx,
  userId: string,
  clientId: string,
  name: string
): Promise<TaskProjectDto | null> {
  const client = await assertClientOwner(ctx, userId, clientId)
  if (!client) return null
  const sortOrder = await nextProjectSortOrder(ctx, userId, clientId)
  const row = await TaskProjects.create(ctx, {
    userId,
    clientId,
    name: name.trim() || 'Новый проект',
    sortOrder
  })
  return rowToProject(row)
}

export async function updateProject(
  ctx: app.Ctx,
  userId: string,
  id: string,
  data: { name: string; clientId?: string }
): Promise<TaskProjectDto | null> {
  const existing = await assertProjectOwner(ctx, userId, id)
  if (!existing) return null
  let clientId = existing.clientId
  if (data.clientId !== undefined && data.clientId !== existing.clientId) {
    const c = await assertClientOwner(ctx, userId, data.clientId)
    if (!c) return null
    clientId = data.clientId
  }
  const sortOrder =
    clientId === existing.clientId
      ? existing.sortOrder
      : await nextProjectSortOrder(ctx, userId, clientId)
  const row = await TaskProjects.update(ctx, {
    id,
    name: data.name.trim() || existing.name,
    clientId,
    sortOrder
  })
  return rowToProject(row)
}

export async function deleteProject(ctx: app.Ctx, userId: string, id: string): Promise<boolean> {
  const existing = await assertProjectOwner(ctx, userId, id)
  if (!existing) return false
  const tasks = await TaskItems.findAll(ctx, { where: { userId, projectId: id } })
  for (const t of tasks) {
    await TaskItems.delete(ctx, t.id)
  }
  await TaskProjects.delete(ctx, id)
  return true
}

export async function createTask(
  ctx: app.Ctx,
  userId: string,
  projectId: string,
  data: { title: string; description?: string; priority?: number; status?: TaskStatus }
): Promise<TaskItemDto | null> {
  const project = await assertProjectOwner(ctx, userId, projectId)
  if (!project) return null
  const sortOrder = await nextTaskSortOrder(ctx, userId, projectId)
  const priority = normalizePriority(data.priority ?? 2)
  const status = data.status ? normalizeStatus(data.status) : 'todo'
  const row = await TaskItems.create(ctx, {
    userId,
    projectId,
    title: data.title.trim() || 'Новая задача',
    description: typeof data.description === 'string' ? data.description : '',
    priority,
    status,
    sortOrder
  })
  return rowToTask(row)
}

export async function updateTask(
  ctx: app.Ctx,
  userId: string,
  id: string,
  data: {
    title?: string
    description?: string
    priority?: number
    status?: TaskStatus
    projectId?: string
  }
): Promise<TaskItemDto | null> {
  const existing = await assertTaskOwner(ctx, userId, id)
  if (!existing) return null
  let projectId = existing.projectId
  if (data.projectId !== undefined && data.projectId !== existing.projectId) {
    const p = await assertProjectOwner(ctx, userId, data.projectId)
    if (!p) return null
    projectId = data.projectId
  }
  let sortOrder = existing.sortOrder
  if (projectId !== existing.projectId) {
    sortOrder = await nextTaskSortOrder(ctx, userId, projectId)
  }
  const patch = {
    ...(data.title !== undefined ? { title: data.title.trim() || existing.title } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.priority !== undefined ? { priority: normalizePriority(data.priority) } : {}),
    ...(data.status !== undefined ? { status: normalizeStatus(data.status) } : {}),
    ...(projectId !== existing.projectId ? { projectId, sortOrder } : {})
  }
  if (Object.keys(patch).length === 0) {
    return rowToTask(existing)
  }
  const row = await TaskItems.update(ctx, { id, ...patch })
  return rowToTask(row)
}

export async function deleteTask(ctx: app.Ctx, userId: string, id: string): Promise<boolean> {
  const existing = await assertTaskOwner(ctx, userId, id)
  if (!existing) return false
  await TaskItems.delete(ctx, id)
  return true
}

export async function reorderTasks(
  ctx: app.Ctx,
  userId: string,
  projectId: string,
  orderedIds: string[]
): Promise<boolean> {
  const project = await assertProjectOwner(ctx, userId, projectId)
  if (!project) return false
  const tasks = await TaskItems.findAll(ctx, { where: { userId, projectId } })
  const idSet = new Set(tasks.map((t) => t.id))
  if (orderedIds.length !== idSet.size || orderedIds.some((id) => !idSet.has(id))) {
    return false
  }
  // Два прохода: иначе при уникальном (projectId, sortOrder) первая же смена может
  // конфликтовать с соседней строкой, которая ещё держит старый порядок.
  const offset = 1_000_000
  let i = 0
  for (const taskId of orderedIds) {
    await TaskItems.update(ctx, { id: taskId, sortOrder: offset + i })
    i++
  }
  i = 0
  for (const taskId of orderedIds) {
    await TaskItems.update(ctx, { id: taskId, sortOrder: i })
    i++
  }
  return true
}
