# p/neso/design_1 — демо дизайна

Проект содержит только демо-страницы дизайна (тёмная и светлая тема) для предпросмотра UI.

## Маршруты (относительно `/p/neso/design_1`)

- **/** — лендинг с выбором: библиотека компонентов и пример страницы (по 2 карточки на тему)
- **/web/dark/components** — библиотека компонентов · тёмная тема «Ночной лес»
- **/web/light/components** — библиотека компонентов · светлая тема «Солнечная листва»
- **/web/dark** — пример страницы (dashboard) · тёмная тема
- **/web/light** — пример страницы (dashboard) · светлая тема

## Структура

- `config/` — маршруты (`routes.tsx`, PROJECT_ROOT `p/neso/design_1`): `componentsDark`, `componentsLight`, `pageDark`, `pageLight`
- `pages/` — Vue: `DesignComponentsDarkPage.vue`, `DesignComponentsLightPage.vue` (библиотека), `DesignDemoDarkPage.vue`, `DesignDemoLightPage.vue` (пример страницы)
- `shared/` — прелоадер, уровень логов (клиент), логгер для компонентов
- `web/dark/`, `web/light/` — точки входа примера страницы; `web/dark/components/`, `web/light/components/` — точки входа библиотеки компонентов
- `DESIGN_SPEC.md`, `design_v01.md` — описание дизайна

## Стек

Chatium, Vue 3, Tailwind CSS, FontAwesome, Google Fonts (Mulish, Old Standard TT).
