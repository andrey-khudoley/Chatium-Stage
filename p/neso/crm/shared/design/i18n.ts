// @shared
import { computed, readonly, ref } from 'vue'
import { getStoredLocale, saveLocale } from './system'

export type UiLocale = 'ru' | 'en'

export type I18nParams = Record<string, string | number | boolean | null | undefined>

type Dictionary = Record<string, string>

const DICT: Record<UiLocale, Dictionary> = {
  ru: {
    'locale.ru': 'Русский',
    'locale.en': 'English',
    'header.project': 'Проект',
    'header.language': 'Язык',
    'header.theme': 'Тема',
    'header.profile': 'Профиль',
    'header.tests': 'Тесты',
    'header.admin': 'Админ',
    'header.home': 'Главная',
    'header.logout': 'Выход',
    'header.chatium': 'Открыть Chatium',
    'header.preloader': 'Прелоадер',
    'header.preloaderOn': 'Вкл',
    'header.preloaderOff': 'Выкл',
    'header.themeSettings': 'Настройка темы',
    'header.searchHint': 'Command palette: Ctrl + K',

    'home.heroTitle': 'CRM UI Architecture 2026',
    'home.heroDescription': 'Единая дизайн-архитектура с темами, i18n и переиспользуемыми CRM-паттернами.',
    'home.heroCtaPrimary': 'Открыть админ-панель',
    'home.heroCtaSecondary': 'Открыть тесты',
    'home.metrics.modules': 'Модулей в каталоге',
    'home.metrics.themes': 'Преднастроенных тем',
    'home.metrics.fonts': 'Доступных шрифтов',
    'home.metrics.states': 'UI-состояний на модуль',
    'home.blocks.templates': 'Каталог шаблонов',
    'home.blocks.templatesDesc': 'Все CRM-модули имеют набор экранов, состояний и UX-композиции.',
    'home.blocks.designSystem': 'Дизайн-система',
    'home.blocks.designSystemDesc': 'Токены, компоненты, темы, плотность и типографика на уровне shared UI.',
    'home.blocks.customization': 'Кастомизация',
    'home.blocks.customizationDesc': 'Настройка цветов, шрифтов, радиусов, теней и плотности без изменений backend.',
    'home.previewOpsTitle': 'Операционная видимость',
    'home.previewOpsDesc': 'Сводка активностей, KPI и состояния модулей в едином интерфейсе.',
    'home.previewTableTitle': 'Универсальная таблица',
    'home.previewTableDesc': 'Колонки, сохранённые представления, compact/comfortable и card mode.',
    'home.previewEditorTitle': 'Редактор заметок',
    'home.previewEditorDesc': 'Markdown + WYSIWYG в едином компоненте.',
    'home.ctaLogin': 'Войти',
    'home.chartSubtitle': 'Пульс основных воронок за неделю',

    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.retry': 'Повторить',
    'common.empty': 'Нет данных',
    'common.save': 'Сохранить',
    'common.saved': 'Сохранено',
    'common.failed': 'Ошибка',
    'common.cancel': 'Отмена',
    'common.close': 'Закрыть',
    'common.clear': 'Очистить',
    'common.view': 'Представление',
    'common.compact': 'Compact',
    'common.comfortable': 'Comfortable',
    'common.show': 'Показать',
    'common.hide': 'Скрыть',
    'common.status': 'Статус',
    'common.actions': 'Действия',
    'common.filters': 'Фильтры',
    'common.legend': 'Легенда',
    'common.values': 'Значения',
    'common.chartMode': 'Режим графика',
    'common.tableMode': 'Режим таблицы',
    'common.lastUpdated': 'Обновлено',
    'common.notAvailable': 'Недоступно',

    'admin.title': 'Панель администратора',
    'admin.subtitle': 'Управление проектом, логированием и настройками UI-слоя',
    'admin.dashboard': 'Дашборд',
    'admin.dashboardReset': 'Сбросить',
    'admin.errors': 'Ошибок',
    'admin.warnings': 'Предупреждений',
    'admin.settingsProject': 'Настройки проекта',
    'admin.projectName': 'Название проекта',
    'admin.logLevel': 'Уровень логирования',
    'admin.logLevelDebug': 'Debug',
    'admin.logLevelInfo': 'Info',
    'admin.logLevelWarn': 'Warn',
    'admin.logLevelError': 'Error',
    'admin.logLevelDisable': 'Disable',
    'admin.logs': 'Логи',
    'admin.logsLoadMore': 'Загрузить ещё 50',
    'admin.logsLoading': 'Загрузка логов...',
    'admin.logsEmpty': 'Логи появятся здесь...',
    'admin.logsFilterInfo': 'Info',
    'admin.logsFilterWarn': 'Warn',
    'admin.logsFilterError': 'Error',
    'admin.customization': 'Theme & Styling Settings',
    'admin.customizationDesc': 'Ручная кастомизация UI без изменения бизнес-логики.',
    'admin.themePreset': 'Тема',
    'admin.density': 'Плотность',
    'admin.radius': 'Радиусы',
    'admin.shadow': 'Тени',
    'admin.scale': 'Размер элементов',
    'admin.tableDensity': 'Плотность таблиц',
    'admin.chartVisualMode': 'Визуальный режим графиков',
    'admin.chartVisualSoft': 'Soft',
    'admin.chartVisualContrast': 'Contrast',
    'admin.colorBg': 'Фон',
    'admin.colorSurface': 'Поверхность',
    'admin.colorText': 'Текст',
    'admin.colorAccent': 'Акцент',
    'admin.colorSuccess': 'Success',
    'admin.colorWarning': 'Warning',
    'admin.colorDanger': 'Danger',
    'admin.fontHeading': 'Шрифт заголовков',
    'admin.fontBody': 'Шрифт текста',
    'admin.fontTables': 'Шрифт таблиц',
    'admin.fontForms': 'Шрифт форм',
    'admin.fontNavigation': 'Шрифт навигации',

    'tests.title': 'Тесты и валидация',
    'tests.subtitle': 'Проверка endpoint, lib, repo и UI-интеграции',
    'tests.runAll': 'Запустить все тесты',
    'tests.runAllLoading': 'Запуск...',
    'tests.metrics': 'Метрики тестов',
    'tests.total': 'Всего',
    'tests.passed': 'Пройдено',
    'tests.failed': 'Провалено',
    'tests.skipped': 'Пропущено',
    'tests.lastRun': 'Последний запуск: {{value}}',
    'tests.endpoints': 'Проверка эндпоинтов',
    'tests.settingsLib': 'Библиотека настроек',
    'tests.settingsRepo': 'Репозиторий настроек',
    'tests.loggerLib': 'Библиотека логов',
    'tests.logsRepo': 'Репозиторий логов',
    'tests.dashboardLib': 'Библиотека админки',
    'tests.endpointsDesc': 'Проверка доступности маршрутов приложения (HTTP 200).',
    'tests.settingsLibDesc': 'Тесты библиотеки настроек (settings.lib).',
    'tests.settingsRepoDesc': 'Тесты репозитория настроек (settings.repo).',
    'tests.loggerLibDesc': 'Тесты библиотеки логов (logger.lib).',
    'tests.logsRepoDesc': 'Тесты репозитория логов (logs.repo).',
    'tests.dashboardLibDesc': 'Тесты библиотеки админки (dashboard.lib).',
    'tests.runGroup': 'Запустить группу',
    'tests.runGroupLoading': 'Проверяем...',
    'tests.statusTodo': '[TODO]',
    'tests.statusSuccess': '[OK]',
    'tests.statusFail': '[FAIL]',
    'tests.logs': 'Логи',
    'tests.logsEmpty': 'Логи появятся здесь...',
    'tests.logsLoadMore': 'Загрузить ещё 50',
    'tests.logsLoading': 'Загрузка логов...',

    'editor.title': 'Rich Text Notes',
    'editor.modeMarkdown': 'Markdown',
    'editor.modeVisual': 'WYSIWYG',
    'editor.placeholder': 'Начните вводить заметку...',

    'table.title': 'CRM Table',
    'table.savedView': 'Сохранённое представление',
    'table.columns': 'Колонки',
    'table.cardMode': 'Карточный режим',

    'chart.title': 'KPI Dynamics',
    'chart.modeBars': 'Bars',
    'chart.modeLine': 'Line',
    'status.active': 'Активен',
    'status.pending': 'В ожидании',
    'status.blocked': 'Заблокирован',
    'status.done': 'Готово',
    'module.dashboard': 'Dashboard',
    'module.leadsDeals': 'Leads / Deals',
    'module.knowledgeBase': 'Knowledge Base',
    'module.testsPage': 'Tests page',
    'team.ops': 'Ops team',
    'team.sales': 'Sales team',
    'team.enablement': 'Enablement',
    'team.qa': 'QA',

    'footer.company': 'ИП Худолей Андрей Германович',
    'footer.rights': 'Все права сохранены © 2018-{{year}}',
    'footer.madeWith': 'Сделано с ❤ на Chatium'
  },
  en: {
    'locale.ru': 'Русский',
    'locale.en': 'English',
    'header.project': 'Project',
    'header.language': 'Language',
    'header.theme': 'Theme',
    'header.profile': 'Profile',
    'header.tests': 'Tests',
    'header.admin': 'Admin',
    'header.home': 'Home',
    'header.logout': 'Logout',
    'header.chatium': 'Open Chatium',
    'header.preloader': 'Preloader',
    'header.preloaderOn': 'On',
    'header.preloaderOff': 'Off',
    'header.themeSettings': 'Theme settings',
    'header.searchHint': 'Command palette: Ctrl + K',

    'home.heroTitle': 'CRM UI Architecture 2026',
    'home.heroDescription': 'Unified design architecture with themes, i18n, and reusable CRM patterns.',
    'home.heroCtaPrimary': 'Open admin panel',
    'home.heroCtaSecondary': 'Open tests page',
    'home.metrics.modules': 'Catalog modules',
    'home.metrics.themes': 'Preset themes',
    'home.metrics.fonts': 'Available fonts',
    'home.metrics.states': 'UI states per module',
    'home.blocks.templates': 'Template catalog',
    'home.blocks.templatesDesc': 'Every CRM module includes screens, states, and UX compositions.',
    'home.blocks.designSystem': 'Design system',
    'home.blocks.designSystemDesc': 'Tokens, components, themes, density, and typography at shared UI level.',
    'home.blocks.customization': 'Customization',
    'home.blocks.customizationDesc': 'Adjust colors, fonts, radius, shadows, and density without backend changes.',
    'home.previewOpsTitle': 'Operational visibility',
    'home.previewOpsDesc': 'Unified visibility for activities, KPIs, and module health.',
    'home.previewTableTitle': 'Universal table',
    'home.previewTableDesc': 'Columns, saved views, compact/comfortable density, and card mode.',
    'home.previewEditorTitle': 'Notes editor',
    'home.previewEditorDesc': 'Markdown + WYSIWYG in one component.',
    'home.ctaLogin': 'Sign in',
    'home.chartSubtitle': 'Core funnel pulse for the week',

    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.retry': 'Retry',
    'common.empty': 'No data',
    'common.save': 'Save',
    'common.saved': 'Saved',
    'common.failed': 'Failed',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.clear': 'Clear',
    'common.view': 'View',
    'common.compact': 'Compact',
    'common.comfortable': 'Comfortable',
    'common.show': 'Show',
    'common.hide': 'Hide',
    'common.status': 'Status',
    'common.actions': 'Actions',
    'common.filters': 'Filters',
    'common.legend': 'Legend',
    'common.values': 'Values',
    'common.chartMode': 'Chart mode',
    'common.tableMode': 'Table mode',
    'common.lastUpdated': 'Last updated',
    'common.notAvailable': 'Not available',

    'admin.title': 'Administration panel',
    'admin.subtitle': 'Manage project, logging, and UI-layer settings',
    'admin.dashboard': 'Dashboard',
    'admin.dashboardReset': 'Reset',
    'admin.errors': 'Errors',
    'admin.warnings': 'Warnings',
    'admin.settingsProject': 'Project settings',
    'admin.projectName': 'Project name',
    'admin.logLevel': 'Logging level',
    'admin.logLevelDebug': 'Debug',
    'admin.logLevelInfo': 'Info',
    'admin.logLevelWarn': 'Warn',
    'admin.logLevelError': 'Error',
    'admin.logLevelDisable': 'Disable',
    'admin.logs': 'Logs',
    'admin.logsLoadMore': 'Load 50 more',
    'admin.logsLoading': 'Loading logs...',
    'admin.logsEmpty': 'Logs will appear here...',
    'admin.logsFilterInfo': 'Info',
    'admin.logsFilterWarn': 'Warn',
    'admin.logsFilterError': 'Error',
    'admin.customization': 'Theme & Styling Settings',
    'admin.customizationDesc': 'Manual UI customization without changing business logic.',
    'admin.themePreset': 'Theme preset',
    'admin.density': 'Density',
    'admin.radius': 'Radius',
    'admin.shadow': 'Shadows',
    'admin.scale': 'Element size',
    'admin.tableDensity': 'Table density',
    'admin.chartVisualMode': 'Chart visual mode',
    'admin.chartVisualSoft': 'Soft',
    'admin.chartVisualContrast': 'Contrast',
    'admin.colorBg': 'Background',
    'admin.colorSurface': 'Surface',
    'admin.colorText': 'Text',
    'admin.colorAccent': 'Accent',
    'admin.colorSuccess': 'Success',
    'admin.colorWarning': 'Warning',
    'admin.colorDanger': 'Danger',
    'admin.fontHeading': 'Heading font',
    'admin.fontBody': 'Body font',
    'admin.fontTables': 'Table font',
    'admin.fontForms': 'Form font',
    'admin.fontNavigation': 'Navigation font',

    'tests.title': 'Tests & validation',
    'tests.subtitle': 'Endpoint, lib, repo, and UI integration checks',
    'tests.runAll': 'Run all tests',
    'tests.runAllLoading': 'Running...',
    'tests.metrics': 'Test metrics',
    'tests.total': 'Total',
    'tests.passed': 'Passed',
    'tests.failed': 'Failed',
    'tests.skipped': 'Skipped',
    'tests.lastRun': 'Last run: {{value}}',
    'tests.endpoints': 'Endpoints check',
    'tests.settingsLib': 'Settings library',
    'tests.settingsRepo': 'Settings repository',
    'tests.loggerLib': 'Logger library',
    'tests.logsRepo': 'Logs repository',
    'tests.dashboardLib': 'Dashboard library',
    'tests.endpointsDesc': 'Validates application routes availability (HTTP 200).',
    'tests.settingsLibDesc': 'settings.lib checks.',
    'tests.settingsRepoDesc': 'settings.repo checks.',
    'tests.loggerLibDesc': 'logger.lib checks.',
    'tests.logsRepoDesc': 'logs.repo checks.',
    'tests.dashboardLibDesc': 'dashboard.lib checks.',
    'tests.runGroup': 'Run group',
    'tests.runGroupLoading': 'Running...',
    'tests.statusTodo': '[TODO]',
    'tests.statusSuccess': '[OK]',
    'tests.statusFail': '[FAIL]',
    'tests.logs': 'Logs',
    'tests.logsEmpty': 'Logs will appear here...',
    'tests.logsLoadMore': 'Load 50 more',
    'tests.logsLoading': 'Loading logs...',

    'editor.title': 'Rich Text Notes',
    'editor.modeMarkdown': 'Markdown',
    'editor.modeVisual': 'WYSIWYG',
    'editor.placeholder': 'Start writing your note...',

    'table.title': 'CRM Table',
    'table.savedView': 'Saved view',
    'table.columns': 'Columns',
    'table.cardMode': 'Card mode',

    'chart.title': 'KPI Dynamics',
    'chart.modeBars': 'Bars',
    'chart.modeLine': 'Line',
    'status.active': 'Active',
    'status.pending': 'Pending',
    'status.blocked': 'Blocked',
    'status.done': 'Done',
    'module.dashboard': 'Dashboard',
    'module.leadsDeals': 'Leads / Deals',
    'module.knowledgeBase': 'Knowledge Base',
    'module.testsPage': 'Tests page',
    'team.ops': 'Ops team',
    'team.sales': 'Sales team',
    'team.enablement': 'Enablement',
    'team.qa': 'QA',

    'footer.company': 'Sole proprietor Andrey Khudoley',
    'footer.rights': 'All rights reserved © 2018-{{year}}',
    'footer.madeWith': 'Built with ❤ on Chatium'
  }
}

const sharedLocale = ref<UiLocale>('ru')
let initialized = false

function normalizeLocale(input?: string | null): UiLocale {
  if (input === 'en') return 'en'
  return 'ru'
}

function inferLocale(initialLocale?: string): UiLocale {
  const fromCookie = getStoredLocale(normalizeLocale(initialLocale))
  if (fromCookie === 'ru' || fromCookie === 'en') return fromCookie

  if (typeof navigator !== 'undefined') {
    const browserLocale = (navigator.language || '').toLowerCase()
    if (browserLocale.startsWith('en')) return 'en'
  }

  return normalizeLocale(initialLocale)
}

function formatTemplate(template: string, params?: I18nParams): string {
  if (!params) return template
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = params[key]
    return value === undefined || value === null ? '' : String(value)
  })
}

export function tForLocale(locale: UiLocale, key: string, params?: I18nParams): string {
  const bucket = DICT[locale]
  const fallback = DICT.ru
  const template = bucket[key] || fallback[key] || key
  return formatTemplate(template, params)
}

export function initializeUiI18n(initialLocale?: string): void {
  if (initialized) return
  sharedLocale.value = inferLocale(initialLocale)
  saveLocale(sharedLocale.value)
  initialized = true
}

export function useUiI18n(initialLocale?: string) {
  if (!initialized) {
    initializeUiI18n(initialLocale)
  }

  const localeOptions = computed(() => [
    { value: 'ru' as UiLocale, label: tForLocale(sharedLocale.value, 'locale.ru') },
    { value: 'en' as UiLocale, label: tForLocale(sharedLocale.value, 'locale.en') }
  ])

  function setLocale(locale: UiLocale): void {
    sharedLocale.value = locale
    saveLocale(locale)
  }

  function toggleLocale(): void {
    setLocale(sharedLocale.value === 'ru' ? 'en' : 'ru')
  }

  function t(key: string, params?: I18nParams): string {
    return tForLocale(sharedLocale.value, key, params)
  }

  return {
    locale: readonly(sharedLocale),
    localeOptions,
    t,
    setLocale,
    toggleLocale
  }
}

export function getI18nDictionary(): Record<UiLocale, Dictionary> {
  return DICT
}
