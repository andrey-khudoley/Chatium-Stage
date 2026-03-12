# 0028 — План фичи 2, реализация, тесты и проверка оркестратором

### Пользователь

Составь план для второй фичи @p/saas/ref/docs/ADR/0000-waves.md

---

### Ассистент

Прочитан 0000-waves.md. Фича 2 — «Страницы и партнёрские ссылки»: целевые страницы с URL-шаблоном, у партнёра уникальная ссылка; таблицы pages, partner_links; репо pageRepo, linkRepo; либа urlBuilder (подстановка {ref}); API для прототипа не обязательно.

Составлен план (create_plan): таблицы Heap partners (минимальная для RefLink), pages, partner_links; репозитории pageRepo (createPage, getPageById, getCampaignPages), linkRepo (getOrCreatePartnerLink, getPartnerLinks, findLinkByPublicSlug); refGenerator.generateLinkSlug; lib/core/urlBuilder (substituteRef, buildPartnerLinkUrl); константы в config/routes (REDIRECT_SUBROUTE, getBaseUrl, getPartnerRedirectUrl); типы PageRow, PartnerLinkRow в shared/types. Порядок: таблицы → refGenerator → urlBuilder → pageRepo → linkRepo → типы. План сохранён, пользователю предложено запустить проверки после реализации.

---

### Пользователь

Implement the plan as specified, it is attached for your reference. Do NOT edit the plan file itself. To-do's from the plan have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the to-dos.

---

### Ассистент

Реализована фича 2 по плану.

**Сделано:**

- **Таблицы Heap:** partners.table.ts (campaignId, tgId, username, fullName, stats), pages.table.ts (campaignId, title, urlTemplate), partner_links.table.ts (campaignId, partnerId, pageId, publicSlug). Идентификаторы Heap по образцу campaigns/campaign_members, RefLink с onDelete: 'none'.
- **refGenerator.ts:** добавлена функция generateLinkSlug() — generateUrlSafeId(10).
- **config/routes.tsx:** REDIRECT_SUBROUTE = 'r', getBaseUrl() (без process.env — фиксированный URL), getPartnerRedirectUrl(linkSlug).
- **lib/core/urlBuilder.ts:** substituteRef(urlTemplate, ref), buildPartnerLinkUrl(linkSlug) через getPartnerRedirectUrl.
- **lib/repo/pageRepo.ts:** createPage, getPageById, getCampaignPages.
- **lib/repo/linkRepo.ts:** getOrCreatePartnerLink (findOneBy по campaignId+partnerId+pageId или create с generateLinkSlug), getPartnerLinks, findLinkByPublicSlug.
- **shared/types.ts:** PageRow, PartnerLinkRow.
- **docs/imports.md:** обновлён (routes, types, таблицы partners/pages/partner_links, pageRepo, linkRepo, urlBuilder).

Все to-do отмечены выполненными. Предложено запустить проверки (@check).

---

### Пользователь

Добавь тесты и размести их на странице с остальными тестам

---

### Ассистент

Добавлены тесты для фичи 2 и размещены на странице тестов.

**Сделано:**

- **ref-generator.ts:** добавлен тест generateLinkSlug (длина 10, base62).
- **api/tests/endpoints-check/url-builder.ts:** новый эндпоинт — тесты substituteRef (одна и несколько подстановок {ref}), buildPartnerLinkUrl (URL содержит slug и путь редиректа).
- **api/tests/endpoints-check/page-repo.ts:** создаётся кампания через campaignRepo, страница через pageRepo; тесты createPage, getPageById (найдена/не найдена), getCampaignPages; в finally удаляются страницы, участники, кампания.
- **api/tests/endpoints-check/link-repo.ts:** создаётся кампания, партнёр (Partners.create), страница; тесты getOrCreatePartnerLink, идемпотентность повтора, getPartnerLinks, findLinkByPublicSlug; в finally удаляются partner_links, pages, partner, members, campaign.
- **api/tests/list.ts:** в категорию ref-generator добавлен тест generateLinkSlug; добавлены категории url-builder, page-repo, link-repo с перечнем тестов.
- **pages/TestsPage.vue:** в блок 7 (refGenerator) добавлен тест generateLinkSlug; добавлены блоки 11 «Построение URL», 12 «Репозиторий страниц», 13 «Репозиторий партнёрских ссылок» (массивы тестов, display, results, loading, lastRunAt, runXxxTests); в runAllTests добавлены runUrlBuilderTests, runPageRepoTests, runLinkRepoTests и учёт их результатов в метриках.
- **docs/imports.md:** добавлены импорты для url-builder.ts, page-repo.ts, link-repo.ts.

Итог: тесты отображаются на странице тестов и запускаются по блокам или кнопкой «Запустить все тесты». Предложено @check.

---

### Пользователь

/check

---

### Ассистент (оркестратор)

Выполнена полная проверка по порядку: standards-checker, file-based-routing-checker, runtime-architecture-checker, imports-docs, docs-keeper, llm-conversation-logger.

**Затронутые файлы (git diff + untracked):**  
config/routes.tsx, lib/core/refGenerator.ts, lib/core/urlBuilder.ts, lib/repo/pageRepo.ts, lib/repo/linkRepo.ts, shared/types.ts, tables/partners.table.ts, tables/pages.table.ts, tables/partner_links.table.ts, api/tests/list.ts, api/tests/endpoints-check/ref-generator.ts, api/tests/endpoints-check/url-builder.ts, api/tests/endpoints-check/page-repo.ts, api/tests/endpoints-check/link-repo.ts, pages/TestsPage.vue, docs/imports.md.

**Проверки:**

- **Стандарты:** Код соответствует типичным правилам: API-маршруты с `// @shared-route`, таблицы Heap с `.table.ts`, импорты относительные, без `process.env` в коде (getBaseUrl без env), фильтрация через `where`. Нарушений не зафиксировано.
- **Роутинг:** Все новые эндпоинты в api/tests/endpoints-check/ с путём `'/'`. Константы редиректа (REDIRECT_SUBROUTE, getPartnerRedirectUrl) в config/routes — не роуты, замечаний нет.
- **Рантайм и архитектура:** page-repo и link-repo создают тестовые данные и удаляют их в finally. urlBuilder — чистые функции. Циклических зависимостей нет (imports-docs уже обновлён ранее).
- **Импорты:** docs/imports.md уже содержал записи для url-builder, page-repo, link-repo и обновлённые таблицы/репо; циклов нет.
- **Документация (docs-keeper):** Обновлены docs/api.md (добавлены url-builder, page-repo, link-repo; уточнён ref-generator с generateLinkSlug), docs/data.md (типы PageRow, PartnerLinkRow; таблицы partners, pages, partner_links; репо pageRepo, linkRepo; urlBuilder и generateLinkSlug в lib), README.md (текущее состояние — фича 2 и тринадцать блоков тестов; Changelog — запись о фиче 2 и тестах).

**Резюме:** Код в порядке. Критических замечаний нет. Документация приведена в соответствие с фичей 2 и новыми тестами.

---

### Пользователь

LLM должен содержать всю переписку, а не только последнее сообщение

---

### Ассистент

Файл docs/LLM/0028-orchestrator-check-feature2-tests.md обновлён: в него внесена **вся переписка** с начала сессии — от запроса плана по второй фиче (0000-waves.md), реализации плана (таблицы, репо, urlBuilder, refGenerator, типы), добавления тестов и размещения их на странице тестов до запроса /check и ответа оркестратора. Каждый оборот диалога (пользователь → ассистент) сохранён отдельным блоком, чтобы в LLM была полная история диалога, а не только последнее сообщение.
