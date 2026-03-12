# 0026 — API кампаний, тесты на странице, проверка оркестратором

### Пользователь

Реализовать назначенные to-do из плана (фича 1 — кампании). Задача с ID api-campaigns: добавить API list и create в api/campaigns/ (или api/campaigns.ts). Не редактировать сам план. To-do уже созданы, не создавать их снова. Отмечать как in_progress при работе, выполнить до конца.

---

### Ассистент

Реализованы эндпоинты API кампаний по плану.

**Сделано:**

- Создан api/campaigns/list.ts: GET, requireRealUser, campaignRepo.getUserCampaigns, ответ с success и массивом campaigns (id, title, createdAt, updatedAt).
- Создан api/campaigns/create.ts: POST, requireRealUser, валидация title (длина не менее 2), campaignRepo.createCampaign, ответ с success и campaign (id, title, ownerUserId, createdAt, updatedAt) или success: false и error при валидации.
- В обоих файлах указано // @shared-route и импорт requireRealUser из @app/auth. Роуты подхватываются file-based роутингом.

**Итог:** To-do api-campaigns выполнен. Предложено при необходимости запустить проверки (@check).

---

### Пользователь

Отлично. Добавь тесты и помести эти тесты на страницу к остальным тестам.

---

### Ассистент

Добавлены тесты API кампаний и блок на странице тестов.

**Сделано:**

- На странице тестов (TestsPage.vue) добавлен блок 10 «API кампаний» с тремя тестами: GET /api/campaigns/list (проверка 200, success и массива campaigns); POST /api/campaigns/create с валидным title (успешное создание, наличие campaign.id); POST /api/campaigns/create с коротким title (проверка success: false и поля error). Запросы выполняются из браузера с credentials: 'include'.
- Результаты отображаются в той же карточке (TODO/OK/FAIL), добавлена кнопка «Запустить проверку API кампаний» и время последнего запуска.
- В «Запустить все тесты» добавлен вызов runCampaignsApiTests() и учёт результатов в метриках (всего десять блоков).
- В api/tests/list.ts добавлена категория «API кампаний» с теми же тремя тестами.

**Итог:** Тесты API кампаний доступны на странице тестов вместе с остальными блоками. Предложено при необходимости запустить @check.

---

### Пользователь

/check

---

### Ассистент

Выполнены проверки оркестратора по затронутым файлам (api/campaigns, pages/TestsPage.vue, api/tests/list.ts, docs и др.).

**Сделано:**

- **standards-checker:** Документ 001-standards.md в проекте не найден; затронутый код (api/campaigns/list.ts, create.ts, TestsPage.vue) проверен по типичным правилам: отступы 2 пробела, одинарные кавычки, // @shared-route, импорты из @app/auth и относительные пути — нарушений не выявлено.
- **file-based-routing-checker:** Эндпоинты api/campaigns/list.ts и api/campaigns/create.ts объявлены с путём '/', один маршрут на файл; замечаний по роутингу нет.
- **runtime-architecture-checker:** В API кампаний перед логикой вызывается requireRealUser; валидация title и обработка body учтены; критических рисков не выявлено.
- **imports-docs:** В docs/imports.md добавлены разделы для api/campaigns/list.ts и api/campaigns/create.ts (импорты requireRealUser и campaignRepo). Циклических зависимостей не обнаружено.
- **docs-keeper:** Обновлены docs/api.md (раздел «Кампании (api/campaigns/)» с таблицей list/create), docs/architecture.md (примеры api/campaigns в структуре), README.md (текущее состояние — API кампаний и десять блоков тестов; Changelog — запись о добавлении API кампаний и блока «API кампаний» на странице тестов).

**Итог:** Проверки пройдены, документация приведена в соответствие с кодом. Рекомендация: после следующих изменений повторить @check.
