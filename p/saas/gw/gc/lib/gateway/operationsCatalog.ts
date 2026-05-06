import { s } from '@app/schema'
import { GW_ADD_USER_MAPPING } from './gcAddUserMapping'

/**
 * Схема args для POST /v1/addUser (manual §2.4, gc-required-fields-by-op.json, план §1.3).
 * Минимум: params.user.email (демо — tester@khudoley.pro).
 */
export const addUserArgsSchema = s.object({
  params: s.object({
    user: s.object({
      email: s.string()
    })
  })
})

export function getAddUserCatalogMeta() {
  return {
    op: GW_ADD_USER_MAPPING.op,
    contour: GW_ADD_USER_MAPPING.contour,
    httpMethod: GW_ADD_USER_MAPPING.httpMethod,
    availability: GW_ADD_USER_MAPPING.availability
  }
}
