# 0039 — этап 2 (страницы и ссылки), проверка оркестратором

Переписка: реализация этапа 2 плана перехода прототип → MVP (фича 7 — страницы и ссылки), затем вызов @check и выполнение проверок оркестратором.

---

### Пользователь

Implement the following to-dos from the plan (the plan is attached for your reference). Do NOT edit the plan file itself. You have been assigned the following 1 to-do(s): Реализовать этап 2. These to-dos have already been created. Do not create them again. Mark them as in_progress as you work, starting with the first one. Don't stop until you have completed all the assigned to-dos.

---

### Ассистент

**Сделано:**

- Репозитории: в pageRepo добавлены updatePage и deletePage; в linkRepo — getCampaignLinks(campaignId).
- API: api/pages/list, create, update, delete (проверка доступа к кампании, валидация urlTemplate с плейсхолдером {ref}); api/links/list (список партнёрских ссылок с pageTitle, partnerName, fullUrl).
- Компоненты: PageForm.vue (создание/редактирование страницы, валидация {ref}); PagesPage.vue (список целевых страниц, добавление/редактирование/удаление через форму и ConfirmModal; блок «Партнёрские ссылки» — таблица с копированием URL).
- Навигация: в Sidebar пункт «Страницы» сделан ссылкой на campaignUrl + #pages; в CampaignPageShell добавлен вывод PagesPage при currentSection === 'pages', обработка hashchange и onUnmounted для снятия слушателя.

**Итог:** Этап 2 выполнен: админ может управлять целевыми страницами и просматривать партнёрские ссылки в разделе кампании «Страницы».

---

### Пользователь

/check

---

### Ассистент

**Проверки оркестратора выполнены.**

**Стандарты кода (001-standards):** Документ 001-standards.md в проекте не найден; проверка по типичным правилам: в новых файлах использованы одинарные кавычки, относительные импорты, комментарии @shared-route в API, requireRealUser и memberRepo.checkCampaignAccess для доступа. Нарушений не выявлено.

**File-based роутинг:** Все новые эндпоинты (api/pages/*, api/links/list) объявлены с путём `/`. Ссылка на раздел «Страницы» — client-side hash (campaignUrl + '#pages'), не роут с тильдой. Замечаний нет.

**Рантайм и архитектура:** Проверка доступа к кампании перед операциями со страницами и ссылками; валидация urlTemplate на наличие {ref}; извлечение campaignId из страницы при update/delete с учётом RefLink. Циклов в графе импортов не обнаружено.

**Импорты и документация:** Обновлены docs/imports.md (api/pages/*, api/links/list, PagesPage.vue, PageForm.vue, CampaignPageShell — onUnmounted, PagesPage). Обновлены docs/api.md (разделы «Страницы кампании (api/pages/)» и «Партнёрские ссылки (api/links/)»). В README добавлена запись в Changelog об этапе 2.

**Резюме:** Код в порядке. Критических замечаний нет. Документация приведена в соответствие с реализацией этапа 2.

**Что сделать дальше:** Дополнительных обязательных действий нет. После следующих изменений в коде повторить @check.
