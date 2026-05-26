// @shared
/**
 * Каталог тестов шаблонного минимума (синхронизирован с api/tests/unit, integration, HTTP-чеками).
 * Используется в TestsPage (список до запуска) и api/tests/list.
 */

export type TestCatalogEntry = { id: string; title: string }

export type TestCatalogBlock = {
  id: string
  title: string
  description?: string
  tests: TestCatalogEntry[]
}

export const UNIT_TEST_BLOCKS: TestCatalogBlock[] = [
  {
    id: 'unit-routes',
    title: 'config/routes',
    description: 'getFullUrl, withProjectRoot, ROUTES/ROUTE_PATHS',
    tests: [
      { id: 'routes_getFullUrl_dot_slash', title: 'getFullUrl("./")' },
      { id: 'routes_getFullUrl_slash', title: 'getFullUrl("/")' },
      { id: 'routes_getFullUrl_web_admin_rel', title: 'getFullUrl("./web/admin")' },
      { id: 'routes_getFullUrl_web_admin_abs', title: 'getFullUrl("/web/admin")' },
      { id: 'routes_getFullUrl_web_admin_bare', title: 'getFullUrl("web/admin")' },
      { id: 'routes_getFullUrl_empty', title: 'getFullUrl("")' },
      { id: 'routes_withProjectRoot_rel', title: 'withProjectRoot("./web/admin")' },
      { id: 'routes_withProjectRoot_bare', title: 'withProjectRoot("web/admin")' },
      { id: 'routes_withProjectRoot_dot', title: 'withProjectRoot("./")' },
      { id: 'routes_withProjectRoot_empty', title: 'withProjectRoot("")' },
      { id: 'routes_subroute_omit', title: 'withProjectRootAndSubroute без subroute' },
      { id: 'routes_subroute_slash', title: 'subroute = "/"' },
      { id: 'routes_subroute_edit', title: 'subroute = "edit"' },
      { id: 'routes_subroute_slash_edit', title: 'subroute = "/edit"' },
      { id: 'routes_subroute_nested', title: 'subroute = "users/123"' },
      { id: 'routes_PROJECT_ROOT', title: 'PROJECT_ROOT' },
      { id: 'routes_ROUTES_KEYS_match_PATHS', title: 'ключи ROUTES / ROUTE_PATHS' },
      { id: 'routes_no_domain_in_urls', title: 'ссылки без домена' },
      { id: 'routes_internal_start_with_dot', title: 'внутренние роуты с ./' }
    ]
  },
  {
    id: 'unit-project',
    title: 'config/project',
    description: 'Заголовки и константы страниц',
    tests: [
      { id: 'project_getPageTitle_basic', title: 'getPageTitle обычные строки' },
      { id: 'project_getPageTitle_empty_page', title: 'getPageTitle пустой pageName' },
      { id: 'project_getPageTitle_empty_project', title: 'getPageTitle пустой projectName' },
      { id: 'project_getPageTitle_unicode', title: 'getPageTitle кириллица / спецсимволы' },
      { id: 'project_getHeaderText_basic', title: 'getHeaderText базовый' },
      { id: 'project_getHeaderText_empty', title: 'getHeaderText пустые значения' },
      { id: 'project_getHeaderText_special', title: 'getHeaderText спецсимволы' },
      { id: 'project_constants_non_empty', title: 'константы project не пустые' },
      { id: 'project_page_names_distinct', title: 'имена страниц различаются' }
    ]
  },
  {
    id: 'unit-log-level',
    title: 'lib/logLevel',
    description: 'Скрипт window.__BOOT__.logLevel',
    tests: [
      { id: 'logLevel_script_Debug', title: 'getLogLevelScript(Debug)' },
      { id: 'logLevel_script_Info', title: 'getLogLevelScript(Info)' },
      { id: 'logLevel_script_Warn', title: 'getLogLevelScript(Warn)' },
      { id: 'logLevel_script_Error', title: 'getLogLevelScript(Error)' },
      { id: 'logLevel_script_Disable', title: 'getLogLevelScript(Disable)' },
      { id: 'logLevel_script_preserves_boot', title: 'скрипт не затирает __BOOT__' }
    ]
  },
  {
    id: 'unit-logger-lib',
    title: 'lib/logger.lib (pure)',
    description: 'shouldLogByLevel, getAdminLogsSocketId',
    tests: [
      { id: 'loggerLib_getAdminLogsSocketId_format', title: 'префикс admin-logs-' },
      { id: 'loggerLib_getAdminLogsSocketId_stable', title: 'стабильность между вызовами' },
      { id: 'loggerLib_shouldLogByLevel_matrix', title: 'полная матрица shouldLogByLevel' }
    ]
  },
  {
    id: 'unit-shared-logger',
    title: 'shared/logger',
    description: 'shouldLog, setLogSink, createComponentLogger',
    tests: [
      { id: 'shared_shouldLog_Disable_all', title: 'Disable: severity 0..7 → false' },
      { id: 'shared_shouldLog_Error', title: 'Error: матрица' },
      { id: 'shared_shouldLog_Warn', title: 'Warn: матрица' },
      { id: 'shared_shouldLog_Info', title: 'Info: матрица' },
      { id: 'shared_shouldLog_Debug', title: 'Debug: матрица' },
      { id: 'shared_shouldLog_no_window', title: 'без window → Info' },
      { id: 'shared_shouldLog_invalid_numeric', title: 'logLevel -1 → Disable' },
      { id: 'shared_shouldLog_invalid_string', title: 'мусор в logLevel → Info' },
      { id: 'shared_setLogSink_roundtrip', title: 'setLogSink / сброс' },
      { id: 'shared_setLogSink_throw_keeps_console', title: 'ошибка sink не ломает console' },
      { id: 'shared_componentLogger_prefix', title: 'createComponentLogger [Name]' },
      { id: 'shared_logWarn_alias', title: 'logWarn = logWarning' }
    ]
  },
  {
    id: 'unit-catalog',
    title: 'Каталог тестов',
    description: 'Целостность shared/testCatalog и совпадение с прогоном',
    tests: [
      { id: 'catalog_block_ids_unique', title: 'id блоков уникальны' },
      { id: 'catalog_test_ids_unique', title: 'id тестов уникальны' },
      { id: 'catalog_blocks_have_tests', title: 'в блоке есть тесты' },
      { id: 'catalog_flatten_order', title: 'flattenCatalogBlocks порядок' },
      { id: 'catalog_unit_ids_match_runner', title: 'UNIT_TEST_BLOCKS содержит все id прогона' }
    ]
  },
  {
    id: 'unit-lifepay',
    title: 'LifePay client panel',
    description: 'Каталог операций, сборка URL invoke, маскировка args, парсинг webhook, токен',
    tests: [
      { id: 'lp_catalog_three_ops', title: 'каталог: createBill/getBillStatus/cancelBill' },
      { id: 'lp_catalog_methods', title: 'каталог: HTTP-методы операций' },
      { id: 'lp_catalog_findOperation', title: 'findOperationInCatalog' },
      { id: 'lp_invoke_url_build_post', title: 'invoke URL: POST createBill' },
      { id: 'lp_invoke_url_build_get', title: 'invoke URL: GET getBillStatus' },
      { id: 'lp_invoke_url_trailing_slash', title: 'invoke URL: trailing slash' },
      { id: 'lp_invoke_unknown_op', title: 'invoke URL: op_unknown' },
      { id: 'lp_invoke_empty_base_url', title: 'invoke URL: base_url_invalid' },
      { id: 'lp_redact_email', title: 'redactEmail' },
      { id: 'lp_redact_email_no_at', title: 'redactEmail без @' },
      { id: 'lp_redact_phone', title: 'redactPhone' },
      { id: 'lp_redact_phone_short', title: 'redactPhone короткий' },
      { id: 'lp_invoke_redact_email_in_args', title: 'argsRedacted: email маскируется' },
      { id: 'lp_invoke_redact_phone_in_args', title: 'argsRedacted: phone маскируется' },
      {
        id: 'lp_invoke_no_secrets_in_args_redacted',
        title: 'argsRedacted: без apikey/login/token'
      },
      { id: 'lp_extract_order_number', title: 'extractOrderNumber' },
      { id: 'lp_login_valid', title: 'isValidLpLogin: ok' },
      { id: 'lp_login_invalid_wrong_first', title: 'isValidLpLogin: не 7 первая' },
      { id: 'lp_login_invalid_length', title: 'isValidLpLogin: длина' },
      { id: 'lp_gateway_base_url_normalize', title: 'normalizeGatewayBaseUrl' },
      { id: 'lp_gateway_base_url_valid', title: 'isValidGatewayBaseUrl' },
      { id: 'lp_generate_webhook_token_min_length', title: 'generateWebhookToken: длина' },
      { id: 'lp_generate_webhook_token_hex', title: 'generateWebhookToken: hex' },
      { id: 'lp_webhook_parse_basic', title: 'parseWebhookBody основные поля' },
      {
        id: 'lp_webhook_extract_order_number_nested',
        title: 'parseWebhookBody вложенный order.number'
      },
      { id: 'lp_webhook_email_raw', title: 'parseWebhookBody возвращает сырой email' },
      { id: 'lp_webhook_email_from_customer', title: 'parseWebhookBody email из customer.email' },
      { id: 'lp_webhook_no_body', title: 'parseWebhookBody пустое body' },
      { id: 'lp_webhook_unwrap_object', title: 'unwrapWebhookBody: чистый объект' },
      { id: 'lp_webhook_unwrap_json_string', title: 'unwrapWebhookBody: JSON-строка' },
      { id: 'lp_webhook_unwrap_form_data_field', title: 'unwrapWebhookBody: {data:"<json>"}' },
      { id: 'lp_webhook_unwrap_object_data_field', title: 'unwrapWebhookBody: {data:{<obj>}}' },
      {
        id: 'lp_webhook_unwrap_json_string_data_object',
        title: 'unwrapWebhookBody: \'{"data":{...}}\''
      },
      {
        id: 'lp_webhook_unwrap_form_urlencoded_string',
        title: 'unwrapWebhookBody: form-urlencoded строка'
      },
      {
        id: 'lp_webhook_unwrap_form_urlencoded_data_json',
        title: 'unwrapWebhookBody: data=<urlencoded-json>'
      },
      { id: 'lp_webhook_unwrap_null', title: 'unwrapWebhookBody: null' },
      {
        id: 'lp_webhook_raw_multipart_extract',
        title: 'extractDataFromRawMultipart: поле data из сырого multipart'
      },
      { id: 'lp_webhook_success_condition', title: 'isSuccessfulPayment: только payment+success' },
      { id: 'lp_webhook_formdata_string', title: 'readWebhookDataField: текстовое поле data' },
      { id: 'lp_webhook_formdata_file', title: 'readWebhookDataField: File-подобное поле .text()' },
      { id: 'lp_webhook_formdata_absent', title: 'readWebhookDataField: нет поля / нет form' },
      { id: 'lp_webhook_token_not_configured', title: 'checkWebhookToken: not_configured' },
      { id: 'lp_webhook_token_missing', title: 'checkWebhookToken: missing' },
      { id: 'lp_webhook_token_mismatch_403', title: 'checkWebhookToken: mismatch' },
      { id: 'lp_webhook_token_valid', title: 'checkWebhookToken: valid' },
      { id: 'lp_redactraw_secrets_top', title: 'redactRawDeep: удаление секретов верхнего уровня' },
      { id: 'lp_redactraw_secrets_nested', title: 'redactRawDeep: удаление секретов в вложенных' },
      { id: 'lp_redactraw_email_nested', title: 'redactRawDeep: маска email в customer.email' },
      { id: 'lp_redactraw_pii_other', title: 'redactRawDeep: маска passport/inn/fio/address' },
      { id: 'lp_redactraw_truncation', title: 'redactRawDeep: усечение > 64KB' },
      { id: 'lp_redactraw_non_serializable', title: 'redactRawDeep: function → __nonSerializable' },
      { id: 'lp_redactraw_circular', title: 'redactRawDeep: цикл → __circular' },
      { id: 'lp_redactraw_array_root', title: 'redactRawDeep: массив-корень' },
      { id: 'lp_redactraw_primitive_root', title: 'redactRawDeep: примитивы как есть' }
    ]
  },
  {
    id: 'unit-correlation',
    title: 'Связка webhook по correlationId',
    description:
      'shared/correlation — генерация, сборка callbackUrl, извлечение, дедупликация (без Heap)',
    tests: [
      {
        id: 'lp_correlation_generate_nonempty',
        title: 'generateCorrelationId: непустые уникальные строки'
      },
      { id: 'lp_correlation_append_valid', title: 'appendCorrelationId: добавляет в валидный URL' },
      {
        id: 'lp_correlation_append_preserves_token',
        title: 'appendCorrelationId: сохраняет token'
      },
      {
        id: 'lp_correlation_append_invalid',
        title: 'appendCorrelationId: невалидный URL → оригинал'
      },
      { id: 'lp_correlation_extract_present', title: 'extractCorrelationId: значение из объекта' },
      { id: 'lp_correlation_extract_absent', title: 'extractCorrelationId: "" при отсутствии' },
      { id: 'lp_correlation_merge_dedup', title: 'mergeWebhooksById: дедуп по id + сортировка' }
    ]
  },
  {
    id: 'unit-date-filter',
    title: 'Фильтр панели по дате/времени',
    description: 'isValidDateFilter, normalizeDateFilter — чистая валидация без Heap',
    tests: [
      { id: 'df_isvalid_empty', title: 'isValidDateFilter({}) → true' },
      { id: 'df_isvalid_only_from', title: 'isValidDateFilter({from})' },
      { id: 'df_isvalid_only_to', title: 'isValidDateFilter({to})' },
      { id: 'df_isvalid_both_ok', title: 'isValidDateFilter(from<to)' },
      { id: 'df_isvalid_both_equal', title: 'isValidDateFilter(from===to)' },
      { id: 'df_isvalid_from_gt_to', title: 'isValidDateFilter(from>to) → false' },
      { id: 'df_isvalid_string_bound', title: 'isValidDateFilter строковая граница → false' },
      { id: 'df_isvalid_zero', title: 'isValidDateFilter({from:0}) → false' },
      { id: 'df_isvalid_negative', title: 'isValidDateFilter отрицательная → false' },
      { id: 'df_isvalid_nan', title: 'isValidDateFilter NaN → false' },
      { id: 'df_isvalid_non_object', title: 'isValidDateFilter не-объект → false' },
      { id: 'df_norm_floor', title: 'normalizeDateFilter floor границ' },
      { id: 'df_norm_only_from', title: 'normalizeDateFilter только from' },
      { id: 'df_norm_drop_invalid', title: 'normalizeDateFilter отбрасывает невалидное' },
      { id: 'df_norm_empty_on_from_gt_to', title: 'normalizeDateFilter from>to → {}' },
      { id: 'df_norm_non_object', title: 'normalizeDateFilter не-объект → {}' },
      { id: 'df_norm_empty_input', title: 'normalizeDateFilter({}) → {}' }
    ]
  },
  {
    id: 'unit-access',
    title: 'Внутренняя авторизация (ADR 0003)',
    description: 'classifyInvite, decideInternalAccess — чистая логика без Heap',
    tests: [
      { id: 'access_classify_unknown', title: 'classifyInvite: null → unknown' },
      { id: 'access_classify_used', title: 'classifyInvite: usedAt → used' },
      { id: 'access_classify_revoked', title: 'classifyInvite: revokedAt → revoked' },
      { id: 'access_classify_expired', title: 'classifyInvite: истёк → expired' },
      { id: 'access_classify_valid', title: 'classifyInvite: свежий → valid' },
      { id: 'access_classify_used_precedence', title: 'classifyInvite: used приоритетнее' },
      { id: 'access_decide_admin', title: 'decideInternalAccess: admin → true' },
      { id: 'access_decide_grant', title: 'decideInternalAccess: grant → true' },
      { id: 'access_decide_none', title: 'decideInternalAccess: нет → false' }
    ]
  }
]

export const INTEGRATION_SERVER_TEST_BLOCKS: TestCatalogBlock[] = [
  {
    id: 'int-settings-lib',
    title: 'settings.lib',
    description: 'Чтение и запись настроек (Heap)',
    tests: [
      { id: 'settings_get_project_name', title: 'getSettingString(PROJECT_NAME)' },
      { id: 'settings_get_log_level', title: 'getLogLevel — допустимое значение' },
      { id: 'settings_getSetting_branches', title: 'getSetting: heap / null / default' },
      { id: 'settings_getLogsLimit_parse', title: 'getLogsLimit парсинг' },
      { id: 'settings_getLogWebhook', title: 'getLogWebhook объекты и дефолт' },
      { id: 'settings_getDashboardResetAt', title: 'getDashboardResetAt нормализация' },
      { id: 'settings_getAllSettings', title: 'getAllSettings defaults + heap' },
      { id: 'settings_setSetting_log_level', title: 'setSetting LOG_LEVEL ветки' },
      { id: 'settings_setSetting_logs_limit', title: 'setSetting LOGS_LIMIT ветки' },
      { id: 'settings_setSetting_project_fields', title: 'setSetting PROJECT_NAME/TITLE' },
      { id: 'settings_setSetting_webhook', title: 'setSetting LOG_WEBHOOK' },
      { id: 'settings_setSetting_dashboard_reset', title: 'setSetting DASHBOARD_RESET_AT' },
      { id: 'settings_setSetting_unknown_key', title: 'setSetting неизвестный ключ' },
      {
        id: 'regression_getLogLevel_no_recursion',
        title: 'регрессия: getLogLevel без stack overflow'
      },
      {
        id: 'regression_getSetting_no_recursion',
        title: 'регрессия: getSetting без stack overflow'
      }
    ]
  },
  {
    id: 'int-settings-repo',
    title: 'settings.repo',
    description: 'Доступ к таблице настроек',
    tests: [
      { id: 'settings_repo_findAll', title: 'findAll → массив' },
      { id: 'settings_repo_findByKey', title: 'findByKey(project_name)' },
      { id: 'settings_repo_upsert_create_update', title: 'upsert create/update' },
      { id: 'settings_repo_deleteByKey', title: 'deleteByKey' }
    ]
  },
  {
    id: 'int-date-filter',
    title: 'Фильтр панели (Heap)',
    description: 'getPanelDateFilter roundtrip, валидация setSetting, границы выборок репозиториев',
    tests: [
      { id: 'df_getPanelDateFilter_roundtrip', title: 'getPanelDateFilter: save → read → reset' },
      {
        id: 'df_setSetting_invalid_throws',
        title: 'setSetting PANEL_DATE_FILTER: невалидное → throw'
      },
      { id: 'df_requestlog_range_bounds', title: 'requestLog: countInRange/findInRange границы' },
      {
        id: 'df_webhooklog_range_bounds',
        title: 'webhookLog: countInRange/findInRange/byOrder границы'
      }
    ]
  },
  {
    id: 'int-logs-repo',
    title: 'logs.repo',
    description: 'Чтение и запись логов',
    tests: [
      { id: 'logs_repo_findAll', title: 'findAll(limit) → массив' },
      { id: 'logs_repo_create_and_read', title: 'create → findById' },
      { id: 'logs_repo_findBeforeTimestamp_where', title: 'findBeforeTimestamp через where' },
      { id: 'logs_repo_count_severities', title: 'countErrors/Warnings/BySeverity' },
      { id: 'regression_logs_create_no_recursion', title: 'регрессия: create без рекурсии логов' }
    ]
  },
  {
    id: 'int-logger-lib-ctx',
    title: 'logger.lib (ctx)',
    description: 'writeServerLog, сокет, вебхук',
    tests: [
      { id: 'logger_admin_socket', title: 'getAdminLogsSocketId(ctx)' },
      { id: 'logger_writeServerLog_filter', title: 'фильтрация по уровню' },
      { id: 'logger_writeServerLog_socket', title: 'идентификатор сокета логов' },
      { id: 'logger_writeServerLog_webhook_url', title: 'getLogWebhook url' },
      { id: 'regression_payload_not_object_object', title: 'регрессия: payload не [object Object]' }
    ]
  },
  {
    id: 'int-dashboard',
    title: 'dashboard.lib',
    description: 'Счётчики дашборда админки',
    tests: [
      { id: 'dashboard_get_counts', title: 'getDashboardCounts' },
      { id: 'dashboard_reset', title: 'resetDashboard + setSetting' },
      { id: 'dashboard_flow_logs', title: 'сценарий: логи → counts → reset' }
    ]
  },
  {
    id: 'int-api-contract',
    title: 'API (route.run)',
    description: 'Контракты эндпоинтов с текущим ctx',
    tests: [
      { id: 'api_settings_list', title: 'GET settings/list' },
      { id: 'api_settings_get', title: 'GET settings/get?key=' },
      { id: 'api_settings_save_validation', title: 'POST settings/save валидация' },
      { id: 'api_logger_log', title: 'POST logger/log' },
      { id: 'api_admin_logs_recent', title: 'GET admin/logs/recent' },
      { id: 'api_admin_logs_before', title: 'GET admin/logs/before' },
      { id: 'api_admin_dashboard_counts', title: 'GET admin/dashboard/counts' },
      { id: 'api_tests_list_shape', title: 'GET tests/list структура' },
      { id: 'api_tests_unit_shape', title: 'GET tests/unit shape' },
      { id: 'api_tests_integration_shape', title: 'GET tests/integration shape' }
    ]
  },
  {
    id: 'int-e2e',
    title: 'Сквозные сценарии',
    description: 'Настройки, логи, дашборд, пагинация',
    tests: [
      { id: 'e2e_settings_name_roundtrip', title: 'project_name save → get → list' },
      { id: 'e2e_log_level_filters_storage', title: 'log_level Error фильтрует запись в Heap' },
      { id: 'e2e_logs_pagination', title: 'recent + before пагинация' },
      { id: 'e2e_dashboard_reset_flow', title: 'counts → reset → counts' },
      { id: 'e2e_log_payload_roundtrip', title: 'payload объект → Heap → recent' }
    ]
  },
  {
    id: 'int-access',
    title: 'Внутренняя авторизация (ADR 0003)',
    description: 'Гранты, инвайты, потребление (Heap)',
    tests: [
      { id: 'access_require_admin_passes', title: 'requireInternalAccess(admin) не бросает' },
      { id: 'access_repo_grant_lifecycle', title: 'panelAccess: upsert/active/revoke' },
      { id: 'access_invite_generate_token_min_32', title: 'generateInvite: токен ≥ 32' },
      { id: 'access_invite_get_does_not_consume', title: 'getInviteByToken не расходует' },
      { id: 'access_invite_consume_expired', title: 'consumeInvite: expired' },
      { id: 'access_invite_consume_revoked', title: 'consumeInvite: revoked' },
      { id: 'access_invite_consume_flow', title: 'consumeInvite: ok → grant; повтор → used' },
      { id: 'access_invite_already_has_access', title: 'consumeInvite: already_has_access' }
    ]
  }
]

export const INTEGRATION_HTTP_TEST_BLOCK: TestCatalogBlock = {
  id: 'int-http-pages',
  title: 'HTTP GET страниц',
  description: 'Статус 200 и фрагменты SSR',
  tests: [
    { id: 'index', title: 'GET /' },
    { id: 'web-admin', title: 'GET /web/admin' },
    { id: 'web-profile', title: 'GET /web/profile' },
    { id: 'web-login', title: 'GET /web/login' },
    { id: 'web-tests', title: 'GET /web/tests' },
    { id: 'web-panel', title: 'GET /web/panel' }
  ]
}

export function flattenCatalogBlocks(blocks: TestCatalogBlock[]): TestCatalogEntry[] {
  return blocks.flatMap((b) => b.tests)
}
