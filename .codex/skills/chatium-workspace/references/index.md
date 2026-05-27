# Chatium Workspace References

Адаптированный индекс ролей и workflow из `.claude` для Codex.

## Роли

- `code-reviewer` -> `references/roles/code-reviewer.md` — Проводит детальное ревью написанного кода Chatium-проекта по 10 обязательным областям (требования, план, ошибки, типы, безопасность, edge cases, API, архитектура, Chatium-специфика, стандарты). Использовать ПОСЛЕ реализации, ДО запуска проверок (verification-runner).
- `completeness-reviewer` -> `references/roles/completeness-reviewer.md` — Мета-ревьюер, проверяющий ПОЛНОТУ охвата ревью (плана или кода). Использовать ПОСЛЕ plan-reviewer или code-reviewer. Не оценивает качество выводов — только то, что все обязательные области рассмотрены или явно отмечены как «не применимо».
- `discussion-architect` -> `references/roles/discussion-architect.md` — Режим обсуждения задачи ДО реализации — опытный архитектор-собеседник, помогает уточнить формулировку, границы, риски. Использовать когда пользователь хочет «обсудить идею», «подумать вместе», «как лучше сформулировать», ДО запуска /pipeline. Не пишет код, не планирует, не запускает конвейер.
- `docs-keeper` -> `references/roles/docs-keeper.md` — Обновляет документацию Chatium-проекта (README.md, .CHATIUM-LLM.md, docs/architecture.md, docs/api.md, docs/data.md) после изменений кода. Использовать после реализации, как часть финализации задачи. Не дублирует код в документации — пишет «общую картину» с ссылками на файлы.
- `file-based-routing-checker` -> `references/roles/file-based-routing-checker.md` — Проверяет соблюдение file-based роутинга Chatium — путь "/" в роут-файле, ссылки на не-"/" роуты через withProjectRoot/route.url() с тильдой. Использовать после изменений в файлах api/, pages/, config/routes.tsx или ссылках на роуты. По умолчанию проверяет файлы из git diff; принимает явный список от вызывающего агента.
- `pipeline-orchestrator` -> `references/roles/pipeline-orchestrator.md` — Ведёт Chatium-задачу через полный 12-шаговый конвейер от формализации до финального отчёта. В Codex текущий чат обычно является оркестратором; шаги 2–5, 8–9, 10 делегируются через `spawn_agent` только для явного workflow `/pipeline`.
- `plan-reviewer` -> `references/roles/plan-reviewer.md` — Ревьюит план реализации Chatium-задачи по документации платформы и стандартам проекта. Использовать ПОСЛЕ planner и ДО реализации. Возвращает структурированный отчёт с приоритизированными замечаниями и явным вердиктом «можно реализовывать / нужны правки».
- `planner` -> `references/roles/planner.md` — Строит детальный пошаговый план реализации задачи на платформе Chatium. Использовать ПОСЛЕ формализации (task-formalizer), ДО написания кода. Анализирует структуру проекта, определяет затронутые файлы, фиксирует риски. Не пишет код.
- `runtime-architecture-checker` -> `references/roles/runtime-architecture-checker.md` — Ищет рантайм-баги и архитектурные проблемы в свежем коде Chatium — null/undefined, race conditions, необработанные ошибки async, утечки прав, несогласованность данных, нарушения слоёв. Использовать после написания нового кода. По умолчанию проверяет файлы из git diff; принимает явный список от вызывающего агента.
- `standards-checker` -> `references/roles/standards-checker.md` — Проверяет соответствие изменённого кода Chatium-стандартам из inner/docs/001-standards.md (форматирование, структура файлов, JSX, TypeScript, Tailwind, FontAwesome, импорты, типичные ошибки Chatium). Использовать после написания/изменения кода. По умолчанию проверяет файлы из git diff; принимает явный список файлов от вызывающего агента.
- `task-formalizer` -> `references/roles/task-formalizer.md` — Превращает сырой запрос пользователя в формальную постановку с критериями приёмки. Использовать ПЕРВЫМ шагом любого конвейера разработки, ДО планирования или реализации. Возвращает либо готовую формализацию, либо 2–4 уточняющих вопроса при пробелах в постановке.
- `verification-runner` -> `references/roles/verification-runner.md` — Запускает все технические проверки на свежем коде Chatium — TypeScript, стандарты (через standards-checker), роутинг (через file-based-routing-checker), рантайм (через runtime-architecture-checker), тесты. Собирает результаты в единый отчёт. Использовать ПОСЛЕ code-reviewer и ДО финального отчёта.

## Workflows / Slash-команды

- `/check` -> `references/workflows/check.md` — Запускает полный набор технических проверок (TypeScript, стандарты, роутинг, рантайм, тесты) на текущих изменениях.
- `/pipeline` -> `references/workflows/pipeline.md` — Полный 12-шаговый конвейер разработки Chatium-задачи с обязательным делегированием субагентам.
- `/pp` -> `references/workflows/pp.md` — Параллельный конвейер с декомпозицией задачи на независимые куски и одновременным запуском воркеров в фоне.
- `/toprod` -> `references/workflows/toprod.md` — Копирует ассистента (k/assistant) из dev-workspace s.chtm.khudoley.pro в prod-workspace p.chtm.khudoley.pro.

## Vendor Mapping

- Claude `Read/Grep/Glob/Bash/Edit/Write` -> Codex `exec_command`, `rg`, чтение файлов shell-командами, `apply_patch`.
- Claude `Agent` / `subagent_type` -> Codex `spawn_agent`, только когда пользователь явно разрешил делегирование или параллельную агентскую работу.
- Claude `settings.json` allowlist не переносится: Codex следует текущим sandbox/approval-инструкциям сессии.
