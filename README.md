# Workspace s.chtm.khudoley.pro

Синхронизированное дерево приложений Chatium и вспомогательных каталогов (`p/`, `inner/` и др.).

Корневой `tsconfig.json` проверяет только выбранные каталоги (`inner/` без `inner/samples/`, `zoom-agent-tool/`, общие `types/*.d.ts`, `vue-global.d.ts`); каталоги `p/`, `.deprecated/`, `.cursor/` и сэмплы исключены, чтобы не подтягивать дублирующие Vue/JSX-shim из множества приложений. Для отдельного приложения в `p/` используйте его собственный `tsconfig.json`.

## Скрипты в корневом `package.json`

- **`npm run typings`** — генерация деклараций в `.typings` (см. скрипт в `package.json`).
- **`npm run ts-lint`** — последовательная проверка типов для всех `tsconfig.json`, попадающих в git-индекс с учётом `.gitignore`, за исключением путей с `node_modules/` и `.typings/`. Скрипт: `scripts/lint-types-workspace.sh`. Подробности — в `inner/docs/020-testing.md` (раздел про TypeScript).

Подробнее о тестах и проверках: `inner/docs/020-testing.md`. Требования к обязательному прогону TypeScript для агентов: `.cursor/rules/ts-lint.mdc`.

## Cursor: команды чата для этого воркспэйса

Файлы в `.cursor/commands/` (имя файла без `.md` = команда с `/`) подхватываются Cursor в списке slash-команд при открытом этом репозитории. Сейчас: `/pipeline`, `/check`, `/toprod-assistant`, `/pp` (параллельный пайплайн в Multitask — см. текст в `pp.md`).
