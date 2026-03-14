import { Heap } from '@app/heap'

/**
 * Таблица заметок блокнота.
 * Заметки привязаны к пользователю (userId).
 * ID таблицы Heap: создать в панели Chatium и при необходимости заменить.
 */
export const NotebookNotes = Heap.Table('t__assistant__note__2Kp9Qw', {
  userId: Heap.String({
    customMeta: { title: 'ID пользователя (владелец)' }
  }),
  title: Heap.String({
    customMeta: { title: 'Заголовок заметки' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  contentMarkdown: Heap.String({
    customMeta: { title: 'Контент (Markdown)' }
  })
  // createdAt и updatedAt — системные поля Heap, не объявляем
})

export default NotebookNotes

export type NotebookNoteRow = typeof NotebookNotes.T
export type NotebookNoteRowJson = typeof NotebookNotes.JsonT
