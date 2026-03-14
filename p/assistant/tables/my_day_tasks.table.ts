import { Heap } from '@app/heap'

/**
 * Задачи раздела «Мой день»: главные, дополнительные, бэклог.
 * section: main | additional — привязаны к date; backlog — без даты, опционально folderId.
 * completedAt задаётся при отметке чекбокса «выполнено».
 * ID таблицы Heap: создать в панели Chatium и при необходимости заменить.
 */
export const MyDayTasks = Heap.Table('t__assistant__mydaytask__Ef3Qw', {
  userId: Heap.String({
    customMeta: { title: 'ID пользователя' }
  }),
  section: Heap.String({
    customMeta: { title: 'Раздел: main | additional | backlog' }
  }),
  date: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Дата (YYYY-MM-DD), для main/additional' }
    })
  ),
  folderId: Heap.Optional(
    Heap.String({
      customMeta: { title: 'ID папки бэклога (опционально)' }
    })
  ),
  title: Heap.String({
    customMeta: { title: 'Текст задачи' }
  }),
  completedAt: Heap.Optional(
    Heap.DateTime({
      customMeta: { title: 'Дата/время выполнения (если отмечено)' }
    })
  ),
  sortOrder: Heap.Number({
    customMeta: { title: 'Порядок в списке/папке' }
  })
})

export default MyDayTasks

export type MyDayTaskRow = typeof MyDayTasks.T
export type MyDayTaskRowJson = typeof MyDayTasks.JsonT
