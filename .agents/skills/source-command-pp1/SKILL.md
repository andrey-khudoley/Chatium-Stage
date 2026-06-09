---
name: "source-command-pp1"
description: "Конвейер уровня 1 — микро. Правка делается основным чатом напрямую, статическая проверка типов/стиля, без агентов и плана. Самый быстрый и дешёвый. Для опечаток, однострочников, переименований."
---

# source-command-pp1

Use this skill when the user asks to run the migrated source command `/pp1`.

## Codex Adaptation

- Source of truth: `.claude/commands/pp1.md`.
- Claude tool metadata is historical; in Codex use available shell/search/edit tools and `apply_patch` for manual edits.
- If the command references `.claude/agents/pp-orchestrator.md`, use the synchronized Codex copy `.codex/agents/pp-orchestrator.toml` and the workflow reference `.codex/skills/chatium-workspace/references/workflows/pp.md`.

## Command Template

# /pp1 — микро-конвейер (уровень 1)

Прими роль оркестратора и веди задачу по плейбуку `.claude/agents/pp-orchestrator.md` с **N=1**.

Профиль: формализация inline → правка основным чатом → Bash типы/стиль → отчёт в 2 строки + блоки «## Метрики цикла» и «## Лимиты подписки» (токены/лимиты/время — на всех уровнях, см. START и фазу G плейбука). Без агентов, без плана, без ревью. Fix=0.

Текст после `/pp1` — задача. Если пусто — возьми из контекста чата. Вопросов не задавай.
