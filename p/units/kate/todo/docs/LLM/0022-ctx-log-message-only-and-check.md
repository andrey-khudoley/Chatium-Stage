# ctx.log только сообщение, ctx.account.log с payload и проверка @check

## Контекст

Пользователь попросил изменить логирование так, чтобы в ctx.account.log по-прежнему передавался payload, а в ctx.log — только сообщение без json. Затем вызван @check.

---

### Пользователь

Измени логирование так, чтобы в ctx.account.log всё передавалось с payload, как сейчас, а в ctx.log только сообщение, без json.

### Ассистент

**Сделано:**

- В **lib/logger.lib.ts** все вызовы ctx.log переведены на один аргумент — строку сообщения (основной лог и все debug-трассы). Вызов ctx.account.log(formattedMessage, logPayload) оставлен без изменений — полный payload с level и json по-прежнему передаётся только в account.log. JSDoc у writeServerLog обновлён: указано, что в ctx.log идёт только сообщение, в ctx.account.log — сообщение и payload.

---

### Пользователь

/s.chtm.aley.pro/check

### Ассистент

Выполнены проверки оркестратора.

**Сводка:** Затронут один файл — p/template_project/lib/logger.lib.ts. Стандарты кода и file-based роутинг соблюдены. Рантайм и импорты без изменений. Документация: в README добавлена запись в Changelog (ctx.log только сообщение, ctx.account.log с payload) и уточнено описание в «Текущее состояние». Лог переписки записан в docs/LLM/0022-ctx-log-message-only-and-check.md.

**Итог:** Проверка пройдена, замечаний нет.
