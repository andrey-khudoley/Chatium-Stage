# Импорты страниц и схема зависимостей

## 1) Страницы‑роуты (TSX entrypoints)

### `./index.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/HomePage.vue`
- `./shared/preloader` → `getPreloaderStyles`, `getPreloaderScript`
- `./config/routes` → `getFullUrl`, `ROUTES`

### `./admin.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireAccountRole`
- `./pages/AdminPage.vue`
- `./login`
- `./styles`

### `./profile.tsx`
- `@app/html-jsx` → `jsx`
- `@app/auth` → `requireRealUser`
- `./pages/ProfilePage.vue`
- `./login`
- `./styles`

### `./login.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/LoginPage.vue`
- `./styles`
- `./config/routes`

## 2) Страницы‑компоненты (Vue)

### `./pages/HomePage.vue`
- `vue` → `onMounted`, `onUnmounted`, `ref`
- `../shared/Header.vue`
- `../shared/GlobalGlitch.vue`
- `../shared/AppFooter.vue`

### `./pages/AdminPage.vue`
- нет импортов

### `./pages/ProfilePage.vue`
- нет импортов

### `./pages/LoginPage.vue`
- `vue` → `computed`

## 3) Shared-компоненты

### `./shared/preloader.ts`
- нет импортов

### `./shared/Header.vue`
- `vue` → `ref`, `onMounted`, `onUnmounted`
- `./LogoutModal.vue`

### `./shared/LogoutModal.vue`
- нет импортов

### `./shared/AppFooter.vue`
- нет импортов

### `./shared/GlobalGlitch.vue`
- нет импортов
