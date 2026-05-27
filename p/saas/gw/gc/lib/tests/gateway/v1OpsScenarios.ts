/**
 * Реестр сценариев интеграционного прогона /v1/{op} (gateway-testing-strategy.md §3.4).
 *
 * Каждая запись описывает: фазу прогона (1-каталог/Heap, 2-производитель, 3-потребитель,
 * 4-деструктор), зависимости от других op в этом же сьюите, требуемые Heap-ключи
 * `gc_itest_*` (§5.8 manual), сборку args из контекста и захват id из ответа в контекст.
 *
 * Цель — чтобы UI на странице `/web/tests` видел статус и сырой ответ GetCourse для
 * каждого роута `api/v1/*`. Если для op нет производителя или нет Heap-ключа,
 * соответствующий запуск помечается `skip` с человеческим объяснением.
 */
import {
  V1_OPS_HEAP_KEYS,
  V1_OPS_TESTER_EMAIL,
  V1_OPS_ARTIFACT_PREFIX,
  type V1OpsRunContext
} from './v1OpsRunContext'

/** Поля настроек Heap, прочитанные перед прогоном (`gc_itest_*`). */
export type V1OpsHeapBag = {
  offerId?: string | number
  lessonId?: string | number
  dialogId?: string | number
  telegramChatId?: string
  departmentId?: string | number
  diplomaTemplateId?: string | number
  moderatorId?: string | number
  webinarCommentId?: string | number
  webhookEventId?: string | number
  webhookEventObjectId?: string | number
  webhookUri?: string
}

export type ScenarioBuildResult = { skip: string } | { args: Record<string, unknown> }

export type ScenarioBuildCtx = {
  runCtx: V1OpsRunContext
  heap: V1OpsHeapBag
}

export type V1OpScenario = {
  /** Имя `op` (совпадает с `operationsCatalog[].op`). */
  op: string
  /** Фаза §3.1 стратегии: 1 — каталог/Heap, 2 — производитель, 3 — потребитель, 4 — деструктор. */
  phase: 1 | 2 | 3 | 4
  /** Список op-ов, которые должны успешно отработать в этом сьюите (по §3.4). */
  dependsOn?: readonly string[]
  /** Список Heap-ключей `gc_itest_*` (§5.8 manual), без которых `build` обязан вернуть `skip`. */
  heapKeys?: readonly string[]
  /** Сборка args из контекста и Heap. Возвращает `skip` при недостаточных данных. */
  build: (ctx: ScenarioBuildCtx) => ScenarioBuildResult
  /** Захват полезных id из распарсенного ответа gateway в `runCtx` для последующих сценариев. */
  capture?: (parsedData: unknown, runCtx: V1OpsRunContext) => void
  /** Краткая подсказка для UI: что именно делает сценарий. */
  hint?: string
}

/** Безопасное чтение поля по пути типа "result.user_id". */
function pickPath(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) return undefined
  let cur: unknown = obj
  for (const part of path.split('.')) {
    if (cur === null || cur === undefined) return undefined
    if (typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

function asNumberLike(v: unknown): number | string | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string' && v.length > 0) return v
  return undefined
}

function firstItem(arr: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null) {
    return arr[0] as Record<string, unknown>
  }
  return undefined
}

const SCENARIOS_RAW: V1OpScenario[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // Фаза 1. Каталоги без аргументов / Heap-зависимые без производителя
  // ───────────────────────────────────────────────────────────────────────────
  {
    op: 'getCustomFields',
    phase: 1,
    hint: 'Legacy export: список кастомных полей школы. Без аргументов.',
    build: () => ({ args: {} })
  },
  {
    op: 'getAllGroups',
    phase: 1,
    hint: 'Каталог групп аккаунта; запоминает первый groupId для exportGroupUsers/setUserGroups.',
    build: () => ({ args: {} }),
    capture: (parsed, runCtx) => {
      const groups =
        (pickPath(parsed, 'data.result') as unknown) ??
        (pickPath(parsed, 'data.groups') as unknown) ??
        (pickPath(parsed, 'result') as unknown) ??
        (pickPath(parsed, 'groups') as unknown)
      const first = firstItem(groups)
      if (first) {
        const id = asNumberLike(first.id ?? first.groupId ?? first.group_id)
        if (id !== undefined) runCtx.groupId = id
      }
    }
  },
  {
    op: 'getAllPersonalManagers',
    phase: 1,
    hint: 'Каталог персональных менеджеров; запоминает первый managerId.',
    build: () => ({ args: {} }),
    capture: (parsed, runCtx) => {
      const list =
        (pickPath(parsed, 'data.result') as unknown) ??
        (pickPath(parsed, 'data.managers') as unknown) ??
        (pickPath(parsed, 'result') as unknown)
      const first = firstItem(list)
      if (first) {
        const id = asNumberLike(first.id ?? first.userId ?? first.user_id ?? first.managerId)
        if (id !== undefined) {
          runCtx.managerId = id
          if (runCtx.moderatorId === undefined) runCtx.moderatorId = id
        }
      }
    }
  },
  {
    op: 'getTrainings',
    phase: 1,
    hint: 'Каталог тренингов школы.',
    build: () => ({ args: {} })
  },
  {
    op: 'getOffers',
    phase: 1,
    hint: 'Каталог предложений школы.',
    build: () => ({ args: {} })
  },
  {
    op: 'getOffersTags',
    phase: 1,
    hint: 'Каталог тегов предложений (с пагинацией).',
    build: () => ({ args: { limit: 10, offset: 0 } })
  },
  {
    op: 'getDealCancelReasons',
    phase: 1,
    hint: 'Справочник причин отмены сделок.',
    build: () => ({ args: {} })
  },
  {
    op: 'getDealsTags',
    phase: 1,
    hint: 'Справочник тегов сделок (с пагинацией).',
    build: () => ({ args: { limit: 10, offset: 0 } })
  },
  {
    op: 'getAllWebinars',
    phase: 1,
    hint: 'Каталог вебинаров; запоминает webinarId и список webinarIds для getWebinarsByIds.',
    build: () => ({ args: {} }),
    capture: (parsed, runCtx) => {
      const list =
        (pickPath(parsed, 'data.result') as unknown) ??
        (pickPath(parsed, 'data.webinars') as unknown) ??
        (pickPath(parsed, 'result') as unknown)
      if (Array.isArray(list)) {
        const ids = list
          .map((w) => {
            if (w && typeof w === 'object') {
              const o = w as Record<string, unknown>
              return asNumberLike(o.id ?? o.webinarId)
            }
            return undefined
          })
          .filter((x): x is number | string => x !== undefined)
        if (ids.length > 0) {
          runCtx.webinarId = ids[0]
          runCtx.webinarIds = ids.slice(0, 5)
        }
      }
    }
  },
  {
    op: 'getOfferById',
    phase: 1,
    heapKeys: [V1_OPS_HEAP_KEYS.OFFER_ID],
    hint: 'Чтение конкретного предложения. offerId берётся из Heap gc_itest_offer_id.',
    build: ({ heap }) => {
      const offerId = heap.offerId
      if (offerId === undefined) {
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.OFFER_ID}` }
      }
      return { args: { offerId } }
    }
  },
  {
    op: 'getDialogHistory',
    phase: 1,
    heapKeys: [V1_OPS_HEAP_KEYS.DIALOG_ID],
    hint: 'История диалога: dialogId — из Heap gc_itest_dialog_id.',
    build: ({ heap }) => {
      if (heap.dialogId === undefined) {
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.DIALOG_ID}` }
      }
      return { args: { dialogId: heap.dialogId, limit: 10 } }
    }
  },
  {
    op: 'getUserByTelegramChatId',
    phase: 1,
    heapKeys: [V1_OPS_HEAP_KEYS.TELEGRAM_CHAT_ID],
    hint: 'Поиск пользователя по chatId Telegram (Heap gc_itest_telegram_chat_id).',
    build: ({ heap }) => {
      if (heap.telegramChatId === undefined) {
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.TELEGRAM_CHAT_ID}` }
      }
      return { args: { chatId: heap.telegramChatId } }
    }
  },
  {
    op: 'getLessonAnswers',
    phase: 1,
    heapKeys: [V1_OPS_HEAP_KEYS.LESSON_ID],
    hint: 'Ответы на урок: lessonId из Heap gc_itest_lesson_id; запоминает lessonAnswerId.',
    build: ({ heap }) => {
      if (heap.lessonId === undefined) {
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.LESSON_ID}` }
      }
      return { args: { lessonId: heap.lessonId } }
    },
    capture: (parsed, runCtx) => {
      const list =
        (pickPath(parsed, 'data.result') as unknown) ??
        (pickPath(parsed, 'data.answers') as unknown) ??
        (pickPath(parsed, 'result') as unknown)
      const first = firstItem(list)
      if (first) {
        const id = asNumberLike(first.id ?? first.lessonAnswerId ?? first.answerId)
        if (id !== undefined) runCtx.lessonAnswerId = id
      }
    }
  },
  {
    op: 'setUri',
    phase: 1,
    heapKeys: [
      V1_OPS_HEAP_KEYS.WEBHOOK_EVENT_ID,
      V1_OPS_HEAP_KEYS.WEBHOOK_EVENT_OBJECT_ID,
      V1_OPS_HEAP_KEYS.WEBHOOK_URI
    ],
    hint: 'Регистрация вебхука: event_id/event_object_id/uri из Heap.',
    build: ({ heap }) => {
      if (
        heap.webhookEventId === undefined ||
        heap.webhookEventObjectId === undefined ||
        heap.webhookUri === undefined
      ) {
        return { skip: 'Нужны Heap-ключи gc_itest_webhook_event_id, _event_object_id и _uri' }
      }
      return {
        args: {
          event_id: Number(heap.webhookEventId),
          event_object_id: Number(heap.webhookEventObjectId),
          uri: heap.webhookUri
        }
      }
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Фаза 2. Производители (создают тестовые сущности и наполняют контекст)
  // ───────────────────────────────────────────────────────────────────────────
  {
    op: 'addUser',
    phase: 2,
    hint: `Создание/импорт пользователя с email ${V1_OPS_TESTER_EMAIL}; запоминает userId.`,
    build: () => ({
      args: {
        params: {
          user: {
            email: V1_OPS_TESTER_EMAIL
          }
        }
      }
    }),
    capture: (parsed, runCtx) => {
      const userId =
        asNumberLike(pickPath(parsed, 'data.result.user_id')) ??
        asNumberLike(pickPath(parsed, 'data.user_id')) ??
        asNumberLike(pickPath(parsed, 'data.result.id')) ??
        asNumberLike(pickPath(parsed, 'data.id'))
      if (userId !== undefined) runCtx.userId = userId
    }
  },
  {
    op: 'createDeal',
    phase: 2,
    dependsOn: ['addUser'],
    heapKeys: [V1_OPS_HEAP_KEYS.OFFER_ID],
    hint: 'Создание сделки на тестового пользователя; offerId из Heap. Запоминает dealId.',
    build: ({ runCtx, heap }) => {
      if (heap.offerId === undefined) {
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.OFFER_ID}` }
      }
      const offerCode = String(heap.offerId)
      return {
        args: {
          params: {
            user: { email: runCtx.testerEmail },
            deal: { offer_code: offerCode }
          }
        }
      }
    },
    capture: (parsed, runCtx) => {
      const dealId =
        asNumberLike(pickPath(parsed, 'data.result.deal_id')) ??
        asNumberLike(pickPath(parsed, 'data.deal_id')) ??
        asNumberLike(pickPath(parsed, 'data.result.id'))
      if (dealId !== undefined) runCtx.dealId = dealId
    }
  },
  {
    op: 'exportUsers',
    phase: 2,
    hint: 'Старт экспорта пользователей; запоминает exportId для getExportResult.',
    build: () => ({ args: {} }),
    capture: (parsed, runCtx) => {
      const exportId =
        asNumberLike(pickPath(parsed, 'data.export_id')) ??
        asNumberLike(pickPath(parsed, 'data.info.export_id')) ??
        asNumberLike(pickPath(parsed, 'data.id'))
      if (exportId !== undefined) runCtx.exportId = exportId
    }
  },
  {
    op: 'exportDeals',
    phase: 2,
    hint: 'Старт экспорта сделок (резервный источник exportId).',
    build: () => ({ args: {} }),
    capture: (parsed, runCtx) => {
      if (runCtx.exportId !== undefined) return
      const exportId =
        asNumberLike(pickPath(parsed, 'data.export_id')) ??
        asNumberLike(pickPath(parsed, 'data.info.export_id'))
      if (exportId !== undefined) runCtx.exportId = exportId
    }
  },
  {
    op: 'exportPayments',
    phase: 2,
    hint: 'Старт экспорта платежей (резервный источник exportId).',
    build: () => ({ args: {} }),
    capture: (parsed, runCtx) => {
      if (runCtx.exportId !== undefined) return
      const exportId =
        asNumberLike(pickPath(parsed, 'data.export_id')) ??
        asNumberLike(pickPath(parsed, 'data.info.export_id'))
      if (exportId !== undefined) runCtx.exportId = exportId
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Фаза 3. Потребители — читают и используют сущности из контекста
  // ───────────────────────────────────────────────────────────────────────────
  {
    op: 'getExportResult',
    phase: 3,
    dependsOn: ['exportUsers'],
    hint: 'Получение готового файла экспорта по exportId.',
    build: ({ runCtx }) => {
      if (runCtx.exportId === undefined) {
        return { skip: 'Нет exportId — exportUsers/exportDeals/exportPayments не отработали' }
      }
      return { args: { exportId: Number(runCtx.exportId) } }
    }
  },
  {
    op: 'exportGroupUsers',
    phase: 3,
    dependsOn: ['getAllGroups'],
    hint: 'Экспорт пользователей группы; groupId из getAllGroups.',
    build: ({ runCtx }) => {
      if (runCtx.groupId === undefined) {
        return { skip: 'Нет groupId — getAllGroups не отработал' }
      }
      return { args: { groupId: Number(runCtx.groupId) } }
    }
  },
  {
    op: 'getDealCalls',
    phase: 3,
    dependsOn: ['createDeal'],
    hint: 'История звонков по сделке; dealId из createDeal.',
    build: ({ runCtx }) => {
      if (runCtx.dealId === undefined) return { skip: 'Нет dealId — createDeal не отработал' }
      return { args: { dealId: Number(runCtx.dealId) } }
    }
  },
  {
    op: 'getDealComments',
    phase: 3,
    dependsOn: ['createDeal'],
    hint: 'Комментарии сделки; dealId из createDeal.',
    build: ({ runCtx }) => {
      if (runCtx.dealId === undefined) return { skip: 'Нет dealId — createDeal не отработал' }
      return { args: { dealId: Number(runCtx.dealId) } }
    }
  },
  {
    op: 'getDealCustomFields',
    phase: 3,
    dependsOn: ['createDeal'],
    hint: 'Кастомные поля сделки; dealId из createDeal.',
    build: ({ runCtx }) => {
      if (runCtx.dealId === undefined) return { skip: 'Нет dealId — createDeal не отработал' }
      return { args: { dealId: Number(runCtx.dealId) } }
    }
  },
  {
    op: 'getDealFields',
    phase: 3,
    dependsOn: ['createDeal'],
    hint: 'Поля сделки; dealId из createDeal.',
    build: ({ runCtx }) => {
      if (runCtx.dealId === undefined) return { skip: 'Нет dealId — createDeal не отработал' }
      return { args: { dealId: Number(runCtx.dealId) } }
    }
  },
  {
    op: 'addCommentToDeal',
    phase: 3,
    dependsOn: ['createDeal', 'addUser'],
    hint: 'Комментарий к сделке (артефакт помечается префиксом).',
    build: ({ runCtx }) => {
      if (runCtx.dealId === undefined) return { skip: 'Нет dealId — createDeal не отработал' }
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return {
        args: {
          dealId: Number(runCtx.dealId),
          userId: Number(runCtx.userId),
          text: `${V1_OPS_ARTIFACT_PREFIX} test comment from gateway integration suite`
        }
      }
    }
  },
  {
    op: 'addDealPositions',
    phase: 3,
    dependsOn: ['createDeal'],
    heapKeys: [V1_OPS_HEAP_KEYS.OFFER_ID],
    hint: 'Добавление позиции в сделку: использует offerId из Heap.',
    build: ({ runCtx, heap }) => {
      if (runCtx.dealId === undefined) return { skip: 'Нет dealId — createDeal не отработал' }
      const offerNum = Number(heap.offerId)
      if (!Number.isFinite(offerNum)) {
        return { skip: `${V1_OPS_HEAP_KEYS.OFFER_ID} не приводится к числу` }
      }
      return {
        args: {
          dealId: Number(runCtx.dealId),
          positions: [{ offerId: offerNum, price: 0, quantity: 1 }]
        }
      }
    }
  },
  {
    op: 'removeDealPositions',
    phase: 3,
    dependsOn: ['createDeal'],
    hint: 'Удаление позиций сделки. Без реальных positionIds — отправляется пустой массив (ожидаем 4xx).',
    build: ({ runCtx }) => {
      if (runCtx.dealId === undefined) return { skip: 'Нет dealId — createDeal не отработал' }
      return { args: { dealId: Number(runCtx.dealId), positionIds: [] } }
    }
  },
  {
    op: 'addCommentToDialog',
    phase: 3,
    dependsOn: ['addUser'],
    heapKeys: [V1_OPS_HEAP_KEYS.DIALOG_ID],
    hint: 'Комментарий в диалоге; dialogId — Heap, userId — addUser.',
    build: ({ runCtx, heap }) => {
      if (heap.dialogId === undefined)
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.DIALOG_ID}` }
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return {
        args: {
          dialogId: Number(heap.dialogId),
          commentText: `${V1_OPS_ARTIFACT_PREFIX} dialog comment`,
          transport: [],
          userId: Number(runCtx.userId)
        }
      }
    }
  },
  {
    op: 'changeDepartment',
    phase: 3,
    heapKeys: [V1_OPS_HEAP_KEYS.DIALOG_ID, V1_OPS_HEAP_KEYS.DEPARTMENT_ID],
    hint: 'Смена отдела диалога; dialogId и newDepartmentId из Heap.',
    build: ({ heap }) => {
      if (heap.dialogId === undefined)
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.DIALOG_ID}` }
      if (heap.departmentId === undefined)
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.DEPARTMENT_ID}` }
      return {
        args: { dialogId: Number(heap.dialogId), newDepartmentId: Number(heap.departmentId) }
      }
    }
  },
  {
    op: 'closeDialog',
    phase: 3,
    heapKeys: [V1_OPS_HEAP_KEYS.DIALOG_ID],
    hint: 'Закрытие диалога; dialogId из Heap.',
    build: ({ heap }) => {
      if (heap.dialogId === undefined)
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.DIALOG_ID}` }
      return { args: { dialogId: Number(heap.dialogId) } }
    }
  },
  {
    op: 'addNote',
    phase: 3,
    heapKeys: [V1_OPS_HEAP_KEYS.DIALOG_ID],
    hint: 'Заметка в диалоге; артефакт помечается префиксом.',
    build: ({ heap }) => {
      if (heap.dialogId === undefined)
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.DIALOG_ID}` }
      return { args: { dialogId: Number(heap.dialogId), text: `${V1_OPS_ARTIFACT_PREFIX} note` } }
    }
  },
  {
    op: 'addCommentToLessonAnswer',
    phase: 3,
    dependsOn: ['addUser', 'getLessonAnswers'],
    hint: 'Комментарий к ответу на урок; lessonAnswerId — из getLessonAnswers.',
    build: ({ runCtx }) => {
      if (runCtx.lessonAnswerId === undefined) {
        return { skip: 'Нет lessonAnswerId — getLessonAnswers не отработал' }
      }
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return {
        args: {
          lessonAnswerId: Number(runCtx.lessonAnswerId),
          text: `${V1_OPS_ARTIFACT_PREFIX} lesson comment`,
          userId: Number(runCtx.userId)
        }
      }
    }
  },
  {
    op: 'changeStatusAnswers',
    phase: 3,
    dependsOn: ['getLessonAnswers'],
    hint: 'Смена статуса ответа; lessonAnswerId — из getLessonAnswers.',
    build: ({ runCtx }) => {
      if (runCtx.lessonAnswerId === undefined) {
        return { skip: 'Нет lessonAnswerId — getLessonAnswers не отработал' }
      }
      return { args: { lessonAnswerId: Number(runCtx.lessonAnswerId), status: 'in_progress' } }
    }
  },
  {
    op: 'addUserBalance',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Изменение баланса пользователя на тестовую сумму 0 (нейтрально).',
    build: ({ runCtx }) => {
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return {
        args: {
          value: 0,
          type: 1,
          comment: `${V1_OPS_ARTIFACT_PREFIX} balance probe`,
          email: runCtx.testerEmail
        }
      }
    }
  },
  {
    op: 'addUserGroups',
    phase: 3,
    dependsOn: ['addUser', 'getAllGroups'],
    hint: 'Добавить пользователя в первую группу из getAllGroups.',
    build: ({ runCtx }) => {
      if (runCtx.groupId === undefined) return { skip: 'Нет groupId — getAllGroups не отработал' }
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return { args: { groups: [Number(runCtx.groupId)], email: runCtx.testerEmail } }
    }
  },
  {
    op: 'removeUserGroups',
    phase: 3,
    dependsOn: ['addUserGroups'],
    hint: 'Зеркало addUserGroups: удаление пользователя из той же группы.',
    build: ({ runCtx }) => {
      if (runCtx.groupId === undefined) return { skip: 'Нет groupId — getAllGroups не отработал' }
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return { args: { groups: [Number(runCtx.groupId)], email: runCtx.testerEmail } }
    }
  },
  {
    op: 'setUserGroups',
    phase: 3,
    dependsOn: ['addUser', 'getAllGroups'],
    hint: 'Заменить набор групп пользователя на одну группу из getAllGroups.',
    build: ({ runCtx }) => {
      if (runCtx.groupId === undefined) return { skip: 'Нет groupId — getAllGroups не отработал' }
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return { args: { groups: [Number(runCtx.groupId)], email: runCtx.testerEmail } }
    }
  },
  {
    op: 'setPersonalManager',
    phase: 3,
    dependsOn: ['addUser', 'getAllPersonalManagers'],
    hint: 'Назначить персонального менеджера тестовому пользователю.',
    build: ({ runCtx }) => {
      if (runCtx.managerId === undefined) {
        return { skip: 'Нет managerId — getAllPersonalManagers не отработал' }
      }
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return { args: { managerId: Number(runCtx.managerId), email: runCtx.testerEmail } }
    }
  },
  {
    op: 'createDiploma',
    phase: 3,
    dependsOn: ['addUser'],
    heapKeys: [V1_OPS_HEAP_KEYS.DIPLOMA_TEMPLATE_ID],
    hint: 'Создать диплом по шаблону Heap gc_itest_diploma_template_id.',
    build: ({ runCtx, heap }) => {
      if (heap.diplomaTemplateId === undefined) {
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.DIPLOMA_TEMPLATE_ID}` }
      }
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return {
        args: {
          templateId: Number(heap.diplomaTemplateId),
          allowDuplicates: true,
          email: runCtx.testerEmail
        }
      }
    }
  },
  {
    op: 'getUserAnswers',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Все ответы тестового пользователя (по email).',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserBalance',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Баланс тестового пользователя (по email).',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserCustomFields',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Кастомные поля тестового пользователя.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserDeals',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Сделки тестового пользователя.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserDiplomas',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Дипломы тестового пользователя.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserFields',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Поля профиля тестового пользователя; уточняет userId, если он ещё не зафиксирован.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } }),
    capture: (parsed, runCtx) => {
      if (runCtx.userId !== undefined) return
      const id =
        asNumberLike(pickPath(parsed, 'data.result.user.id')) ??
        asNumberLike(pickPath(parsed, 'data.user.id')) ??
        asNumberLike(pickPath(parsed, 'data.id'))
      if (id !== undefined) runCtx.userId = id
    }
  },
  {
    op: 'getUserGoalRecords',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Цели тестового пользователя.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserGroups',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Группы, в которых состоит тестовый пользователь.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserLessonAnswers',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Ответы пользователя на уроки.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserPurchases',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Покупки тестового пользователя.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserSchedule',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Расписание тестового пользователя.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'getUserTrainings',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Тренинги тестового пользователя.',
    build: ({ runCtx }) => ({ args: { email: runCtx.testerEmail } })
  },
  {
    op: 'updateUserCustomFields',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Обновление кастомных полей пустым объектом (нейтрально).',
    build: ({ runCtx }) => ({ args: { customFields: {}, email: runCtx.testerEmail } })
  },
  {
    op: 'updateUserFields',
    phase: 3,
    dependsOn: ['addUser'],
    hint: 'Обновление поля comment у тестового пользователя (помечается префиксом).',
    build: ({ runCtx }) => ({
      args: { comment: `${V1_OPS_ARTIFACT_PREFIX} update probe`, email: runCtx.testerEmail }
    })
  },
  {
    op: 'addCommentToWebinar',
    phase: 3,
    dependsOn: ['getAllWebinars'],
    hint: 'Комментарий на вебинаре; moderatorId — Heap или getAllPersonalManagers.',
    build: ({ runCtx, heap }) => {
      if (runCtx.webinarId === undefined) {
        return { skip: 'Нет webinarId — getAllWebinars не отработал' }
      }
      const moderator = heap.moderatorId ?? runCtx.moderatorId
      if (moderator === undefined) {
        return {
          skip: `Нет moderatorId (${V1_OPS_HEAP_KEYS.MODERATOR_ID} или getAllPersonalManagers)`
        }
      }
      return {
        args: {
          moderatorId: Number(moderator),
          webinarId: Number(runCtx.webinarId),
          text: `${V1_OPS_ARTIFACT_PREFIX} webinar comment`
        }
      }
    }
  },
  {
    op: 'getWebinarsByIds',
    phase: 3,
    dependsOn: ['getAllWebinars'],
    hint: 'Подробные данные по списку вебинаров.',
    build: ({ runCtx }) => {
      if (!runCtx.webinarIds || runCtx.webinarIds.length === 0) {
        return { skip: 'Нет webinarIds — getAllWebinars не отработал' }
      }
      return { args: { ids: runCtx.webinarIds.map((x) => Number(x)) } }
    }
  },
  {
    op: 'moderateWebinarComment',
    phase: 3,
    dependsOn: ['getAllWebinars'],
    heapKeys: [V1_OPS_HEAP_KEYS.WEBINAR_COMMENT_ID],
    hint: 'Модерация комментария вебинара (commentId — Heap).',
    build: ({ runCtx, heap }) => {
      if (runCtx.webinarId === undefined) {
        return { skip: 'Нет webinarId — getAllWebinars не отработал' }
      }
      if (heap.webinarCommentId === undefined) {
        return { skip: `Не задан Heap-ключ ${V1_OPS_HEAP_KEYS.WEBINAR_COMMENT_ID}` }
      }
      return {
        args: {
          webinarId: Number(runCtx.webinarId),
          commentId: Number(heap.webinarCommentId),
          action: 'delete'
        }
      }
    }
  },
  {
    op: 'moderateWebinarUser',
    phase: 3,
    dependsOn: ['getAllWebinars', 'addUser'],
    hint: 'Модерация пользователя вебинара (userType=1 — обычный пользователь).',
    build: ({ runCtx }) => {
      if (runCtx.webinarId === undefined) {
        return { skip: 'Нет webinarId — getAllWebinars не отработал' }
      }
      if (runCtx.userId === undefined) return { skip: 'Нет userId — addUser не отработал' }
      return {
        args: {
          webinarId: Number(runCtx.webinarId),
          userId: Number(runCtx.userId),
          userType: 1,
          action: 'kick'
        }
      }
    }
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Фаза 4. Деструктор: переводим тестовую сделку в status:false (§3.5).
  // ───────────────────────────────────────────────────────────────────────────
  {
    op: 'updateDealFields',
    phase: 4,
    dependsOn: ['createDeal'],
    hint: 'Деструктор фазы 4: status:"false" (false-сделка) — снимает артефакт createDeal.',
    build: ({ runCtx }) => {
      if (runCtx.dealId === undefined) return { skip: 'Нет dealId — createDeal не отработал' }
      return { args: { dealId: Number(runCtx.dealId), status: 'false' } }
    }
  }
]

/** Реестр сценариев по op (Map для O(1) поиска). */
export const V1_OPS_SCENARIOS: ReadonlyMap<string, V1OpScenario> = new Map(
  SCENARIOS_RAW.map((s) => [s.op, s])
)

/** Линейный порядок исполнения: фаза → исходный порядок внутри фазы. */
export const V1_OPS_EXECUTION_ORDER: readonly V1OpScenario[] = [...SCENARIOS_RAW].sort((a, b) => {
  if (a.phase !== b.phase) return a.phase - b.phase
  return SCENARIOS_RAW.indexOf(a) - SCENARIOS_RAW.indexOf(b)
})
