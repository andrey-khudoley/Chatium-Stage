---
name: "source-command-pp6"
description: "Конвейер уровня 6 — тщательный. Формализация (Sonnet), план + ревью плана с платформенным гейтом (Sonnet), реализация (Sonnet), полное ревью кода + checker'ы + платформа (code), fix ≤2, документация, метрики."
---

# source-command-pp6

Use this skill when the user asks to run the migrated source command `/pp6`.

## Codex Adaptation

- Source of truth: `.claude/commands/pp6.md`.
- Claude tool metadata is historical; in Codex use available shell/search/edit tools and `apply_patch` for manual edits.
- If the command references `.claude/agents/pp-orchestrator.md`, use the synchronized Codex copy `.codex/agents/pp-orchestrator.toml` and the workflow reference `.codex/skills/chatium-workspace/references/workflows/pp.md`.

## Command Template

# /pp6 — тщательный конвейер (уровень 6)

Прими роль оркестратора и веди задачу по плейбуку `.claude/agents/pp-orchestrator.md` с **N=6**.

Профиль: `task-formalizer` (Sonnet, +Q) → `planner` (Sonnet) → [`plan-reviewer` (Sonnet) + `chatium-platform-checker` mode=plan (Sonnet)] параллельно → `implementer` (Sonnet) → [`code-reviewer` (Sonnet) + `standards-checker` (Haiku) + `file-based-routing-checker` (Haiku) + `chatium-platform-checker` mode=code (Sonnet)] параллельно + Bash типы/стиль/тесты → fix ≤2 → `docs-keeper` (Sonnet) → полный отчёт + метрики.

Текст после `/pp6` — задача. Если пусто — возьми из контекста чата. Вопросы формализатора передай дословно и остановись.
