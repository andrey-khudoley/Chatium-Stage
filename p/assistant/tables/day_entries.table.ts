import { Heap } from '@app/heap'

/**
 * Записи «Мой день»: Утро / День / Вечер на дату.
 * Одна запись на пользователя и дату (userId + date).
 * ID таблицы Heap: создать в панели Chatium и при необходимости заменить.
 */
export const DayEntries = Heap.Table('t__assistant__dayentry__Ab1Qw', {
  userId: Heap.String({
    customMeta: { title: 'ID пользователя' }
  }),
  date: Heap.String({
    customMeta: { title: 'Дата (YYYY-MM-DD)' }
  }),
  morningText: Heap.String({
    customMeta: { title: 'Текст блока «Утро»' }
  }),
  dayText: Heap.String({
    customMeta: { title: 'Текст блока «День»' }
  }),
  eveningText: Heap.String({
    customMeta: { title: 'Текст блока «Вечер»' }
  })
})

export default DayEntries

export type DayEntryRow = typeof DayEntries.T
export type DayEntryRowJson = typeof DayEntries.JsonT
