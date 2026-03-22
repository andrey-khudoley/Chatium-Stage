import { Heap } from '@app/heap'

/** Статусы задачи */
export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'cancelled'] as const
export type TaskStatus = (typeof TASK_STATUSES)[number]

/**
 * Задачи внутри проекта.
 */
export const TaskItems = Heap.Table('t__assistant__task_item__2Vx8sT', {
  userId: Heap.String({
    customMeta: { title: 'Владелец' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  projectId: Heap.String({
    customMeta: { title: 'ID проекта' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  title: Heap.String({
    customMeta: { title: 'Заголовок' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  description: Heap.String({
    customMeta: { title: 'Описание' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  /** 1 — срочно, 4 — низкий */
  priority: Heap.Number({
    customMeta: { title: 'Приоритет (1–4)' }
  }),
  status: Heap.String({
    customMeta: { title: 'Статус' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  sortOrder: Heap.Number({
    customMeta: { title: 'Порядок в проекте' }
  })
})

export default TaskItems

export type TaskItemsRow = typeof TaskItems.T
export type TaskItemsRowJson = typeof TaskItems.JsonT
