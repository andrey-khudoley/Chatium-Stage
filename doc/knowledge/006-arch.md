# Архитектура проекта в Chatium

Исчерпывающее руководство по организации файлов, структуре директорий и правилам именования в Chatium. Документ структурирован для удобства полнотекстового поиска и работы с эмбеддингами.

## Содержание

- [Основные принципы](#основные-принципы)
- [Структура директорий](#структура-директорий)
  - [Базовая структура](#базовая-структура)
  - [Полная структура](#полная-структура)
  - [Модульная организация](#модульная-организация)
- [Правила именования](#правила-именования)
  - [Файлы роутов](#файлы-роутов)
  - [Vue компоненты](#vue-компоненты)
  - [Константы и переменные](#константы-и-переменные)
  - [Таблицы](#таблицы)
- [Комментарии и директивы](#комментарии-и-директивы)
  - [@shared](#shared)
  - [@shared-route](#shared-route)
- [Организация по папкам](#организация-по-папкам)
  - [/api/ - API роуты](#api---api-роуты)
  - [/pages/ - Vue страницы](#pages---vue-страницы)
  - [/components/ - Переиспользуемые компоненты](#components---переиспользуемые-компоненты)
  - [/tables/ - Определения таблиц](#tables---определения-таблиц)
  - [/shared/ - Общий код](#shared---общий-код)
  - [/lib/ - Утилиты и библиотеки](#lib---утилиты-и-библиотеки)
- [Один файл — один роут](#один-файл--один-роут)
- [Избегание циклических импортов](#избегание-циклических-импортов)
- [Примеры организации](#примеры-организации)
- [Лучшие практики](#лучшие-практики)

---

## Основные принципы

### Золотые правила

1. **Один файл — один основной маршрут**
2. **Keep files small and maintainable** (держите файлы маленькими и поддерживаемыми)
3. **Структурируйте по функциональности**, а не по типу
4. **Избегайте циклических импортов**
5. **Используйте file-based роутинг**

### Философия организации

- ✅ Группируйте связанные файлы вместе
- ✅ Используйте понятные имена
- ✅ Следуйте единому стилю
- ✅ Документируйте сложную логику
- ❌ Не создавайте глубокие вложенности
- ❌ Не дублируйте код

---

## Структура директорий

### Базовая структура

Минимальная структура для простого приложения:

```
project/
├── index.tsx              # Главная страница (/)
└── pages/                 # Vue компоненты
    └── HomePage.vue
```

### Полная структура

Рекомендуемая структура для полноценного проекта:

```
project/
├── index.tsx              # Главная страница (/)
├── settings.tsx           # Страница настроек (/settings)
├── profile.tsx            # Страница профиля (/profile)
│
├── pages/                 # Vue компоненты страниц
│   ├── HomePage.vue
│   ├── SettingsPage.vue
│   └── ProfilePage.vue
│
├── components/            # Переиспользуемые компоненты
│   ├── Button.vue
│   ├── Header.vue
│   └── Footer.vue
│
├── api/                   # API endpoints
│   ├── users.ts
│   ├── products.ts
│   └── orders.ts
│
├── tables/                # Определения таблиц
│   ├── users.table
│   ├── products.table
│   └── orders.table
│
├── shared/                # Общий код для frontend и backend
│   ├── utils.ts
│   ├── constants.ts
│   └── types.ts
│
├── lib/                   # Утилиты и библиотеки
│   ├── repo/              # Репозитории данных
│   │   ├── userRepo.ts
│   │   └── productRepo.ts
│   └── core/              # Бизнес-логика
│       └── calculations.ts
│
├── styles.tsx             # Общие стили
└── .CHATIUM-LLM.md        # Документация проекта
```

### Модульная организация

Для крупных проектов используйте модульную структуру:

```
project/
├── admin-panel/           # Модуль админки
│   ├── index.tsx
│   ├── users.tsx
│   ├── pages/
│   │   ├── AdminDashboard.vue
│   │   └── UsersManagement.vue
│   └── api/
│       └── admin.ts
│
├── user-dashboard/        # Модуль пользователя
│   ├── index.tsx
│   ├── profile.tsx
│   ├── pages/
│   │   ├── Dashboard.vue
│   │   └── Profile.vue
│   └── api/
│       └── userdata.ts
│
├── tests/                 # Модуль тестирования (обязательный!)
│   ├── index.tsx          # Интерактивная страница /tests
│   ├── ai.tsx             # AI страница /tests/ai
│   ├── pages/
│   │   └── UnitTestsPage.vue
│   ├── api/
│   │   └── run-tests.ts   # Универсальный API тестов
│   └── shared/
│       └── test-definitions.ts  # Единый источник истины
│
└── shared/                # Общие ресурсы
    ├── components/
    └── tables/
```

**⚠️ ОБЯЗАТЕЛЬНО**: Каждый проект ДОЛЖЕН иметь папку `/tests/` с unit и интеграционными тестами.

---

## Правила именования

### Файлы роутов

**TSX файлы** (роуты и страницы):

- ✅ **camelCase** для файлов: `userProfile.tsx`, `productList.tsx`
- ✅ **Короткие, но описательные**: `settings.tsx`, `profile.tsx`
- ✅ **index.tsx** для корневого маршрута модуля

```
project/
├── index.tsx              # Главная страница
├── settings.tsx           # Настройки
├── userProfile.tsx        # Профиль пользователя
└── productList.tsx        # Список продуктов
```

**Константы роутов**:

- ✅ **camelCase** с суффиксом **Route**
- ✅ Начинайте с типа страницы/функции

```typescript
// ✅ Правильно
export const indexPageRoute = app.get('/', ...)
export const settingsPageRoute = app.get('/', ...)
export const userProfileRoute = app.get('/', ...)
export const apiCreateProductRoute = app.post('/create', ...)

// ❌ Неправильно
export const index = app.get('/', ...)
export const Settings = app.get('/', ...)
export const route1 = app.get('/', ...)
```

### Vue компоненты

**Файлы Vue**:

- ✅ **PascalCase**: `HomePage.vue`, `UserProfile.vue`
- ✅ Суффикс **Page** для страниц: `SettingsPage.vue`
- ✅ Суффикс **Component** опционален: `Button.vue` или `ButtonComponent.vue`

```
pages/
├── HomePage.vue           # Страница
├── SettingsPage.vue       # Страница
└── ProfilePage.vue        # Страница

components/
├── Button.vue             # Компонент
├── Header.vue             # Компонент
└── ProductCard.vue        # Компонент
```

### Константы и переменные

**TypeScript/JavaScript**:

- ✅ **camelCase** для переменных и функций
- ✅ **PascalCase** для классов и типов
- ✅ **UPPER_SNAKE_CASE** для констант

```typescript
// ✅ Правильно
const userName = 'John'
const calculateTotal = (items) => { ... }
const MAX_RETRIES = 3

interface UserProfile { ... }
class ProductService { ... }
type ApiResponse = { ... }

// ❌ Неправильно
const UserName = 'John'
const CalculateTotal = (items) => { ... }
const maxRetries = 3  // для констант используйте UPPER_SNAKE_CASE
```

### Таблицы

**Файлы таблиц**:

- ✅ **camelCase** с суффиксом **.table**
- ✅ Множественное число: `users.table`, `products.table`

```
tables/
├── users.table            # Таблица пользователей
├── products.table         # Таблица продуктов
├── orders.table           # Таблица заказов
└── orderItems.table       # Таблица элементов заказа
```

**Импорт таблиц**:

```typescript
// ✅ Правильно
import UsersTable from '../tables/users.table'
import ProductsTable from '../tables/products.table'

// ❌ Неправильно
import users from '../tables/users.table'
import Table1 from '../tables/products.table'
```

---

## Комментарии и директивы

### @shared

Используется для файлов, доступных и на frontend, и на backend:

```typescript
// @shared
import { jsx } from "@app/html-jsx"
import HomePage from './pages/HomePage.vue'

export const indexPageRoute = app.get('/', async (ctx) => {
  return <html>...</html>
})
```

**Когда использовать**:
- ✅ Файлы роутов, экспортирующих маршруты
- ✅ Общие утилиты в `/shared/`
- ✅ Константы и типы

### @shared-route

Используется для API роутов, которые можно вызывать с клиента:

```typescript
// @shared-route
import ProductsTable from "../tables/products.table"

export const apiProductsRoute = app.get('/list', async (ctx) => {
  const products = await ProductsTable.findAll(ctx, { limit: 100 })
  return products
})
```

**Когда использовать**:
- ✅ API endpoints в `/api/`
- ✅ Роуты, вызываемые через `.run()` с клиента

---

## Организация по папкам

### /api/ - API роуты

Все API endpoints располагаются в `/api/`:

```
api/
├── users.ts               # CRUD для пользователей
├── products.ts            # CRUD для продуктов
├── orders.ts              # CRUD для заказов
└── analytics.ts           # Аналитические endpoints
```

**Пример файла**:

```typescript
// api/products.ts
// @shared-route
import ProductsTable from '../tables/products.table'

export const apiGetProductsRoute = app.get('/list', async (ctx) => {
  const products = await ProductsTable.findAll(ctx, { limit: 100 })
  return { success: true, products }
})

export const apiCreateProductRoute = app.post('/create', async (ctx, req) => {
  const product = await ProductsTable.create(ctx, req.body)
  return { success: true, product }
})
```

### /pages/ - Vue страницы

Vue компоненты, рендерящиеся на страницах:

```
pages/
├── HomePage.vue
├── SettingsPage.vue
├── ProfilePage.vue
└── ProductListPage.vue
```

**Правило**: Каждому роуту — своя Vue страница.

### /components/ - Переиспользуемые компоненты

Общие Vue компоненты:

```
components/
├── Button.vue
├── Header.vue
├── Footer.vue
├── ProductCard.vue
└── UserAvatar.vue
```

**Правило**: Компоненты должны быть переиспользуемыми и независимыми.

### /tables/ - Определения таблиц

Определения heap-таблиц:

```
tables/
├── users.table
├── products.table
├── orders.table
└── orderItems.table
```

**Важно**:
- ❌ Таблицы доступны **только на backend**
- ✅ Для клиента создавайте API роуты

### /shared/ - Общий код

Код, используемый и на frontend, и на backend:

```
shared/
├── utils.ts               # Общие утилиты
├── constants.ts           # Константы
├── types.ts               # TypeScript типы
└── formatters.ts          # Форматирование данных
```

**Пример**:

```typescript
// shared/constants.ts
// @shared

export const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10 MB
export const ALLOWED_EXTENSIONS = ['jpg', 'png', 'pdf']
export const DEFAULT_PAGE_SIZE = 20
```

### /lib/ - Утилиты и библиотеки

Бизнес-логика и репозитории:

```
lib/
├── repo/                  # Репозитории данных
│   ├── userRepo.ts
│   ├── productRepo.ts
│   └── orderRepo.ts
│
└── core/                  # Бизнес-логика
    ├── calculations.ts
    ├── validators.ts
    └── transformers.ts
```

**Пример репозитория**:

```typescript
// lib/repo/userRepo.ts
import UsersTable from '../../tables/users.table'

export async function findUserByEmail(ctx, email: string) {
  return await UsersTable.findOneBy(ctx, { email })
}

export async function createUser(ctx, data) {
  return await UsersTable.create(ctx, data)
}
```

### /tests/ - Тестирование (обязательная папка!)

**⚠️ КРИТИЧЕСКИ ВАЖНО**: Каждый проект ДОЛЖЕН содержать папку `/tests/` с полным набором unit и интеграционных тестов.

```
tests/
├── index.tsx                 # Интерактивная страница → /project/tests
├── ai.tsx                    # AI страница (JSON) → /project/tests/ai
│
├── pages/
│   └── UnitTestsPage.vue     # Vue компонент для UI
│
├── api/
│   └── run-tests.ts          # Универсальный API для выполнения тестов
│
└── shared/
    └── test-definitions.ts   # ← ЕДИНЫЙ ИСТОЧНИК ИСТИНЫ для всех тестов
```

**Ключевые особенности**:

1. **Единый источник истины** - все тесты в `test-definitions.ts`
2. **Две страницы**:
   - `/tests` - интерактивная для разработчиков
   - `/tests/ai` - JSON для AI-агентов и мониторинга
3. **Синхронизация** - одинаковые тесты на обеих страницах
4. **Два типа API тестов**:
   - `api_internal` - внутренние вызовы через `route.run()`
   - `api_http` - реальные HTTP запросы через `request()`

**Пример структуры тестов**:

```typescript
// tests/shared/test-definitions.ts
export const TEST_CATEGORIES = [
  {
    name: 'database',
    title: 'Тесты базы данных',
    icon: 'fa-database',
    tests: [
      { name: 'table_exists', description: 'Проверка таблицы' },
      { name: 'create_record', description: 'Создание записи' }
    ]
  },
  {
    name: 'api_internal',
    title: 'Тесты API (внутренние)',
    icon: 'fa-code',
    tests: [
      { name: 'get_list', description: 'GET /api/items (route.run)' }
    ]
  },
  {
    name: 'api_http',
    title: 'Тесты HTTP доступности',
    icon: 'fa-globe',
    tests: [
      { name: 'http_get_list', description: 'HTTP GET /api/items' }
    ]
  }
]
```

**Почему тестировать через HTTP?**
- ✅ Проверка доступности endpoints (не "упал" ли фронт)
- ✅ Проверка роутинга и HTTP статусов
- ✅ Полный стек от HTTP до бизнес-логики

**Подробнее**: см. `knowledge/020-testing.md`

---

## Один файл — один роут

### Правило

Каждый TSX файл должен экспортировать **один основной маршрут**.

✅ **Правильно**:

```
project/
├── index.tsx              # export const indexPageRoute
├── settings.tsx           # export const settingsPageRoute
└── profile.tsx            # export const profilePageRoute
```

```typescript
// settings.tsx
export const settingsPageRoute = app.get('/', async (ctx) => {
  return <html>...</html>
})
```

❌ **Неправильно** (несколько роутов в одном файле):

```typescript
// pages.tsx  ❌ Плохо
export const homeRoute = app.get('/home', ...)
export const aboutRoute = app.get('/about', ...)
export const contactRoute = app.get('/contact', ...)
```

### Исключение

Допустимо несколько роутов в одном файле для **API** с общей логикой:

```typescript
// api/products.ts
// @shared-route

export const apiGetProductsRoute = app.get('/list', ...)
export const apiCreateProductRoute = app.post('/create', ...)
export const apiUpdateProductRoute = app.put('/update', ...)
export const apiDeleteProductRoute = app.delete('/delete', ...)
```

---

## Избегание циклических импортов

### Проблема

Циклические импорты возникают когда файл A импортирует B, а B импортирует A:

```
HomePage.vue → imports settingsRoute
                          ↓
                   settings.tsx → imports HomePage.vue (❌ ЦИКЛ!)
```

### Правильная модель

Однонаправленные зависимости: **UI → Routes → Shared/Core/Repo**

```
Vue компоненты (pages/)
         ↓
      Роуты (.tsx)
         ↓
  Shared/Lib (utils, repo)
```

### Примеры

✅ **Правильно**:

```typescript
// HomePage.vue
import { settingsRoute } from '../settings'
import { profileRoute } from '../profile'

// settingsRoute и profileRoute не импортируют HomePage
```

```typescript
// settings.tsx
import SettingsPage from './pages/SettingsPage.vue'
// НЕ импортируем другие роуты
```

❌ **Неправильно**:

```typescript
// HomePage.vue
import { settingsRoute } from '../settings'

// settings.tsx
import HomePage from './pages/HomePage.vue'  // ❌ HomePage импортирует settingsRoute!
```

### Решение

Выносите общие константы и типы в отдельные файлы:

```typescript
// shared/types.ts
export interface UserData { ... }

// HomePage.vue
import type { UserData } from '../shared/types'

// settings.tsx
import type { UserData } from './shared/types'
```

---

## Примеры организации

### Простое приложение

```
simple-app/
├── index.tsx              # Главная страница
├── about.tsx              # О нас
├── contact.tsx            # Контакты
│
├── pages/
│   ├── HomePage.vue
│   ├── AboutPage.vue
│   └── ContactPage.vue
│
└── api/
    └── contact.ts         # API для формы контакта
```

### Блог

```
blog/
├── index.tsx              # Список статей
├── post.tsx               # Одна статья (/:id)
├── editPost.tsx           # Редактирование (/:id)
├── admin.tsx              # Админка
│
├── pages/
│   ├── BlogListPage.vue
│   ├── PostPage.vue
│   ├── EditPostPage.vue
│   └── AdminPage.vue
│
├── api/
│   ├── posts.ts           # CRUD для статей
│   └── comments.ts        # CRUD для комментариев
│
└── tables/
    ├── posts.table
    └── comments.table
```

### E-commerce

```
shop/
├── index.tsx              # Главная
├── catalog.tsx            # Каталог
├── product.tsx            # Товар (/:id)
├── cart.tsx               # Корзина
├── checkout.tsx           # Оформление
│
├── pages/
│   ├── HomePage.vue
│   ├── CatalogPage.vue
│   ├── ProductPage.vue
│   ├── CartPage.vue
│   └── CheckoutPage.vue
│
├── api/
│   ├── products.ts
│   ├── cart.ts
│   ├── orders.ts
│   └── payment.ts
│
├── tables/
│   ├── products.table
│   ├── categories.table
│   ├── orders.table
│   └── orderItems.table
│
├── lib/
│   ├── repo/
│   │   ├── productRepo.ts
│   │   └── orderRepo.ts
│   └── core/
│       └── cartLogic.ts
│
└── components/
    ├── ProductCard.vue
    ├── CartItem.vue
    └── OrderSummary.vue
```

---

## Лучшие практики

### Организация файлов

✅ **Группируйте по функциональности**:
- Связанные файлы держите рядом
- Используйте модульную структуру для крупных проектов

✅ **Держите файлы маленькими**:
- Один файл — одна ответственность
- Разбивайте большие файлы на части

✅ **Используйте понятные имена**:
- Имя файла должно отражать его функцию
- Избегайте абстрактных имен (file1.tsx, temp.tsx)

### Именование

✅ **Следуйте конвенциям**:
- camelCase для файлов роутов и переменных
- PascalCase для Vue компонентов и типов
- UPPER_SNAKE_CASE для констант

✅ **Добавляйте суффиксы**:
- `Route` для констант роутов
- `Page` для Vue страниц
- `.table` для таблиц

### Импорты

✅ **Используйте относительные пути**:
```typescript
import HomePage from './pages/HomePage.vue'
import { getUserData } from './lib/repo/userRepo'
```

✅ **Группируйте импорты**:
```typescript
// Системные модули
import { jsx } from "@app/html-jsx"
import { requireAccountRole } from '@app/auth'

// Локальные модули
import HomePage from './pages/HomePage.vue'
import { settingsRoute } from './settings'
```

### Документация

✅ **Создавайте .CHATIUM-LLM.md**:
- Документируйте структуру проекта
- Описывайте основные таблицы и API
- Обновляйте при изменениях

✅ **Добавляйте комментарии к сложной логике**:
```typescript
// Рассчитываем скидку на основе количества товаров
// и статуса пользователя (VIP получает +5%)
const discount = calculateDiscount(items, user)
```

---

## Связанные документы

- **002-routing.md** — Роутинг и file-based архитектура
- **007-vue.md** — Vue компоненты
- **001-standards.md** — Стандарты кодирования

---

**Версия**: 1.0  
**Дата**: 2025-11-02  
**Последнее обновление**: Создание инструкции по архитектуре проекта

