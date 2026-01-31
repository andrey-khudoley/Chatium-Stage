# LLM 0002 — диалог: структура проекта, роуты, дубликаты, исправления

История переписки с агентом по приведению структуры p/renew_project в соответствие с документацией Chatium, удалению дубликатов и исправлению ошибок.

---

## 1. Восстановление структуры каталогов по документации Chatium

**Запрос:** Структура проекта @p/renew_project отличается от документации @Chatium. Восстановить правильную структуру каталогов и путей.

**Сделано:**
- По документации и ADR: `components/` — переиспользуемые Vue-компоненты, `shared/` — общий код (утилиты).
- Vue-компоненты (Header, AppFooter, GlobalGlitch, LogoutModal) перенесены из `shared/` в `components/`.
- В `shared/` оставлен только `preloader.ts`.
- В `pages/HomePage.vue` импорты заменены с `../shared/...` на `../components/...`.
- Обновлены `docs/architecture.md`, `docs/imports.md`.

---

## 2. Перенос админки в /web/

**Запрос:** Почему не перенёс админку в /web/?

**Сделано:**
- Создан `web/admin.tsx` (импорты: `../pages/AdminPage.vue`, `../login`, `../styles`).
- Удалён корневой `admin.tsx`.
- Документация обновлена: админка в `web/admin.tsx`.

---

## 3. Обновление маршрутов для админки

**Запрос:** Админка теперь в каталоге /web/admin — почему ничего не поменялось в роутах?

**Сделано:**
- В `config/routes.tsx`: `ROUTES.admin` → `'./web/admin'`, `ROUTE_PATHS.admin` → `'/web/admin'`.
- Ссылки на админку ведут на `/p/renew_project/web/admin`.

---

## 4. Перенос profile и login в /web/

**Запрос:** Перенеси в каталог /web/ также profile и login.

**Сделано:**
- Созданы `web/login.tsx`, `web/profile.tsx` с корректными импортами.
- В `web/admin.tsx` импорт логина заменён с `../login` на `./login`.
- В `config/routes.tsx`: `profile` → `'./web/profile'`, `login` → `'./web/login'` (и соответствующие ROUTE_PATHS).
- Удалены корневые `login.tsx`, `profile.tsx`.
- Обновлены `docs/architecture.md`, `docs/imports.md`.

---

## 5. Вопрос по размещению компонентов админки

**Запрос:** По документации 006-arch — стоит ли размещать компоненты, специфичные для админки, в /web/admin (страница в /web/admin/index.tsx), или в components/?

**Ответ:** По 006-arch в `components/` — только переиспользуемые компоненты. Компоненты, используемые только в админке, логично размещать в `web/admin/` (colocation). Документ явно не предписывает папки под компоненты модуля, но такая организация не противоречит ему.

---

## 6. Каталоги в /web/, файлы в index.tsx

**Запрос:** Следовать документации: создать в /web/ каталоги, файлы положить внутрь и переименовать в index. Проверить ссылки и импорты.

**Сделано:**
- Созданы `web/admin/index.tsx`, `web/profile/index.tsx`, `web/login/index.tsx` (содержимое перенесено из `web/admin.tsx`, `web/profile.tsx`, `web/login.tsx`).
- Импорты обновлены: `../../pages/...`, `../login`, `../../styles`, `../../config/routes`.
- Удалены старые `web/admin.tsx`, `web/profile.tsx`, `web/login.tsx`.
- Маршруты в config без изменений (URL остаются ./web/admin, ./web/profile, ./web/login).
- Обновлены `docs/architecture.md`, `docs/imports.md`.

---

## 7. Запуск проверок (@check)

**Запрос:** Список файлов (в т.ч. старые пути). Действуй.

**Сделано:**
- Выполнены проверки по плану оркестратора: standards-checker, file-based-routing-checker, runtime-architecture-checker, imports-docs.
- В `docs/imports.md` добавлена запись для `./config/routes.tsx`.
- Проверки пройдены: стандарты, роутинг, рантайм, импорты и циклы в порядке.

---

## 8. Ошибка Vue 3: emit chatiumClick vs @chatium-click

**Запрос:** Подтвердить наличие ошибки и объяснить: AppFooter.vue эмитит `chatiumClick` (camelCase), HomePage.vue слушает `@chatium-click` (kebab-case). Vue 3 не нормализует имена событий — обработчик не вызывается.

**Подтверждено и исправлено:**
- В Vue 3 имена кастомных событий чувствительны к регистру; `chatiumClick` и `chatium-click` — разные имена.
- В `components/AppFooter.vue` и `shared/AppFooter.vue`: `$emit('chatiumClick')` заменён на `$emit('chatium-click')`, `defineEmits` — на `'chatium-click'`. В HomePage.vue остаётся `@chatium-click`.

---

## 9. Дубликаты components/ и shared/

**Запрос:** Как получилось, что components и shared дублируют друг друга?

**Ответ:** При приведении структуры к 006-arch компоненты были перенесены в `components/` и удалены из `shared/`. Появление снова тех же .vue в `shared/` — из-за отката коммита, копирования или несохранённых удалений. Используется только `components/`; файлы в `shared/` были мёртвыми дубликатами.

**Запрос:** Удали лишнее. Запроси tree. Проверь другие аномалии.

**Сделано:**
- Удалены из `shared/`: AppFooter.vue, Header.vue, GlobalGlitch.vue, LogoutModal.vue. Оставлены `preloader.ts` и `.gitkeep`.
- Выведено дерево p/renew_project.
- Отмечены аномалии: устаревший путь в `.dir.json` (`inner/samples/renew_project/`), в `docs/LLM/0001-initial.md` — старые имена файлов роутов.

---

## 10. Исправление обеих аномалий

**Запрос:** Исправь обе проблемы.

**Сделано:**
- `.dir.json`: `"name": "[INWORK] inner/samples/renew_project/"` заменён на `"name": "[INWORK] p/renew_project"`.
- `docs/LLM/0001-initial.md`: в начало добавлено примечание об актуальной структуре роутов (web/admin/index.tsx, web/profile/index.tsx, web/login/index.tsx; в корне только index.tsx).

---

## 11. Ошибка tsconfig: shared/GlobalGlitch.vue not found

**Запрос:** Объяснить ошибку и предложить решение.

**Объяснение:** Файл `shared/GlobalGlitch.vue` был удалён, но языковой сервер TypeScript/Volar держит устаревший список файлов (по include `**/*.vue`). Компилятор по-прежнему считает этот путь частью программы и выдаёт «file not found».

**Решение:**
1. Перезапустить TypeScript/Vue сервер (Command Palette → «TypeScript: Restart TS Server» / «Vue: Restart Vue server»), чтобы сбросить кэш.
2. По желанию добавить в tsconfig.json: `"exclude": ["shared/**/*.vue"]`, чтобы .vue в shared/ не попадали в программу.

---

**Итог сессии:** структура p/renew_project приведена к 006-arch (корень — только index.tsx; web/admin, web/profile, web/login в каталогах с index.tsx; компоненты в components/, общий код в shared/); дубликаты из shared/ удалены; исправлены именование события chatium-click, метаданные .dir.json и примечание в 0001-initial.md; дано объяснение и решение для ошибки tsconfig по удалённому shared/GlobalGlitch.vue.
