# Входящий роутинг в Chatium

Исчерпывающее руководство по обработке входящих HTTP запросов в Chatium. Документ структурирован для удобства полнотекстового поиска и работы с эмбеддингами.

## Содержание

- [Основные концепции](#основные-концепции)
- [File-based архитектура роутинга](#file-based-архитектура-роутинга)
  - [Навигация через слеш и тильду](#навигация-через-слеш-и-тильду)
  - [Примеры формирования URL](#примеры-формирования-url)
  - [Рекомендации по использованию](#рекомендации-по-использованию)
- [Типы роутов](#типы-роутов)
  - [app.get - GET запросы](#appget---get-запросы)
  - [app.post - POST запросы](#apppost---post-запросы)
  - [app.html - HTML страницы](#apphtml---html-страницы)
  - [app.put и app.delete](#appput-и-appdelete)
- [Структура обработчика](#структура-обработчика)
  - [Параметр ctx (контекст)](#параметр-ctx-контекст)
  - [Параметр req (запрос)](#параметр-req-запрос)
- [Параметры маршрутов](#параметры-маршрутов)
  - [Параметры пути (:id)](#параметры-пути-id)
  - [Query параметры (?key=value)](#query-параметры-keyvalue)
  - [Body параметры (POST/PUT)](#body-параметры-postput)
- [Форматирование ответов](#форматирование-ответов)
  - [Возврат JSON](#возврат-json)
  - [Возврат HTML](#возврат-html)
  - [Возврат с кастомными заголовками](#возврат-с-кастомными-заголовками)
  - [Обработка ошибок](#обработка-ошибок)
  - [Перенаправления](#перенаправления)
- [Генерация ссылок](#генерация-ссылок)
  - [Базовое использование route.url()](#базовое-использование-routeurl)
  - [Ссылки с параметрами](#ссылки-с-параметрами)
  - [Использование в Vue](#использование-в-vue)
- [Вызов API роутов через .run()](#вызов-api-роутов-через-run)
  - [Основные концепции](#основные-концепции-1)
  - [Почему .run(), а не fetch()?](#почему-run-а-не-fetch)
  - [Синтаксис .run()](#синтаксис-run)
  - [Примеры использования](#примеры-использования)
  - [Паттерны использования](#паттерны-использования)
  - [Импорт API роутов](#импорт-api-роутов)
  - [Когда использовать fetch() vs .run()](#когда-использовать-fetch-vs-run)
- [Валидация параметров](#валидация-параметров)
- [Чек-листы](#чек-листы)
  - [Чек-лист создания страницы](#чек-лист-создания-страницы)
  - [Чек-лист создания API роута](#чек-лист-создания-api-роута)
- [Лучшие практики](#лучшие-практики)

---

## Основные концепции

**Входящий роутинг** — механизм обработки HTTP запросов от клиентов к вашему приложению в Chatium.

### Ключевые понятия

- **Маршрут (Route)** — объект, создаваемый вызовом `app.get()`, `app.post()` и подобных функций
- **Обработчик (Handler)** — async функция, обрабатывающая запрос
- **Контекст (ctx)** — обязательный параметр обработчика, формируется автоматически фреймворком для каждого запроса
- **Request (req)** — объект с параметрами HTTP запроса

### Принципы работы

Chatium использует **file-based роутинг**: URL формируется на основе расположения файлов в проекте.

```
Расположение файла → Базовый путь → Итоговый URL
```

---

## File-based архитектура роутинга

### Навигация через слеш и тильду

**Навигация по файлам через `/` (слеш)**:
- Структура директорий определяет базовый путь
- Каждая папка добавляет сегмент к URL
- Пример: файл в `admin/settings/index.tsx` → `/admin/settings`

**Навигация внутри файла через `~` (тильда)**:
- Тильда отделяет базовый путь файла от явного маршрута
- Используется когда в файле объявлен путь отличный от `'/'`
- Пример: `app.get('/edit')` в файле `settings.tsx` → `/settings~edit`

### Примеры формирования URL

**Чистый путь (рекомендуется)**:

```typescript
// Файл: pages/dashboard/index.tsx
export const dashboardRoute = app.get('/', async (ctx, req) => {
  // URL: /pages/dashboard
  return <html>...</html>
})
```

**Путь с тильдой (явный маршрут)**:

```typescript
// Файл: pages/dashboard/settings.tsx
export const editSettingsRoute = app.get('/edit', async (ctx, req) => {
  // URL: /pages/dashboard/settings~edit
  // Тильда появляется из-за явного пути '/edit'
  return <html>...</html>
})
```

**Вложенные явные пути**:

```typescript
// Файл: api/settings.ts
export const advancedRoute = app.get('/advanced/security', async (ctx, req) => {
  // URL: /api/settings~advanced/security
  // Первая тильда отделяет базовый путь, далее обычные слеши
  return { settings: {} }
})
```

**Параметры пути**:

```typescript
// Файл: blog/post.tsx
export const postRoute = app.get('/:id', async (ctx, req) => {
  // URL: /blog/post~123 (где 123 — значение параметра id)
  const postId = req.params.id
  return <html>...</html>
})
```

### Рекомендации по использованию

✅ **Используйте `'/'` для чистых путей**:
- Внутри модуля используйте `'/'` как корень
- Позволяет фреймворку формировать чистые URL из структуры файлов

✅ **Используйте явные пути только при необходимости**:
- Публичные API endpoints с фиксированными URL
- Обратная совместимость со старыми ссылками
- Специальные пермалинки

❌ **Избегайте избыточных явных путей**:
- Не дублируйте структуру папок в явных путях
- Полагайтесь на file-based роутинг для организации

---

## Типы роутов

### app.get - GET запросы

Используется для получения данных и отображения страниц:

```typescript
// Файл: index.tsx
export const indexPageRoute = app.get('/', async (ctx, req) => {
  return { message: 'Hello, World!' }
})
```

```typescript
// Файл: api/products.ts
export const getProductsRoute = app.get('/list', async (ctx, req) => {
  const products = await ProductsTable.findAll(ctx, { limit: 100 })
  return products
})
```

### app.post - POST запросы

Используется для создания и изменения данных:

```typescript
// Файл: api/products.ts
export const createProductRoute = app.post('/create', async (ctx, req) => {
  const { name, price } = req.body
  
  const product = await ProductsTable.create(ctx, {
    name,
    price: new Money(price, 'RUB')
  })
  
  return { success: true, product }
})
```

### app.html - HTML страницы

Семантический вариант app.get для HTML страниц:

```typescript
// @shared
import { jsx } from "@app/html-jsx"
import HomePage from './pages/HomePage.vue'

export const homePageRoute = app.html('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Главная страница</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
      </head>
      <body>
        <HomePage />
      </body>
    </html>
  )
})
```

**Важно**:
- Используйте комментарий `// @shared` для экспорта маршрута
- Импортируйте `{ jsx }` из `@app/html-jsx`
- Всегда закрывайте все HTML теги

### app.put и app.delete

Используются для обновления и удаления:

```typescript
// PUT - обновление
export const updateProductRoute = app.put('/update', async (ctx, req) => {
  const { id, name, price } = req.body
  
  const product = await ProductsTable.update(ctx, {
    id,
    name,
    price: new Money(price, 'RUB')
  })
  
  return { success: true, product }
})

// DELETE - удаление
export const deleteProductRoute = app.delete('/delete', async (ctx, req) => {
  const { id } = req.query
  
  await ProductsTable.delete(ctx, id)
  
  return { success: true }
})
```

---

## Структура обработчика

Обработчик маршрута — это async функция с двумя параметрами:

```typescript
export const myRoute = app.get('/', async (ctx, req) => {
  // ctx — контекст приложения (формируется автоматически)
  // req — объект HTTP запроса
  
  // Ваша логика
  
  return result
})
```

### Параметр ctx (контекст)

**Формируется автоматически фреймворком** для каждого запроса:

```typescript
ctx.user           // Текущий пользователь (см. 003-auth.md)
ctx.account        // Текущий аккаунт
ctx.session        // Сессия пользователя
ctx.lang           // Язык пользователя ('ru', 'en', etc.)
ctx.t()            // Функция локализации

// Логирование
ctx.account.log('Сообщение', { level: 'info', json: { data } })
```

**Важно**:
- ctx — обязательный параметр всех обработчиков
- Формируется автоматически, не требует ручного создания
- Содержит полную информацию о запросе и пользователе

### Параметр req (запрос)

Объект с параметрами HTTP запроса:

```typescript
req.query          // Query параметры (?key=value)
req.params         // Параметры пути (:id, :slug)
req.body           // Тело POST/PUT запроса
req.headers        // HTTP заголовки
```

---

## Параметры маршрутов

### Параметры пути (:id)

Определяются с помощью двоеточия в шаблоне маршрута:

```typescript
// Файл: blog/post.tsx
export const postRoute = app.get('/:id', async (ctx, req) => {
  const postId = req.params.id
  // URL: /blog/post~123 → postId = "123"
  
  const post = await PostsTable.findById(ctx, postId)
  
  if (!post) {
    return { error: 'Post not found' }
  }
  
  return (
    <html>
      <body>
        <PostPage post={post} />
      </body>
    </html>
  )
})
```

**Несколько параметров**:

```typescript
export const articleRoute = app.get('/:category/:articleId', async (ctx, req) => {
  const { category, articleId } = req.params
  // URL: /blog~technology/article-123
  // category = "technology", articleId = "article-123"
  
  return { category, articleId }
})
```

### Query параметры (?key=value)

Передаются в URL после знака вопроса:

```typescript
export const searchRoute = app.get('/search', async (ctx, req) => {
  const query = req.query.q as string
  const page = parseInt(req.query.page as string || '1')
  const limit = parseInt(req.query.limit as string || '10')
  
  // URL: /search~search?q=chatium&page=2&limit=20
  // query = "chatium", page = 2, limit = 20
  
  const results = await performSearch(ctx, query, page, limit)
  
  return { results, page, limit }
})
```

### Body параметры (POST/PUT)

Доступны в req.body для POST и PUT запросов:

```typescript
export const createUserRoute = app.post('/create', async (ctx, req) => {
  const { name, email, age } = req.body
  
  // Валидация
  if (!name || !email) {
    return { error: 'Name and email are required' }
  }
  
  const user = await UsersTable.create(ctx, {
    name,
    email,
    age: age || null
  })
  
  return { success: true, user }
})
```

---

## Форматирование ответов

### Возврат JSON

Возвращайте простые JavaScript объекты — они автоматически сериализуются в JSON:

```typescript
export const apiRoute = app.get('/data', async (ctx, req) => {
  return {
    success: true,
    data: {
      id: '123',
      name: 'Product',
      price: 999
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  }
})
```

**Рекомендуемый формат успешного ответа**:

```typescript
return {
  success: true,
  data: result,
  meta?: { ... }  // Опционально
}
```

**Рекомендуемый формат ответа с ошибкой**:

```typescript
return {
  success: false,
  error: 'Error message',
  code?: 'ERROR_CODE'  // Опционально
}
```

### Возврат HTML

Используйте JSX для серверного рендеринга:

```typescript
// @shared
import { jsx } from "@app/html-jsx"

export const pageRoute = app.get('/', async (ctx, req) => {
  return (
    <html>
      <head>
        <title>Page Title</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charset="UTF-8" />
      </head>
      <body>
        <h1>Hello, World!</h1>
      </body>
    </html>
  )
})
```

### Возврат с кастомными заголовками

Для отдачи файлов или контента с кастомными HTTP заголовками используйте формат с `rawHttpBody`:

```typescript
// Отдача JavaScript файла
export const serveJsRoute = app.get('/:filename', async (ctx, req) => {
  const { filename } = req.params
  
  const script = await ScriptsTable.findOneBy(ctx, { name: filename })
  
  if (!script) {
    return 'Script not found'
  }
  
  return {
    statusCode: 200,
    rawHttpBody: script.content,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8'
    }
  }
})
```

**Формат ответа с заголовками**:

```typescript
return {
  statusCode: number,      // HTTP статус код (200, 404, 500, etc.)
  rawHttpBody: string,     // Контент ответа (строка)
  headers: {               // Объект с HTTP заголовками
    'Header-Name': 'value'
  }
}
```

**Примеры для разных типов контента**:

```typescript
// CSS файл
return {
  statusCode: 200,
  rawHttpBody: cssContent,
  headers: {
    'Content-Type': 'text/css; charset=utf-8'
  }
}

// JavaScript файл
return {
  statusCode: 200,
  rawHttpBody: jsContent,
  headers: {
    'Content-Type': 'application/javascript; charset=utf-8'
  }
}

// Текстовый файл
return {
  statusCode: 200,
  rawHttpBody: textContent,
  headers: {
    'Content-Type': 'text/plain; charset=utf-8'
  }
}

// JSON с дополнительными заголовками
return {
  statusCode: 200,
  rawHttpBody: JSON.stringify(data),
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Custom-Header': 'custom-value'
  }
}

// Файл для скачивания
return {
  statusCode: 200,
  rawHttpBody: fileContent,
  headers: {
    'Content-Type': 'application/javascript; charset=utf-8',
    'Content-Disposition': 'attachment; filename=script.js'
  }
}
```

**Важные моменты**:

⚠️ **НЕ используйте `ctx.header()` или `ctx.set()` — эти методы не существуют!**

```typescript
// ❌ НЕПРАВИЛЬНО - эти методы не работают
ctx.header('Content-Type', 'text/css')
ctx.set('Content-Type', 'text/css')
return content

// ✅ ПРАВИЛЬНО - используйте объект с rawHttpBody и headers
return {
  statusCode: 200,
  rawHttpBody: content,
  headers: {
    'Content-Type': 'text/css; charset=utf-8'
  }
}
```

**Когда использовать**:

✅ Используйте `rawHttpBody` для:
- Отдачи JavaScript и CSS файлов
- Отдачи текстового контента с специфическим Content-Type
- Установки дополнительных заголовков (Cache-Control, CORS, etc.)
- Файлов для скачивания (Content-Disposition)

✅ Используйте обычный `return` для:
- JSON ответов (автоматически сериализуется)
- HTML страниц (JSX)
- Простых текстовых ответов без специальных заголовков

**Пример реального использования**:

```typescript
// Файл: serve.tsx
// Отдача скриптов и стилей с правильным Content-Type

export const serveScriptRoute = app.get('/:filename', async (ctx, req) => {
  const { filename } = req.params
  
  // Определяем расширение и имя файла
  const extension = filename.match(/\.(js|css)$/)?.[1]
  const name = filename.replace(/\.(js|css)$/, '')
  
  // Ищем скрипт по имени
  const script = await ScriptsTable.findOneBy(ctx, { name })
  
  if (!script) {
    return 'Script not found'
  }
  
  // Определяем Content-Type в зависимости от расширения
  let contentType = 'text/plain; charset=utf-8'
  if (extension === 'css') {
    contentType = 'text/css; charset=utf-8'
  } else if (extension === 'js') {
    contentType = 'application/javascript; charset=utf-8'
  }
  
  // Возвращаем контент с правильными заголовками
  return {
    statusCode: 200,
    rawHttpBody: script.content,
    headers: {
      'Content-Type': contentType
    }
  }
})
```

**Почему это важно**:

Firefox и другие браузеры строго проверяют MIME-типы для CSS и JS файлов:
- Неправильный `Content-Type` для CSS → ошибка `NS_ERROR_FAILURE`, стиль не применяется
- Неправильный `Content-Type` для JS → скрипт может не выполниться
- Простой `return` строки → Content-Type по умолчанию `text/plain`, что неправильно для файлов

### Обработка ошибок

**Базовая обработка**:

```typescript
export const apiRoute = app.post('/action', async (ctx, req) => {
  try {
    const result = await performAction(ctx, req.body)
    return { success: true, result }
  } catch (error) {
    ctx.account.log('API error', { 
      level: 'error', 
      json: { error: error.message } 
    })
    return { 
      success: false, 
      error: error.message 
    }
  }
})
```

**Валидация с ранним возвратом**:

```typescript
export const createItemRoute = app.post('/create', async (ctx, req) => {
  const { name, price } = req.body
  
  // Валидация
  if (!name) {
    return { success: false, error: 'Name is required' }
  }
  
  if (!price || price <= 0) {
    return { success: false, error: 'Invalid price' }
  }
  
  // Создание
  const item = await ItemsTable.create(ctx, { name, price })
  
  return { success: true, item }
})
```

**Логирование ошибок**:

```typescript
// ❌ Неправильно
console.log('Error:', error)

// ✅ Правильно
ctx.account.log('Error occurred', {
  level: 'error',
  json: { error: error.message, stack: error.stack }
})
```

### Перенаправления

Используйте `ctx.resp.redirect()` для перенаправлений:

```typescript
// На явный URL
export const oldPageRoute = app.get('/', async (ctx) => {
  return ctx.resp.redirect('https://example.com')
})

// На другой маршрут
import { dashboardRoute } from "./dashboard.tsx"

export const redirectRoute = app.get('/', async (ctx) => {
  return ctx.resp.redirect(dashboardRoute.url())
})
```

---

## Генерация ссылок

### Базовое использование route.url()

Всегда используйте `route.url()` для получения URL маршрута:

```typescript
// В файле settings.tsx
export const settingsRoute = app.get('/', async (ctx) => {
  return <html>...</html>
})

// В другом месте
import { settingsRoute } from './settings'

const url = settingsRoute.url()
// Вернёт: /pages/settings
```

**Важно**:
- `route.url()` всегда возвращает полный URL с протоколом и хостом
- Никогда не хардкодьте пути — всегда используйте `.url()`

### Ссылки с параметрами

**С параметрами пути**:

```typescript
// Роут с параметром
export const postRoute = app.get('/:id', async (ctx, req) => {
  return <html>...</html>
})

// Генерация URL
const postId = '123'
const url = postRoute.url({ id: postId })
// Вернёт: /blog/post~123
```

**С несколькими параметрами**:

```typescript
export const articleRoute = app.get('/:category/:articleId', async (ctx, req) => {
  return <html>...</html>
})

const url = articleRoute.url({ 
  category: 'technology', 
  articleId: 'article-456' 
})
// Вернёт: /blog~technology/article-456
```

**С query параметрами**:

```typescript
export const searchRoute = app.get('/search', async (ctx, req) => {
  return <html>...</html>
})

// Используйте встроенный метод query
const url = searchRoute.query({ q: 'chatium', page: '2' }).url()
// Вернёт: /search~search?q=chatium&page=2
```

### Использование в Vue

```vue
<script setup>
import { computed } from 'vue'
import { settingsRoute } from '../settings'
import { postRoute } from '../post'

const settingsUrl = computed(() => settingsRoute.url())
const postUrl = computed(() => postRoute.url({ id: '123' }))
</script>

<template>
  <nav>
    <a :href="settingsUrl">Настройки</a>
    <a :href="postUrl">Статья #123</a>
  </nav>
</template>
```

---

## Вызов API роутов через .run()

### Основные концепции

**`.run()`** — метод для вызова API роутов **внутри** Chatium приложения (клиент-серверное взаимодействие).

⚠️ **КРИТИЧЕСКИ ВАЖНО**: Для вызова внутренних API роутов **ВСЕГДА** используйте `.run()`, а **НЕ** `fetch()`.

### Почему .run(), а не fetch()?

**✅ Преимущества .run()**:
- Автоматическая передача контекста (ctx)
- Типобезопасность через TypeScript
- Нет необходимости в URL — роут знает свой путь
- Работает как на клиенте, так и на сервере
- Автоматическая сериализация/десериализация данных
- Консистентность с file-based роутингом

**❌ Проблемы fetch()**:
- Требует хардкод URL (нарушает file-based роутинг)
- Требует ручной сериализации данных
- Нет типизации
- Ломается при изменении структуры файлов
- Требует ручного управления headers

**Пример проблемы**:
```vue
<script setup>
// ❌ ПЛОХО - использование fetch с хардкод URL
async function loadData() {
  const response = await fetch('/dev/amocrm-connector/commentService/api/status')
  const data = await response.json()
  // Если файл переименуется, это сломается!
}

// ✅ ПРАВИЛЬНО - использование .run()
import { apiGetCommentServiceStatusRoute } from '../api/commentService'

async function loadData() {
  const data = await apiGetCommentServiceStatusRoute.run(ctx)
  // Всегда работает, независимо от структуры файлов!
}
</script>
```

### Синтаксис .run()

**Базовый синтаксис**:
```typescript
const result = await apiRoute.run(ctx, requestData?)
```

- **ctx** — глобальный контекст (обязательный первый параметр)
- **requestData** — данные запроса (опциональный второй параметр)

### Примеры использования

#### GET запросы без параметров

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { apiGetStatusRoute } from '../api/service'

const status = ref(null)

onMounted(async () => {
  // Простой GET без параметров
  const data = await apiGetStatusRoute.run(ctx)
  
  if (data.success) {
    status.value = data.enabled
  }
})
</script>
```

**API роут**:
```typescript
// api/service.ts
export const apiGetStatusRoute = app.get('/status', async (ctx) => {
  return {
    success: true,
    enabled: true
  }
})
```

#### GET запросы с query параметрами

```vue
<script setup>
import { ref } from 'vue'
import { apiGetLogsRoute } from '../api/logs'

const logs = ref([])

async function loadLogs() {
  // GET с query параметрами
  const data = await apiGetLogsRoute.run(ctx, { 
    limit: 50, 
    offset: 0 
  })
  
  if (data.success) {
    logs.value = data.logs
  }
}
</script>
```

**API роут**:
```typescript
// api/logs.ts
export const apiGetLogsRoute = app.get('/logs', async (ctx) => {
  const limit = parseInt(ctx.req.query.limit as string) || 50
  const offset = parseInt(ctx.req.query.offset as string) || 0
  
  const logs = await LogsTable.findAll(ctx, {
    limit,
    offset
  })
  
  return {
    success: true,
    logs
  }
})
```

#### POST запросы с данными

```vue
<script setup>
import { ref } from 'vue'
import { apiSaveTemplateRoute } from '../api/templates'

const template = ref('')
const saving = ref(false)

async function saveTemplate() {
  saving.value = true
  
  try {
    // POST с body данными
    const data = await apiSaveTemplateRoute.run(ctx, {
      template: template.value
    })
    
    if (data.success) {
      alert('Шаблон сохранен!')
    } else {
      alert('Ошибка: ' + data.error)
    }
  } finally {
    saving.value = false
  }
}
</script>
```

**API роут**:
```typescript
// api/templates.ts
export const apiSaveTemplateRoute = app.post('/template', async (ctx, req) => {
  const { template } = req.body
  
  if (!template) {
    return {
      success: false,
      error: 'Шаблон обязателен'
    }
  }
  
  await SettingsTable.createOrUpdateBy(ctx, 'key', {
    key: 'template',
    value: template
  })
  
  return {
    success: true
  }
})
```

#### Обработка ошибок

```vue
<script setup>
import { ref } from 'vue'
import { apiCreateProductRoute } from '../api/products'

const error = ref(null)
const loading = ref(false)

async function createProduct(productData) {
  loading.value = true
  error.value = null
  
  try {
    const result = await apiCreateProductRoute.run(ctx, productData)
    
    if (!result.success) {
      // Ошибка от API
      error.value = result.error
      return
    }
    
    // Успех
    console.log('Создан продукт:', result.product)
    
  } catch (e) {
    // Исключение (сетевая ошибка, etc)
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>
```

### Паттерны использования

#### Паттерн 1: Загрузка данных при монтировании

```vue
<script setup>
import { ref, onMounted } from 'vue'
import { apiGetDataRoute } from '../api/data'

const data = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const result = await apiGetDataRoute.run(ctx)
    data.value = result.data
  } catch (error) {
    console.error('Ошибка загрузки:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-if="loading">Загрузка...</div>
  <div v-else>{{ data }}</div>
</template>
```

#### Паттерн 2: Отправка формы

```vue
<script setup>
import { ref } from 'vue'
import { apiSubmitFormRoute } from '../api/forms'

const form = ref({
  name: '',
  email: ''
})
const submitting = ref(false)

async function handleSubmit() {
  submitting.value = true
  
  try {
    const result = await apiSubmitFormRoute.run(ctx, form.value)
    
    if (result.success) {
      // Очистка формы
      form.value = { name: '', email: '' }
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.name" placeholder="Имя" />
    <input v-model="form.email" type="email" placeholder="Email" />
    <button :disabled="submitting">
      {{ submitting ? 'Отправка...' : 'Отправить' }}
    </button>
  </form>
</template>
```

#### Паттерн 3: Переключатель (toggle)

```vue
<script setup>
import { ref } from 'vue'
import { apiToggleServiceRoute } from '../api/service'

const enabled = ref(false)
const loading = ref(false)

async function toggle() {
  loading.value = true
  
  try {
    const result = await apiToggleServiceRoute.run(ctx, {
      enabled: !enabled.value
    })
    
    if (result.success) {
      enabled.value = result.enabled
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <button @click="toggle" :disabled="loading">
    {{ enabled ? 'Выключить' : 'Включить' }}
  </button>
</template>
```

#### Паттерн 4: Повторная отправка

```vue
<script setup>
import { ref } from 'vue'
import { apiRetryActionRoute } from '../api/actions'

const retryingId = ref(null)

async function retry(itemId) {
  if (!confirm('Повторить действие?')) return
  
  retryingId.value = itemId
  
  try {
    const result = await apiRetryActionRoute.run(ctx, {
      id: itemId
    })
    
    if (result.success) {
      // Обновить список
      await loadItems()
    }
  } finally {
    retryingId.value = null
  }
}
</script>

<template>
  <button 
    @click="retry(item.id)" 
    :disabled="retryingId === item.id"
  >
    <i :class="{ 'animate-spin': retryingId === item.id }"></i>
    Повторить
  </button>
</template>
```

### Импорт API роутов

**Всегда импортируйте API роуты в начале `<script setup>`**:

```vue
<script setup>
import { ref, onMounted } from 'vue'

// ✅ ПРАВИЛЬНО - импортируем роуты из API файлов
import { 
  apiGetStatusRoute,
  apiToggleServiceRoute,
  apiGetLogsRoute,
  apiRetryActionRoute 
} from '../api/service'

// Остальной код
</script>
```

### Когда использовать fetch() vs .run()

**✅ Используйте .run() для**:
- Вызова внутренних API роутов Chatium
- Клиент-серверного взаимодействия внутри приложения
- Любых запросов к `app.get()`, `app.post()` и т.д.

**✅ Используйте fetch() для**:
- Внешних API (другие домены)
- Интеграций с третьими сервисами
- Запросов к AmoCRM, GetCourse, и т.д.

**Пример**:
```typescript
// ✅ Внутренний API - используем .run()
const status = await apiGetStatusRoute.run(ctx)

// ✅ Внешний API - используем fetch()
const amocrmData = await fetch('https://subdomain.amocrm.ru/api/v4/leads', {
  headers: { 'Authorization': `Bearer ${token}` }
})
```

### Чек-лист

Перед тем как закоммитить код с API вызовами, проверьте:

- [ ] ✅ Все внутренние API вызовы используют `.run()`
- [ ] ✅ Нет `fetch()` для внутренних роутов
- [ ] ✅ API роуты импортированы из API файлов
- [ ] ✅ Первый параметр `.run()` — это `ctx`
- [ ] ✅ Данные передаются вторым параметром
- [ ] ✅ Обработаны ошибки (try/catch)
- [ ] ✅ Показывается состояние загрузки
- [ ] ✅ Нет хардкода URL в коде

---

## 🚨 КРИТИЧЕСКАЯ ОШИБКА: Хардкод URL вместо роут-объектов

### Проблема

**Самая распространённая ошибка** при работе с роутами — использование хардкода URL вместо роут-объектов.

#### ❌ Неправильно (НИКОГДА ТАК НЕ ДЕЛАЙТЕ):

```vue
<!-- HomePage.vue -->
<script setup>
import { computed } from 'vue'

// ❌ ПЛОХО - хардкод URL
const customFieldsUrl = computed(() => '/dev/amocrm-connector/customFields')
</script>

<template>
  <a :href="customFieldsUrl">Дополнительные поля</a>
</template>
```

#### ✅ Правильно:

```vue
<!-- HomePage.vue -->
<script setup>
import { computed } from 'vue'
import { customFieldsPageRoute } from '../customFields'

// ✅ ПРАВИЛЬНО - использование роут-объекта
const customFieldsUrl = computed(() => customFieldsPageRoute.url())
</script>

<template>
  <a :href="customFieldsUrl">Дополнительные поля</a>
</template>
```

### Почему хардкод — это КАТАСТРОФА?

#### 1. Ломается при переименовании файлов

```typescript
// Было: customFields.tsx
export const customFieldsPageRoute = app.get('/', async (ctx) => {
  return <html>...</html>
})
// URL: /dev/amocrm-connector/customFields

// Стало: fields.tsx (файл переименовали)
export const customFieldsPageRoute = app.get('/', async (ctx) => {
  return <html>...</html>
})
// URL: /dev/amocrm-connector/fields (изменился автоматически!)

// Хардкод '/dev/amocrm-connector/customFields' → 404 ошибка! 🔴
// Роут-объект customFieldsPageRoute.url() → работает! ✅
```

#### 2. Ломается при изменении базового пути

```typescript
// Было: /dev/amocrm-connector/customFields
// Стало: /prod/amocrm-connector/customFields (переехали в продакшен)

// Хардкод '/dev/amocrm-connector/customFields' → 404 ошибка! 🔴
// Роут-объект customFieldsPageRoute.url() → работает! ✅
```

#### 3. Ломается при изменении структуры роутов

```typescript
// Было: customFields.tsx с роутом '/'
// URL: /dev/amocrm-connector/customFields

// Стало: customFields.tsx с роутом '/list'
export const customFieldsPageRoute = app.get('/list', async (ctx) => {
  return <html>...</html>
})
// URL: /dev/amocrm-connector/customFields~list

// Хардкод '/dev/amocrm-connector/customFields' → 404 ошибка! 🔴
// Роут-объект customFieldsPageRoute.url() → работает! ✅
```

#### 4. Нет типизации и автокомплита

```typescript
// ❌ Хардкод - никаких подсказок IDE
const url = '/dev/amocrm-connector/customFields' // опечатка? IDE не знает!

// ✅ Роут-объект - IDE знает о роуте
import { customFieldsPageRoute } from '../customFields' // автокомплит!
const url = customFieldsPageRoute.url() // IDE проверит корректность!
```

### Как работает File-based роутинг

**ВАЖНО ПОНЯТЬ**: URL формируется автоматически из структуры файлов!

```
Файл: /dev/amocrm-connector/customFields.tsx
Роут внутри: app.get('/', ...)

Итоговый URL = базовый путь + имя файла + внутренний путь
             = /dev/amocrm-connector + /customFields + /
             = /dev/amocrm-connector/customFields
```

**Вы НЕ контролируете** полный URL напрямую — он формируется из:
1. Местоположения файла в папке проекта
2. Имени файла
3. Пути внутри роута

Поэтому **НИКОГДА** не пишите полные URL вручную!

### Типичные ошибки и их решения

#### ❌ ОШИБКА 1: Хардкод полного URL

```vue
<!-- ❌ ПЛОХО -->
<script setup>
const url = '/dev/amocrm-connector/customFields'
</script>

<!-- ✅ ПРАВИЛЬНО -->
<script setup>
import { customFieldsPageRoute } from '../customFields'
const url = computed(() => customFieldsPageRoute.url())
</script>
```

#### ❌ ОШИБКА 2: Забыли вызвать .url()

```vue
<!-- ❌ ПЛОХО - передаётся объект роута, а не строка! -->
<script setup>
import { customFieldsPageRoute } from '../customFields'
</script>
<template>
  <a :href="customFieldsPageRoute">Ссылка</a>
</template>

<!-- ✅ ПРАВИЛЬНО - вызываем .url() -->
<script setup>
import { customFieldsPageRoute } from '../customFields'
</script>
<template>
  <a :href="customFieldsPageRoute.url()">Ссылка</a>
</template>
```

#### ❌ ОШИБКА 3: Не импортировали роут

```vue
<!-- ❌ ПЛОХО - роут не импортирован -->
<script setup>
const url = customFieldsPageRoute.url() // ReferenceError!
</script>

<!-- ✅ ПРАВИЛЬНО - импортируем роут -->
<script setup>
import { customFieldsPageRoute } from '../customFields'
const url = customFieldsPageRoute.url()
</script>
```

#### ❌ ОШИБКА 4: Неправильный путь импорта

```typescript
// ❌ ПЛОХО - неправильные пути
import { customFieldsPageRoute } from './customFields' // возможно неверно
import { customFieldsPageRoute } from 'customFields' // ошибка!
import { customFieldsPageRoute } from '@/customFields' // не поддерживается

// ✅ ПРАВИЛЬНО - относительный путь от текущего файла
import { customFieldsPageRoute } from '../customFields'
import { customFieldsPageRoute } from '../../amocrm-connector/customFields'
```

#### ❌ ОШИБКА 5: Хардкод с параметрами

```vue
<!-- ❌ ПЛОХО - конкатенация строк -->
<script setup>
const productId = '123'
const url = '/dev/shop/product/' + productId
</script>

<!-- ✅ ПРАВИЛЬНО - параметры роута -->
<script setup>
import { productRoute } from '../product'
const productId = '123'
const url = productRoute.url({ id: productId })
</script>
```

### Правила использования роутов

#### Правило №1: Всегда экспортируй роуты

```typescript
// ✅ ПРАВИЛЬНО - customFields.tsx
export const customFieldsPageRoute = app.get('/', async (ctx) => {
  return <html>...</html>
})

// ❌ ПЛОХО - роут не экспортирован
const customFieldsPageRoute = app.get('/', async (ctx) => {
  return <html>...</html>
})
```

#### Правило №2: Всегда импортируй роут-объект

```typescript
// ✅ ПРАВИЛЬНО - в любом Vue компоненте
import { customFieldsPageRoute } from '../customFields'

// ❌ ПЛОХО - ничего не импортировано, используется хардкод
const url = '/dev/amocrm-connector/customFields'
```

#### Правило №3: Всегда используй .url()

```typescript
// ✅ ПРАВИЛЬНО
const url = customFieldsPageRoute.url()

// ❌ ПЛОХО - забыли .url()
const url = customFieldsPageRoute // это объект, а не строка!
```

#### Правило №4: Параметры передавай через роут-объект

```typescript
// ✅ ПРАВИЛЬНО - параметры пути
const url = productRoute.url({ id: '123' })

// ✅ ПРАВИЛЬНО - query параметры
const url = searchRoute.query({ q: 'test', page: '1' }).url()

// ❌ ПЛОХО - ручная конкатенация
const url = '/product/' + id + '?page=' + page
```

### Примеры правильного использования

#### Пример 1: Простая ссылка

```vue
<template>
  <a :href="customFieldsPageRoute.url()">
    Дополнительные поля
  </a>
</template>

<script setup>
import { customFieldsPageRoute } from '../customFields'
</script>
```

#### Пример 2: Ссылка в computed

```vue
<script setup>
import { computed } from 'vue'
import { customFieldsPageRoute } from '../customFields'

const customFieldsUrl = computed(() => customFieldsPageRoute.url())
</script>

<template>
  <a :href="customFieldsUrl">Перейти</a>
  <button @click="() => window.location.href = customFieldsUrl">Перейти</button>
</template>
```

#### Пример 3: Роут с параметрами

```typescript
// productPage.tsx
export const productPageRoute = app.get('/:id', async (ctx, req) => {
  const id = req.params.id
  return <html>...</html>
})
```

```vue
<script setup>
import { productPageRoute } from '../productPage'

// Передаём параметры
const productId = '123'
const productUrl = productPageRoute.url({ id: productId })
// Результат: "/dev/shop/productPage~123"
</script>

<template>
  <a :href="productUrl">Товар {{ productId }}</a>
</template>
```

#### Пример 4: Роут с query параметрами

```vue
<script setup>
import { searchRoute } from '../search'

const searchUrl = searchRoute.query({ 
  q: 'chatium', 
  page: '1',
  limit: '10' 
}).url()
// Результат: "/dev/search~search?q=chatium&page=1&limit=10"
</script>

<template>
  <a :href="searchUrl">Поиск</a>
</template>
```

### Исключения из правил

**Единственные случаи**, когда можно использовать строки:

#### 1. Внешние ссылки

```vue
<!-- ✅ OK - это внешняя ссылка -->
<a href="https://example.com">Внешний сайт</a>
```

#### 2. Якорные ссылки на той же странице

```vue
<!-- ✅ OK - якорь на текущей странице -->
<a href="#section">Перейти к секции</a>
```

#### 3. Mailto/tel ссылки

```vue
<!-- ✅ OK - специальные протоколы -->
<a href="mailto:email@example.com">Email</a>
<a href="tel:+1234567890">Телефон</a>
```

**Всё остальное** — только через роут-объекты!

### Чек-лист перед коммитом

Перед тем как закоммитить код, проверьте:

- [ ] ✅ Все роуты экспортированы из файлов роутов
- [ ] ✅ Все ссылки используют `.url()` метод
- [ ] ✅ Нет хардкода URL в Vue компонентах
- [ ] ✅ Все роут-объекты импортированы
- [ ] ✅ Параметры передаются через роут-объекты
- [ ] ✅ Query параметры используют `.query({})`
- [ ] ✅ Нет конкатенации строк для формирования URL

### Как найти хардкод в проекте

Используйте поиск по проекту для обнаружения хардкода:

```bash
# Поиск подозрительных паттернов (в вашей IDE или через grep)

# Искать строки вида '/dev/' или '/prod/'
Поиск: ['"]/dev/|['"]/prod/

# Искать конкатенацию URL
Поиск: \+ '/' |  \+ "/" 

# Искать href без роут-объектов
Поиск: href=['"]/(?!http|#|mailto|tel)
```

---

## Валидация параметров

### Валидация параметров пути

```typescript
export const userRoute = app.get('/:userId', async (ctx, req) => {
  const userId = req.params.userId
  
  if (!userId || userId.length === 0) {
    return { success: false, error: 'User ID is required' }
  }
  
  const user = await getUserById(ctx, userId)
  
  if (!user) {
    return { success: false, error: 'User not found' }
  }
  
  return { success: true, user }
})
```

### Валидация query параметров

```typescript
export const searchRoute = app.get('/search', async (ctx, req) => {
  const query = req.query.q as string
  
  if (!query) {
    return { success: false, error: 'Search query is required' }
  }
  
  if (query.length < 3) {
    return { success: false, error: 'Query must be at least 3 characters' }
  }
  
  const results = await performSearch(ctx, query)
  
  return { success: true, results }
})
```

### Валидация body параметров

```typescript
export const createProductRoute = app.post('/create', async (ctx, req) => {
  const { name, price, description } = req.body
  
  // Обязательные поля
  if (!name) {
    return { success: false, error: 'Name is required' }
  }
  
  if (!price || price <= 0) {
    return { success: false, error: 'Price must be positive' }
  }
  
  // Опциональные поля с значениями по умолчанию
  const finalDescription = description || 'No description'
  
  const product = await ProductsTable.create(ctx, {
    name,
    price: new Money(price, 'RUB'),
    description: finalDescription
  })
  
  return { success: true, product }
})
```

---

## Чек-листы

### Чек-лист создания страницы

1. ✅ **Создайте Vue компонент** в `pages/`
   - Файл: `pages/NewPage.vue`
   - Используйте `<script setup>` с Composition API

2. ✅ **Создайте роут-файл** рядом с `index.tsx`
   - Файл: `newPage.tsx`
   - Добавьте `// @shared` в начало
   - Импортируйте `{ jsx }` и Vue компонент

3. ✅ **Экспортируйте маршрут**:
   ```typescript
   export const newPageRoute = app.get('/', async (ctx) => {
     return <html>...</html>
   })
   ```

4. ✅ **Добавьте ссылки** на новую страницу
   - Импортируйте `newPageRoute` в родительском компоненте
   - Используйте `newPageRoute.url()`

5. ✅ **Добавьте авторизацию** (если нужно) — см. `003-auth.md`

6. ✅ **Проверьте** отсутствие циклических импортов

7. ✅ **Добавьте метаданные**: title, viewport, charset

### Чек-лист создания API роута

1. ✅ **Создайте файл** в `api/`
   - Например: `api/users.ts`

2. ✅ **Добавьте комментарий**: `// @shared-route`

3. ✅ **Импортируйте зависимости**

4. ✅ **Определите роут**:
   ```typescript
   export const getUserRoute = app.get('/get', async (ctx, req) => {
     // ctx формируется автоматически
     // req содержит параметры запроса
   })
   ```

5. ✅ **Добавьте авторизацию** — см. `003-auth.md`

6. ✅ **Валидируйте параметры**:
   ```typescript
   if (!req.query.id) {
     return { success: false, error: 'ID required' }
   }
   ```

7. ✅ **Обработайте ошибки**:
   ```typescript
   try {
     // логика
   } catch (error) {
     ctx.account.log('Error', { level: 'error', json: { error } })
     return { success: false, error: error.message }
   }
   ```

8. ✅ **Возвращайте консистентный формат**:
   ```typescript
   return {
     success: true,
     data: result
   }
   ```

9. ✅ **Документируйте** роут в комментариях

10. ✅ **Тестируйте** все сценарии (success, error)

---

## Лучшие практики

### Организация

✅ **Один файл = один основной роут**
- Упрощает навигацию и поддержку
- Избегайте множественных роутов в одном файле

✅ **Используйте `'/'` для чистых путей**
- Полагайтесь на file-based роутинг
- Явные пути только при необходимости

✅ **Следуйте именованию**: см. `006-arch.md`
- Константы роутов: `pageNameRoute`
- Файлы: camelCase для роутов, PascalCase для Vue

### Валидация

✅ **Всегда валидируйте параметры**
- Проверяйте обязательные поля
- Используйте ранний возврат для ошибок

✅ **Используйте типы**
- TypeScript для type safety
- Интерфейсы для сложных данных

### Ответы

✅ **Возвращайте консистентный формат**
- `{ success: true, data: ... }` для успеха
- `{ success: false, error: ... }` для ошибок

✅ **Логируйте ошибки**
- Используйте `ctx.account.log()`
- Не используйте `console.log()`

### Безопасность

✅ **Добавляйте авторизацию** — см. `003-auth.md`
- requireAccountRole для проверки ролей
- requireRealUser для авторизованных

✅ **Валидируйте данные перед использованием**
- Не доверяйте входным данным
- Проверяйте типы и форматы

### Ссылки

⚠️ **КРИТИЧЕСКИ ВАЖНО**: См. раздел [🚨 КРИТИЧЕСКАЯ ОШИБКА: Хардкод URL](#-критическая-ошибка-хардкод-url-вместо-роут-объектов)

✅ **Используйте route.url()**
- Никогда не хардкодьте пути
- Всегда импортируйте роуты
- ВСЕГДА вызывайте `.url()` метод

❌ **Не делайте так**:
```typescript
// ❌ Плохо - хардкод URL
const url = '/admin/settings'
const url = '/product/' + id
const url = customFieldsPageRoute // забыли .url()

// ✅ Хорошо - используем роут-объекты
import { settingsRoute } from './settings'
import { productRoute } from './product'
const url = settingsRoute.url()
const url = productRoute.url({ id })
```

**Подробное объяснение всех ошибок и решений** — см. раздел выше про хардкод URL.

---

## Связанные документы

- **003-auth.md** — Авторизация и проверка прав
- **006-arch.md** — Структура проекта и именование
- **007-vue.md** — Vue компоненты и страницы
- **001-standards.md** — Стандарты кодирования

---

**Версия**: 2.3  
**Дата**: 2025-11-05  
**Последнее обновление**: Добавлен раздел "Возврат с кастомными заголовками" с объяснением использования `rawHttpBody` и `headers` для отдачи файлов с правильным Content-Type (JS, CSS и других типов контента)
