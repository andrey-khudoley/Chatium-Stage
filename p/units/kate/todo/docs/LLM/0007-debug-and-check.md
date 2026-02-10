# LLM 0007 — уровень Debug и проверка @check

Диалог: добавление уровня логирования Debug в админку, запуск оркестратора проверок.

---

### Пользователь

Обновить компонент (блок кнопок уровня логирования в админке) для поддержки реализованных уровней логирования. Достаточно добавить «Debug» перед «Info» и убедиться, что уже добавленные работают корректно. Если нет — исправить.

### Ассистент

**Сделано:**
- В lib/settings.lib.ts в LOG_LEVELS добавлен уровень Debug перед Info: порядок Debug, Info, Warn, Error, Disable.
- В shared/logger.ts в CONFIG_LEVELS добавлен Debug; в CONFIG_TO_MAX_SEVERITY заданы Debug: 7 (все сообщения включая Debug), Info: 6 (до Informational без Debug).
- В pages/AdminPage.vue добавлены тип уровня debug, кнопка Debug перед Info, инициализация выбранной кнопки из window.__BOOT__.logLevel при загрузке.
- В api/settings/save.ts в маппинг числовых уровней добавлено 4 → Debug, комментарий обновлён.

**Итог:** кнопки уровня в админке: Debug | Info | Warn | Error | Disable; при загрузке страницы активна кнопка, соответствующая сохранённому уровню.

---

### Пользователь

/check

### Ассистент

Выполнены проверки оркестратора: standards-checker, file-based-routing-checker, runtime-architecture-checker, imports-docs, docs-keeper, llm-conversation-logger. Обновлены docs/api.md (log_level: Debug, числа -1–4), README (текущее состояние и Changelog — запись о добавлении Debug). Импорты и циклы проверены, циклических зависимостей нет. Лог диалога записан в docs/LLM/0007-debug-and-check.md.

**Резюме:** код в порядке; критических замечаний нет; документация приведена в соответствие с поддержкой уровня Debug.
