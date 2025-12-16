# Документация по событиям трафика (Traffic Events)

## Обзор

События трафика собираются из логов доступа `chatium_ai.access_log` и предоставляют полную информацию о взаимодействии пользователей с веб-интерфейсом. Всего доступно **21 тип событий** для мониторинга и аналитики.

### ВАЖНО: Фильтрация событий

**Система автоматически фильтрует:**
- ✅ **Только реальные действия** - поле `action` должно быть заполнено (не NULL)
- ✅ **Только внешние события** - URL должен начинаться с `https`
- ❌ **Исключаются системные страницы:**
  - `https://s.chtm/*` - системные ресурсы
  - `*/dev/*` - страницы разработки
- ❌ **Собственные события** - события текущего пользователя скрыты

Это означает, что вы увидите только реальные действия пользователей (клики, формы, покупки и т.д.) с внешних публичных страниц вашего сайта. Обычные просмотры страниц без конкретных действий не отображаются.

## Типы событий трафика

### 1. `pageview` - Просмотр страницы
**Описание:** Фиксирует каждое посещение страницы пользователем.

**Ожидаемые поля:**
```json
{
  "event_type": "pageview",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "page_url": "https://example.com/page",
  "page_title": "Заголовок страницы",
  "referrer": "https://google.com",
  "user_agent": "Mozilla/5.0...",
  "ip_address": "192.168.1.1",
  "country": "RU",
  "city": "Moscow"
}
```

### 2. `registration` - Регистрация
**Описание:** Фиксирует успешную регистрацию нового пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "registration",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "registration_method": "email",
  "user_info": {
    "email": "user@example.com",
    "first_name": "Иван",
    "last_name": "Иванов",
    "phone": "+79001234567"
  },
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "new_year"
}
```

### 3. `form_submit` - Отправка формы
**Описание:** Фиксирует отправку любой формы на сайте.

**Ожидаемые поля:**
```json
{
  "event_type": "form_submit",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "form_id": "contact_form",
  "form_name": "Контактная форма",
  "form_data": {
    "name": "Иван Иванов",
    "email": "ivan@example.com",
    "message": "Текст сообщения",
    "phone": "+79001234567"
  },
  "page_url": "https://example.com/contact"
}
```

### 4. `button_click` - Клик по кнопке
**Описание:** Фиксирует нажатия на кнопки с отслеживаемыми атрибутами.

**Ожидаемые поля:**
```json
{
  "event_type": "button_click",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "button_id": "submit_button",
  "button_text": "Отправить заявку",
  "button_class": "btn btn-primary",
  "page_url": "https://example.com/form",
  "click_coordinates": {
    "x": 250,
    "y": 400
  }
}
```

### 5. `link_click` - Клик по ссылке
**Описание:** Фиксирует переходы по внутренним и внешним ссылкам.

**Ожидаемые поля:**
```json
{
  "event_type": "link_click",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "link_url": "https://external-site.com/page",
  "link_text": "Перейти на партнерский сайт",
  "link_type": "external",
  "page_url": "https://example.com/partners"
}
```

### 6. `video_play` - Воспроизведение видео
**Описание:** Фиксирует начало воспроизведения видео.

**Ожидаемые поля:**
```json
{
  "event_type": "video_play",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "video_url": "https://example.com/video.mp4",
  "video_title": "Обучающее видео",
  "video_duration": 300,
  "autoplay": false,
  "page_url": "https://example.com/video-page"
}
```

### 7. `video_pause` - Пауза видео
**Описание:** Фиксирует паузу воспроизведения видео.

**Ожидаемые поля:**
```json
{
  "event_type": "video_pause",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "video_url": "https://example.com/video.mp4",
  "video_title": "Обучающее видео",
  "current_time": 125,
  "video_duration": 300,
  "page_url": "https://example.com/video-page"
}
```

### 8. `video_complete` - Просмотр видео до конца
**Описание:** Фиксирует полное завершение просмотра видео.

**Ожидаемые поля:**
```json
{
  "event_type": "video_complete",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "video_url": "https://example.com/video.mp4",
  "video_title": "Обучающее видео",
  "video_duration": 300,
  "page_url": "https://example.com/video-page"
}
```

### 9. `scroll` - Прокрутка страницы
**Описание:** Фиксирует достижение определенных точек прокрутки.

**Ожидаемые поля:**
```json
{
  "event_type": "scroll",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "scroll_depth": 75,
  "scroll_direction": "down",
  "page_url": "https://example.com/long-page",
  "page_height": 2000,
  "viewport_height": 800
}
```

### 10. `download` - Скачивание файла
**Описание:** Фиксирует скачивание файлов с сайта.

**Ожидаемые поля:**
```json
{
  "event_type": "download",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "file_url": "https://example.com/file.pdf",
  "file_name": "document.pdf",
  "file_size": 1024000,
  "file_type": "pdf",
  "page_url": "https://example.com/downloads"
}
```

### 11. `search` - Поиск
**Описание:** Фиксирует поисковые запросы на сайте.

**Ожидаемые поля:**
```json
{
  "event_type": "search",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "search_query": "курсы программирования",
  "search_results_count": 15,
  "search_type": "site_search",
  "page_url": "https://example.com/search"
}
```

### 12. `add_to_cart` - Добавление в корзину
**Описание:** Фиксирует добавление товаров в корзину.

**Ожидаемые поля:**
```json
{
  "event_type": "add_to_cart",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "product_id": "prod_12345",
  "product_name": "Курс по Vue.js",
  "product_price": 2990,
  "product_category": "Программирование",
  "quantity": 1,
  "cart_total": 2990
}
```

### 13. `remove_from_cart` - Удаление из корзины
**Описание:** Фиксирует удаление товаров из корзины.

**Ожидаемые поля:**
```json
{
  "event_type": "remove_from_cart",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "product_id": "prod_12345",
  "product_name": "Курс по Vue.js",
  "product_price": 2990,
  "quantity": 1,
  "cart_total": 0
}
```

### 14. `checkout` - Оформление заказа
**Описание:** Фиксирует начало процесса оформления заказа.

**Ожидаемые поля:**
```json
{
  "event_type": "checkout",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "order_id": "order_12345",
  "cart_items_count": 2,
  "cart_total": 5990,
  "checkout_step": 1,
  "payment_method": "card"
}
```

### 15. `purchase` - Покупка
**Описание:** Фиксирует успешное завершение покупки.

**Ожидаемые поля:**
```json
{
  "event_type": "purchase",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "order_id": "order_12345",
  "transaction_id": "txn_abc123",
  "revenue": 5990,
  "currency": "RUB",
  "payment_method": "card",
  "products": [
    {
      "product_id": "prod_12345",
      "product_name": "Курс по Vue.js",
      "price": 2990,
      "quantity": 1
    }
  ]
}
```

### 16. `login` - Вход в аккаунт
**Описание:** Фиксирует успешную авторизацию пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "login",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "login_method": "email",
  "previous_login": "2025-01-06T10:15:00Z",
  "device_type": "desktop"
}
```

### 17. `logout` - Выход из аккаунта
**Описание:** Фиксирует выход пользователя из системы.

**Ожидаемые поля:**
```json
{
  "event_type": "logout",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "session_duration": 3600,
  "pages_viewed": 12
}
```

### 18. `share` - Поделиться контентом
**Описание:** Фиксирует действия по шерингу контента.

**Ожидаемые поля:**
```json
{
  "event_type": "share",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "share_url": "https://example.com/article",
  "share_method": "telegram",
  "share_title": "Интересная статья"
}
```

### 19. `comment` - Комментарий
**Описание:** Фиксирует добавление комментариев.

**Ожидаемые поля:**
```json
{
  "event_type": "comment",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "comment_id": "comment_12345",
  "comment_text": "Отличный материал!",
  "comment_type": "article_comment",
  "target_url": "https://example.com/article"
}
```

### 20. `like` - Лайк
**Описание:** Фиксирует постановку лайков.

**Ожидаемые поля:**
```json
{
  "event_type": "like",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "target_type": "article",
  "target_id": "article_12345",
  "target_url": "https://example.com/article",
  "like_type": "positive"
}
```

### 21. `custom_action` - Пользовательское действие
**Описание:** Фиксирует любые кастомные события, определенные разработчиком.

**Ожидаемые поля:**
```json
{
  "event_type": "custom_action",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_12345",
  "session_id": "session_abc123",
  "action_name": "widget_interaction",
  "action_category": "engagement",
  "custom_parameters": {
    "widget_type": "calculator",
    "widget_value": 1500,
    "interaction_type": "slider"
  },
  "page_url": "https://example.com/calculator"
}
```

## Технические детали

### Источник данных
- таблица: `chatium_ai.access_log`
- система: ClickHouse
- формат: JSON

### Поля доступа
Все события трафика содержат стандартные поля:
- `event_type` - тип события
- `timestamp` - время события (UTC)
- `user_id` - ID пользователя
- `session_id` - ID сессии
- `page_url` - URL страницы
- `ip_address` - IP адрес
- `user_agent` - User Agent браузера

### Фильтрация
События можно фильтровать по:
- Типу события
- Периоду времени
- ID пользователя
- ID сессии
- URL страницы

### Агрегация
Доступны агрегации по:
- Количеству событий
- Уникальным пользователям
- Сессиям
- Временным периодам

## Использование в аналитике

### Метрики
- **DAU/MAU** - активные пользователи
- **Bounce Rate** - показатель отказов
- **Conversion Rate** - конверсия целей
- **Session Duration** - длительность сессий
- **Page Views** - просмотры страниц

### Воронки
- Registration Funnel: pageview → registration → login
- Purchase Funnel: add_to_cart → checkout → purchase
- Engagement Funnel: video_play → video_pause → video_complete

### Сегментация
- По типам устройств
- По источникам трафика
- По поведенческим паттернам
- По демографическим данным

## Рекомендации по настройке

1. **Определите ключевые метрики** для вашего бизнеса
2. **Настройте воронки конверсии** для основных целей
3. **Используйте сегментацию** для анализа аудитории
4. **Следите за аномалиями** в поведении пользователей
5. **Интегрируйте с CRM** для комплексного анализа