# Architecture

## Назначение

Приложение **`p/saas/gw/gc`** — экземпляр **GetCourse Gateway** на каркасе, изначально скопированном из `template_project` (страницы, админка, Heap settings/logs, тестовая страница). **Источник правды по коду** — дерево **`p/saas/gw/gc`** (в т.ч. `lib/logger.lib`, `web/admin`); каталог **`p/template_project`** — только происхождение каркаса при bootstrap, не место текущих правок. Целевая доменная логика — публичное API **`/v1/{op}`** и связка с GetCourse по нормативу в **`docs/gateway/`** (SSOT: `docs/gateway/gateway-operation-manual.md`, реестр `op`, OpenAPI и маппинг в том же каталоге). **План реализации (Прототип → MVP → Прод):** `docs/gateway/implementation-plan.md`.

## Ограничения платформы
- Серверная инфраструктура предоставляется Chatium.
- Нельзя менять стек и зависимости.
- Деплой — автоматически при пуше.

## Основные сценарии
- Открыть главную страницу.
- Авторизоваться и попасть в профиль.
- Открыть админку (только роль Admin).

## Роутинг
- `index.tsx` — главная (SSR + Vue), единственный роут в корне.
- `web/admin/index.tsx` — админка, `requireAccountRole('Admin')`.
- `web/profile/index.tsx` — профиль, `requireRealUser()`.
- `web/tests/index.tsx` — страница тестов, `requireRealUser()`.
- `web/login/index.tsx` — вход (редирект на системный `/s/auth/signin`).

## Вёрстка админки и страницы тестов
- Корень Vue (`.app-layout` в `AdminPage.vue` / `TestsPage.vue`) ограничен высотой окна (`100vh` / `100dvh`) с `overflow: hidden`; после `boot-complete` у `body` нет вертикального скролла. Ширина: `.app-layout`, `<main class="ap-wrap|tp-wrap">` и блок `.ap` / `.tp` — на всю доступную ширину (`width: 100%`, у обёрток при необходимости `min-width: 0` для flex); контент по-прежнему ограничен `max-width: 1440px` у `.ap`/`.tp`. `<main>` — flex-колонка с `overflow: hidden` (сам не скроллится). Ниже — `.ap` / `.tp` (flex, `min-height: 0`), статус/тулбар `flex-shrink: 0`, сетка `.ap-grid` / `.tp-grid` с `grid-template-rows: minmax(0, 1fr)` и `flex: 1`; в двухколоночном режиме первая колонка — `minmax(240px, 1fr)` (не `minmax(0, 1fr)`), чтобы левая область не сжималась чрезмерно. Вертикальный скролл только у левой колонки `.ap-main` / `.tp-main` (`overflow-y: auto`, класс `content-wrapper` для стилей скроллбара). Правая колонка логов тянется по высоте ячейки сетки; список строк — `.ap-log-out` / `.tp-log-out` с внутренним `overflow-y`. На узкой вёрстке снова скроллится весь `<main>`.

## Разделение слоёв

Принцип разделения ответственности при работе с данными (см. [ADR-0002](ADR/0002-settings-heap-and-layered-api.md)):

| Слой | Каталог | Ответственность |
| --- | --- | --- |
| **Таблицы** | `tables/` | Схемы Heap (поля, типы). Только определение структуры данных. |
| **Репозитории** | `repos/` | Работа с БД: CRUD, запросы. Никакой бизнес‑логики, только вызовы Heap API. |
| **Бизнес‑логика** | `lib/` | Правила, дефолты, валидация значений, вычисления. Вызывает репозитории. |
| **API** | `api/` | HTTP‑эндпоинты, парсинг и первичная валидация запросов, проверка прав. Вызывает lib. |

Поток данных: `HTTP → API → lib → repos → Heap`.

## Структура каталогов
- `config/` — маршруты и `PROJECT_ROOT`.
- `web/` — браузерные роуты модулей (admin, profile, tests, login).
- `pages/` — Vue‑страницы (минимальные).
- `components/` — переиспользуемые Vue‑компоненты (Header, AppFooter, GlobalGlitch, LogoutModal).
- `api/` — API‑эндпоинты (получение и валидация входных данных). File-based: один файл — один эндпоинт с `/`. Пример: `api/settings/list.ts`, `api/logger/log.ts`, `api/admin/logs/recent.ts`, `api/tests/list.ts`, `api/tests/unit/index.ts`, `api/tests/integration/index.ts`, **`api/v1/*.ts`** (публичный gateway без сессии Chatium: по одному файлу на каждый **`op`** из `gc-op-http-mapping.json`, плюс **`api/v1/operations.ts`** для каталога), **`api/gateway-analytics/`** (Admin-only аналитика вызовов `/v1/{op}` поверх Heap-логов с `logStage = v1_op_completed` — manual §7.4.2).
- `tables/` — Heap‑таблицы (схемы: settings, logs).
- `repos/` — репозитории (работа с БД: settings, logs; logs.repo включает findBeforeTimestamp для пагинации).
- `lib/` — бизнес‑логика (settings.lib, logger.lib: проверка уровня, запись в ctx/Heap/WebSocket/вебхук). Подкаталог **`lib/gateway/`** — общий слой публичного **`/v1/*`**: **`handleV1OpRoute.ts`** (единая точка вызова GC), константы лимитов и таймаута, **`utf8Base64.ts`** (UTF-8 → Base64 для Legacy `params`, без платформенных глобалов; норматив **`inner/docs/047-base64.md`**), разбор входящего POST/query, **единый каталог операций `operationsCatalog`** (manual §3.1: `export const operationsCatalog = { schemaVersion, entries } as const`, в каждой записи — `op`, `httpMethod`, `contour`, `availability`, `pathTemplate`, `legacyImportAction` и live-объект схемы `args` через билдер `s` из `@app/schema`), генерируемые источники (`gcOpHttpMapping.generated`, `v1OpArgsSchemas.generated`), клиенты Legacy/new (`legacyGcImportClient`, `legacyGcExportGet`, `newGcApiClient`), **`gatewayWorkspaceEvents.ts`**, нормализованные ответы и коды ошибок по SPEC.
- `shared/` — общий код (preloader, logLevel для передачи уровня логирования на клиент, logger — уровни syslog RFC 5424, createComponentLogger, setLogSink/LogEntry для дашборда, logEmergency…logDebug в браузере с проверкой порога, browserRemoteLogger — пакетная отправка браузерных логов на сервер через POST /api/logger/browser).
- `docs/` — документация проекта; **`docs/gateway/`** — спецификация gateway (manual, JSON, скрипты).

## Стратегия логирования

Логирование построено на стандарте syslog (RFC 5424), severity 0–7. Управление уровнем через настройку `log_level` (Debug/Info/Warn/Error/Disable).

| Severity | Уровень | Что логируется |
| --- | --- | --- |
| 7 | Debug | Сырые данные (параметры, возвраты, промежуточные значения) — появляются только при Debug |
| 6 | Info | Карта вызовов: entry/exit функций, ветвления — без сырых данных при уровне Info |
| 5 | Notice | Пользовательские действия (клик, навигация, изменение настроек) |
| 4 | Warning | Нештатные ситуации, не требующие немедленной реакции |
| 3 | Error | Ошибки, требующие внимания |
| 2 | Critical | Критические действия (выход из аккаунта) |
| -1 | Disable | Логи выключены |

Для ошибок, которые нужно одновременно зафиксировать в серверном логе и пробросить вызывающему коду как `throw new Error(…)` (например, валидация в `lib/settings.lib.ts`), используется **`throwLoggedServerError`** в `lib/logger.lib.ts`: сначала `writeServerLog` с настраиваемым severity (по умолчанию 3), затем исключение с тем же текстом.

**Ключевой принцип**: trace-логи (карта вызовов) имеют severity 6 (Info). Payload (сырые данные) автоматически отсекается при уровне != Debug:
- **Сервер** (`lib/logger.lib.ts`): функция `shouldIncludePayload` — payload в ctx.account.log, Heap, WebSocket и webhook только при Debug.
- **Браузер** (`shared/logger.ts`): `emitLog` фильтрует non-string args при уровне != Debug.

**Наблюдаемость `/v1/{op}` (manual §7):** общий обработчик `lib/gateway/handleV1OpRoute.ts` после возврата ответа клиенту делает **итоговую** запись `writeServerLog` со стабильным `logStage: v1_op_completed` и **минимальным набором** полей (manual §7.2): `requestId`, `op`, `httpMethod`, `contour`, `availability`, `schoolHostPresent`, `clientHttpStatus`, `ok`, `errorCode`, `gcHttpStatus`, `durationMs`. Параллельно — событие workspace `gateway_gc.invoke.completed` через `lib/gateway/gatewayWorkspaceEvents.ts`. Эти записи — единый источник для админской аналитики (`api/gateway-analytics/invocations.ts`, секция «Аналитика вызовов /v1/{op}» в `pages/AdminPage.vue`).

## Интеграционный сьюит `/v1/{op}` (gateway-testing-strategy.md)

Сьюит реализует норматив `docs/gateway/gateway-testing-strategy.md`: один прогон на каждый из 59 публичных роутов `api/v1/*`, фазовый порядок 1–4, минимизация Heap-входа, цепочки producer→consumer→destructor, throttle 1 rps.

| Слой | Файл | Ответственность |
| --- | --- | --- |
| Контекст сессии | `lib/tests/gateway/v1OpsRunContext.ts` | Типы `V1OpsRunContext` (dealId, userId, groupId, webinarId, ...), реестр `gc_itest_*` Heap-ключей (manual §5.8), email тестового пользователя `tester@khudoley.pro`. |
| Сценарии | `lib/tests/gateway/v1OpsScenarios.ts` | Реестр на каждый из 59 op: фаза, `dependsOn`, требуемые Heap-ключи, `build(args)` или `skip` с человеческим объяснением, `capture(parsed)` для наполнения контекста. |
| Раннер | `lib/tests/gateway/v1OpsSuiteRunner.ts` | `runAllV1Ops` и `runSingleV1Op(opId)`: чтение Heap (хост/ключ школы + `gc_itest_*`), throttle 1 rps между сетевыми вызовами (ожидание по `Date.now()` без `setTimeout`: изолята нет глобального таймера; `@app/jobs` не подходит для паузы внутри одного запроса), проверка зависимостей, перенос результата в `runCtx`. Использует **`handleV1OpRouteWithGcDiagnostic`** (сырое тело ответа школы в `gcUpstream`), парсит `rawHttpBody` gateway. |
| Эндпоинт | `api/tests/v1-ops/run.ts` | `POST /api/tests/v1-ops/run` (Admin), `body: { mode: 'all' \| 'single', opId? }`. Возвращает `V1OpsRunSummary` со списком результатов и сводкой. |
| UI | `pages/TestsPage.vue`, секция «Gateway /v1/{op}» на вкладке HTTP | Метрики прогона, кнопка «Запустить сьюит», по строке на каждый op (бейдж availability, контур, метод), индивидуальная кнопка «Run», HTTP-статус, длительность, `requestId`, фаза, причина skip, раскрывающийся блок с распарсенным ответом и отправленными `args`. |
| Список op для UI | `shared/v1OpsList.generated.ts` (// @shared) | Автоген из `config/gc-op-http-mapping.json` через `scripts/gen-gc-op-http-mapping.cjs` (рядом с `lib/gateway/gcOpHttpMapping.generated.ts`). Без notes, безопасен для клиентского бандла. |
| Каталог тестов | `api/tests/list.ts` | Категория `gateway-v1` со списком 59 пунктов. |
| Префлайт | `lib/tests/gateway/v1OpsPreflight.ts` | Статичный анализ готовности сьюита без сетевых вызовов: вычисляет для каждого op `runStatus ∈ {ready, blocked-availability, warn-heap, warn-deps}`, состояние «уровня A» (manual §5.8) и список заполненных `gc_itest_*` (только имена). Транзитивно учитывает порядок фаз (стратегия §3.1). |
| Эндпоинт префлайта | `api/tests/v1-ops/preflight.ts` | `GET /api/tests/v1-ops/preflight` (Admin). Используется UI при монтировании страницы `/web/tests` и после каждого прогона. |
| Произвольные настройки | `lib/settings.lib.ts` (`deleteSetting`, `listArbitrarySettings`, `KNOWN_SETTING_KEYS`), `api/settings/delete.ts`, `api/settings/list-arbitrary.ts` | Поддержка manual §5.9: универсальный ввод «ключ — значение» в Heap для `gc_itest_*` (§5.8 уровень B) и других пользовательских ключей. Секреты в этот список не включаются. |
| UI настроек §5.9 | `pages/AdminPage.vue`, секция «Произвольные настройки Heap» | Форма «Ключ — Значение» с валидацией (непустой ключ, без управляющих символов), список существующих произвольных ключей с кнопками «Изменить» и «Удалить». |

Артефакты, оставленные тестами в школе (комментарии, заметки), помечаются префиксом `[gateway-itest]` (стратегия §5). Деструктор фазы 4 — `updateDealFields` со `status: "false"` для тестовой сделки.

### Визуальные состояния строк сценариев (стратегия §9.1, §9.3)

UI блока «Gateway /v1/{op}» использует `runStatus` из префлайта:

- `ready` — обычный фон, активная кнопка `Run`;
- `blocked-availability` — нейтральный серый фон (`rgba(70,70,78,0.28)`), кнопка `Run` отключена с иконкой `fa-ban`, в строке — текст «availability=…, запуск запрещён» (§9.1);
- `warn-heap` — приглушённый янтарный фон (`rgba(201,166,96,0.12)`) с боковой полосой `rgba(201,166,96,0.7)`, кнопка `Run` отключена, в строке — список недостающих `gc_itest_*` и ссылка «Задать в админке» (§9.3, §9.4);
- `warn-deps` — тот же янтарный фон, в строке — перечень предшественников, которых ждёт сценарий.

Сверху над списком — панель «Готовность к прогону»: статус трёх ключей уровня A (включая «✓»/«—»), counts по `runStatus`, ссылка на админку (§5.9).

**Ограничение UGC в шаблоне:** в выражениях `v-if` / `{{ }}` секции `/v1/{op}` не использовать optional chaining (`?.`) и не начинать `{{` с `{ … }` (объектный литерал) — иначе при синхронизации/рендере возможен пустой `ReferenceError:` в логе UGC. Доступ к полям после `fetch` — через явные проверки `row.result && row.result.field`; маппинг подписей — функции в `<script setup>`.

## Интеграции
- Внешние сервисы: нет.
- Внутренние SDK: стандартные модули Chatium.
