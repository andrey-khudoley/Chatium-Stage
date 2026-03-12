# 0023 — Heap-таблицы кампаний и проверка оркестратором

### Пользователь

Implement the following to-dos from the plan (the plan is attached for your reference). Do NOT edit the plan file itself. You have been assigned the following 1 to-do(s) with IDs: heap-tables. 1. [heap-tables] Создать tables/campaigns.table.ts и tables/campaign_members.table.ts. These to-dos have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the assigned to-dos.

---

### Ассистент

**Сделано:**

- Создан файл p/saas/ref/tables/campaigns.table.ts: таблица t__saas-ref__campaign__8Hn4Lx с полями title, ownerUserId (UserRefLink), webhookSecret, settings (Any), isDeleted (defaultValue: false); экспорт CampaignRow, CampaignRowJson.
- Создан файл p/saas/ref/tables/campaign_members.table.ts: таблица t__saas-ref__campaign_member__2Km5Ny с полями campaignId (RefLink на tables/campaigns.table), userId (UserRefLink), role; экспорт CampaignMemberRow, CampaignMemberRowJson.
- To-do heap-tables отмечен выполненным.

**Итог:** Обе Heap-таблицы созданы по плану фичи 1; линтер ошибок не показывает.

---

### Пользователь

/check

---

### Ассистент

Выполнены проверки оркестратора по затронутым файлам (git diff и untracked: tables/campaigns.table.ts, tables/campaign_members.table.ts, docs/imports.md, docs/data.md, README, docs/architecture.md и др.).

**Стандарты кода:** Таблицы соответствуют 001-standards: отступы 2 пробела, одинарные кавычки, импорт Heap из @app/heap, файлы с расширением .table.ts. Нарушений не выявлено.

**File-based роутинг:** Таблицы не содержат роутов. Замечаний нет.

**Рантайм и архитектура:** Таблицы — определения схем; критических рисков не выявлено.

**Импорты и циклы:** Обновлён docs/imports.md — добавлены разделы для campaigns.table.ts и campaign_members.table.ts. campaign_members ссылается на campaigns через targetTablePath (конфиг Heap), не через импорт. Циклических зависимостей не обнаружено.

**Документация:** Обновлены docs/data.md (таблица Heap с campaigns и campaign_members), docs/imports.md (импорты новых таблиц), README (Changelog — запись о добавлении таблиц), docs/architecture.md (tables/ — campaigns, campaign_members).

**Итог:** Проверки пройдены; правки внесены. Код и документация приведены в соответствие с текущим состоянием.
