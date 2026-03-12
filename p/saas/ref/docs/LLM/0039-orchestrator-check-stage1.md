# 0039 — этап 1 (фича 6: кампании и приглашения), затем @check

Реализация этапа 1 плана перехода прототип → MVP: таблица приглашений, API кампаний/участников/приглашений, роуты invite и campaign, IndexPage, InvitePage, layout кампании, формы и модалки. После этого пользователь запросил проверку оркестратором.

---

### Пользователь

Implement the following to-dos from the plan (the plan is attached for reference). Do NOT edit the plan file itself. You have been assigned the following 1 to-do(s): [todo-1770130251448-ob9g2hi62] Реализовать этап 1.

---

### Ассистент

**Сделано:**

- Таблица campaign_invites (tables/campaign_invites.table.ts), inviteRepo (createInvite, getInviteByToken, acceptInvite, listInvitesByCampaign), расширение campaignRepo (updateCampaignSettings, deleteCampaign), memberRepo.listMembers.
- API: campaigns get/update/delete, members/list, invites create/get-by-token/accept.
- Роуты: config/routes — invite, campaign, getInvitePageUrl, getCampaignPageUrl, parseTildeParam; web/invite/index.tsx, web/campaign/index.tsx.
- Страницы: IndexPage (список кампаний, кнопка «Создать кампанию», CampaignForm), InvitePage (по токену принять/отклонить), CampaignPageShell (Sidebar + PageContainer), CampaignPage (дашборд + блок приглашения), компоненты Layout (Sidebar, PageContainer), Forms/CampaignForm, Modals/ConfirmModal.
- Главная (index.tsx): для авторизованного — IndexPage, для гостя — HomePage.
- refGenerator: добавлена generateInviteToken().

**Итог:** Этап 1 выполнен; пользователь может создавать кампанию, генерировать приглашение, приглашённый принимает и видит кампанию в списке; навигация в кампанию ведёт на дашборд с боковым меню.

---

### Пользователь

/check

---

### Ассистент

**Проверки оркестратора выполнены.**

**Стандарты (001-standards):** Исправлено: в inviteRepo при создании инвайта убрана передача acceptedAt: undefined (опциональные поля не передаём). Остальной затронутый код соответствует: @shared / @shared-route, относительные импорты, пути эндпоинтов `/`, ссылки через getFullUrl и тильду.

**File-based роутинг:** Замечаний нет. Эндпоинты в отдельных файлах с путём `/`; страницы invite и campaign используют путь с тильдой (parseTildeParam, getInvitePageUrl, getCampaignPageUrl).

**Рантайм и архитектура:** Критических рисков не выявлено. Проверка доступа к кампании перед операциями; валидация campaignId и token в API; обработка отсутствующего/истёкшего приглашения.

**Импорты и циклы:** Обновлён docs/imports.md (новые entrypoints, страницы, компоненты, API, inviteRepo, таблица campaign_invites). Циклических зависимостей не обнаружено.

**Документация:** Обновлены docs/api.md (кампании get/update/delete, members/list, invites create/get-by-token/accept), docs/data.md (таблица campaign_invites, inviteRepo, расширения campaignRepo и memberRepo, refGenerator.generateInviteToken), docs/architecture.md (роутинг invite и campaign, главная для авторизованных).

**Итог:** Код в порядке; правки внесены (inviteRepo), документация приведена в соответствие с реализацией этапа 1. После исправлений повторный @check не обязателен.
