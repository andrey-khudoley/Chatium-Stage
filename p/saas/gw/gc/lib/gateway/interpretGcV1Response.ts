import { GW_GC_RAW_BODY_CAP_BYTES } from './constants'
import { detectLegacySemanticErrorRule, type LegacyGcSemanticRule } from './legacyGcSemantic'

export type InterpretGcOutcome =
  | { kind: 'success'; data: unknown }
  | { kind: 'semantic_error'; gcContour: 'legacy'; gcRule: LegacyGcSemanticRule }
  | { kind: 'upstream_error'; gcHttpStatus: number }
  | { kind: 'json_parse_error' }

function looksLikeJsonContentType(ct: string): boolean {
  const c = ct.toLowerCase()
  return c.includes('application/json') || c.includes('+json')
}

function truncateGcRawBody(text: string): { gcRawBody: string; gcRawBodyTruncated?: true } {
  const bytes = new TextEncoder().encode(text).length
  if (bytes <= GW_GC_RAW_BODY_CAP_BYTES) {
    return { gcRawBody: text }
  }
  let out = ''
  let len = 0
  for (const ch of text) {
    const b = new TextEncoder().encode(ch).length
    if (len + b > GW_GC_RAW_BODY_CAP_BYTES) break
    out += ch
    len += b
  }
  return { gcRawBody: out, gcRawBodyTruncated: true }
}

/**
 * Транспорт и семантика ответа GetCourse для контура legacy (manual §2.8.1–2.8.2).
 */
export function interpretLegacyHttpResponse(input: {
  gcStatus: number
  gcContentType: string
  gcBodyText: string
}): InterpretGcOutcome {
  const { gcStatus, gcContentType, gcBodyText } = input
  if (gcStatus < 200 || gcStatus > 299) {
    return { kind: 'upstream_error', gcHttpStatus: gcStatus }
  }

  const isJsonHint = looksLikeJsonContentType(gcContentType) || /^\s*[\[{]/.test(gcBodyText)
  if (!isJsonHint) {
    const raw = truncateGcRawBody(gcBodyText)
    return {
      kind: 'success',
      data: {
        gcRawBody: raw.gcRawBody,
        gcContentType,
        ...(raw.gcRawBodyTruncated ? { gcRawBodyTruncated: true } : {})
      }
    }
  }

  let gcJson: unknown
  try {
    gcJson = JSON.parse(gcBodyText)
  } catch {
    return { kind: 'json_parse_error' }
  }

  const rule = detectLegacySemanticErrorRule(gcJson)
  if (rule) {
    return { kind: 'semantic_error', gcContour: 'legacy', gcRule: rule }
  }

  return { kind: 'success', data: gcJson }
}
