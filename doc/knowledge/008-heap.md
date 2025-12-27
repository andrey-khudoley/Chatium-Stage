# Heap - база данных в Chatium

Исчерпывающее руководство по работе с встроенной базой данных Heap в Chatium. Документ структурирован для удобства полнотекстового поиска и работы с эмбеддингами.

## Содержание

- [Основные концепции](#основные-концепции)
- [Создание таблицы](#создание-таблицы)
  - [Heap.Table - определение таблицы](#heaptable---определение-таблицы)
  - [Типы полей](#типы-полей)
  - [Пример таблицы](#пример-таблицы)
- [CRUD операции](#crud-операции)
  - [create - создание записи](#create---создание-записи)
  - [findAll - получение списка](#findall---получение-списка)
  - [findById - получение по ID](#findbyid---получение-по-id)
  - [findOneBy - поиск одной записи](#findoneby---поиск-одной-записи)
  - [update - обновление записи](#update---обновление-записи)
  - [delete - удаление записи](#delete---удаление-записи)
  - [deleteAll - массовое удаление](#deleteall---массовое-удаление)
  - [createOrUpdateBy - создание или обновление](#createorupdateby---создание-или-обновление)
- [Фильтрация данных](#фильтрация-данных)
  - [Простые фильтры](#простые-фильтры)
  - [Операторы сравнения](#операторы-сравнения)
  - [Логические операторы](#логические-операторы)
- [Сортировка](#сортировка)
- [Подсчёт записей](#подсчёт-записей)
- [Полнотекстовый поиск](#полнотекстовый-поиск)
- [Работа с Money](#работа-с-money)
- [Работа со связями RefLink](#работа-со-связями-reflink)
- [Специальные типы полей](#специальные-типы-полей)
  - [Array - массивы](#array---массивы)
  - [Object - объекты](#object---объекты)
  - [Enum - перечисления](#enum---перечисления)
  - [DateTime - дата и время](#datetime---дата-и-время)
- [Транзакции](#транзакции)
- [Предотвращение race condition](#предотвращение-race-condition)
- [Лучшие практики](#лучшие-практики)

---

## Основные концепции

**Heap** — встроенная база данных Chatium для хранения структурированных данных.

### Ключевые понятия

- **Heap.Table** — определение структуры таблицы
- **HeapTableRepo** — объект для работы с данными таблицы
- **HeapObject** — запись (строка) таблицы
- **Типы полей** — String, Number, Boolean, Money, RefLink и др.

### Важные особенности

- ✅ Таблицы доступны **только на backend**
- ✅ Для клиента создавайте API роуты
- ✅ Автоматическая типизация TypeScript
- ✅ Поддержка транзакций
- ✅ Полнотекстовый поиск с эмбеддингами
- ⚠️ **Эмбединги** (`embeddings: false`) — по умолчанию **ВЫКЛЮЧЕНЫ**, включайте только при необходимости семантического поиска

---

## Создание таблицы

### Heap.Table - определение таблицы

**Базовый синтаксис**:

```typescript
import { Heap } from '@app/heap'

export const TableName = Heap.Table('table_name', {
  fieldName: Heap.FieldType(options),
  // ... другие поля
})
```

**Полный пример**:

```typescript
import { Heap } from '@app/heap'

export const Products = Heap.Table('products', {
  name: Heap.String({
    customMeta: { title: 'Название' },
    searchable: { langs: ['ru', 'en'], embeddings: false }  // ✅ По умолчанию ВЫКЛЮЧЕНО
  }),
  price: Heap.Money({
    customMeta: { title: 'Цена' }
  }),
  inStock: Heap.Boolean({
    customMeta: { title: 'В наличии' },
    defaultValue: true
  }),
  description: Heap.String({
    customMeta: { title: 'Описание' },
    searchable: { langs: ['ru'], embeddings: false }  // ✅ По умолчанию ВЫКЛЮЧЕНО
  })
})
```

### Типы полей

| Тип | Описание | TypeScript тип |
|-----|----------|----------------|
| `Heap.String()` | Строка | `string` |
| `Heap.Number()` | Число | `number` |
| `Heap.Boolean()` | Булево | `boolean` |
| `Heap.Money()` | Деньги | `Money` |
| `Heap.DateTime()` | Дата и время | `Date` |
| `Heap.RefLink()` | Ссылка на запись | `RefLink<T>` |
| `Heap.Array()` | Массив | `Array<T>` |
| `Heap.Object()` | Объект | `Object` |
| `Heap.Enum()` | Перечисление | `union type` |
| `Heap.Any()` | Любой тип | `any` |

### Пример таблицы

**⚠️ КРИТИЧЕСКИ ВАЖНО**: Heap таблицы создаются как **чистые JSON файлы БЕЗ расширения .ts**!

```json
// tables/users.table (БЕЗ .ts!)
{
  "name": "users",
  "title": "Пользователи",
  "description": "Таблица пользователей",
  "fields": [
    {
      "name": "firstName",
      "kind": "StringKind",
      "title": "Имя",
      "searchable": {
        "langs": ["ru", "en"],
        "embeddings": false
      }
    },
    {
      "name": "lastName",
      "kind": "StringKind",
      "title": "Фамилия"
    },
    {
      "name": "email",
      "kind": "StringKind",
      "title": "Email"
    },
    {
      "name": "age",
      "kind": "NumberKind",
      "title": "Возраст",
      "defaultValue": 0
    },
    {
      "name": "isActive",
      "kind": "BooleanKind",
      "title": "Активен",
      "defaultValue": true
    }
  ]
}
```

**Ключевые правила**:
- ✅ Файл: `tables/users.table` (БЕЗ расширения .ts!)
- ✅ Содержимое: Чистый JSON
- ❌ НЕ создавайте TypeScript файлы `tables/users.table.ts`
- ❌ НЕ используйте `export`, `import` или TypeScript код
- ❌ НЕ используйте `Heap.Table()` в файле таблицы

---

## CRUD операции

### create - создание записи

```typescript
const record = await TableName.create(ctx, {
  field1: value1,
  field2: value2
})
```

**Пример**:

```typescript
import Products from '../tables/products.table'
import { Money } from '@app/heap'

const product = await Products.create(ctx, {
  name: 'iPhone 15',
  price: new Money(999, 'USD'),
  inStock: true,
  description: 'Latest iPhone model'
})

ctx.account.log('Product created', {
  level: 'info',
  json: { productId: product.id }
})
```

### findAll - получение списка

```typescript
const records = await TableName.findAll(ctx, {
  where?: Where<T>,
  limit?: number,        // По умолчанию 1000, максимум 1000
  offset?: number,
  order?: Array<Order<T>>
})
```

**Примеры**:

```typescript
// Все записи
const products = await Products.findAll(ctx, {
  limit: 100
})

// С фильтром
const inStockProducts = await Products.findAll(ctx, {
  where: { inStock: true },
  limit: 50
})

// С сортировкой
const sortedProducts = await Products.findAll(ctx, {
  where: { inStock: true },
  order: [{ createdAt: 'desc' }],
  limit: 100
})
```

### findById - получение по ID

```typescript
const record = await TableName.findById(ctx, id)
// Возвращает null если не найдена
```

**Или getById** (выбрасывает ошибку если не найдена):

```typescript
const record = await TableName.getById(ctx, id)
// Выбросит ошибку если не найдена
```

**Пример**:

```typescript
const product = await Products.findById(ctx, 'product_id')

if (!product) {
  return { success: false, error: 'Product not found' }
}

return { success: true, product }
```

### findOneBy - поиск одной записи

```typescript
const record = await TableName.findOneBy(ctx, where)
// Возвращает null если не найдена
```

**Пример**:

```typescript
const product = await Products.findOneBy(ctx, {
  name: 'iPhone 15'
})

if (product) {
  ctx.account.log('Product found', {
    level: 'info',
    json: { id: product.id }
  })
}
```

### update - обновление записи

```typescript
const updated = await TableName.update(ctx, {
  id: 'record_id',
  field1: newValue1,
  field2: newValue2
})
```

**Пример**:

```typescript
import { Money } from '@app/heap'

const updated = await Products.update(ctx, {
  id: 'product_id',
  price: new Money(899, 'USD'),
  inStock: false
})

ctx.account.log('Product updated', {
  level: 'info',
  json: { productId: updated.id }
})
```

### delete - удаление записи

```typescript
await TableName.delete(ctx, id)
```

**Пример**:

```typescript
await Products.delete(ctx, 'product_id')

ctx.account.log('Product deleted', {
  level: 'info',
  json: { productId: 'product_id' }
})
```

### deleteAll - массовое удаление

**⚠️ КРИТИЧЕСКИ ВАЖНО**: Метод `deleteAll` имеет защиту от случайного массового удаления!

```typescript
const deletedCount = await TableName.deleteAll(ctx, {
  where?: Where<T>,  // Условие фильтрации
  limit: number | null,  // ⚠️ КРИТИЧЕСКИ ВАЖНО: по умолчанию limit = 1
  hard?: boolean  // Жёсткое удаление (по умолчанию false)
})
```

**Ключевые правила**:

1. **По умолчанию `limit = 1`** — защита от случайного удаления всех записей
2. **Если записей больше чем `limit`** — удаление **БЛОКИРУЕТСЯ** и выбрасывается ошибка
3. **Для удаления всех записей** используйте `limit: null`
4. **Всегда проверяйте количество** через `countBy` перед удалением

**Примеры**:

```typescript
// ❌ НЕПРАВИЛЬНО - удалит только 1 запись (по умолчанию limit = 1)
await Products.deleteAll(ctx, {
  where: { inStock: false }
})

// ✅ ПРАВИЛЬНО - удалит все записи с inStock: false
await Products.deleteAll(ctx, {
  where: { inStock: false },
  limit: null  // Удаляем все записи
})

// ✅ ПРАВИЛЬНО - удалит максимум 100 записей
const deleted = await Products.deleteAll(ctx, {
  where: { inStock: false },
  limit: 100
})

// ✅ ПРАВИЛЬНО - удалит точное количество записей
const count = await Products.countBy(ctx, { inStock: false })
if (count > 0) {
  await Products.deleteAll(ctx, {
    where: { inStock: false },
    limit: count  // Используем точное количество
  })
}
```

**Ошибка "Accidental mass-delete protection"**:

Если вы видите эту ошибку, значит количество записей, соответствующих `where`, превышает `limit`. Решения:

1. Используйте `limit: null` для удаления всех записей
2. Увеличьте `limit` до нужного значения
3. Используйте точное количество через `countBy`

**Пример безопасного удаления всех зависимых записей**:

```typescript
// Удаляем все записи кэша для датасета
async function deleteDatasetCache(ctx: app.Ctx, datasetId: string): Promise<number> {
  // 1. Проверяем количество
  const totalCount = await CacheTable.countBy(ctx, {
    dataset_id: datasetId
  })
  
  if (totalCount === 0) {
    return 0
  }
  
  // 2. Удаляем все записи сразу
  const deleted = await CacheTable.deleteAll(ctx, {
    where: { dataset_id: datasetId },
    limit: null  // Удаляем все записи
  })
  
  // 3. Финальная проверка
  const remaining = await CacheTable.countBy(ctx, {
    dataset_id: datasetId
  })
  
  if (remaining > 0) {
    throw new Error(`Не удалось удалить все записи. Осталось: ${remaining}`)
  }
  
  return deleted
}
```

**⚠️ ВАЖНО: Порядок удаления зависимых записей**

При удалении записей со связями `RefLink` **ВСЕГДА** удаляйте зависимые записи **ПЕРЕД** удалением родительской записи:

```typescript
// ❌ НЕПРАВИЛЬНО - вызовет "Data consistency error"
async function deleteDataset(ctx: app.Ctx, datasetId: string) {
  // Сначала удаляем датасет
  await Datasets.delete(ctx, datasetId)  // ← ОШИБКА!
  
  // Потом пытаемся удалить кэш (но датасет уже удалён!)
  await deleteDatasetCache(ctx, datasetId)
}

// ✅ ПРАВИЛЬНО - сначала зависимые записи
async function deleteDataset(ctx: app.Ctx, datasetId: string) {
  // 1. Сначала удаляем все зависимые записи (кэш)
  await deleteDatasetCache(ctx, datasetId)
  
  // 2. Проверяем, что кэш действительно пустой
  const remainingCache = await CacheTable.countBy(ctx, {
    dataset_id: datasetId
  })
  
  if (remainingCache > 0) {
    throw new Error(`Невозможно удалить датасет: осталось ${remainingCache} записей в кэше`)
  }
  
  // 3. Только после полной очистки удаляем датасет
  await Datasets.delete(ctx, datasetId)
}
```

**Ошибка "Data consistency error! Reason: Heap object with idx = X has dependent links"**:

Эта ошибка возникает, когда вы пытаетесь удалить запись, на которую ссылаются другие записи через `RefLink`. Решение:

1. **Всегда удаляйте зависимые записи первыми**
2. **Проверяйте `countBy` после удаления** зависимых записей
3. **Удаляйте родительскую запись только после полной очистки зависимых**

### createOrUpdateBy - создание или обновление

Автоматически создаёт или обновляет запись по уникальному полю:

```typescript
const record = await TableName.createOrUpdateBy(
  ctx,
  'uniqueFieldName',  // Имя поля для поиска
  { 
    uniqueFieldName: value,
    otherField: value
  }
)
```

**Пример**:

```typescript
// Создаст новую или обновит существующую настройку по ключу
const setting = await Settings.createOrUpdateBy(ctx, 'key', {
  key: 'api_url',
  value: 'https://api.example.com'
})

// Если запись с key='api_url' существует - обновит
// Если нет - создаст новую
```

**Когда использовать**:
- ✅ Сохранение настроек (key-value)
- ✅ Обновление профилей по userId
- ✅ Предотвращение дубликатов

---

## Фильтрация данных

**⚠️ ВАЖНО**: Для фильтрации используется параметр `where`, НЕ `filter`!

### Простые фильтры

**Точное совпадение**:

```typescript
const products = await Products.findAll(ctx, {
  where: { inStock: true }  // ✅ where, НЕ filter!
})
```

**IN запрос** (массив значений):

```typescript
const products = await Products.findAll(ctx, {
  where: {  // ✅ where, НЕ filter!
    category: ['electronics', 'computers', 'phones'] 
  }
})
```

**❌ НЕПРАВИЛЬНО** (не используйте `filter`):
```typescript
// ❌ Параметр 'filter' НЕ существует в Chatium!
const products = await Products.findAll(ctx, {
  filter: { inStock: true }  // ← НЕ РАБОТАЕТ!
})
```

### Операторы сравнения

```typescript
// Меньше
{ price: { $lt: 1000 } }

// Меньше или равно
{ price: { $lte: 1000 } }

// Больше
{ price: { $gt: 500 } }

// Больше или равно
{ price: { $gte: 500 } }

// Диапазон
{ price: { $gte: 500, $lte: 1000 } }
```

**Пример**:

```typescript
const affordableProducts = await Products.findAll(ctx, {
  where: {
    price: { $lte: new Money(500, 'USD') },
    inStock: true
  }
})
```

### Логические операторы

**$and** - все условия должны выполняться:

```typescript
const products = await Products.findAll(ctx, {
  where: {
    $and: [
      { inStock: true },
      { price: { $lt: new Money(1000, 'USD') } }
    ]
  }
})
```

**$or** - хотя бы одно условие:

```typescript
const products = await Products.findAll(ctx, {
  where: {
    $or: [
      { category: 'electronics' },
      { featured: true }
    ]
  }
})
```

**$not** - отрицание:

```typescript
const products = await Products.findAll(ctx, {
  where: {
    $not: { inStock: false }
  }
})
```

**Комбинирование**:

```typescript
const products = await Products.findAll(ctx, {
  where: {
    $and: [
      { inStock: true },
      {
        $or: [
          { category: 'electronics' },
          { price: { $lt: new Money(500, 'USD') } }
        ]
      }
    ]
  }
})
```

---

## Сортировка

**⚠️ КРИТИЧЕСКИ ВАЖНО**: Chatium использует специфический синтаксис сортировки!

### Правильный синтаксис

```typescript
order: [
  { fieldName: 'asc' | 'desc' }
]
```

**Ключевые правила**:
- ✅ Имя поля = ключ объекта
- ✅ Направление сортировки = значение ('asc' или 'desc')
- ✅ Только одно поле в каждом объекте массива
- ❌ НЕ используйте `{ field: ..., direction: ... }` (это синтаксис других ORM!)

### Примеры правильной сортировки

**По одному полю**:
```typescript
const products = await Products.findAll(ctx, {
  order: [{ createdAt: 'desc' }]
})

const users = await Users.findAll(ctx, {
  order: [{ lastName: 'asc' }]
})
```

**По нескольким полям**:
```typescript
const products = await Products.findAll(ctx, {
  order: [
    { priority: 'desc' },  // Сначала по приоритету (высокий первый)
    { name: 'asc' }        // Потом по имени (алфавит)
  ]
})

const orders = await Orders.findAll(ctx, {
  order: [
    { status: 'asc' },     // По статусу
    { createdAt: 'desc' }  // По дате создания (новые первые)
  ]
})
```

### ❌ НЕПРАВИЛЬНЫЕ примеры (НЕ ДЕЛАЙТЕ ТАК!)

```typescript
// ❌ НЕПРАВИЛЬНО - синтаксис TypeORM/Sequelize
const products = await Products.findAll(ctx, {
  order: [{ field: 'title', direction: 'asc' }]  // ← НЕ РАБОТАЕТ!
})

// ❌ НЕПРАВИЛЬНО - несколько полей в одном объекте
const products = await Products.findAll(ctx, {
  order: [{ priority: 'desc', name: 'asc' }]  // ← РАБОТАЕТ, НО НЕ РЕКОМЕНДУЕТСЯ
})

// ❌ НЕПРАВИЛЬНО - строка вместо массива
const products = await Products.findAll(ctx, {
  order: 'createdAt DESC'  // ← НЕ РАБОТАЕТ!
})
```

### Почему это важно

Chatium **НЕ** использует стандартный синтаксис TypeORM, Sequelize или других популярных ORM. Не путайте синтаксис разных фреймворков! Использование неправильного синтаксиса приведет к ошибкам или непредсказуемому поведению.

---

## Подсчёт записей

### countBy - подсчёт с фильтром

```typescript
const count = await TableName.countBy(ctx, where?)
```

**Примеры**:

```typescript
// Всего записей
const total = await Products.countBy(ctx)

// С фильтром
const inStockCount = await Products.countBy(ctx, {
  inStock: true
})

// Сложный фильтр
const count = await Products.countBy(ctx, {
  $and: [
    { inStock: true },
    { price: { $lte: new Money(500, 'USD') } }
  ]
})
```

**Важно**: Не используйте `findAll` + `.length` для подсчёта! Используйте `countBy`.

---

## Полнотекстовый поиск

### searchBy - поиск по тексту

**⚠️ ВАЖНО**: По умолчанию **всегда отключайте эмбединги** (`embeddings: false`), если нет явной необходимости в семантическом поиске. Эмбединги значительно увеличивают нагрузку и стоимость операций.

Для использования поиска поле должно иметь `searchable`:

```typescript
export const Products = Heap.Table('products', {
  name: Heap.String({
    searchable: { 
      langs: ['ru', 'en'],      // Языки для поиска
      embeddings: false          // ✅ По умолчанию ВЫКЛЮЧЕНО
    }
  }),
  description: Heap.String({
    searchable: { 
      langs: ['ru'], 
      embeddings: false          // ✅ По умолчанию ВЫКЛЮЧЕНО
    }
  })
})
```

**Использование**:

```typescript
const results = await Products.searchBy(ctx, {
  query: 'iPhone 15',           // Поисковый запрос
  embeddingsQuery: 'смартфон',  // Запрос для эмбеддингов
  where?: Where<T>,             // Дополнительные фильтры
  limit?: number
})
```

**Пример**:

```typescript
// Простой поиск
const products = await Products.searchBy(ctx, {
  query: 'iPhone'
})

// С фильтром
const products = await Products.searchBy(ctx, {
  query: 'phone',
  where: { 
    inStock: true,
    price: { $lte: new Money(1000, 'USD') }
  },
  limit: 50
})

// С эмбеддингами для семантического поиска
// ⚠️ ВАЖНО: Работает только если embeddings: true в определении поля!
// Используйте только при явной необходимости в семантическом поиске
const products = await Products.searchBy(ctx, {
  query: 'iPhone 15',
  embeddingsQuery: 'новый смартфон Apple',  // Требует embeddings: true
  limit: 10
})
```

---

## Работа с Money

### Создание Money

```typescript
import { Money } from '@app/heap'

const price = new Money(999.99, 'USD')
const priceRub = new Money(5000, 'RUB')
```

**Важно**: Всегда используйте float для дробных значений!

### Математические операции

```typescript
import { Money } from '@app/heap'

const price = new Money(100, 'USD')

// Сложение
const sum = price.add(new Money(50, 'USD'))  // 150 USD

// Вычитание
const diff = price.subtract(new Money(20, 'USD'))  // 80 USD

// Умножение
const doubled = price.multiply(2)  // 200 USD

// Деление
const half = price.divide(2)  // 50 USD
```

**Важно**: Всегда используйте методы `.add()`, `.subtract()`, `.multiply()`, `.divide()`. Никогда не используйте обычную математику!

### Форматирование

```typescript
const price = new Money(999.99, 'USD')

// Базовое форматирование
const formatted = price.format(ctx)  // "$999.99"

// С настройками
const customFormat = price.format(ctx, {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
  signDisplay: 'exceptZero'  // 'always', 'auto', 'never', 'exceptZero'
})
```

### Использование в таблицах

```typescript
// Создание
await Products.create(ctx, {
  name: 'Product',
  price: new Money(999, 'USD')
})

// Фильтрация
const products = await Products.findAll(ctx, {
  where: {
    price: { 
      $gte: new Money(100, 'USD'),
      $lte: new Money(500, 'USD')
    }
  }
})
```

---

## Работа со связями RefLink

### Определение RefLink

```typescript
import { Heap } from '@app/heap'

export const Orders = Heap.Table('orders', {
  customer: Heap.RefLink({
    targetTablePath: 'tables/customers.table',
    customMeta: { title: 'Клиент' }
  }),
  product: Heap.RefLink({
    targetTablePath: 'tables/products.table',
    customMeta: { title: 'Продукт' }
  }),
  quantity: Heap.Number({
    customMeta: { title: 'Количество' }
  })
})
```

### Создание с RefLink

При создании передавайте **ID строкой**:

```typescript
const order = await Orders.create(ctx, {
  customer: customerId,  // Передаем ID строкой
  product: productId,    // Передаем ID строкой
  quantity: 2
})
```

### Получение связанных данных

При чтении получаете **объект RefLink** с методами:

```typescript
const order = await Orders.findById(ctx, orderId)

// Прямой доступ к ID
const customerId = order.customer.id

// Получить полную запись
const customer = await order.customer.get(ctx)

// Получить заголовок (отображаемое имя)
const customerTitle = await order.customer.getTitle(ctx)

// Получить таблицу
const customersTable = await order.customer.getTargetTableRepo(ctx)
```

### Фильтрация по RefLink

Используйте **ID строкой** в фильтрах:

```typescript
// Один ID
const orders = await Orders.findAll(ctx, {
  where: {
    customer: customerId  // Используй ID, не объект RefLink!
  }
})

// Множественная фильтрация (IN)
const orders = await Orders.findAll(ctx, {
  where: {
    customer: ['customer1_id', 'customer2_id', 'customer3_id']
  }
})
```

### RefLink runtime interface

```typescript
interface RefLink<T> {
  id: string                              // ID связанной записи
  get(ctx): Promise<T | null>            // Получить полную запись
  getTitle(ctx): Promise<string | null>  // Получить заголовок
  getTargetTableRepo(ctx): Promise<HeapTable<T>>  // Получить таблицу
  toJSON(): string                        // Возвращает ID
}
```

---

## Специальные типы полей

### Array - массивы

```typescript
export const Posts = Heap.Table('posts', {
  tags: Heap.Array(Heap.String(), {
    customMeta: { title: 'Теги' }
  }),
  ratings: Heap.Array(Heap.Number(), {
    customMeta: { title: 'Оценки' }
  })
})
```

**Использование**:

```typescript
await Posts.create(ctx, {
  title: 'Post',
  tags: ['javascript', 'typescript', 'vue'],
  ratings: [5, 4, 5, 4, 5]
})

// Фильтрация (будет искать пересечение)
const posts = await Posts.findAll(ctx, {
  where: {
    tags: ['javascript']  // Найдёт посты с тегом 'javascript'
  }
})
```

### Object - объекты

```typescript
export const Users = Heap.Table('users', {
  settings: Heap.Object({
    theme: Heap.String(),
    language: Heap.String(),
    notifications: Heap.Boolean()
  }, {
    customMeta: { title: 'Настройки' }
  })
})
```

**Использование**:

```typescript
await Users.create(ctx, {
  name: 'John',
  settings: {
    theme: 'dark',
    language: 'en',
    notifications: true
  }
})
```

### Enum - перечисления

```typescript
export const Orders = Heap.Table('orders', {
  status: Heap.Enum(['new', 'processing', 'completed', 'cancelled'], {
    customMeta: { title: 'Статус' },
    defaultValue: 'new'
  })
})
```

**Использование**:

```typescript
await Orders.create(ctx, {
  status: 'new'
})

// Фильтрация
const completedOrders = await Orders.findAll(ctx, {
  where: { status: 'completed' }
})
```

### DateTime - дата и время

```typescript
export const Events = Heap.Table('events', {
  startDate: Heap.DateTime({
    customMeta: { title: 'Дата начала' }
  }),
  endDate: Heap.DateTime({
    customMeta: { title: 'Дата окончания' }
  })
})
```

**Использование**:

```typescript
await Events.create(ctx, {
  name: 'Conference',
  startDate: new Date('2025-12-01'),
  endDate: new Date('2025-12-03')
})

// Фильтрация
const upcomingEvents = await Events.findAll(ctx, {
  where: {
    startDate: { $gte: new Date() }
  }
})
```

---

## Транзакции

Для целостного выполнения группы изменений используйте транзакции:

```typescript
import { serializableTransaction } from '@app/heap'

await serializableTransaction(ctx, async (txCtx) => {
  // Все операции внутри транзакции
  
  const product = await Products.findById(txCtx, productId)
  
  if (product.quantity < orderQuantity) {
    throw new Error('Недостаточно товара')
  }
  
  // Уменьшаем количество
  await Products.update(txCtx, {
    id: productId,
    quantity: product.quantity - orderQuantity
  })
  
  // Создаём заказ
  await Orders.create(txCtx, {
    productId,
    quantity: orderQuantity,
    customerId: ctx.user.id
  })
  
  // Если всё прошло успешно - транзакция закоммитится
  // Если выброшена ошибка - откатится
})
```

**Когда использовать**:
- ✅ Перевод денег между счетами
- ✅ Создание заказа с уменьшением остатка
- ✅ Любые операции требующие атомарности

---

## Предотвращение race condition

### Проблема race condition

**Race condition** (состояние гонки) возникает, когда несколько параллельных запросов одновременно работают с одними и теми же данными, что может привести к некорректным результатам.

**Типичные сценарии**:
- Два запроса одновременно проверяют существование записи через `findOneBy`, затем оба создают её через `createOrUpdateBy`
- Между `findOneBy` и `createOrUpdateBy` другой процесс может изменить данные
- Параллельные обновления одной записи могут перезаписать изменения друг друга

**Пример проблемного кода**:
```typescript
// ❌ НЕПРАВИЛЬНО - возможна race condition
const existingChat = await TelegramChats.findOneBy(ctx, { chatId: chatIdString })

if (existingChat) {
  // Между findOneBy и createOrUpdateBy другой запрос может создать запись
  await TelegramChats.createOrUpdateBy(ctx, 'chatId', {
    chatId: chatIdString,
    firstSeenAt: existingChat.firstSeenAt, // Может быть перезаписано!
    lastSeenAt: new Date()
  })
} else {
  // Два параллельных запроса могут оба создать запись
  await TelegramChats.createOrUpdateBy(ctx, 'chatId', {
    chatId: chatIdString,
    firstSeenAt: new Date(), // Может быть установлено неправильно!
    lastSeenAt: new Date()
  })
}
```

### Решение: runWithExclusiveLock

Используйте `runWithExclusiveLock` из `@app/sync` для гарантии, что только один процесс может выполнить критическую секцию кода для конкретного ключа.

**Синтаксис**:
```typescript
import { runWithExclusiveLock } from '@app/sync'

await runWithExclusiveLock(ctx, lockKey, options, async () => {
  // ВСЕ операции с БД должны быть ВНУТРИ блокировки
  // Это гарантирует атомарность выполнения
})
```

**Параметры**:
- `ctx` — контекст приложения
- `lockKey` — уникальный ключ блокировки (строка). **ВАЖНО**: Ключ должен быть одинаковым для всех параллельных запросов, работающих с одними данными
- `options` — опции блокировки (обычно пустой объект `{}`)
- `callback` — функция, которая выполнится с блокировкой

**Пример правильного использования**:
```typescript
// ✅ ПРАВИЛЬНО - с эксклюзивной блокировкой
import { runWithExclusiveLock } from '@app/sync'

const chatIdString = String(chatInfo.id)
const lockKey = `telegram-chat-${chatIdString}` // Ключ должен быть одинаковым для одного chatId

await runWithExclusiveLock(ctx, lockKey, {}, async () => {
  // ВСЕ операции с БД ВНУТРИ блокировки
  const existingChat = await TelegramChats.findOneBy(ctx, { chatId: chatIdString })
  
  if (existingChat) {
    // Обновляем существующий чат
    await TelegramChats.createOrUpdateBy(ctx, 'chatId', {
      chatId: chatIdString,
      firstSeenAt: existingChat.firstSeenAt, // Гарантированно сохранится оригинальное значение
      lastSeenAt: new Date()
    })
  } else {
    // Создаём новый чат (гарантированно только один раз)
    await TelegramChats.createOrUpdateBy(ctx, 'chatId', {
      chatId: chatIdString,
      firstSeenAt: new Date(),
      lastSeenAt: new Date()
    })
  }
})
```

### Ключевые правила

1. **Ключ блокировки должен быть одинаковым**:
   ```typescript
   // ✅ ПРАВИЛЬНО - одинаковый ключ для одного chatId
   const lockKey = `telegram-chat-${chatIdString}`
   
   // ❌ НЕПРАВИЛЬНО - разные ключи для одного chatId
   const lockKey = `telegram-chat-${chatIdString}-${Date.now()}` // Каждый запрос получит свой ключ!
   ```

2. **Все операции с БД должны быть внутри блокировки**:
   ```typescript
   // ❌ НЕПРАВИЛЬНО - findOneBy снаружи блокировки
   const existingChat = await TelegramChats.findOneBy(ctx, { chatId: chatIdString })
   
   await runWithExclusiveLock(ctx, lockKey, {}, async () => {
     // Между findOneBy и createOrUpdateBy может произойти другой запрос!
     await TelegramChats.createOrUpdateBy(ctx, 'chatId', { ... })
   })
   
   // ✅ ПРАВИЛЬНО - все операции внутри
   await runWithExclusiveLock(ctx, lockKey, {}, async () => {
     const existingChat = await TelegramChats.findOneBy(ctx, { chatId: chatIdString })
     await TelegramChats.createOrUpdateBy(ctx, 'chatId', { ... })
   })
   ```

3. **Блокировка работает только для одинаковых ключей**:
   ```typescript
   // Запрос 1: lockKey = "telegram-chat-123"
   await runWithExclusiveLock(ctx, "telegram-chat-123", {}, async () => { ... })
   
   // Запрос 2: lockKey = "telegram-chat-123" → будет ждать завершения запроса 1
   await runWithExclusiveLock(ctx, "telegram-chat-123", {}, async () => { ... })
   
   // Запрос 3: lockKey = "telegram-chat-456" → выполнится параллельно с запросом 1
   await runWithExclusiveLock(ctx, "telegram-chat-456", {}, async () => { ... })
   ```

### Когда использовать

✅ **Используйте `runWithExclusiveLock` когда**:
- Несколько параллельных запросов могут работать с одной записью
- Между проверкой (`findOneBy`) и изменением (`createOrUpdateBy`) может произойти другой запрос
- Нужно гарантировать атомарность последовательности операций
- Важно сохранить оригинальные значения полей (например, `firstSeenAt`)

❌ **НЕ используйте `runWithExclusiveLock` когда**:
- Операции уже атомарны (например, один `createOrUpdateBy` без предварительной проверки)
- Работаете с разными записями (разные ключи блокировки)
- Нет риска параллельного доступа

### Производительность

- Блокировка выполняется на уровне приложения, не блокирует всю БД
- Запросы с разными ключами блокировки выполняются параллельно
- Запросы с одинаковым ключом выполняются последовательно (второй ждёт завершения первого)
- Внутри блокировки можно выполнять любые операции: работу с таблицами, внешние запросы и т.д.

---

## Лучшие практики

### Организация таблиц

✅ **Используйте правильное именование**:
```typescript
// Файл: tables/products.table.ts
export const Products = Heap.Table('products', { ... })

// Импорт
import Products from '../tables/products.table'
```

✅ **Добавляйте customMeta**:
```typescript
name: Heap.String({
  customMeta: { title: 'Название' }
})
```

✅ **Используйте searchable для поиска**:
```typescript
description: Heap.String({
  searchable: { langs: ['ru', 'en'], embeddings: false }  // ✅ По умолчанию ВЫКЛЮЧЕНО
})
```

✅ **Включайте embeddings только при необходимости**:
```typescript
// ❌ Плохо - включены без причины
searchable: { langs: ['ru'], embeddings: true }

// ✅ Хорошо - по умолчанию выключены
searchable: { langs: ['ru'], embeddings: false }

// ✅ Допустимо - включены для семантического поиска
// Только если требуется поиск по смыслу, а не по точным словам
searchable: { langs: ['ru'], embeddings: true }  // Используйте осознанно!
```

### Работа с данными

✅ **Используйте countBy для подсчёта**:
```typescript
// ❌ Плохо
const count = (await Products.findAll(ctx, {})).length

// ✅ Хорошо
const count = await Products.countBy(ctx)
```

✅ **Валидируйте перед созданием**:
```typescript
if (!name || name.length === 0) {
  return { success: false, error: 'Name is required' }
}

const product = await Products.create(ctx, { name })
```

✅ **Обрабатывайте ошибки**:
```typescript
try {
  const product = await Products.create(ctx, data)
  return { success: true, product }
} catch (error) {
  ctx.account.log('Create failed', {
    level: 'error',
    json: { error: error.message }
  })
  return { success: false, error: error.message }
}
```

### Money

✅ **Всегда используйте методы Money**:
```typescript
// ❌ Плохо
const total = product.price.amount + 100

// ✅ Хорошо
const total = product.price.add(new Money(100, 'USD'))
```

### RefLink

✅ **Передавайте ID при создании**:
```typescript
// ✅ Правильно
await Orders.create(ctx, {
  customer: customerId  // ID строкой
})

// ❌ Неправильно
await Orders.create(ctx, {
  customer: customerObject  // Не передавайте объект
})
```

✅ **Используйте .id для доступа к ID**:
```typescript
// ✅ Правильно
const customerId = order.customer.id

// ❌ Неправильно
const customerId = order.customer  // Это объект RefLink!
```

### Производительность

✅ **Используйте limit**:
```typescript
const products = await Products.findAll(ctx, {
  limit: 100  // Не больше 1000
})
```

✅ **Batch loading для связей**:
```typescript
// Получите все ID
const customerIds = orders.map(o => o.customer.id)

// Загрузите одним запросом
const customers = await Customers.findAll(ctx, {
  where: { id: customerIds }
})
```

---

## Частые ошибки при работе с Heap Tables

### ❌ Ошибка #1: Включение embeddings без необходимости

**НЕПРАВИЛЬНО**:
```typescript
// ❌ Embeddings включены без явной необходимости
export const Products = Heap.Table('products', {
  name: Heap.String({
    searchable: { 
      langs: ['ru', 'en'], 
      embeddings: true  // ← Увеличивает нагрузку и затраты!
    }
  }),
  description: Heap.String({
    searchable: { 
      langs: ['ru'], 
      embeddings: true  // ← Без необходимости!
    }
  })
})
```

**ПРАВИЛЬНО**:
```typescript
// ✅ По умолчанию embeddings ВЫКЛЮЧЕНЫ
export const Products = Heap.Table('products', {
  name: Heap.String({
    searchable: { 
      langs: ['ru', 'en'], 
      embeddings: false  // ✅ По умолчанию
    }
  }),
  description: Heap.String({
    searchable: { 
      langs: ['ru'], 
      embeddings: false  // ✅ По умолчанию
    }
  })
})

// ✅ Включайте только при необходимости семантического поиска
export const Articles = Heap.Table('articles', {
  content: Heap.String({
    searchable: { 
      langs: ['ru'], 
      embeddings: true  // Осознанное решение для смыслового поиска
    }
  })
})
```

**Почему это важно**:
- Эмбединги значительно увеличивают нагрузку на систему
- Увеличивают стоимость операций записи и поиска
- Требуются только для семантического (смыслового) поиска
- Для обычного полнотекстового поиска достаточно `embeddings: false`

**Когда включать embeddings: true**:
- ✅ Поиск по смыслу, а не по точным словам
- ✅ Поиск синонимов и близких по смыслу запросов
- ✅ Многоязычный поиск с автоматическим переводом смысла

**Когда НЕ нужны embeddings**:
- ❌ Обычный поиск по названиям, артикулам, именам
- ❌ Поиск по точным совпадениям
- ❌ Простой полнотекстовый поиск

### ❌ Ошибка #2: Создание таблиц как TypeScript файлов

**НЕПРАВИЛЬНО**:
```
tables/
├── services.table.ts     ← TypeScript файл!
└── settings.table.ts     ← TypeScript файл!
```

Содержимое файла (НЕПРАВИЛЬНО):
```typescript
// tables/services.table.ts
export const servicesTable = {
  "name": "services",
  "fields": [...]
}
```

**ПРАВИЛЬНО**:
```
tables/
├── services.table        ← JSON файл, БЕЗ расширения .ts!
└── settings.table        ← JSON файл, БЕЗ расширения .ts!
```

Содержимое файла (ПРАВИЛЬНО):
```json
{
  "name": "services",
  "title": "Сервисы",
  "description": "Таблица для хранения сервисов",
  "fields": [
    {
      "name": "title",
      "kind": "StringKind",
      "title": "Название сервиса"
    }
  ]
}
```

**Почему это важно**:
- Chatium требует только JSON, без TypeScript кода
- Фреймворк загружает таблицы как данные, а не как модули
- TypeScript файлы вызовут ошибку `TypeError: element is not a function`

---

### ❌ Ошибка #2: Неправильный синтаксис параметра order

**НЕПРАВИЛЬНО** (как в других ORM):
```typescript
// ❌ Это синтаксис других фреймворков, НЕ Chatium!
const services = await ServicesTable.findAll(ctx, {
  order: [{ field: 'title', direction: 'asc' }],  // ← НЕПРАВИЛЬНО!
  limit: 1000
})

const settings = await SettingsTable.findAll(ctx, {
  order: [{ field: 'key', direction: 'desc' }],   // ← НЕПРАВИЛЬНО!
  limit: 1000
})
```

**ПРАВИЛЬНО** (синтаксис Chatium):
```typescript
// ✅ В Chatium имя поля = ключ, направление = значение
const services = await ServicesTable.findAll(ctx, {
  order: [{ title: 'asc' }],  // ← ПРАВИЛЬНО!
  limit: 1000
})

const settings = await SettingsTable.findAll(ctx, {
  order: [{ key: 'desc' }],   // ← ПРАВИЛЬНО!
  limit: 1000
})
```

**Сравнение синтаксиса**:
```typescript
// ❌ НЕПРАВИЛЬНО (синтаксис TypeORM/Sequelize)
order: [{ field: 'title', direction: 'asc' }]
order: [{ field: 'key', direction: 'desc' }]
order: [{ field: 'updatedAt', direction: 'asc' }]

// ✅ ПРАВИЛЬНО (синтаксис Chatium)
order: [{ title: 'asc' }]
order: [{ key: 'desc' }]
order: [{ updatedAt: 'asc' }]
```

**Сортировка по нескольким полям**:
```typescript
// ❌ НЕПРАВИЛЬНО
order: [
  { field: 'category', direction: 'asc' },
  { field: 'title', direction: 'desc' }
]

// ✅ ПРАВИЛЬНО
order: [
  { category: 'asc' },
  { title: 'desc' }
]
```

**Почему это важно**:
- Chatium использует собственный синтаксис, отличный от TypeORM, Sequelize и других ORM
- Формат `{ field: ..., direction: ... }` просто не будет работать
- Не путайте синтаксис разных фреймворков!

---

### ❌ Ошибка #3: Ручное добавление полей id, createdAt, updatedAt

**НЕПРАВИЛЬНО**:
```typescript
// ❌ Поля id, createdAt, updatedAt добавляются АВТОМАТИЧЕСКИ!
await Table.create(ctx, {
  key: 'some_key',
  value: 'some_value',
  updatedAt: new Date()  // ← ОШИБКА! Это поле добавляется автоматически
})

await Table.update(ctx, {
  id: recordId,
  value: 'new_value',
  updatedAt: new Date()  // ← ОШИБКА! Обновляется автоматически
})
```

**Ошибка**:
```
HeapTableRepo.create: given data doesn't match the table schema:
"must be string", "data": {}
```

**ПРАВИЛЬНО**:
```typescript
// ✅ Поля id, createdAt, updatedAt НЕ передаются вручную
await Table.create(ctx, {
  key: 'some_key',
  value: 'some_value'
  // updatedAt добавится автоматически
})

await Table.update(ctx, {
  id: recordId,
  value: 'new_value'
  // updatedAt обновится автоматически
})
```

**Почему это важно**:
- Chatium автоматически добавляет поля `id`, `createdAt`, `updatedAt` ко всем таблицам
- Эти поля НЕ нужно указывать в схеме таблицы
- Эти поля НЕ нужно передавать в `create()` или `update()`
- При попытке передать эти поля вручную может возникнуть ошибка валидации схемы

**Автоматические поля**:
- `id: string` — уникальный идентификатор записи (генерируется автоматически)
- `createdAt: Date` — дата создания записи (устанавливается при create)
- `updatedAt: Date` — дата последнего обновления (обновляется при create/update)

### ❌ Ошибка #4: Использование filter вместо where

**НЕПРАВИЛЬНО** (синтаксис других фреймворков):
```typescript
// ❌ Параметр 'filter' НЕ существует в Chatium!
const config = await SettingsTable.findAll(ctx, {
  filter: {  // ← НЕПРАВИЛЬНЫЙ ПАРАМЕТР!
    key: {
      $in: ['amocrm_subdomain', 'amocrm_client_id']
    }
  }
})

const products = await ProductsTable.findAll(ctx, {
  filter: { inStock: true }  // ← НЕПРАВИЛЬНО!
})
```

**ПРАВИЛЬНО** (синтаксис Chatium):
```typescript
// ✅ В Chatium используется параметр 'where'
const config = await SettingsTable.findAll(ctx, {
  where: {  // ← ПРАВИЛЬНЫЙ ПАРАМЕТР!
    key: {
      $in: ['amocrm_subdomain', 'amocrm_client_id']
    }
  }
})

const products = await ProductsTable.findAll(ctx, {
  where: { inStock: true }  // ← ПРАВИЛЬНО!
})
```

**Все методы используют where, не filter**:
```typescript
// ✅ findAll с where
const items = await Table.findAll(ctx, { where: { status: 'active' } })

// ✅ findOneBy принимает where напрямую
const item = await Table.findOneBy(ctx, { email: 'user@example.com' })

// ✅ countBy принимает where напрямую
const count = await Table.countBy(ctx, { status: 'pending' })

// ✅ searchBy поддерживает where
const results = await Table.searchBy(ctx, {
  query: 'search term',
  where: { category: 'electronics' }
})
```

**Почему это важно**:
- В Chatium параметр называется `where`, не `filter`
- Использование `filter` приведет к тому, что фильтрация просто не будет работать
- Все операции фильтрации используют единый параметр `where`

---

### 📝 Чек-лист перед созданием таблицы

Перед тем как создать Heap таблицу, проверьте:

- ✅ Файл имеет расширение `.table` (БЕЗ `.ts`)
- ✅ Содержимое - чистый JSON (БЕЗ `export`, `import`)
- ✅ Используете `where` для фильтрации (НЕ `filter`)
- ✅ Используете синтаксис `{ fieldName: 'asc' }` для сортировки (НЕ `{ field: ..., direction: ... }`)
- ✅ Каждое поле имеет `kind` (StringKind, NumberKind, и т.д.)
- ✅ Добавили `title` для читаемых названий полей
- ✅ **Embeddings выключены** (`embeddings: false`) по умолчанию, включены только при необходимости

### 🔍 Пример правильной таблицы

```json
{
  "name": "products",
  "title": "Продукты",
  "description": "Таблица продуктов для магазина",
  "fields": [
    {
      "name": "title",
      "kind": "StringKind",
      "title": "Название"
    },
    {
      "name": "price",
      "kind": "MoneyKind",
      "title": "Цена"
    },
    {
      "name": "inStock",
      "kind": "BooleanKind",
      "title": "В наличии",
      "defaultValue": true
    }
  ]
}
```

### 🔍 Пример правильного использования

```typescript
// api/products.ts
import ProductsTable from '../tables/products.table'

export const apiGetProductsRoute = app.get('/products/list', async (ctx) => {
  // ✅ ПРАВИЛЬНО: where + правильный синтаксис order
  const products = await ProductsTable.findAll(ctx, {
    where: { inStock: true },        // НЕ filter!
    order: [{ title: 'asc' }],       // НЕ { field: 'title', direction: 'asc' }!
    limit: 100
  })
  
  return { success: true, products: products || [] }
})
```

---

## Связанные документы

- **002-routing.md** — Использование таблиц в API роутах
- **006-arch.md** — Организация файлов таблиц
- **007-vue.md** — Отображение данных в Vue
- [Официальная документация](https://chatium.ru/docs/app/heap)

---

**Версия**: 1.4  
**Дата**: 2025-11-06  
**Последнее обновление**: 2025-12-02 (добавлен раздел "Предотвращение race condition" с описанием `runWithExclusiveLock`)

