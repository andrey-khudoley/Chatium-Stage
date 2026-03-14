import { Heap } from '@app/heap'

/**
 * Папки бэклога в разделе «Мой день».
 * Задачи бэклога могут быть в папке (folderId) или без папки.
 * ID таблицы Heap: создать в панели Chatium и при необходимости заменить.
 */
export const BacklogFolders = Heap.Table('t__assistant__backlogfolder__Cd2Qw', {
  userId: Heap.String({
    customMeta: { title: 'ID пользователя' }
  }),
  name: Heap.String({
    customMeta: { title: 'Название папки' }
  }),
  sortOrder: Heap.Number({
    customMeta: { title: 'Порядок отображения' }
  })
})

export default BacklogFolders

export type BacklogFolderRow = typeof BacklogFolders.T
export type BacklogFolderRowJson = typeof BacklogFolders.JsonT
