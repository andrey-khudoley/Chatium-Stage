# Импорты страниц и схема зависимостей

## 1) Страницы‑роуты (TSX entrypoints)

### `./config/routes.tsx`
- нет внутренних импортов (только экспорт PROJECT_ROOT, ROUTES, getFullUrl, withProjectRoot, withProjectRootAndSubroute)

### `./index.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/HomePage.vue`
- `./shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `./config/routes` → `getFullUrl`, `ROUTES`

### `./web/admin/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireAccountRole`
- `../../pages/AdminPage.vue`
- `../login`
- `../../styles`

### `./web/profile/index.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `../../pages/ProfilePage.vue`
- `../login`
- `../../styles`

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
- нет импортов

### `./pages/ProfilePage.vue`
- нет импортов

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
