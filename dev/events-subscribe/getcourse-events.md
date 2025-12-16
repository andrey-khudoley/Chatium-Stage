# Документация по событиям GetCourse

## Обзор

События GetCourse предоставляют полную информацию о взаимодействии пользователей с образовательной платформой. Всего доступно **30 типов событий** для мониторинга учебного процесса, коммерческой активности и вовлеченности пользователей.

## Типы событий GetCourse

### 🔒 События заказов (Customer Deals)

#### 1. `dealCreated` - Создание заказа
**Описание:** Фиксирует создание нового заказа в системе.

**Ожидаемые поля:**
```json
{
  "event_type": "dealCreated",
  "timestamp": "2025-01-07T14:30:00Z",
  "deal_id": "deal_12345",
  "user_id": "user_abc123",
  "deal_status": "new",
  "deal_amount": 2990,
  "currency": "RUB",
  "products": [
    {
      "product_id": "prod_001",
      "product_name": "Курс по Vue.js",
      "quantity": 1,
      "price": 2990
    }
  ],
  "contact_info": {
    "email": "user@example.com",
    "phone": "+79001234567",
    "first_name": "Иван",
    "last_name": "Иванов"
  },
  "utm_source": "google",
  "utm_medium": "cpc"
}
```

#### 2. `dealStatusChanged` - Изменение статуса заказа
**Описание:** Фиксирует изменение статуса заказа на любом этапе.

**Ожидаемые поля:**
```json
{
  "event_type": "dealStatusChanged",
  "timestamp": "2025-01-07T14:30:00Z",
  "deal_id": "deal_12345",
  "user_id": "user_abc123",
  "old_status": "new",
  "new_status": "processing",
  "changed_by": "manager_001",
  "change_reason": "Проверка оплаты",
  "deal_amount": 2990,
  "currency": "RUB"
}
```

#### 3. `dealPaid` - Оплата заказа
**Описание:** Фиксирует успешную оплату заказа.

**Ожидаемые поля:**
```json
{
  "event_type": "dealPaid",
  "timestamp": "2025-01-07T14:30:00Z",
  "deal_id": "deal_12345",
  "user_id": "user_abc123",
  "payment_id": "pay_xyz789",
  "payment_amount": 2990,
  "currency": "RUB",
  "payment_method": "card",
  "payment_system": "stripe",
  "paid_at": "2025-01-07T14:30:00Z",
  "deal_status": "paid"
}
```

#### 4. `dealRefund` - Возврат средств
**Описание:** Фиксирует возврат денежных средств за заказ.

**Ожидаемые поля:**
```json
{
  "event_type": "dealRefund",
  "timestamp": "2025-01-07T14:30:00Z",
  "deal_id": "deal_12345",
  "user_id": "user_abc123",
  "refund_id": "ref_456789",
  "refund_amount": 2990,
  "currency": "RUB",
  "refund_reason": "Возврат по просьбе клиента",
  "refund_method": "card",
  "processed_by": "manager_001"
}
```

#### 5. `dealUpdated` - Обновление заказа
**Описание:** Фиксирует любые изменения в данных заказа.

**Ожидаемые поля:**
```json
{
  "event_type": "dealUpdated",
  "timestamp": "2025-01-07T14:30:00Z",
  "deal_id": "deal_12345",
  "user_id": "user_abc123",
  "updated_fields": [
    {
      "field": "contact_email",
      "old_value": "old@example.com",
      "new_value": "new@example.com"
    }
  ],
  "updated_by": "manager_001",
  "update_reason": "Обновление контакта"
}
```

### 👥 События пользователей (User Management)

#### 6. `user/created` - Регистрация пользователя
**Описание:** Фиксирует создание нового пользователя в системе.

**Ожидаемые поля:**
```json
{
  "event_type": "user/created",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "email": "user@example.com",
  "first_name": "Иван",
  "last_name": "Иванов",
  "phone": "+79001234567",
  "registration_source": "form",
  "registration_method": "email",
  "ip_address": "192.168.1.1",
  "utm_source": "google",
  "utm_medium": "cpc",
  "utm_campaign": "new_year"
}
```

#### 7. `user/updated` - Обновление профиля
**Описание:** Фиксирует изменение данных пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "user/updated",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "updated_fields": [
    {
      "field": "first_name",
      "old_value": "Иван",
      "new_value": "Пётр"
    },
    {
      "field": "phone",
      "old_value": "+79001234567",
      "new_value": "+79111234567"
    }
  ],
  "updated_by": "user_abc123",
  "update_source": "profile_form"
}
```

#### 8. `user/deleted` - Удаление пользователя
**Описание:** Фиксирует удаление пользователя из системы.

**Ожидаемые поля:**
```json
{
  "event_type": "user/deleted",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "email": "user@example.com",
  "deletion_reason": "request_by_user",
  "deleted_by": "admin_001",
  "related_data": {
    "deals_count": 2,
    "courses_count": 3,
    "certificates_count": 1
  }
}
```

### 🤖 События чат-ботов (Chatbots Integration)

#### 9. `user/chatbot/telegram_enabled` - Привязка Telegram
**Описание:** Фиксирует успешную привязку Telegram аккаунта пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "user/chatbot/telegram_enabled",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "telegram_id": "123456789",
  "telegram_username": "ivan_ivanov",
  "telegram_first_name": "Иван",
  "telegram_last_name": "Иванов",
  "integration_date": "2025-01-07T14:30:00Z",
  "bot_id": "gc_telegram_bot",
  "subscription_status": "active"
}
```

#### 10. `user/chatbot/telegram_disabled` - Отвязка Telegram
**Описание:** Фиксирует отвязку Telegram аккаунта пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "user/chatbot/telegram_disabled",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "telegram_id": "123456789",
  "disabled_by": "user_abc123",
  "disable_reason": "user_request",
  "previous_messages_count": 25
}
```

#### 11. `user/chatbot/vk_enabled` - Привязка VK
**Описание:** Фиксирует успешную привязку VK аккаунта пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "user/chatbot/vk_enabled",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "vk_id": "987654321",
  "vk_username": "id987654321",
  "vk_first_name": "Иван",
  "vk_last_name": "Иванов",
  "integration_date": "2025-01-07T14:30:00Z",
  "bot_id": "gc_vk_bot",
  "subscription_status": "active"
}
```

#### 12. `user/chatbot/vk_disabled` - Отвязка VK
**Описание:** Фиксирует отвязку VK аккаунта пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "user/chatbot/vk_disabled",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "vk_id": "987654321",
  "disabled_by": "user_abc123",
  "disable_reason": "user_request",
  "previous_messages_count": 15
}
```

#### 13. `user/chatbot/whatsapp_enabled` - Привязка WhatsApp
**Описание:** Фиксирует успешную привязку WhatsApp номера пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "user/chatbot/whatsapp_enabled",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "whatsapp_number": "+79001234567",
  "whatsapp_verified": true,
  "integration_date": "2025-01-07T14:30:00Z",
  "bot_id": "gc_whatsapp_bot",
  "subscription_status": "active"
}
```

#### 14. `user/chatbot/whatsapp_disabled` - Отвязка WhatsApp
**Описание:** Фиксирует отвязку WhatsApp номера пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "user/chatbot/whatsapp_disabled",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "whatsapp_number": "+79001234567",
  "disabled_by": "user_abc123",
  "disable_reason": "user_request",
  "previous_messages_count": 8
}
```

### 📚 События групп (Groups Management)

#### 15. `user/group_added` - Добавление в группу
**Описание:** Фиксирует добавление пользователя в учебную группу.

**Ожидаемые поля:**
```json
{
  "event_type": "user/group_added",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "group_id": "group_001",
  "group_name": "Группа по Vue.js - Январь 2025",
  "course_id": "course_001",
  "course_name": "Курс по Vue.js",
  "added_by": "manager_001",
  "addition_reason": "enrollment",
  "start_date": "2025-01-10T00:00:00Z",
  "status": "active"
}
```

#### 16. `user/group_removed` - Удаление из группы
**Описание:** Фиксирует удаление пользователя из учебной группы.

**Ожидаемые поля:**
```json
{
  "event_type": "user/group_removed",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "group_id": "group_001",
  "group_name": "Группа по Vue.js - Январь 2025",
  "course_id": "course_001",
  "removed_by": "manager_001",
  "removal_reason": "course_completion",
  "completion_date": "2025-01-07T14:30:00Z",
  "progress_percentage": 100
}
```

### 🎓 События обучения (Learning Progress)

#### 17. `lesson/started` - Урок начат
**Описание:** Фиксирует начало прохождения урока пользователем.

**Ожидаемые поля:**
```json
{
  "event_type": "lesson/started",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "lesson_id": "lesson_001",
  "lesson_name": "Введение в Vue.js",
  "course_id": "course_001",
  "course_name": "Курс по Vue.js",
  "lesson_number": 1,
  "module_id": "module_001",
  "module_name": "Основы Vue.js",
  "estimated_duration": 30,
  "start_time": "2025-01-07T14:30:00Z"
}
```

#### 18. `lesson/completed` - Урок пройден
**Описание:** Фиксирует успешное завершение урока.

**Ожидаемые поля:**
```json
{
  "event_type": "lesson/completed",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "lesson_id": "lesson_001",
  "lesson_name": "Введение в Vue.js",
  "course_id": "course_001",
  "course_name": "Курс по Vue.js",
  "completion_time": "2025-01-07T15:00:00Z",
  "time_spent_minutes": 30,
  "lesson_score": 95,
  "max_score": 100,
  "attempts_count": 1,
  "passed_on_first_attempt": true
}
```

#### 19. `training/started` - Тренинг начат
**Описание:** Фиксирует начало прохождения тренинга.

**Ожидаемые поля:**
```json
{
  "event_type": "training/started",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "training_id": "course_001",
  "training_name": "Курс по Vue.js",
  "training_type": "course",
  "estimated_duration_hours": 40,
  "start_date": "2025-01-07T14:30:00Z",
  "access_type": "paid",
  "enrollment_source": "deal_12345"
}
```

#### 20. `training/completed` - Тренинг завершен
**Описание:** Фиксирует успешное завершение всего тренинга.

**Ожидаемые поля:**
```json
{
  "event_type": "training/completed",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "training_id": "course_001",
  "training_name": "Курс по Vue.js",
  "completion_date": "2025-01-07T14:30:00Z",
  "total_time_spent_hours": 42,
  "final_score": 88,
  "lessons_completed_count": 25,
  "total_lessons_count": 25,
  "test_results": {
    "average_score": 85,
    "best_score": 95,
    "tests_passed": 15
  }
}
```

### 📝 События заданий и тестов (Assignments & Tests)

#### 21. `task/completed` - Задание выполнено
**Описание:** Фиксирует выполнение практического задания.

**Ожидаемые поля:**
```json
{
  "event_type": "task/completed",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "task_id": "task_001",
  "task_name": "Создание Vue компонента",
  "lesson_id": "lesson_005",
  "course_id": "course_001",
  "submission_date": "2025-01-07T14:30:00Z",
  "task_type": "practical",
  "score": 92,
  "max_score": 100,
  "graded_by": "teacher_001",
  "feedback": "Отличная работа!",
  "attempts_count": 2
}
```

#### 22. `test/passed` - Тест пройден
**Описание:** Фиксирует успешное прохождение теста.

**Ожидаемые поля:**
```json
{
  "event_type": "test/passed",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "test_id": "test_001",
  "test_name": "Тест по основам Vue.js",
  "lesson_id": "lesson_001",
  "course_id": "course_001",
  "completion_time": "2025-01-07T14:30:00Z",
  "score": 85,
  "max_score": 100,
  "passing_score": 70,
  "questions_count": 20,
  "correct_answers_count": 17,
  "time_spent_minutes": 25,
  "attempts_count": 3
}
```

#### 23. `test/failed` - Тест не пройден
**Описание:** Фиксирует неудачную попытку прохождения теста.

**Ожидаемые поля:**
```json
{
  "event_type": "test/failed",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "test_id": "test_001",
  "test_name": "Тест по основам Vue.js",
  "lesson_id": "lesson_001",
  "course_id": "course_001",
  "completion_time": "2025-01-07T14:30:00Z",
  "score": 45,
  "max_score": 100,
  "passing_score": 70,
  "questions_count": 20,
  "correct_answers_count": 9,
  "time_spent_minutes": 20,
  "attempts_count": 1,
  "next_attempt_available": "2025-01-08T00:00:00Z"
}
```

### 🎥 События вебинаров (Webinars)

#### 24. `webinar/registered` - Регистрация на вебинар
**Описание:** Фиксирует регистрацию пользователя на вебинар.

**Ожидаемые поля:**
```json
{
  "event_type": "webinar/registered",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "webinar_id": "webinar_001",
  "webinar_title": "Продвинутые техники Vue.js",
  "webinar_date": "2025-01-15T18:00:00Z",
  "registration_date": "2025-01-07T14:30:00Z",
  "expected_duration_minutes": 60,
  "registration_source": "course_page",
  "reminders_sent": 0
}
```

#### 25. `webinar/attended` - Присутствие на вебинаре
**Описание:** Фиксирует фактическое участие пользователя в вебинаре.

**Ожидаемые поля:**
```json
{
  "event_type": "webinar/attended",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "webinar_id": "webinar_001",
  "webinar_title": "Продвинутые техники Vue.js",
  "attendance_date": "2025-01-15T18:00:00Z",
  "join_time": "2025-01-15T18:02:00Z",
  "leave_time": "2025-01-15T19:15:00Z",
  "duration_minutes": 73,
  "attendance_percentage": 100,
  "interaction_count": 5,
  "certificate_issued": false
}
```

### 📜 События сертификатов (Certificates)

#### 26. `certificate/issued` - Выдача сертификата
**Описание:** Фиксирует выдачу сертификата об обучении.

**Ожидаемые поля:**
```json
{
  "event_type": "certificate/issued",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "certificate_id": "cert_001234",
  "course_id": "course_001",
  "course_name": "Курс по Vue.js",
  "completion_date": "2025-01-07T14:30:00Z",
  "issue_date": "2025-01-07T14:30:00Z",
  "certificate_type": "completion",
  "grade": "A",
  "score": 88,
  "certificate_url": "https://getcourse.com/certificate/cert_001234",
  "valid_until": "2028-01-07T23:59:59Z",
  "issued_by": GetCourse
}
```

### 💳 События подписок (Subscriptions)

#### 27. `subscription/created` - Создание подписки
**Описание:** Фиксирует создание новой подписки пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "subscription/created",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "subscription_id": "sub_001",
  "subscription_type": "monthly",
  "product_id": "product_monthly",
  "product_name": "Месячная подписка на курсы",
  "amount": 1990,
  "currency": "RUB",
  "start_date": "2025-01-07T14:30:00Z",
  "next_billing_date": "2025-02-07T14:30:00Z",
  "auto_renewal": true,
  "payment_method": "card",
  "trial_period": false
}
```

#### 28. `subscription/cancelled` - Отмена подписки
**Описание:** Фиксирует отмену подписки пользователя.

**Ожидаемые поля:**
```json
{
  "event_type": "subscription/cancelled",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "subscription_id": "sub_001",
  "cancellation_date": "2025-01-07T14:30:00Z",
  "cancellation_reason": "user_request",
  "cancelled_by": "user_abc123",
  "access_until": "2025-02-07T14:30:00Z",
  "refund_amount": 0,
  "remaining_access_days": 31
}
```

#### 29. `subscription/payment` - Оплата подписки
**Описание:** Фиксирует успешное продление подписки.

**Ожидаемые поля:**
```json
{
  "event_type": "subscription/payment",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "subscription_id": "sub_001",
  "payment_id": "pay_xyz789",
  "payment_amount": 1990,
  "currency": "RUB",
  "payment_date": "2025-01-07T14:30:00Z",
  "billing_period": "monthly",
  "next_billing_date": "2025-02-07T14:30:00Z",
  "payment_method": "card",
  "auto_renewal": true,
  "payment_attempt": 1
}
```

#### 30. `subscription/renewal_failed` - Неудачное продление
**Описание:** Фиксирует неудачную попытку продления подписки.

**Ожидаемые поля:**
```json
{
  "event_type": "subscription/renewal_failed",
  "timestamp": "2025-01-07T14:30:00Z",
  "user_id": "user_abc123",
  "subscription_id": "sub_001",
  "failure_date": "2025-01-07T14:30:00Z",
  "failure_reason": "insufficient_funds",
  "payment_attempt": 2,
  "next_retry_date": "2025-01-08T14:30:00Z",
  "grace_period_days": 3,
  "access_suspended": false
}
```

## Технические детали

### Источник данных
- API: GetCourse Webhook API
- Формат: JSON через вебхуки
- Частота: Real-time

### Стандартные поля
Все события GetCourse содержат базовые поля:
- `event_type` - тип события
- `timestamp` - время события (UTC)
- `user_id` - ID пользователя в GetCourse
- `integration_id` - ID интеграции
- `workspace_id` - ID рабочего пространства

### Специфические поля
Различные типы событий имеют дополнительные поля:
- `deal_id` - ID заказа
- `product_id` - ID продукта
- `course_id` - ID курса
- `lesson_id` - ID урока
- `group_id` - ID группы

## Использование в аналитике

### Бизнес-метрики
- **Revenue** - общая выручка
- **ARPU** - средний доход на пользователя
- **LTV** - пожизненная ценность клиента
- **Churn Rate** - отток пользователей
- **Conversion Rate** - конверсия в покупку

### Учебные метрики
- **Course Completion Rate** - процент завершения курсов
- **Engagement Score** - показатель вовлеченности
- **Learning Path Efficiency** - эффективность учебных путей
- **Knowledge Retention** - удержание знаний
- **Skill Progress** - прогресс развития навыков

### Воронки процесса обучения
1. **Registration Funnel:** user/created → lesson/started → course_enrolled
2. **Learning Funnel:** lesson/started → lesson/completed → test/passed → training/completed
3. **Monetization Funnel:** dealCreated → dealPaid → subscription/created
4. **Certification Funnel:** training/completed → certificate/issued

### Сегментация пользователей
- **Новички** (new users < 30 дней)
- **Активные обучающиеся** (progress > 50%)
- **Эксперты** (multiple courses completed)
- **Платящие пользователи** (active subscriptions)
- **Риск оттока** (low activity < 7 дней)

## Рекомендации по настройке

1. **Настройте_CRYPTO_вебхуки** в GetCourse для real-time синхронизации
2. **Определите ключевые KPI** для вашего образовательного бизнеса
3. **Создайте автоматические триггеры** для обратной связи
4. **Интегрируйте с CRM** для полной картины взаимодействия
5. **Используйте предиктивную аналитику** для предотвращения оттока
6. **Настройте email-автоматизации** на основе событий
7. **Создайте дашборды** для операторов поддержки
8. **Внедрите систему флагов** для сегментации аудитории

## Примеры использования

### Автоматическое создание групп
При `dealPaid` создать пользователя и добавить в соответствующую группу.

### Отслеживание прогресса
Анализировать `lesson/completed` для предсказания успешного завершения курса.

### Управление оттоком
Мониторить `subscription/cancelled` для анализа причин ухода.

### Персонализация обучения
Использовать `test/passed` и `task/completed` для адаптации учебного пути.