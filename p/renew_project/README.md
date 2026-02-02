# renew_project

## Назначение
Шаблон проекта для Chatium. Минимальный старт: главная страница, админка, профиль и логин.

## Важно
- Платформа: Chatium. Серверная часть управляется платформой.
- Стек фиксирован платформой, новые зависимости не добавляем.
- Деплой происходит автоматически после пуша.

## Текущее состояние
- Главная, админка, профиль и логин существуют как минимальные страницы.
- Реализованы: API настроек (list, get, save), Heap-таблица settings, репозиторий, lib (бизнес-логика).
- Серверные логи: Heap-таблица logs (message, payload, severity, level, timestamp), repos/logs.repo (create, findAll, findById, findBeforeTimestamp, countBySeverityAfter, countErrorsAfter, countWarningsAfter), lib/logger.lib (проверка уровня по настройке log_level, запись в ctx.log, ctx.account.log, Heap, WebSocket с хэшем для уникальности канала, вебхук log_webhook { enable, url } по умолчанию url: ""). API POST /api/logger/log (AnyUser), body: { severity, level, message, payload?, timestamp? }; GET /api/admin/logs/recent (Admin) — последние N логов; GET /api/admin/logs/before (Admin) — N логов старше указанного timestamp для пагинации. Админка получает encodedLogsSocketId, подписывается на new-log для отображения в дашборде, загружает историю логов через recent при монтировании, может догружать старые логи через before (кнопка «Загрузить ещё 50»); кнопка «Очистить логи» очищает вывод и сдвигает таймштамп на текущий — повторное нажатие «Загрузить ещё 50» восстанавливает последние логи.
- Дашборд админки: счётчики ошибок и предупреждений. Настройка `dashboard_reset_at` (таймштамп сброса в ms); lib/admin/dashboard.lib (getDashboardCounts, resetDashboard), GET /api/admin/dashboard/counts и POST /api/admin/dashboard/reset (Admin). При монтировании загружаются счётчики; кнопка «Сбросить» записывает текущее время в настройки; при новых логах (sink/WebSocket) инкремент только если timestamp >= dashboardResetAt.
- При серверной загрузке главной, админки и профиля уровень логирования читается из настроек и передаётся на клиент в `window.__BOOT__.logLevel` (shared/logLevel.ts). В браузере доступен shared/logger по стандарту syslog (RFC 5424): уровни -1 (логи выключены, LOG_LEVEL_OFF), 0–7 (Emergency…Debug), функции `logEmergency`, `logAlert`, `logCritical`, `logError`, `logWarning`, `logNotice`, `logInfo`, `logDebug`; `createComponentLogger(name)` для логов с префиксом; `setLogSink`, `LogEntry` для дашборда. Вывод только если severity не строже настроенного порога.
- Клиентская часть полностью покрыта логами: страницы и компоненты используют `createComponentLogger`; AdminPage регистрирует sink и подписку на WebSocket для отображения логов в дашборде в реальном времени.

## Навигация по документации
- Архитектура: `docs/architecture.md`
- API: `docs/api.md`
- Данные: `docs/data.md`
- Запуск и деплой: `docs/run.md`
- Импорты/циклы: `docs/imports.md`
- Решения: `docs/ADR/`
- История диалогов: `docs/LLM/`

## TODO
- Заполнить UI для главной/админки/профиля.
- Добавить реальные сценарии авторизации.
- Описать бизнес‑логику и данные.

## Changelog
- 2026-02-02: дашборд админки: счётчики ошибок и предупреждений после таймштампа сброса; настройка dashboard_reset_at, lib/admin/dashboard.lib, GET /api/admin/dashboard/counts, POST /api/admin/dashboard/reset; repos/logs.repo — countBySeverityAfter, countErrorsAfter, countWarningsAfter (несколько countBy по severity); при новых логах (sink/WebSocket) инкремент только если entry.timestamp >= dashboardResetAt.
- 2026-02-02: админка — блок логов: кнопка «Загрузить ещё 50» ~90% ширины, рядом квадратная кнопка «Очистить логи» (корзина); при очистке таймштамп сдвигается на текущий (Date.now()), кнопка «Загрузить ещё 50» восстанавливает последние логи с сервера.
- 2026-02-02: стили скроллбара (customScrollbarStyles в styles.tsx): body, .content-wrapper, .custom-scrollbar; подключены на главной, админке, логине и профиле; исправление для Chrome 121+ через @supports not selector(::-webkit-scrollbar).
- 2026-02-02: оптимизирована функция findBeforeTimestamp в repos/logs.repo — использует нативную фильтрацию Heap API через `where: { timestamp: { $lt } }` вместо загрузки избыточных данных и фильтрации в памяти.
- 2026-02-02: добавлена пагинация логов в админке: GET /api/admin/logs/recent (последние N логов), GET /api/admin/logs/before (N логов старше timestamp); repos/logs.repo.findBeforeTimestamp; AdminPage загружает историю при монтировании и может догружать старые логи по кнопке «Загрузить ещё 50».
- 2026-02-02: админка: индикаторы «Сохранено»/«Ошибка» в правом верхнем углу карточек «Настройки проекта» и «Уровень логирования» после ответа сервера (3 с); автосохранение поля «Название проекта» с debounce 2 с без ожидания blur.
- 2026-02-02: исправлен вызов GET api/settings/get в AdminPage: query передаётся через getSettingRoute.query({ key }).run(ctx) вместо .run(ctx, { query }), по inner/docs (002-routing, 001-run).
- 2026-02-02: сериализация payload при записи в Heap (lib/logger.lib): JSON.stringify для объектов, чтобы в таблице логов отображался корректный JSON вместо "[object Object]".
- 2026-02-02: серверные логи: таблица logs, repos/logs.repo, lib/logger.lib, api/logger/log (POST), админка — encodedLogsSocketId и подписка на new-log; сокет без accountId. Body API: только message (обяз.), severity? (0–7), payload?; timestamp и level вычисляются в lib; имя модуля в тексте message. Формат вывода: `[DD.MM.YYYY HH:mm:ss.SSS] [LEVEL] message` (пробелы между группами в скобках).
- 2026-02-01: клиентская часть покрыта логами (createComponentLogger, setLogSink, sink в AdminPage дашборде; HomePage, AdminPage, ProfilePage, LoginPage, Header, AppFooter, GlobalGlitch, LogoutModal).
- 2026-02-01: добавлен уровень логирования Debug (кнопка в админке перед Info, lib LOG_LEVELS, logger CONFIG_LEVELS и порог, API save -1–4), порядок: Debug, Info, Warn, Error, Disable.
- 2026-02-01: уровень логирования -1 (логи выключены): LOG_LEVEL_OFF в shared/logger, приём -1 в window.__BOOT__.logLevel, API save принимает -1 → Disable.
- 2026-02-01: shared/logger — логгер для браузера (logInfo, logWarn, logError с проверкой уровня по window.__BOOT__.logLevel), импорт в HomePage, AdminPage, ProfilePage.
- 2026-02-01: чтение уровня логирования при загрузке страницы — shared/logLevel.ts, вызов getLogLevel в lib, скрипт window.__BOOT__.logLevel на главной, админке и профиле (без логина).
- 2026-02-01: мгновенное сохранение уровня логирования в админке (кнопки → .run() → POST /api/settings/save), нормализация чисел 0–3 и строк в API.
- 2026-02-01: добавлен ADR-0002 — настройки в Heap и слоистая архитектура API (решения коммита aaf4a0a).
- 2026-02-01: обновлено «Текущее состояние» — отражены API настроек, таблица, репозиторий, lib.
- 2026-01-31: создана базовая структура и первичная документация.
