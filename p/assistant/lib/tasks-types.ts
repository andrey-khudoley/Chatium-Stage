/** DTO для UI и API задач (без зависимостей от Heap — безопасно для Vue). */

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'cancelled'

export type TaskClientDto = { id: string; name: string; sortOrder: number }

export type TaskProjectDto = { id: string; clientId: string; name: string; sortOrder: number }

export type TaskItemDto = {
  id: string
  projectId: string
  title: string
  description: string
  priority: number
  status: TaskStatus
  sortOrder: number
}

export type TasksTreeDto = {
  clients: TaskClientDto[]
  projects: TaskProjectDto[]
  tasks: TaskItemDto[]
}
