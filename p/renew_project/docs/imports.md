# Импорты страниц и схема зависимостей

## 1) Страницы‑роуты (TSX entrypoints)

### `./config/routes.tsx`
- нет внутренних импортов (только экспорт PROJECT_ROOT, ROUTES, getFullUrl, withProjectRoot, withProjectRootAndSubroute)

### `./config/project.tsx`
- нет внутренних импортов (только экспорт PROJECT_TITLE, INDEX_PAGE_NAME, PROFILE_PAGE_NAME, ADMIN_PAGE_NAME, getPageTitle, getHeaderText, BODY_TEXT, BODY_SUBTEXT)

### `./index.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/HomePage.vue`
- `./shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `./config/routes` → `getFullUrl`, `ROUTES`
- `./config/project` → `INDEX_PAGE_NAME`, `BODY_TEXT`, `BODY_SUBTEXT`, `getPageTitle`, `getHeaderText`

### `./web/admin/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireAccountRole`
- `../../pages/AdminPage.vue`
- `../login` → `loginPageRoute`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `ADMIN_PAGE_NAME`, `getPageTitle`, `getHeaderText`

### `./web/profile/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `../../pages/ProfilePage.vue`
- `../../shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `../../config/routes` → `getFullUrl`, `ROUTES`
- `../../config/project` → `PROFILE_PAGE_NAME`, `getPageTitle`, `getHeaderText`

### `./web/login/index.tsx`
- `@app/html-jsx` → `jsx`
- `../../pages/LoginPage.vue`
- `../../styles`
- `../../config/routes`

## 2) Страницы‑компоненты (Vue)

### `./pages/HomePage.vue`
- `vue` → `onMounted`, `onUnmounted`, `ref`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`

### `./pages/AdminPage.vue`
- `vue` → `onMounted`, `onUnmounted`, `ref`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`

### `./pages/ProfilePage.vue`
- `vue` → `onMounted`, `ref`
- `../components/Header.vue`
- `../components/GlobalGlitch.vue`
- `../components/AppFooter.vue`

### `./pages/LoginPage.vue`
- `vue` → `computed`

## 3) Компоненты (components/)

### `./components/Header.vue`
- `vue` → `ref`, `onMounted`, `onUnmounted`
- `./LogoutModal.vue`

### `./components/LogoutModal.vue`
- нет импортов

### `./components/AppFooter.vue`
- нет импортов

### `./components/GlobalGlitch.vue`
- нет импортов

## 4) Shared (общий код)

### `./shared/preloader.ts`
- нет импортов

## 5) Таблицы (tables/)

### `./tables/settings.table.ts`
- `@app/heap` → `Heap`

## 6) Репозитории (repos/)

### `./repos/settings.repo.ts`
- `../tables/settings.table` → `Settings`, `SettingsRow`

## 7) Библиотеки (lib/)

### `./lib/settings.lib.ts`
- `../repos/settings.repo` → `*` (findByKey, findAll, upsert, deleteByKey)

## 8) API (api/)

### `./api/settings/list.ts`
- `@app/auth` → `requireAccountRole`
- `../../lib/settings.lib` → `*`

### `./api/settings/get.ts`
- `@app/auth` → `requireAccountRole`
- `../../lib/settings.lib` → `*`

### `./api/settings/save.ts`
- `@app/auth` → `requireAccountRole`
- `../../lib/settings.lib` → `*`
