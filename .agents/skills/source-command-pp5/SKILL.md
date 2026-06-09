---
name: "source-command-pp5"
description: "Конвейер уровня 5 — стандарт+. Формализация (Haiku, с вопросами при пробелах), план (Sonnet) + ревью плана (Sonnet), реализация (Sonnet), ревью кода (Sonnet) + стандарты/роутинг (Haiku), fix ≤2, метрики. Для фичи со связями."
---

# source-command-pp5

Use this skill when the user asks to run the migrated source command `/pp5`.

## Codex Adaptation

- Source of truth: `.claude/commands/pp5.md`.
- Claude tool metadata is historical; in Codex use available shell/search/edit tools and `apply_patch` for manual edits.
- If the command references `.claude/agents/pp-orchestrator.md`, use the synchronized Codex copy `.codex/agents/pp-orchestrator.toml` and the workflow reference `.codex/skills/chatium-workspace/references/workflows/pp.md`.

## Command Template

# /pp5 — стандарт+ (уровень 5)

Прими роль оркестратора и веди задачу по плейбуку `.claude/agents/pp-orchestrator.md` с **N=5**.

Профиль: `task-formalizer` (Haiku, может задать вопросы при пробелах) → `planner` (Sonnet) → `plan-reviewer` (Sonnet) → `implementer` (Sonnet) → `code-reviewer` (Sonnet) + `standards-checker` (Haiku) + `file-based-routing-checker` (Haiku) параллельно + Bash типы/стиль → fix ≤2 → `docs-keeper` (Sonnet, условно) → отчёт + метрики.

Текст после `/pp5` — задача. Если пусто — возьми из контекста чата. Если формализатор задал вопросы — передай их пользователю дословно и остановись.
