# Architecture

## Назначение
Заготовка проекта NeSo CRM на Chatium с дизайн-системой «Ночной лес» / «Солнечная листва» (перенесённой из design_1).

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
- `pages/` — Vue‑страницы (HomePage, AdminPage, ProfilePage, TestsPage, LoginPage).
- `components/` — компоненты дизайн-системы (Dc*, AppSidebar): кнопки, карточки, таблицы, сайдбар, hero, стат-карты и др. (перенесены из design_1).
- `layout/` — оболочка страницы: DcAppShell, DcMain, DcContent, DcMainGrid, DcPageSection, DcSidebarOverlay (из design_1).
- `shared/` — общий код: `preloader` (прелоадер с темой dark/light), `themeStyles` (токены темы, скроллбар), `demoPageShell` (getDemoPageHead, getBootLoaderDiv для единой разметки head и boot loader), `logLevel`, `logger`.
- `api/` — API‑эндпоинты (получение и валидация входных данных). File-based: один файл — один эндпоинт с `/`. Пример: `api/settings/list.ts`, `api/settings/get.ts`, `api/settings/save.ts`, `api/logger/log.ts`, `api/admin/logs/recent.ts`, `api/admin/logs/before.ts`, `api/tests/list.ts`, `api/tests/endpoints-check/health.ts`, `api/tests/endpoints-check/ping.ts`.
- `tables/` — Heap‑таблицы (схемы: settings, logs).
- `repos/` — репозитории (работа с БД: settings, logs; logs.repo включает findBeforeTimestamp для пагинации).
- `lib/` — бизнес‑логика (settings.lib, logger.lib: проверка уровня, запись в ctx/Heap/WebSocket/вебхук).
- `docs/` — документация проекта; `docs/design/` — спецификация дизайна (DESIGN_SPEC.md, design_v01.md, design-architecture.md).

## Интеграции
- Внешние сервисы: нет.
- Внутренние SDK: стандартные модули Chatium.
