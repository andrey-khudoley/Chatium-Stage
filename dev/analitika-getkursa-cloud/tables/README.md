# Таблицы данных проекта

## settings.table.ts - Таблица настроек

Heap-таблица для хранения настроек проекта в формате ключ-значение.

> **Примечание**: Полная документация по использованию таблицы находится в файле `.CHATIUM-LLM.md` в разделе "Работа с Heap-таблицей настроек".

### Структура таблицы

| Поле | Тип | Описание |
|------|-----|----------|
| key | String | Ключ настройки (уникальный идентификатор) |
| value | String | Значение настройки |

### Примеры использования

#### Импорт таблицы

```typescript
import TAnalitikaGetkursaCloudSettingsKv8 from '../tables/settings.table'
```

#### Создание новой настройки

```typescript
await TAnalitikaGetkursaCloudSettingsKv8.create(ctx, {
  key: 'theme',
  value: 'dark'
})
```

#### Получение значения настройки

```typescript
const setting = await TAnalitikaGetkursaCloudSettingsKv8.findOne(ctx, { 
  key: 'theme' 
})
console.log(setting?.value) // 'dark'
```

#### Получение всех настроек

```typescript
const settings = await TAnalitikaGetkursaCloudSettingsKv8.findMany(ctx, {})
settings.forEach(setting => {
  console.log(`${setting.key}: ${setting.value}`)
})
```

#### Обновление существующей настройки

```typescript
const setting = await TAnalitikaGetkursaCloudSettingsKv8.findOne(ctx, { 
  key: 'theme' 
})

if (setting) {
  await setting.update(ctx, { value: 'light' })
}
```

#### Удаление настройки

```typescript
const setting = await TAnalitikaGetkursaCloudSettingsKv8.findOne(ctx, { 
  key: 'theme' 
})

if (setting) {
  await setting.delete(ctx)
}
```

### API endpoints

Для работы с настройками через REST API используйте следующие эндпоинты:

- **GET** `/api/settings~get?key=settingKey` - получить значение по ключу
- **GET** `/api/settings~all` - получить все настройки
- **POST** `/api/settings~save` - сохранить или обновить настройку
  ```json
  {
    "key": "theme",
    "value": "dark"
  }
  ```
- **POST** `/api/settings~delete?key=settingKey` - удалить настройку

### Примеры настроек

Вот несколько примеров настроек, которые можно хранить в этой таблице:

```typescript
// Тема интерфейса
{ key: 'theme', value: 'dark' }

// Адрес API сервера
{ key: 'apiServerUrl', value: 'https://api.example.com' }

// API ключ
{ key: 'apiKey', value: 'sk_live_...' }

// Период по умолчанию для отчетов (в днях)
{ key: 'defaultReportPeriod', value: '30' }

// Таймзона по умолчанию
{ key: 'defaultTimezone', value: 'Europe/Moscow' }

// Email для уведомлений
{ key: 'notificationEmail', value: 'admin@example.com' }

// Настройки фильтров (JSON)
{ key: 'defaultFilters', value: '{"status":"active","period":"month"}' }
```

### Особенности

- ✅ Поддержка поиска по содержимому (embeddings)
- ✅ Двуязычная индексация (русский и английский)
- ✅ Простая структура ключ-значение для быстрого доступа
- ✅ Типобезопасность через TypeScript типы
- ✅ Автоматическая генерация файла

### TypeScript типы

```typescript
import type { 
  TAnalitikaGetkursaCloudSettingsKv8Row,
  TAnalitikaGetkursaCloudSettingsKv8RowJson 
} from '../tables/settings.table'

// Использование типов
const setting: TAnalitikaGetkursaCloudSettingsKv8Row = {
  key: 'theme',
  value: 'dark'
}
```

