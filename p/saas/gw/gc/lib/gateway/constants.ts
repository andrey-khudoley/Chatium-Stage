/** Исходящий HTTP к GetCourse: таймаут ожидания ответа (manual §8.1, §12.2). */
export const GW_OUTBOUND_TIMEOUT_MS = 10_000

/** Верхний предел размера тела входящего POST /v1/{op} (manual §8.7, §12.3). */
export const GW_MAX_REQUEST_BODY_BYTES = 1_048_576

/** Максимум сохраняемого сырого тела GC в ответе клиенту при не-JSON 2xx (manual §8.2). */
export const GW_GC_RAW_BODY_CAP_BYTES = 512 * 1024
