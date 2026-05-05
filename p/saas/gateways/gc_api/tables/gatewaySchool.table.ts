import { Heap } from '@app/heap'

/** Школа клиента: ключ API GC (шифр.), Bearer-хэш, метаданные. */
export const GatewaySchool = Heap.Table('t__gc-api-gateway__school__7Np2Qx', {
  schoolId: Heap.String({
    customMeta: { title: 'Идентификатор школы (slug/id)' },
    searchable: { langs: ['ru', 'en'], embeddings: false }
  }),
  schoolSlug: Heap.String({
    customMeta: { title: 'Поддомен GC (myschool.getcourse.ru)' }
  }),
  schoolApiKeyCiphertext: Heap.String({
    customMeta: { title: 'Ключ школы GC (AES-GCM ciphertext, base64)' }
  }),
  schoolApiKeyIv: Heap.String({
    customMeta: { title: 'IV для ключа школы' }
  }),
  devKeyOverrideCiphertext: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Переопределение dev-ключа (зашифровано)' }
    })
  ),
  devKeyOverrideIv: Heap.Optional(
    Heap.String({
      customMeta: { title: 'IV для переопределения dev-ключа' }
    })
  ),
  clientTokenHash: Heap.String({
    customMeta: { title: 'Хэш Bearer-токена клиента' }
  }),
  clientTokenSalt: Heap.String({
    customMeta: { title: 'Соль для токена' }
  }),
  allowedOps: Heap.Optional(
    Heap.Any({
      customMeta: { title: 'Allowlist op (массив строк или null — все из каталога)' }
    })
  ),
  isEnabled: Heap.Boolean({
    customMeta: { title: 'Школа активна' }
  }),
  createdAt: Heap.Number({
    customMeta: { title: 'Создано (Unix ms)' }
  }),
  lastUsedAt: Heap.Optional(
    Heap.Number({
      customMeta: { title: 'Последний invoke (Unix ms)' }
    })
  ),
  notes: Heap.Optional(
    Heap.String({
      customMeta: { title: 'Заметки админа' }
    })
  )
})

export default GatewaySchool

export type GatewaySchoolRow = typeof GatewaySchool.T
export type GatewaySchoolRowJson = typeof GatewaySchool.JsonT
