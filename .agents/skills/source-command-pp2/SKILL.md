---
name: "source-command-pp2"
description: "Конвейер уровня 2 — быстрый. Правка основным чатом + самопроверка дифа + типы/стиль, 1 итерация правок. Дёшево. Для простых локальных изменений."
---

# source-command-pp2

Use this skill when the user asks to run the migrated source command `/pp2`.

## Codex Adaptation

- Source of truth: `.claude/commands/pp2.md`.
- Claude tool metadata is historical; in Codex use available shell/search/edit tools and `apply_patch` for manual edits.
- If the command references `.claude/agents/pp-orchestrator.md`, use the synchronized Codex copy `.codex/agents/pp-orchestrator.toml` and the workflow reference `.codex/skills/chatium-workspace/references/workflows/pp.md`.

## Command Template

# /pp2 — быстрый конвейер (уровень 2)

Прими роль оркестратора и веди задачу по плейбуку `.claude/agents/pp-orchestrator.md` с **N=2**.

Профиль: формализация inline → правка основным чатом → саморевью дифа + Bash типы/стиль → fix ≤1 → краткий отчёт + блоки «## Метрики цикла» и «## Лимиты подписки» (токены/лимиты/время — на всех уровнях). Без агентов. Вопросов не задавай.

Текст после `/pp2` — задача. Если пусто — возьми из контекста чата.
