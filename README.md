# Workspace s.chtm.khudoley.pro

Синхронизированное дерево приложений Chatium и вспомогательных каталогов (`p/`, `inner/` и др.).

## Скрипты в корневом `package.json`

- **`npm run typings`** — генерация деклараций в `.typings` (см. скрипт в `package.json`).
- **`npm run ts-lint`** — последовательная проверка типов для всех `tsconfig.json`, попадающих в git-индекс с учётом `.gitignore`, за исключением путей с `node_modules/` и `.typings/`. Скрипт: `scripts/lint-types-workspace.sh`. Подробности — в `inner/docs/020-testing.md` (раздел про TypeScript).

Подробнее о тестах и проверках: `inner/docs/020-testing.md`. Требования к обязательному прогону TypeScript для агентов: `.cursor/rules/ts-lint.mdc`.
