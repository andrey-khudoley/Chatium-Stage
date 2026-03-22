import { Heap } from '@app/heap'

/**
 * Заметки блокнота журнала: привязка к пользователю, заголовок и текст.
 * Поля id, createdAt, updatedAt — системные (не объявляем в схеме).
 */
export const JournalNotes = Heap.Table('t__assistant__journal_note__8Kp2Nx', {
  userId: Heap.String({
    customMeta: { title: 'ID пользователя-владельца' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  title: Heap.String({
    customMeta: { title: 'Название заметки' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  content: Heap.String({
    customMeta: { title: 'Содержание' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  })
})

export default JournalNotes

export type JournalNotesRow = typeof JournalNotes.T
export type JournalNotesRowJson = typeof JournalNotes.JsonT
