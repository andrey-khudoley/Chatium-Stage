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
- При серверной загрузке главной, админки и профиля уровень логирования читается из настроек и передаётся на клиент в `window.__BOOT__.logLevel` (shared/logLevel.ts). В браузере доступен shared/logger по стандарту syslog (RFC 5424): уровни -1 (логи выключены, LOG_LEVEL_OFF), 0–7 (Emergency…Debug), функции `logEmergency`, `logAlert`, `logCritical`, `logError`, `logWarning`, `logNotice`, `logInfo`, `logDebug`; `createComponentLogger(name)` для логов с префиксом; `setLogSink`, `LogEntry` для дашборда. Вывод только если severity не строже настроенного порога.
- Клиентская часть полностью покрыта логами: страницы и компоненты используют `createComponentLogger`; AdminPage регистрирует sink для отображения логов в дашборде в реальном времени.

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
- 2026-02-01: клиентская часть покрыта логами (createComponentLogger, setLogSink, sink в AdminPage дашборде; HomePage, AdminPage, ProfilePage, LoginPage, Header, AppFooter, GlobalGlitch, LogoutModal).
- 2026-02-01: добавлен уровень логирования Debug (кнопка в админке перед Info, lib LOG_LEVELS, logger CONFIG_LEVELS и порог, API save -1–4), порядок: Debug, Info, Warn, Error, Disable.
- 2026-02-01: уровень логирования -1 (логи выключены): LOG_LEVEL_OFF в shared/logger, приём -1 в window.__BOOT__.logLevel, API save принимает -1 → Disable.
- 2026-02-01: shared/logger — логгер для браузера (logInfo, logWarn, logError с проверкой уровня по window.__BOOT__.logLevel), импорт в HomePage, AdminPage, ProfilePage.
- 2026-02-01: чтение уровня логирования при загрузке страницы — shared/logLevel.ts, вызов getLogLevel в lib, скрипт window.__BOOT__.logLevel на главной, админке и профиле (без логина).
- 2026-02-01: мгновенное сохранение уровня логирования в админке (кнопки → .run() → POST /api/settings/save), нормализация чисел 0–3 и строк в API.
- 2026-02-01: добавлен ADR-0002 — настройки в Heap и слоистая архитектура API (решения коммита aaf4a0a).
- 2026-02-01: обновлено «Текущее состояние» — отражены API настроек, таблица, репозиторий, lib.
- 2026-01-31: создана базовая структура и первичная документация.
