/**
 * Генерирует api/v1/<op>.ts для каждой записи gc-op-http-mapping.json (кроме дубликатов).
 * Не трогает operations.ts — его держим отдельно.
 * Запуск: node scripts/gen-api-v1-routes.cjs
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MAPPING = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/gc-op-http-mapping.json'), 'utf8'))
const apiDir = path.join(ROOT, 'api/v1')

for (const e of MAPPING.entries) {
  const op = e.op
  const method = e.httpMethod.toLowerCase()
  const exportName = op + 'Route'
  const content = `import { handleV1OpRoute } from '../../lib/gateway/handleV1OpRoute'

/** ${e.httpMethod} /v1/${op} — каталог: config/gc-op-http-mapping.json */
export const ${exportName} = app.${method}('/', async (ctx, req) => handleV1OpRoute(ctx, '${op}', req))
`
  fs.writeFileSync(path.join(apiDir, `${op}.ts`), content)
}

console.log('Wrote', MAPPING.entries.length, 'files to api/v1/')
