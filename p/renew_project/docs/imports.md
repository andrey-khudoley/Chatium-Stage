# Импорты страниц и схема зависимостей

## 1) Страницы‑роуты (TSX entrypoints)

### `./index.tsx`
- `@app/html-jsx` → `jsx`
- `./pages/HomePage.vue`
- `./styles`

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
- нет импортов

### `./pages/AdminPage.vue`
- нет импортов

### `./pages/ProfilePage.vue`
- нет импортов

### `./pages/LoginPage.vue`
- `vue` → `computed`
