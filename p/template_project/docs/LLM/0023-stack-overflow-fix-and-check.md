# Исправление рекурсии (Maximum call stack) и проверка @check

## Контекст

Пользователь сообщил об ошибке 500 при обращении к p/neso/crm/index: RangeError Maximum call stack size exceeded. Цепочка: writeServerLog → getLogLevel → getSetting → findByKey → writeServerLog. После исправления вызван @check.

---

### Пользователь

Проверь, мы сломали в template_project. В ответе при обращении к p/neso/crm/index приходит success false, statusCode 500, ошибка UgcRequestFailed с текстом runUgcRequest get p/neso/crm/index~ to account:4534:db failed (500): RangeError: Maximum call stack size exceeded. В underlyingStack видно: writeServerLog (logger.lib.ts), findByKey (settings.repo.ts), getSetting (settings.lib.ts), getLogLevel (settings.lib.ts), снова writeServerLog — то есть рекурсия.

### Ассистент

**Сделано:**

- Найдена циклическая зависимость: writeServerLog в начале вызывает getLogLevel; getLogLevel вызывает getSetting; getSetting вызывает repo.findByKey; findByKey в settings.repo вызывал loggerLib.writeServerLog, что снова запускало writeServerLog.
- В **repos/settings.repo.ts** удалены все вызовы loggerLib.writeServerLog. Репозиторий настроек не должен обращаться к логгеру, так как чтение уровня логирования и вебхука идёт через getSetting и findByKey, вызываемые из writeServerLog. В комментарии в репо зафиксировано, почему логирование не используется.
- В **lib/settings.lib.ts** ограничения уже были: getSetting, getLogLevel, getLogWebhook не логируют; проблема была только в репо.

**Причина:** Рекурсия при первом же вызове writeServerLog: для проверки уровня он вызывает getLogLevel → getSetting → findByKey, а findByKey логировал вход/выход через тот же writeServerLog.

**Итог:** После деплоя шаблона в p/neso/crm ошибка Maximum call stack size exceeded при обращении к index должна пропасть.

---

### Пользователь

/s.chtm.aley.pro/check

### Ассистент

Выполнены все проверки оркестратора по затронутому файлу p/template_project/repos/settings.repo.ts.

**Сводка по категориям:**

- **Стандарты кода:** Затронутый файл соответствует типичным правилам Chatium (отступы, кавычки, относительные импорты, только таблица настроек; 001-standards.md в проекте не найден, проверка по общим правилам). Нарушений нет.
- **File-based роутинг:** Файл не содержит роутов. Замечаний нет.
- **Рантайм и архитектура:** Исправление как раз устраняет критическую рекурсию; проверка на null перед удалением (row) сохранена. Критических рисков не выявлено.
- **Импорты и циклы:** docs/imports.md обновлён: у settings.repo указано отсутствие импорта logger.lib с пояснением про рекурсию. Цикл logger.lib → settings.lib → settings.repo разорван (settings.repo больше не импортирует logger.lib). Циклических зависимостей не обнаружено.
- **Документация:** Обновлены README (Changelog — исправление рекурсии, обновление imports.md), docs/data.md (в описании settings.repo добавлено пояснение про отсутствие логирования). docs/imports.md обновлён агентом imports-docs.
- **LLM:** Текущая переписка записана в docs/LLM/0023-stack-overflow-fix-and-check.md.

**Краткое резюме:** Код в порядке. Изменение в template_project устраняет рекурсию в цепочке логгер → настройки → репо; замечаний по стандартам, роутингу, рантайму и циклам нет. Документация приведена в соответствие с изменениями.

**Что сделать дальше:**

1. Закоммитить изменения в p/template_project/repos/settings.repo.ts, docs/imports.md, docs/data.md, README.md и docs/LLM/0023-stack-overflow-fix-and-check.md.
2. Задеплоить обновлённый шаблон в проект p/neso/crm (или дождаться автоматического деплоя после пуша), чтобы ошибка 500 при обращении к p/neso/crm/index исчезла на проде.
3. После любых дальнейших правок повторить @check при необходимости.
