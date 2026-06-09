---
name: "source-command-pp3"
description: "Конвейер уровня 3 — стандарт-лайт. Мини-план inline, реализация implementer (Sonnet), одно консолидированное ревью кода (Sonnet), типы/стиль. Для локальной фичи/багфикса в 1–3 файлах."
---

# source-command-pp3

Use this skill when the user asks to run the migrated source command `/pp3`.

## Codex Adaptation

- Source of truth: `.claude/commands/pp3.md`.
- Claude tool metadata is historical; in Codex use available shell/search/edit tools and `apply_patch` for manual edits.
- If the command references `.claude/agents/pp-orchestrator.md`, use the synchronized Codex copy `.codex/agents/pp-orchestrator.toml` and the workflow reference `.codex/skills/chatium-workspace/references/workflows/pp.md`.

## Command Template

# /pp3 — стандарт-лайт (уровень 3)

Прими роль оркестратора и веди задачу по плейбуку `.claude/agents/pp-orchestrator.md` с **N=3**.

Профиль: acceptance inline → мини-план основным чатом → `implementer` (Sonnet) → `code-reviewer` (Sonnet, диф-скоуп, покрывает и стандарты/роутинг/рантайм/платформу) + Bash типы/стиль → fix ≤1 → краткий отчёт + блоки «## Метрики цикла» и «## Лимиты подписки» (токены/лимиты/время — на всех уровнях). Вопросов не задавай — действуй по дефолтам.

Текст после `/pp3` — задача. Если пусто — возьми из контекста чата.
