# Архитектура проекта p/neso/design_1

Продовая структура дизайн-системы: главные страницы приложения (dark/light), каталог компонентов, общая разметка и единая точка входа.

## Назначение маршрутов

| Путь | Назначение |
|------|------------|
| `/` | Лендинг: выбор темы и переход на главную страницу или каталог компонентов |
| `/web/dark` | **Главная страница** примера приложения (сводка) · тёмная тема «Ночной лес» |
| `/web/light` | **Главная страница** примера приложения (сводка) · светлая тема «Солнечная листва» |
| `/web/dark/components` | Каталог компонентов · тёмная тема |
| `/web/light/components` | Каталог компонентов · светлая тема |

Страницы `/web/dark` и `/web/light` являются основой проекта с точки зрения UI; каталог компонентов — вторичный.

## Структура папок

```
p/neso/design_1/
├── config/           # Конфигурация проекта и маршруты
│   ├── project.tsx    # Название проекта, хелперы title/header
│   └── routes.tsx    # PROJECT_ROOT, ROUTES, ROUTE_PATHS, getFullUrl
├── docs/             # Документация
│   └── architecture.md
├── layout/           # Оболочка страницы: shell, sidebar, content, grid
│   ├── DcAppShell.vue
│   ├── DcContent.vue
│   ├── DcMain.vue
│   ├── DcMainGrid.vue
│   ├── DcPageSection.vue
│   ├── DcSidebarOverlay.vue
│   └── index.ts
├── pages/            # Vue-страницы (по одной на тип экрана)
│   ├── DesignDemoPage.vue      # Единая страница сводки (theme: dark | light)
│   ├── DesignComponentsDarkPage.vue
│   └── DesignComponentsLightPage.vue
├── components/       # Переиспользуемые UI-компоненты дизайн-системы
├── shared/           # Общая логика и разметка
│   ├── demoPageShell.tsx  # Head + boot loader для страниц dark/light
│   ├── preloader.ts
│   ├── themeStyles.ts
│   ├── logLevel.ts
│   └── logger.ts
├── web/              # Точки входа роутов (file-based)
│   ├── dark/
│   │   ├── index.tsx         # Роут главной страницы · dark
│   │   └── components/
│   │       └── index.tsx     # Роут каталога компонентов · dark
│   └── light/
│       ├── index.tsx         # Роут главной страницы · light
│       └── components/
│           └── index.tsx    # Роут каталога компонентов · light
├── index.tsx         # Роут лендинга (/)
├── DESIGN_SPEC.md
├── design_v01.md
└── README.md
```

## Принципы

1. **Один экран — один Vue-компонент страницы.** Для сводки используется общий `DesignDemoPage.vue` с пропом `theme`; дублирование dark/light страниц устранено.
2. **Общая разметка в shared.** `demoPageShell.tsx` формирует `<head>` и прелоадер для страниц `/web/dark` и `/web/light`, чтобы не дублировать разметку в роутах.
3. **Маршруты в config.** Все пути и `getFullUrl` задаются в `config/routes.tsx`; ссылки на фронте и в роутах строятся через него.
4. **Лендинг — точка входа.** На главной сначала идёт блок «Главная страница» (сводка), затем «Библиотека компонентов».
