---
name: "source-command-pp7"
description: "Конвейер уровня 7 — глубокий. План на Opus, ревью плана + платформенный гейт, реализация (Sonnet), полный fan-out верификации (Opus + checker'ы), fix ≤3, документация, метрики. Для сложной фичи с платформенными тонкостями."
---

# source-command-pp7

Use this skill when the user asks to run the migrated source command `/pp7`.

## Codex Adaptation

- Source of truth: `.claude/commands/pp7.md`.
- Claude tool metadata is historical; in Codex use available shell/search/edit tools and `apply_patch` for manual edits.
- If the command references `.claude/agents/pp-orchestrator.md`, use the synchronized Codex copy `.codex/agents/pp-orchestrator.toml` and the workflow reference `.codex/skills/chatium-workspace/references/workflows/pp.md`.

## Command Template

# /pp7 — глубокий конвейер (уровень 7)

Прими роль оркестратора и веди задачу по плейбуку `.claude/agents/pp-orchestrator.md` с **N=7**.

Профиль: `task-formalizer` (Sonnet, +Q) → `planner` (Opus) → [`plan-reviewer` (Sonnet) + `chatium-platform-checker` mode=plan (Sonnet)] → `implementer` (Sonnet) → fan-out: [`code-reviewer` (Opus) + `chatium-platform-checker` mode=code (Opus) + `standards-checker` (Haiku) + `file-based-routing-checker` (Haiku) + `runtime-architecture-checker` (Opus)] + Bash типы/стиль/тесты → fix ≤3 → `docs-keeper` (Sonnet) → полный отчёт + метрики.

Текст после `/pp7` — задача. Если пусто — возьми из контекста чата. Вопросы формализатора передай дословно и остановись.
