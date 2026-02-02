# Название проекта в шапке и title, проверка оркестратором

## Контекст
Пользователь запросил связать поле «Название проекта» в настройках админки (input#project-name) с заголовком в шапке (h1) и с document title так, чтобы в h1 отображалось «название из настроек / Название страницы», а в title — «Название страницы - Название из настроек». После реализации выполнен @check оркестратором.

---

### Пользователь

Поле input#project-name (настройки проекта в админке) должно влиять на имя, отображаемое в h1.header-title в Header.vue и в title страницы:
- В h1 название формировалось как «название из настроек + / + Название страницы».
- В title название формировалось как «Название страницы - Название из настроек».

### Ассистент

**Сделано:**
- В `config/project.tsx`: переименована константа в DEFAULT_PROJECT_TITLE; getPageTitle(pageName, projectName) возвращает «Название страницы - Название из настроек»; getHeaderText(pageName, projectName) возвращает «Название из настроек / Название страницы».
- В `index.tsx`, `web/admin/index.tsx`, `web/profile/index.tsx`: добавлен импорт settingsLib; при рендере вызывается getSettingString(ctx, SETTING_KEYS.PROJECT_NAME); полученное значение передаётся в getPageTitle и getHeaderText для формирования title и projectTitle.
- В `components/Header.vue`: в h1 выводится только projectTitle (уже в формате «название / страница»); убран отдельный блок « - pageName» и неиспользуемый стиль .page-name.

**Итог:** название проекта из настроек (ключ project_name) подставляется при серверном рендере в заголовок шапки и в document title. После изменения в админке новое значение видно после перезагрузки страницы.

---

### Пользователь

/check

### Ассистент

Выполнены проверки оркестратора по затронутым файлам (config/project.tsx, index.tsx, web/admin/index.tsx, web/profile/index.tsx, components/Header.vue).

**standards-checker:** Соответствие 001-standards.md (inner/docs): отступы 2 пробела, одинарные кавычки, относительные импорты, системные модули @app/* и @app/html-jsx. Нарушений не найдено.

**file-based-routing-checker:** Роуты не менялись, эндпоинты с путём `/`. Ссылки через getFullUrl(ROUTES.*). Замечаний нет.

**runtime-architecture-checker:** projectName берётся из getSettingString (при отсутствии в БД возвращается дефолт из settings.lib). Критических рисков не выявлено. При сбое БД настроек страница может упасть на этапе рендера — приемлемо, как и для getLogLevelForPage.

**imports-docs:** Обновлён docs/imports.md: config/project.tsx — экспорт DEFAULT_PROJECT_TITLE; index.tsx, web/admin/index.tsx, web/profile/index.tsx — добавлен импорт lib/settings.lib. Циклических зависимостей не обнаружено.

**docs-keeper:** Обновлены README.md (Changelog — запись о названии проекта в шапке и title) и docs/imports.md (импорты роутов и config/project).

**llm-conversation-logger:** Создан docs/LLM/0016-project-name-header-title-and-check.md с полным диалогом.

**Резюме:** Код в порядке. Замечаний по стандартам, роутингу и архитектуре нет. Документация и импорты приведены в соответствие.

**Что сделать дальше:** Дополнительных действий не требуется. После любых последующих правок повторить @check.
