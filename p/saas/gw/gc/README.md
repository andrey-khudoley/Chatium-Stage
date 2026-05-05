# GetCourse Gateway (`p/saas/gw/gc`)

## Назначение

Приложение Chatium — экземпляр **gateway** к API GetCourse: публичные маршруты вида `/v1/{op}`, каталог операций, проксирование на школу по заголовкам `X-Gc-School-Host` и `X-Gc-School-Api-Key`, настройки и логи в Heap (каркас унаследован от `p/template_project`).

Полный норматив разработки слоя gateway задаётся вне репозитория приложения — в Obsidian:

`/home/aley/obsidian/second-brain/03_Projects/active/course-chatium-gc-integration-3fa7c2/docs/specifications/gateway/gateway-operation-manual.md`

Там же ссылки на машиночитаемые артефакты (`gc-op-http-mapping.json`, реестр `op` и т.д.). Код в этом каталоге должен согласовываться с этим manual на этапе активной разработки.

## Платформа и деплой

- Платформа: Chatium; локальный сервер не требуется; зависимости фиксированы платформой.
- Деплой: закоммитить и запушить изменения — Chatium подхватит обновления.
- URL приложения: `https://<домен>/p/saas/gw/gc/` (и подмаршруты из `config/routes.tsx`).

## Текущее состояние

Сохранены возможности шаблона: главная, админка, профиль, логин, страница тестов, API настроек, Heap-таблицы settings/logs (с **отдельными** ключами таблиц для этого проекта), серверные логи, дашборд админки. Доменная реализация gateway (`/v1/...`, маппинг на GetCourse) — в планах по manual выше.

## Документация в репозитории

- Архитектура и отсылка к спеке: `docs/architecture.md`
- API: `docs/api.md`
- Данные и Heap: `docs/data.md`
- Импорты: `docs/imports.md`
- ADR: `docs/ADR/`
- История диалогов: `docs/LLM/`

## Changelog

- 2026-05-06: проект отвязан от копии `template_project`: `PROJECT_ROOT` `p/saas/gw/gc`, `.dir.json`, дефолтные названия, отдельные ключи Heap settings/logs, обновлена документация; инструкция после копирования шаблона (`docs/run.md`) удалена как выполненная.
