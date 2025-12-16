import { Heap } from '@app/heap'

/**
 * Таблица для хранения заявок на гранты программы «Ключ. Академия»
 */
export const GrantApplicationsTable = Heap.Table('form_0912_grant_applications', {
  fullName: Heap.String({
    customMeta: { title: 'Имя и фамилия' }
  }),
  phone: Heap.String({
    customMeta: { title: 'Номер телефона' }
  }),
  email: Heap.String({
    customMeta: { title: 'Почта' }
  }),
  telegramNick: Heap.String({
    customMeta: { title: 'Ник в телеграм' }
  }),
  realEstateSituation: Heap.String({
    customMeta: { title: 'Ситуация в сфере недвижимости' }
  }),
  desiredResult: Heap.String({
    customMeta: { title: 'Желаемый результат' }
  }),
  whyDeserveGrant: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Почему должны получить грант' }
    })
  )
})

