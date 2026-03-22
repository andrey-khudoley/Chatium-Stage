import { Heap } from '@app/heap'

/**
 * Проекты внутри клиента.
 */
export const TaskProjects = Heap.Table('t__assistant__task_project__9Lp4qR', {
  userId: Heap.String({
    customMeta: { title: 'Владелец' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  clientId: Heap.String({
    customMeta: { title: 'ID клиента' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  name: Heap.String({
    customMeta: { title: 'Название проекта' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  sortOrder: Heap.Number({
    customMeta: { title: 'Порядок в списке' }
  })
})

export default TaskProjects

export type TaskProjectsRow = typeof TaskProjects.T
export type TaskProjectsRowJson = typeof TaskProjects.JsonT
