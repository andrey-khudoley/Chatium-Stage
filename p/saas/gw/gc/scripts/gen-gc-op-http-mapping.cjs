/**
 * Генерирует lib/gateway/gcOpHttpMapping.generated.ts из config/gc-op-http-mapping.json.
 * Запуск: node scripts/gen-gc-op-http-mapping.cjs (из корня p/saas/gw/gc).
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const MAPPING = JSON.parse(fs.readFileSync(path.join(ROOT, 'config/gc-op-http-mapping.json'), 'utf8'))

const lines = []
lines.push('/** Автогенерация из config/gc-op-http-mapping.json — не править вручную; `node scripts/gen-gc-op-http-mapping.cjs`. */')
lines.push('export const GC_OP_HTTP_MAPPING_SCHEMA_VERSION = ' + JSON.stringify(MAPPING.schemaVersion) + ' as const')
lines.push('export type GcMappingEntry = {')
lines.push("  op: string")
lines.push("  contour: 'new' | 'legacy'")
lines.push("  httpMethod: 'GET' | 'POST'")
lines.push('  pathTemplate: string')
lines.push("  availability: 'enabled' | 'beta' | 'disabled' | 'unsupported'")
lines.push('  legacyImportAction: string | null')
lines.push('}')
lines.push('export const GC_OP_HTTP_MAPPING_ENTRIES: readonly GcMappingEntry[] = [')

for (const e of MAPPING.entries) {
  const av = e.availability != null ? e.availability : 'enabled'
  const li = e.legacyImportAction === undefined ? null : e.legacyImportAction
  const parts = [
    `op: ${JSON.stringify(e.op)}`,
    `contour: ${JSON.stringify(e.contour)}`,
    `httpMethod: ${JSON.stringify(e.httpMethod)}`,
    `pathTemplate: ${JSON.stringify(e.pathTemplate)}`,
    `availability: ${JSON.stringify(av)}`,
    `legacyImportAction: ${li === null ? 'null' : JSON.stringify(li)}`
  ]
  lines.push(`  { ${parts.join(', ')} },`)
}

lines.push('] as const')

const outPath = path.join(ROOT, 'lib/gateway/gcOpHttpMapping.generated.ts')
fs.writeFileSync(outPath, lines.join('\n') + '\n')
console.log('Wrote', outPath, 'entries:', MAPPING.entries.length)

// shared/v1OpsList.generated.ts — облегчённая копия для клиентского бандла Vue (// @shared).
// Не содержит OpenAPI-аннотаций и technical notes; только то, что нужно UI страницы тестов.
const sharedLines = []
sharedLines.push('// @shared')
sharedLines.push('/** Автогенерация из config/gc-op-http-mapping.json — `node scripts/gen-gc-op-http-mapping.cjs`. */')
sharedLines.push("export type V1OpListEntry = {")
sharedLines.push('  op: string')
sharedLines.push("  contour: 'new' | 'legacy'")
sharedLines.push("  httpMethod: 'GET' | 'POST'")
sharedLines.push("  availability: 'enabled' | 'beta' | 'disabled' | 'unsupported'")
sharedLines.push('}')
sharedLines.push('export const V1_OPS_LIST: readonly V1OpListEntry[] = [')
for (const e of MAPPING.entries) {
  const av = e.availability != null ? e.availability : 'enabled'
  sharedLines.push(`  { op: ${JSON.stringify(e.op)}, contour: ${JSON.stringify(e.contour)}, httpMethod: ${JSON.stringify(e.httpMethod)}, availability: ${JSON.stringify(av)} },`)
}
sharedLines.push('] as const')

const sharedOutPath = path.join(ROOT, 'shared/v1OpsList.generated.ts')
fs.writeFileSync(sharedOutPath, sharedLines.join('\n') + '\n')
console.log('Wrote', sharedOutPath, 'entries:', MAPPING.entries.length)
