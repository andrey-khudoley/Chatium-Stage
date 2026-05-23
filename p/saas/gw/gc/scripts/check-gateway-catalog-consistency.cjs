/**
 * CI: файлы api/v1/<op>.ts должны совпадать с множеством op из config/gc-op-http-mapping.json
 * (исключение: operations.ts — это GET /v1/operations).
 * Выход 1 при расхождении.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/gc-op-http-mapping.json'), 'utf8'))
const apiDir = path.join(ROOT, 'api/v1')
const files = fs.readdirSync(apiDir).filter((f) => f.endsWith('.ts'))

const fromDisk = new Set(
  files
    .map((f) => f.replace(/\.ts$/, ''))
    .filter((name) => name !== 'operations')
)
const fromMapping = new Set(mapping.entries.map((e) => e.op))

const missingFiles = [...fromMapping].filter((op) => !fromDisk.has(op))
const extraFiles = [...fromDisk].filter((op) => !fromMapping.has(op))

if (missingFiles.length || extraFiles.length) {
  console.error('gateway catalog ↔ api/v1 файлы не совпадают')
  if (missingFiles.length) console.error('Нет файла для op:', missingFiles.join(', '))
  if (extraFiles.length) console.error('Лишние файлы (нет в mapping):', extraFiles.join(', '))
  process.exit(1)
}

console.log('OK: api/v1/*.ts ↔ gc-op-http-mapping.json (', fromMapping.size, 'op )')
