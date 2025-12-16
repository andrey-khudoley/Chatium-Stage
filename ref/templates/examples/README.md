# Примеры кода Chatium

Этот каталог содержит исчерпывающую коллекцию примеров кода для разработки на платформе Chatium.

## Структура примеров

### 📁 Базовые примеры
- `basic/landing-page` - Лендинг с TailwindCSS
- `basic/auth-example` - Примеры авторизации и пользователей
- `basic/forms` - Работы с формами
- `basic/ui-components` - Базовые UI компоненты

### 📁 Работа с данными
- `data/heap-tables` - Примеры работы с таблицами
- `data/external-tables` - Работа с внешними таблицами
- `data/filtering-sorting` - Фильтрация и сортировка
- `data/aggregations` - Агрегированные запросы

### 📁 API и маршрутизация
- `api/rest-endpoints` - REST API эндпоинты
- `api/route-params` - Параметры маршрутов
- `api/middleware` - Промежуточные обработчики
- `api/query-params` - Работа с query параметрами

### 📁 Интеграции
- `integrations/analytics` ⭐ - **НОВОЕ** Полная аналитика (GetCourse + Traffic + Workspace)
  - `getcourse-mcp-client.ts` - Настраиваемый GetCourse (gcQueryAi)
  - `developer-account.ts` - Аккаунт разработчика (queryAi)
  - `subscriptions-monitoring.ts` - Подписки + WebSocket мониторинг
  - `setup-page-example.tsx` - Страница с проверкой настройки
  - `events.ts` - Workspace события + клиентский трекинг
  - `README.md` - Детальное руководство по примерам
- `integrations/getcourse` - Интеграция с Getcourse (старый подход через API)
- `integrations/telegram` - Работа с Telegram
- `integrations/payment` - Платежи и сохраненные карты
- `integrations/ai-agents` - AI агенты и инструменты

### 📁 Продвинутые сценарии
- `advanced/jobs-scheduling` - Отложенные задачи
- `advanced/websockets` - Real-time обновления
- `advanced/file-storage` - Работа с файлами
- `advanced/i18n` - Мультиязычность

### 📁 UI/UX
- `ui/responsive-design` - Адаптивный дизайн
- `ui/animations` - Анимации и переходы
- `ui/video-player` - Видеоплееры (Kinescope)
- `ui/icons-images` - Работа с иконками и изображениями

### 📁 Аналитика и отчеты ⭐ ОБНОВЛЕНО

**`analytics/` (новая структура)**:

1. **`getcourse-mcp-client.ts`** - Настраиваемый GetCourse MCP Client
   - Для SaaS и клиентских приложений
   - Каждый пользователь работает со своим аккаунтом
   - `gcQueryAi()` для запросов к настроенному аккаунту
   - Примеры: заказы, пользователи, Telegram статистика, трафик

2. **`developer-account.ts`** - Аккаунт разработчика
   - Для внутренних инструментов
   - Все видят данные одного аккаунта
   - `queryAi()` для запросов к аккаунту разработчика
   - Примеры: заказы, статистика, трафик

3. **`subscriptions-monitoring.ts`** - Подписки на события
   - Real-time мониторинг через WebSocket
   - Job для периодической проверки (каждые 15 сек)
   - API для подписки/отписки
   - Примеры SQL запросов для GetCourse и Traffic событий
   - Vue компонент с WebSocket клиентом

4. **`setup-page-example.tsx`** - Главная страница с проверкой
   - Проверка `integrationIsEnabled()`
   - Форма установки GetCourse MCP Server
   - Красивый UI с градиентами
   - Автоматическая установка плагина

5. **`events.ts`** - Workspace события
   - `writeWorkspaceEvent()` для серверных событий
   - `window.clrtTrack()` для клиентских событий
   - Примеры: регистрация, формы, заказы, квизы
   - UTM метки
   - Vue компонент с клиентским трекингом

6. **`README.md`** - Подробное руководство
   - Сравнение подходов (gcQueryAi vs queryAi)
   - 30 типов GetCourse событий
   - 21 тип Traffic событий
   - Примеры SQL запросов
   - Быстрый старт

### 📁 Автоматизация
- `automation/event-tracking` - Отслеживание событий
- `automation/notifications` - Уведомления
- `automation/workflows` - Рабочие процессы

## Как использовать примеры

1. **Изучение конкретного функционала**: Перейдите в нужную категорию и изучите примеры
2. **Копирование кода**: Используйте примеры как основу для своих проектов
3. **Адаптация**: Модифицируйте примеры под свои нужды
4. **Комбинирование**: Сочетайте примеры из разных категорий

## Новое в аналитике (2025-11-09)

### Два способа работы с ClickHouse

**1. gcQueryAi (настраиваемый GetCourse MCP Client)** ⭐ Рекомендуется
```typescript
import { gcQueryAi, integrationIsEnabled } from '@gc-mcp-server/sdk'
import { installSupportedApp } from '@store/sdk'

// Проверка настройки
const isConfigured = await integrationIsEnabled(ctx)

// Установка плагина
await installSupportedApp(ctx, 'gc-mcp-server')

// Запросы к настроенному аккаунту
const result = await gcQueryAi(ctx, query)
```

**Для кого**: SaaS, клиентские приложения, агентские инструменты

**2. queryAi (аккаунт разработчика)**
```typescript
import { queryAi } from '@traffic/sdk'

// Запросы к аккаунту разработчика
const result = await queryAi(ctx, query)
```

**Для кого**: Внутренние инструменты, прототипирование

### Система подписок и мониторинг

- Подписки через Heap таблицы
- WebSocket для real-time обновлений
- Job для периодической проверки событий
- Поддержка GetCourse и Traffic событий
- Полные примеры Vue компонентов

---

## Основные принципы

- ✅ Production-ready код
- ✅ TypeScript с типизацией
- ✅ Vue 3 Composition API
- ✅ Современные подходы к разработке
- ✅ Лучшие практики и паттерны
- ✅ Два подхода к аналитике (настраиваемый vs фиксированный)
- ✅ Real-time мониторинг через WebSocket

---

*Примеры регулярно обновляются и дополняются новыми сценариями использования.*

**Последнее обновление**: 2025-11-09 - Добавлены примеры аналитики с gcQueryAi, queryAi, подписками и мониторингом