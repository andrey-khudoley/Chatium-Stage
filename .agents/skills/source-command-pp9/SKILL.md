---
name: "source-command-pp9"
description: "Конвейер уровня 9 — максимальный. Опциональный архитектор-обсуждение, план на Opus + полный гейт + completeness, fan-out верификации на Opus с adversarial-проходом критичных находок, loop-until-clean, документация, метрики. Для крупных/рискованных задач."
---

# source-command-pp9

Use this skill when the user asks to run the migrated source command `/pp9`.

## Codex Adaptation

- Source of truth: `.claude/commands/pp9.md`.
- Claude tool metadata is historical; in Codex use available shell/search/edit tools and `apply_patch` for manual edits.
- If the command references `.claude/agents/pp-orchestrator.md`, use the synchronized Codex copy `.codex/agents/pp-orchestrator.toml` and the workflow reference `.codex/skills/chatium-workspace/references/workflows/pp.md`.

## Command Template

# /pp9 — максимальный конвейер (уровень 9)

Прими роль оркестратора и веди задачу по плейбуку `.claude/agents/pp-orchestrator.md` с **N=9**.

Профиль: (опц.) `discussion-architect` (Opus) для скоупинга → `task-formalizer` (Sonnet, +Q) → `planner` (Opus) → полный гейт плана [`plan-reviewer` (Opus) + `chatium-platform-checker` mode=plan (Opus)] + `completeness-reviewer` → `implementer` (Sonnet; Opus если отмечен блокер) → fan-out верификации (Opus) + `completeness-reviewer` + **adversarial 2-й проход** по подтверждённым критичным находкам (скептик отсекает ложные) + Bash типы/стиль/тесты → **loop-until-clean** (правки → повтор верификации, пока находки не исчерпаны или бюджет) → `docs-keeper` (Sonnet) → полный отчёт + метрики.

Текст после `/pp9` — задача. Если пусто — возьми из контекста чата. Вопросы формализатора передай дословно и остановись.
