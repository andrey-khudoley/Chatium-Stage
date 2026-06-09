---
name: "source-command-pp10"
description: "Конвейер уровня 10 — автономный максимум. Мульти-кандидатное планирование (2×Opus→выбор), полный гейт + completeness, fan-out верификации на Opus с adversarial, цикл правок до сходимости (2 чистых раунда подряд), бюджет ~1.5–2 ч. Максимальная автономная проработка самых сложных задач. Дорого."
---

# source-command-pp10

Use this skill when the user asks to run the migrated source command `/pp10`.

## Codex Adaptation

- Source of truth: `.claude/commands/pp10.md`.
- Claude tool metadata is historical; in Codex use available shell/search/edit tools and `apply_patch` for manual edits.
- If the command references `.claude/agents/pp-orchestrator.md`, use the synchronized Codex copy `.codex/agents/pp-orchestrator.toml` and the workflow reference `.codex/skills/chatium-workspace/references/workflows/pp.md`.

## Command Template

# /pp10 — автономный максимум (уровень 10)

Прими роль оркестратора и веди задачу по плейбуку `.claude/agents/pp-orchestrator.md` с **N=10**.

Профиль: (опц.) `discussion-architect` (Opus) → `task-formalizer` (Sonnet) → **2 параллельных `planner` (Opus)** с разными акцентами → синтез/выбор лучшего плана → полный гейт плана (Opus) + `completeness-reviewer` → `implementer` (Sonnet; Opus при сложности) → fan-out верификации (Opus) + `completeness-reviewer` + **adversarial-проход** → **цикл правок до сходимости** (повторяй верификацию до 2 чистых раундов подряд или исчерпания бюджета ~1.5–2 ч) → `docs-keeper` (Sonnet) → полный отчёт + метрики.

**Максимальная автономия:** вопросов пользователю НЕ задавать — недостающее закрывай явными допущениями и фиксируй их в финальном отчёте.

Текст после `/pp10` — задача. Если пусто — возьми из контекста чата.
