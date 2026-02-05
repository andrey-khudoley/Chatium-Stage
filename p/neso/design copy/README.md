# p/neso/crm — демо дизайна

Проект содержит только демо-страницы дизайна (тёмная и светлая тема) для предпросмотра UI.

## Маршруты

- **/** — лендинг со ссылками на демо
- **/web/design-demo** — демо тёмной темы
- **/web/design-demo-light** — демо светлой темы

## Структура

- `config/` — маршруты и название проекта
- `pages/` — Vue-страницы: `DesignDemoPage.vue`, `DesignDemoLightPage.vue`
- `shared/` — прелоадер, уровень логов (клиент), логгер для компонентов
- `web/design-demo/`, `web/design-demo-light/` — точки входа для демо-страниц
- `docs/design.md`, `docs/design_v01.md` — описание дизайна

## Стек

Chatium, Vue 3, Tailwind CSS, FontAwesome, Google Fonts (Mulish, Old Standard TT).
