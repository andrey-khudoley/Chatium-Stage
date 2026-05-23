// @shared

/**
 * Имя поля `key` в Heap (таблица настроек), под которым лежит **значение** devKey от GetCourse.
 * Это не секрет и не сам devKey — только стабильный идентификатор строки настроек (§5.4 manual).
 */
export const GC_DEVELOPER_API_KEY = 'gc_developer_api_key' as const

/**
 * Имя поля `key` в Heap для **значения** API-ключа тестовой школы GetCourse (автотесты, заголовок `X-Gc-School-Api-Key`).
 * Это не секрет — только стабильный идентификатор строки настроек (§5.5 manual).
 */
export const GC_TEST_SCHOOL_API_KEY = 'gc_test_school_api_key' as const

/**
 * Имя поля `key` в Heap для **хоста** тестовой школы GetCourse (без схемы, §2.5 manual): интеграционные тесты подставляют значение в заголовок `X-Gc-School-Host` (§5.8 manual, уровень A).
 */
export const GC_TEST_SCHOOL_HOST = 'gc_test_school_host' as const
