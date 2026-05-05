import * as gatewaySchoolRepo from '../repos/gatewaySchool.repo'
import * as authToken from './authToken.lib'

export async function rotateSchoolToken(ctx: app.Ctx, schoolId: string): Promise<{ plainToken: string }> {
  const school = await gatewaySchoolRepo.findBySchoolId(ctx, schoolId.trim())
  if (!school) {
    throw new Error('Школа не найдена')
  }
  const { plainToken, hash, salt } = authToken.newClientTokenCredentials()
  await gatewaySchoolRepo.update(ctx, school.id, {
    clientTokenHash: hash,
    clientTokenSalt: salt
  })
  return { plainToken }
}
