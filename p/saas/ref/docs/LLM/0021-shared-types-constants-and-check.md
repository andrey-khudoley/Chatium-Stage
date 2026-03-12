# 0021 — shared types/constants и проверка оркестратором

### Пользователь

Реализовать to-do из плана (фича 1 — кампании): создать shared/types.ts и shared/constants.ts (CampaignSettings, CampaignRow, роли, дефолты). Задачи уже созданы, не создавать их снова. Отмечать in_progress и выполнить до конца.

---

### Ассистент

**Сделано:**

- В `p/saas/ref/shared/types.ts`: добавлены интерфейсы CampaignSettings (requireNewClient, products, attributionDays, botUpdatesLimit, logLevel), CampaignRow (id, title, ownerUserId, webhookSecret, settings, isDeleted, createdAt, updatedAt), MemberRow (id, campaignId, userId, role, createdAt, updatedAt).
- В `p/saas/ref/shared/constants.ts`: константа CAMPAIGN_ROLES и тип CampaignRole ('campaign-owner' | 'campaign-member'), объект DEFAULT_CAMPAIGN_SETTINGS с дефолтами (requireNewClient: false, products: [], attributionDays: null, botUpdatesLimit: 25, logLevel: 'info'). Импорт типа CampaignSettings из shared/types.
- To-do «shared-types-constants» отмечен выполненным.

**Итог:** Общие типы и константы кампаний по плану 9.4 созданы; линтер ошибок не показывает.

---

### Пользователь

/check

---

### Ассистент

Выполнены проверки оркестратора по затронутым файлам (shared/types.ts, shared/constants.ts):

**Стандарты кода:** Документ 001-standards.md в проекте не найден; проверка по типичным правилам Chatium: отступы 2 пробела, одинарные кавычки, структура файлов в норме, импорт только типа из types в constants — нарушений не выявлено.

**File-based роутинг:** Затронутые файлы — только shared-модули, объявлений роутов нет. Замечаний нет.

**Рантайм и архитектура:** Файлы содержат только типы и константы, без бизнес-логики и обращений к данным. Циклических зависимостей нет (types без импортов, constants импортирует только тип из types). Критических рисков не выявлено.

**Импорты и циклы:** В docs/imports.md добавлены разделы для shared/types.ts (нет импортов) и shared/constants.ts (импорт типа из ./types). Граф зависимостей: types ← constants; циклов нет.

**Документация:** Обновлены README (текущее состояние и Changelog), docs/architecture.md (описание shared/types и shared/constants), docs/data.md (разделы «Общие типы» и «Константы»). .CHATIUM-LLM.md без изменений (указатели актуальны).

**Итог:** Проверки пройдены; правки не требуются. После исправлений повторять @check не нужно.
