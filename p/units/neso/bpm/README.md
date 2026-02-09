# neso/bpm

BPM проект после миграции из `p/neso/crm` в `p/units/neso/bpm`.

## Что сделано
- Из legacy CRM удалён старый web-интерфейс.
- Сохранены data-слои: `tables/`, `repos/`, `lib/`.
- Проект перенесён в `p/units/neso/bpm`.
- Скопированы reusable-компоненты и layout/shared-блоки из `p/neso/design_2`.
- Создан новый минимальный набор страниц: `Главная`, `Вход`, `Админка`, `Тесты`.
- Добавлен изолированный каталог `web/design` с индексом и 19 практическими demo-сценариями.
- В `design` добавлены отдельные layout-режимы (`war-room`, `approval-lab`, `operations-hub`, `risk-console`, `delivery-studio`, `executive-deck`) и новые reusable-компоненты для них.

## Структура
- `tables/` — heap таблицы
- `repos/` — репозитории
- `lib/` — библиотечный и service слой
- `components/` — reusable UI-компоненты (включая импорт из `design_2`)
- `layout/` — layout primitives
- `pages/` — Vue-страницы нового интерфейса
- `web/` — file-based маршруты
- `shared/` — тема, preloader, scenario dataset, demo factory

## Маршруты
- `/` — главная
- `/web/login` — вход
- `/web/admin` — админка
- `/web/tests` — тестовая страница
- `/web/design` — индекс дизайн-сценариев
- `/web/design/<scenario>` — отдельная demo-страница сценария (19 шт.)
