# AGENTS.md — Chatium Workspace `s.chtm.khudoley.pro`

Инструкции для Codex в этом workspace. Они заменяют Claude-специфичный `CLAUDE.md` для работы Codex.

## Codex Skill

Для задач Chatium в этом репозитории используй skill:

- `.codex/skills/chatium-workspace/SKILL.md`

Он содержит адаптированные роли и workflow из `.claude/agents` и `.claude/commands`.

Если пользователь пишет `/check`, `/pipeline`, `/pp`, `/toprod`, воспринимай это как обычный запрос Codex и открой соответствующий reference из `.codex/skills/chatium-workspace/references/workflows/`.

## Инварианты Chatium

- `ctx` и `app` глобальные, не импортировать.
- Логирование: `ctx.account.log()`, не `console.log()`.
- File-based routing: один файл = один роут; предпочтительный путь `'/'`.
- Ссылки на роуты: `withProjectRoot(route.url())` или `withProjectRootAndSubroute(base, '/sub')`, без хардкода URL.
- Heap и таблицы только на сервере. В Vue не импортировать `tables/`, `repos/`, `lib/`; в Vue допустим только `shared/*` с `// @shared`.
- Подсчёт Heap: `countBy`, не `findAll().length`.
- Фильтры Heap: `where`, не `filter`.
- Money: `.add()`, `.subtract()`, `.multiply()`, не обычная арифметика.
- Race conditions: `runWithExclusiveLock`.
- Защищённые эндпоинты: `requireRealUser(ctx)` или `requireAccountRole(ctx, 'admin')` первой строкой обработчика.
- `// @ts-ignore` допустим только для системных модулей Chatium без локальных типов.
- Документация платформы: `inner/docs/`, навигатор `inner/docs/000-summ.md`.

## Codex Tooling

- Для поиска используй `rg` и `rg --files`.
- Для shell-команд используй `exec_command`.
- Для ручных правок используй `apply_patch`.
- Делегирование через `spawn_agent` используй только когда пользователь явно просит subagents, делегирование или параллельных агентов. `/pipeline` и `/pp` считаются такими явными workflow; обычные ревью, проверки и планирование выполняй локально, если пользователь не попросил делегировать.
- Не переноси Claude `tools`, `model`, `allowed-tools`, `subagent_type` буквально: это metadata другого вендора.

## Encoding-Sensitive Files

Some legacy files in this workspace may show Cyrillic comments as mojibake in shell output.
When editing them, prefer ASCII anchors, selectors, function names, line numbers, and very small
`apply_patch` hunks. Do not use broad Cyrillic/garbled comment blocks as required patch context.
If a patch fails unexpectedly, inspect exact numbered lines and retry with narrower ASCII-only
context. Do not rewrite or normalize whole-file encoding unless the user explicitly asks.

## Дата и время

Если в отчёте, changelog, LLM-логе или имени файла нужна текущая дата/время, получай её через shell:

```bash
date "+%d-%m-%Y %H:%M:%S %Z"
date "+%Y-%m-%d"
date "+%y%m%d"
```

## Документация После Изменений

При изменениях в коде проекта-приложения (каталог с `index.tsx` / `index.ts` и собственным `docs/`) проверь необходимость обновить:

- `README.md`
- `.CHATIUM-LLM.md`
- `docs/architecture.md`
- `docs/api.md`
- `docs/data.md`
- `docs/LLM/`

Для больших изменений используй reference `docs-keeper` из skill-а.

Документация обычно не нужна для изменений в общих библиотеках, `shared/`, инфраструктуре, `.cursor/`, `.claude/`, `.codex/`, gateway.

## Workspace

- `s.chtm.khudoley.pro` — dev workspace, изменения здесь.
- `p.chtm.khudoley.pro` — prod workspace. Изменять только через workflow `/toprod` и только каталог `k/assistant`.
- В workspace несколько проектов под `p/units/`, `p/saas/`, `tg/`. Корень проекта — каталог с `index.tsx` / `index.ts`, не корень workspace.

## Стиль Ответа

- Русский язык.
- Кратко и по делу.
- Без вводных вроде «Конечно» и без эмодзи в обычных сообщениях.
- Если задача является формализацией, планированием, ревью или обсуждением, не пиши код без явного запроса.
