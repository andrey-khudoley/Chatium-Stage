# Рефакторинг архитектуры, логирования и админки (13.03.2026)

## Контекст

Полный конвейер разработки для проекта p/saas/chat: приведение к стандартной архитектуре Chatium (006-arch.md, 001-standards.md), введение централизованного логирования по образцу p/template_project/lib/logger.lib.ts, админка для уровня логирования и счётчика событий, тесты и обновление документации.

## Выполненные изменения (без кода)

### Конфигурация и роутинг

- Добавлен **config/routes.tsx**: PROJECT_ROOT, ROUTES (index, invite, adminLogs, api styles/manifest), withProjectRoot(), getFullUrl().

### Таблицы и репозитории

- **tables/server-logs.table.ts** — серверные логи (message, payload, severity, level, timestamp).
- **tables/chat-metrics.table.ts** — счётчики (metricKey, value, updatedAt).
- **repos/server-logs.repo.ts** — create (без логирования внутри).
- **repos/chat-metrics.repo.ts** — get, getAll, increment, reset; runWithExclusiveLock для конкурентности.

### Логирование

- **lib/logger-settings.lib.ts** — getLogLevel, setLogLevel (app-settings, ключ log_level), getMetrics, resetMetrics, incrementMetric (chat-metrics.repo).
- **lib/logger.lib.ts** — shouldLogByLevel, writeServerLog (ctx.log, ctx.account.log, server-logs Heap); уровень из logger-settings.

### API логирования

- **api/logging/get-level.ts** — GET, Admin, возврат { level }.
- **api/logging/set-level.ts** — POST, Admin, body { level }.
- **api/logging/get-metrics.ts** — GET, Admin, возврат { metrics }.
- **api/logging/reset-metrics.ts** — POST, Admin, сброс счётчиков.

### Админка

- **components/AdminSettings.vue** — добавлена секция «Логирование и метрики»: выбор уровня, сохранение, отображение счётчиков (обработано сообщений, ошибки), кнопка «Сбросить». Вызовы api/logging/* через .run(ctx).
- **web/admin/logs.tsx** — роут с редиректом на главную с открытием вкладки «Настройки» профиля.

### Интеграция в домен

- **api/messages.ts** — импорт logger.lib и logger-settings.lib; после успешной отправки сообщения: writeServerLog(Info), incrementMetric(processedMessages); в catch: writeServerLog(Error), incrementMetric(errors), rethrow.

### Тесты

- **api/tests/list.ts** — каталог тестов (категория logger-lib).
- **api/tests/endpoints-check/logger-lib.ts** — проверки shouldLogByLevel (Info/Error/Disable) и writeServerLog; доступ Admin.

### Документация

- **README.md** — создан: структура проекта, логирование и админка, запуск, ссылки на docs.
- **docs/architecture.md** — слои, логирование, админка, роутинг.
- **docs/api.md** — эндпоинты логирования и тестов.
- **docs/data.md** — server-logs, chat-metrics, app-settings (log_level).
- **docs/imports.md** — направления зависимостей, ключевые модули.
- **docs/run.md** — запуск и тесты.
- **.CHATIUM-LLM.md** — добавлен раздел «Структура и слои (006-arch)» со ссылками на config, lib, repos, api/logging, web/admin/logs, docs.

## Ограничения

- Изменения только в workspace s.chtm.aley.pro. Зеркальный p.chtm.aley.pro не трогался.
- Полный перенос всех роутов index (CSS, manifest, invite) в web/api и достижение 80% branch coverage в рамках этой сессии не выполнялись; добавлены базовая структура, логирование, админка, тесты logger-lib и документация.
