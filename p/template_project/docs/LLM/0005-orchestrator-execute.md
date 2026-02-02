# LLM 0005 — настройки в Heap, реструктуризация API, проверки оркестратора

Полная история: настройки проекта, Heap-таблица, разделение слоёв, file-based API, выполнение проверок.

**Формальное описание решений:** см. [ADR-0002](../ADR/0002-settings-heap-and-layered-api.md).

---

### Пользователь

Как сейчас реализованы настройки проекта @p/template_project?

### Ассистент

Настройки реализованы статически в коде: config/project.tsx (тексты, названия страниц), config/routes.tsx (пути, маршруты). Отдельно .workspace.json с флагами воркспейса. Без config.json и readWorkspaceFile — всё задаётся константами.

---

### Пользователь

Некоторые настройки, которые будут часто меняться, необходимо вынести в heap-таблицу. Создай таблицу настроек в формате ключ (string) — значение (any). По умолчанию: Название проекта — A/Ley Services, Title проекта — A/Ley, Уровень логирования — Info, Количество логов для хранения — 100. Расскажи, какую архитектуру ты выберешь.

### Ассистент

Предложена архитектура: таблица key-value с Heap.Any для value; репозиторий (findByKey, findAll, upsert); lib с дефолтами и валидацией; API с проверкой прав. Поток: HTTP → API → lib → repos → Heap.

---

### Пользователь

Нужно разделять репозиторий — тот кусок кода, который взаимодействует с БД, lib — бизнес-логика, и api — эндпоинты и первичная валидация. Расположение репо в каталоге /repos/. Реализуй это.

### Ассистент

Реализовано: tables/settings.table.ts, repos/settings.repo.ts, lib/settings.lib.ts, api/settings.ts (впоследствии разбит на три файла). Документация обновлена.

---

### Пользователь

@p/template_project/tables/settings.table.ts:3 измени ключ таблицы на t__template-project__setting__(глобально уникальный хэш).

### Ассистент

Ключ таблицы изменён на t__template-project__setting__7Fk2Qw.

---

### Пользователь

@p/template_project/repos/settings.repo.ts:1-24 проверь, что это полностью соответствует документации heap @Chatium.

### Ассистент

Проверено: findOneBy, findAll, createOrUpdateBy, delete вызываются корректно. Сигнатуры и паттерны соответствуют Heap API и примерам в других проектах.

---

### Пользователь

Зафиксируй в документации по архитектуре принцип разделения: Таблиц, Репозиториев, (lib) бизнес-логики, (api) слоя для получения и валидации данных.

### Ассистент

Добавлена секция «Разделение слоёв» в docs/architecture.md с таблицей ответственности и потоком данных.

---

### Пользователь

@inner/docs тут тоже зафиксируй.

### Ассистент

Обновлён inner/docs/006-arch.md: добавлен раздел «Разделение слоёв при работе с данными», структура с repos/, уточнены описания /api/, /tables/, /repos/, /lib/, обновлены примеры.

---

### Пользователь

Давай изменим всё таким образом, чтобы сохранить file-based структуру. @p/template_project/api/settings.ts поместим в каталог settings и разобьём на три эндпоинта, чтобы в каждом было по одному эндпоинту с "/". Отразим это в документации проекта и в @inner/docs.

### Ассистент

Создана структура api/settings/: list.ts, get.ts, save.ts. Каждый файл — один эндпоинт с путём '/'. Удалён api/settings.ts. Обновлены docs/api.md, docs/imports.md, docs/architecture.md, inner/docs/006-arch.md.

---

### Пользователь

@check

### Ассистент

Выдан пошаговый план оркестратора: вызвать по очереди standards-checker, file-based-routing-checker, runtime-architecture-checker, imports-docs и llm-conversation-logger. Список затронутых файлов: api/settings/list.ts, get.ts, save.ts, lib/settings.lib.ts, repos/settings.repo.ts, tables/settings.table.ts, docs.

---

### Пользователь

Выполняй.

### Ассистент

**Выполнено:**

1. **standards-checker** — проверены файлы по 001-standards.md. Исправлено: в api/settings/save.ts сообщение об ошибке «Поля key и value обязательны» заменено на «Поле key обязательно» (валидируется только key). Остальной код соответствует стандартам.

2. **file-based-routing-checker** — замечаний нет. Все эндпоинты в api/settings/ используют путь '/', один эндпоинт на файл, URL формируется из структуры папок без тильды.

3. **runtime-architecture-checker** — критических рисков не выявлено. Проверки: requireAccountRole до логики, try/catch в API, валидация key в get/save, обработка null в lib.

4. **imports-docs** — docs/imports.md актуален (api/settings/list, get, save описаны). Циклических зависимостей нет: tables ← repos ← lib ← api.

5. **llm-conversation-logger** — сессия залогирована.

**Итог:** код в порядке, одно исправление внесено (сообщение об ошибке в save.ts).

---

### Пользователь

@check

### Ассистент

**Выполнено (оркестратор, чистое git-дерево):**

1. **standards-checker** — изменённых файлов нет, проверка по diff не требуется.
2. **file-based-routing-checker** — замечаний нет.
3. **runtime-architecture-checker** — критических рисков не выявлено.
4. **imports-docs** — docs/imports.md актуален (api/settings/, lib, repos, tables). Циклических зависимостей нет.
5. **docs-keeper** — обновлён README.md: раздел «Текущее состояние» приведён в соответствие с кодом (API настроек, таблица, репозиторий, lib); Changelog дополнен.
6. **llm-conversation-logger** — сессия залогирована.

**Итог:** документация синхронизирована с текущим состоянием кода.
