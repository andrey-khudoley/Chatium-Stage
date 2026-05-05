# ADR-0004: Шифрование секретов школы и GC dev key

## Status
Accepted

## Context
На gateway хранятся: ключ API школы GetCourse, опционально override dev-ключа, глобальный GC dev key для контура new API, постоянный onboarding-токен. Их нельзя держать в Heap в открытом виде.

## Decision
- Мастер-ключ **`gateway_master_key`** (32 байта, base64) хранится в Heap settings; при отсутствии генерируется при первом обращении (`lib/secretSettings.lib`).
- Шифрование строк AES-256-GCM (`lib/crypto.lib`): ciphertext + IV в base64.
- Ключ школы и опциональный override dev-ключа хранятся в строке школы (`GatewaySchool`) как ciphertext/iv.
- Глобальный GC dev key хранится как зашифрованный blob (`gc_dev_key_encrypted` в settings), расшифровка только на сервере через master key.

## Alternatives (не выбраны)
- Внешний vault (HashiCorp Vault и т.п.) — возможное усложнение при масштабировании.

## Consequences
- Ротация master key потребует перешифровки всех секретов (отдельная процедура вне текущего MVP).
