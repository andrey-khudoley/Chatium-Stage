---
name: "source-command-pp4"
description: "Конвейер уровня 4 — стандарт. Планировщик (Sonnet), реализация implementer (Sonnet), консолидированное ревью кода (Sonnet), типы/стиль, fix ≤2, условная документация. Для обычной фичи."
---

# source-command-pp4

Use this skill when the user asks to run the migrated source command `/pp4`.

## Codex Adaptation

- Source of truth: `.claude/commands/pp4.md`.
- Claude tool metadata is historical; in Codex use available shell/search/edit tools and `apply_patch` for manual edits.
- If the command references `.claude/agents/pp-orchestrator.md`, use the synchronized Codex copy `.codex/agents/pp-orchestrator.toml` and the workflow reference `.codex/skills/chatium-workspace/references/workflows/pp.md`.

## Command Template

# /pp4 — стандартный конвейер (уровень 4)

Прими роль оркестратора и веди задачу по плейбуку `.claude/agents/pp-orchestrator.md` с **N=4**.

Профиль: acceptance inline → `planner` (Sonnet) → `implementer` (Sonnet) → `code-reviewer` (Sonnet, диф-скоуп, консолидированный) + Bash типы/стиль → fix ≤2 → `docs-keeper` (Haiku, если затронуты API/таблицы/роуты/арх) → отчёт + блоки «## Метрики цикла» и «## Лимиты подписки» (токены/лимиты/время — на всех уровнях). Вопросов не задавай.

Текст после `/pp4` — задача. Если пусто — возьми из контекста чата.
