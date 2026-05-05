# ADR-0005: Bearer-токен клиента школы

## Status
Accepted

## Context
Клиенты gateway вызывают `/api/v1/invoke` с заголовком `Authorization: Bearer <token>`. Токен не должен храниться в Heap открытым текстом.

## Decision
- При онбординге и ротации генерируется случайный plain-токен (URL-safe), показывается клиенту **один раз**.
- В Heap сохраняются только **salt** и **PBKDF2-хэш** (медленная функция в `lib/crypto.lib`).
- Аутентификация: `lib/authToken.lib` — извлечение Bearer, загрузка школы по `schoolId`, `verifyTokenSlow`.

## Consequences
- Утеря plain-токена решается только ротацией через `/api/v1/rotate-token` или админский API.
