# 0034 — страница redirect-landing и проверка оркестратором

### Пользователь

Создай страницу для тестов в каталоге /web/tests(чётотам), зарегистрируй роут в ней и используй её для этого теста, чтобы не ловить 404.

---

### Ассистент

Был в режиме Ask, поэтому правки не вносил. Описал план: создать страницу web/tests/redirect-landing, добавить в config/routes функцию шаблона URL посадочной и в тесте redirect-route использовать этот шаблон вместо example.com. Предложил переключиться в Agent для применения изменений.

---

### Пользователь

Делай

---

### Ассистент

**Сделано:**
- Создан файл web/tests/redirect-landing/index.tsx: роут app.html('/', ...), отдаёт HTML 200 с query ref.
- В config/routes.tsx добавлена getRedirectTestLandingUrlTemplate().
- В api/tests/endpoints-check/redirect-route.ts при создании тестовой страницы используется urlTemplate: getRedirectTestLandingUrlTemplate() вместо example.com.

Редирект из теста теперь ведёт на наш домен; при следовании редиректу ответ будет 200, а не 404.

---

### Пользователь

/check

---

### Ассистент

Выполнены проверки оркестратора: обновлены docs/imports.md (секция web/tests/redirect-landing, config/routes — getRedirectTestLandingUrlTemplate, redirect-route — импорт и пояснение), docs/api.md (таблица: GET /web/tests/redirect-landing), docs/architecture.md (роутинг — redirect-landing), README (исправлено «Роут редиректа /r?linkId=», Changelog — запись о redirect-landing). Резюме проверок выдано в чат.
