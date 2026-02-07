# NeSo CRM Design System (2026)

## 1. Концепция

Дизайн-система построена вокруг двух равноправных тем:

- Light: "солнечный день" — воздух, свет, мягкие поверхности, высокая читаемость.
- Dark: "ночной лес" — глубина, спокойствие, мягкий контраст, комфорт на долгих сессиях.

Сохранены исходные бренд-цвета и эмоциональный вектор, при этом все UI-паттерны переработаны заново.

## 2. Токены

Источник токенов: `web/design/theme.ts`.

Ключевые группы:

- Фоны: `--bg-primary`, `--bg-secondary`, `--bg-elevated`.
- Поверхности: `--surface-glass`, `--surface-glass-card`, `--surface-soft`, `--surface-strong`.
- Текст: `--text-primary`, `--text-secondary`, `--text-tertiary`.
- Акценты: `--accent-primary`, `--accent-light`, `--accent-dark`, `--accent-soft`, `--accent-glow`.
- Семантические статусы: `--success`, `--warning`, `--danger`, `--info`.
- Ритм/форма: `--radius-lg/md/sm/xs`, `--shadow-soft`, `--shadow-focus`.
- Типографика: `--font-sans` (Manrope), `--font-display` (Fraunces).

## 3. Архитектура стилей

- Базовый UI-слой: `web/design/ui-core.ts`.
- Theme-обёртки: `web/design/ui-dark.ts`, `web/design/ui-light.ts`.
- Shell-компонент для всех страниц: `web/design/components/AppShell.vue`.

В `ui-core.ts` собраны reusable-паттерны:

- Shell layout (sidebar/header/content).
- Навигация, кнопки, формы, табы, теги, карточки.
- Data display: списки, таблицы, логи, статусы.
- UX состояния: hover/focus/disabled/loading/empty/error.
- Адаптив (desktop-first с mobile fallback).

## 4. Витрина компонентов

Основная demo-витрина: `web/design/components/DesignSystemShowcase.vue`.

Покрытые сценарии:

- Навигация и shell.
- Фильтрация и поиск.
- Кнопки и их состояния.
- Формы.
- Списки.
- Таблицы.
- Уведомления/alerts/toasts.
- Модальные окна.
- Empty / loading / disabled / error.

`DesignDemoPage.vue` и `DesignDemoLightPage.vue` теперь используют единый showcase-компонент.

## 5. Прикладные страницы

Страницы `Admin`, `Inquiries`, `Tests` приведены к новой визуальной системе через обновлённые scoped-стили и общие токены. Все ключевые рабочие сценарии остаются совместимыми с существующей разметкой и логикой.
