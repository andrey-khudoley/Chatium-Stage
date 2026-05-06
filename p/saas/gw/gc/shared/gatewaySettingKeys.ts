// @shared

/**
 * Имя поля `key` в Heap (таблица настроек), под которым лежит **значение** devKey от GetCourse.
 * Это не секрет и не сам devKey — только стабильный идентификатор строки настроек (§5.4 manual).
 */
export const GC_DEVELOPER_API_KEY = 'gc_developer_api_key' as const
