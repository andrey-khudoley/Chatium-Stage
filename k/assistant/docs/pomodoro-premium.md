# Pomodoro — премиальный таймер продуктивности

## Обзор

Премиальная реализация техники Pomodoro с выверенным UX, продвинутой визуализацией и интеграцией с системой управления задачами.

## Ключевые возможности

### 1. Динамическая атмосфера
- **Цветовые схемы фаз**: автоматическая смена темы приложения в зависимости от текущей фазы
  - `work` (Работа) — насыщенный красный градиент (#d3234b → #ff4567)
  - `rest` (Отдых) — спокойный изумрудный (#2f8f8f → #3db8b8)
  - `long_rest` (Длинный отдых) — глубокий фиолетовый (#8566ff → #a78bff)
- **Плавные переходы**: все смены цвета через CSS `transition: 0.6s ease`
- **CSS-переменные**: `--pomodoro-phase-color` для унификации акцентов

### 2. Продвинутый таймер (PomodoroTimerDial)
- **SVG-дуга с градиентами**: использование `<linearGradient>` для каждой фазы
- **Свечение**: filter `glow` (feGaussianBlur) для создания эффекта свечения
- **Pulse-анимация**: мягкое «дыхание» дуги во время активного отсчёта (только при `status=running`)
- **Моноширинный таймер**: `Share Tech Mono`, `font-variant-numeric: tabular-nums` для исключения скачков

### 3. Микро-взаимодействия
- **Vue transitions**: плавная смена таймера при переключении фаз (`<transition name="fade">`)
- **Звуковые уведомления**: пять пресетов от «Шёпот» до «Настойчивый» (`phaseChangeSound` 1–5, Web Audio API, `lib/pomodoro-phase-sounds.ts`); ритм **три цикла по два звонка** (шесть ударов, в каждом цикле два тона подряд); выбор в `PomodoroSettingsModal`, хранение в Heap, кнопка «Прослушать» для проверки
- **Браузерные уведомления**: Web Notifications API с запросом разрешения при первом посещении
- **Вибрация**: Vibration API для мобильных устройств (паттерн `[200, 100, 200]` мс)
- **Умный заголовок**: обновление `document.title` в фоновых вкладках:
  - Формат: `(24:59) ⚡ Работа` (running), `(Пауза) Работа` (paused)
  - Возврат к оригинальному заголовку при `stopped`

### 4. Интеграция с задачами
- **Селектор задачи**: `PomodoroTaskSelector` — dropdown с задачами статуса `in_progress`
- **API**: `api/tasks/in-progress` — получение списка активных задач
- **Привязка задачи**: `api/pomodoro/assign-task` — связывание Pomodoro с конкретной задачей
- **Отображение**: название выбранной задачи под таймером
- **Учёт времени**: автоматическое накопление `pomodoroWorkSec`/`pomodoroRestSec` в Heap

### 5. Режим завершения этапов
Настройки в `PomodoroSettingsModal` задают поведение отдельно для завершения:
- работы;
- отдыха;
- длинного отдыха.

Для каждого этапа доступны 3 полнофункциональных режима:
- **Автоматический переход на следующий этап** — сразу запускается следующая фаза.
- **Пауза после завершения этапа** — фаза переключается, но следующий этап ждёт ручного `resume`.
- **Продолжение отсчёта (отрицательный таймер)** — статус `awaiting_continue`, текущая фаза уходит в овертайм до ручного `resume`/`skip`.

### 6. Статистика за день
Визуализация в `.stat-card`:
- **Помидорок** — количество завершённых работовых циклов (`tasksCompletedToday`)
- **Работа** — общее время фокуса (`totalWorkSec`)
- **Отдых** — общее время отдыха (`totalRestSec`)

**Сброс в 05:00**: «Сутки» для этих трёх счётчиков начинаются в **5:00 по локальному времени браузера**. В Heap хранится `statsPeriodDayKey` (строка `YYYY-MM-DD` для текущего периода); при каждом запросе клиент передаёт `statsDayKey` (тот же алгоритм — `lib/pomodoro-stats-day.ts`, `computePomodoroStatsDayKeyLocal`). Если ключ не совпадает с сохранённым, сервер обнуляет только статистику, **не** сбрасывая таймер и **не** меняя `cyclesCompleted`. Без `statsDayKey` в запросе fallback — граница 05:00 по `Europe/Moscow`.

Для вкладок `Таймер` и `Секундомер` счётчики `Сессий / Фокус / Всего` сохраняются на клиенте в `localStorage` (в `components/pomodoro/FocusClockPane.vue`) и восстанавливаются после обновления страницы. Хранение разделено по режимам (`timer`/`stopwatch`) и по такому же дневному ключу с границей в 05:00.
При переключении между вкладками восстановление выполняется принудительно по `mode`, чтобы на `Таймере` и `Секундомере` всегда показывались разные актуальные значения, а не последние данные предыдущей вкладки.

### 8. Полный лог запусков
- **Новая таблица**: `tables/pomodoro-launches.table.ts` (`t__assistant__pomodoro_launch__9Hk2tR`)
- **Что фиксируется**: каждый сегмент фактического запуска таймера (`running`) с `startedAtMs`, `endedAtMs`, `durationSec`, `phase`, `taskId`, `cyclesCompletedAtStart`
- **Источник сегмента** (`source`): `start`, `resume`, `auto_next_phase`, `task_changed`
- **Причина завершения** (`endReason`): `pause`, `stop`, `restart`, `phase_completed`, `task_changed`, `state_recovered`
- **Поведение**:
  - при `start`/`resume` создаётся новый сегмент;
  - при `pause`/`stop` — сегмент закрывается;
  - при автопереходе фазы (`work -> rest`, `rest -> work`) сегмент закрывается и сразу открывается новый;
  - при смене задачи во время `running` сегмент закрывается и открывается новый, чтобы аналитика по задачам была точной;
  - при **«Пропустить»** во время отсчёта в `totalWorkSec`/`totalRestSec` и в секундах задачи учитывается только уже накопленное время (через `tick`), неотработанный остаток фазы не доначисляется; длительность сегмента в `pomodoro-launches` по-прежнему равна фактическому интервалу `startedAtMs`…`endedAtMs`.

Карточки статистики:
- Адаптивная сетка (desktop 3 колонки, mobile 1 колонка)
- Иконки Font Awesome с цветом текущей фазы
- Hover-эффекты: подъём, смена градиента

### 7. Настройки
Модальное окно `PomodoroSettingsModal` (рамка по периметру — `inset box-shadow`, не `border`: иначе при `clip-path` с скошенными углами нижняя граница могла не отображаться):
- **Черновик полей**: подтягивается из `state` только при **открытии** модалки (при опросе API родитель передаёт новый объект настроек при каждом обновлении — синхронизация на каждое изменение `modelValue` сбрасывала бы несохранённые правки).
- **Длительности**: работа (1-180 мин), отдых (1-180 мин), длинный отдых (1-180 мин)
- **Циклы**: количество циклов до длинного отдыха (1-12)
- **Поведение после этапов**: селекты с тремя режимами (авто/пауза/овертайм) для работы, отдыха и длинного отдыха
- **Совместимость данных**: legacy-значение `afterLongRest=stop` читается как пауза в UI, но поддерживается на сервере

## Технические детали

### Архитектура состояния
- **Хранение**: Heap таблица `tables/pomodoro-state.table.ts` (в т.ч. `statsPeriodDayKey` для сброса дневной статистики; после правки файла убедиться, что схема Heap на аккаунте обновлена через `createOrUpdateHeapTableFile` / привычный процесс деплоя)
- **Репозиторий**: `repos/pomodoro.repo.ts` — CRUD операции с нормализацией
- **Бизнес-логика**: `lib/pomodoro.lib.ts` — tick-engine, управление фазами
- **Эксклюзивная блокировка**: все мутации под `runWithExclusiveLock(ctx, lockKey(userId), ...)`

### API endpoints
```
GET  /api/pomodoro/state/get       — получение текущего состояния
POST /api/pomodoro/control          — управление (start/pause/resume/stop)
POST /api/pomodoro/settings/save    — сохранение настроек
POST /api/pomodoro/assign-task      — привязка задачи
GET  /api/tasks/in-progress         — список задач в работе
```

### Синхронизация и устойчивость
- **Polling**: обновление состояния каждые 7 секунд
- **Local tick**: локальный счётчик для плавного отсчёта без рывков
- **Server time priority**: приоритет более свежего `serverNowMs` при конфликтах
- **Action sequence**: защита от повторных действий через `actionSeq` и `actionPending`
- **Visibility events**: обновление при возврате на вкладку (`focus`, `visibilitychange`)

### Интеграция с Header
`Header.vue` на странице `/web/timers` использует интерактивный виджет в `header-clock`:
- При первом клике по часам открывается выбор инструмента: `Помидор`, `Таймер`, `Секундомер`.
- Повторный клик по виджету открывает выбор снова, можно вернуться к `Часы` или переключиться на другой инструмент.
- После выбора показываются кнопки `Запуск / Пауза / Сброс`.
- Для `Помидор` кнопки управляют серверным состоянием через `api/pomodoro/control` (`start|pause|resume|reset`) и используют актуальные настройки Pomodoro из текущего state.
- Для `Таймер` стартовая длительность читается из `localStorage`-настроек `assistant:focus-clock-settings:timer` (минуты/секунды), которые редактируются только в `FocusClockPane` на вкладке таймера.
- Для `Секундомер` в шапке используется локальная логика `start/pause/resume/reset`.

Дополнительно:
- Состояние выбранного режима и локальных таймеров сохраняется после обновления страницы (localStorage `assistant:header-clock-widget:v1`).
- Параллельный запуск не допускается: при старте одного инструмента остальные ставятся на паузу.
- При загрузке страницы виджет автоматически активирует текущий работающий режим (если в фоне уже идёт `pomodoro`, `timer` или `stopwatch`).
- Поведение доступно на всех страницах приложения с `Header`, включая `home/tasks/journal/tools/pomodoro/admin/profile/tests`.
- UI выбора режима в шапке выполнен как выпадающий вертикальный picker под блоком часов (вместо горизонтальной полосы), чтобы на мобильных и узких экранах меню не раздвигало шапку; добавлены иконки, активное состояние, `aria-pressed` и `focus-visible`, закрытие по `Escape` и по клику вне блока.
- Подложка dropdown-панели выбора инструментов непрозрачная (`background: var(--color-bg-secondary)`), чтобы исключить визуальное просвечивание фона/контента.

## UX-решения

### Graceful degradation
- Проверка наличия `Notification` перед использованием
- Проверка `navigator.vibrate` перед вибрацией
- Fallback для Web Audio API

### Accessibility
- `role="img"` и `aria-label` для SVG-таймера
- Моноширинный шрифт для предсказуемого отображения цифр
- Чёткие статусы и метки фаз

### Performance
- Минимальные операции DOM при каждом tick (только обновление reactive state)
- CSS transitions вместо JavaScript анимаций
- Один polling-интервал для всех обновлений

## Визуальный дизайн — CRT-стиль

### CRT-слои SSR (`web/timers/index.tsx`)
- **geometric-bg**: виньетка с `radial-gradient`, CRT-сетка (inline SVG), плавающий красный акцент
- **Сканлайны**: `body::after` с `repeating-linear-gradient` (2px), `scanline-flicker` анимация
- **Бэзел**: `body::before` с `inset box-shadow`, `bezel-fade-in`
- **CRT power-on**: анимация появления `.app-layout` (scale, blur, opacity)
- **Адаптивность**: на мобильных (≤768px) убраны скругления, облегчены тени

### Пиксельные углы
Все элементы UI используют `clip-path: polygon(...)` для характерных CRT-углов:
- **6px** — крупные карточки (TimerDial, Settings Modal)
- **4px** — кнопки управления
- **3px** — мелкие элементы (stats, phase-bar, error, dropdown)
- **2px** — микро-элементы (settings trigger, close button, checkboxes)

### Scanlines overlay
Повторяющийся паттерн на интерактивных элементах:
```css
background: repeating-linear-gradient(0deg,
  rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px,
  transparent 1px, transparent 3px);
animation: dial-scanline-flicker 6s linear infinite;
```
Применяется к: TimerDial, кнопкам управления, stat-cards, task toggle/dropdown, settings modal

### Цветовая палитра
```css
--color-bg: #0a0a0a
--color-bg-secondary: #141414
--color-bg-tertiary: #1a1a1a
--color-text: #e8e8e8
--color-text-secondary: #a0a0a0
--color-border: #2a2a2a
--color-border-light: #3a3a3a
--color-accent: #d3234b
```

### Типографика
- **Основной шрифт**: Share Tech Mono (монопространственный, tech-стиль)
- **Таймер**: tabular-nums для стабильности, RGB chromatic aberration text-shadow
- **Лейблы**: uppercase, letter-spacing: 0.08–0.12em

### Анимации
- **crt-power-on**: появление страницы (0.5s, scale + blur)
- **Pulse**: свечение дуги (2.5s, glow-strong filter, ease-in-out, infinite)
- **Paused blink**: мигание дуги и времени (2s, ease-in-out)
- **Phase dot pulse**: пульсация индикатора фазы (2s)
- **Scanline flicker**: мерцание сканлайнов (6–8s)
- **Fade**: смена фаз (0.4s ease)
- **Button underline**: `::after scaleX(0→1)` на hover (0.3s)
- **Cursor blink**: мигающий `▮` при загрузке (1s, step-end)

### Кнопки управления
Phase bar сверху с cycle dots → TimerDial → TaskSelector → Actions → Stats:
- `.pomo-btn--primary` — залитая фаза, glow shadow
- `.pomo-btn--secondary` — обводка фазовым цветом
- `.pomo-btn--ghost` — только border
- `.pomo-btn--danger` — красноватая обводка для «Сбросить»
- Все кнопки: scanlines `::before`, underline `::after`, pixel corners `clip-path`

## Файловая структура

```
pages/PomodoroPage.vue                    — основная страница
components/pomodoro/
  PomodoroTimerDial.vue                   — SVG-таймер
  PomodoroSettingsModal.vue               — модалка настроек
  PomodoroTaskSelector.vue                — селектор задачи
lib/
  pomodoro.lib.ts                         — бизнес-логика
  pomodoro-types.ts                       — TypeScript типы
repos/pomodoro.repo.ts                    — слой данных
tables/pomodoro-state.table               — Heap таблица
api/pomodoro/
  state/get.ts                            — GET состояния
  control.ts                              — POST управление
  settings/save.ts                        — POST настройки
  assign-task.ts                          — POST привязка задачи
api/tasks/in-progress.ts                  — GET задачи в работе
web/timers/index.tsx                    — SSR точка входа
```

## Дальнейшие улучшения (опционально)

- [ ] Сброс `tasksCompletedToday` по расписанию (в полночь через `app.job`)
- [x] Детальная история помодорок (отдельная таблица с логами)
- [ ] Экспорт статистики (CSV, JSON)
- [ ] Настройки звука (громкость, тип волны)
- [ ] Темы оформления (выбор цветовых схем)
- [ ] Интеграция с календарём (блокировка времени)
- [ ] Мобильное приложение (PWA)
