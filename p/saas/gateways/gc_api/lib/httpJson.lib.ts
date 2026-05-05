/** Ответ API с явным HTTP-статусом и JSON-телом. */
export function jsonHttpResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    rawHttpBody: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }
  }
}
