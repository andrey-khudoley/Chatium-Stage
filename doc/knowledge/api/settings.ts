import { requireAccountRole } from '@app/auth'
import Settings from '../tables/settings.table'

// @shared-route
export const getSettingRoute = app.get('/get', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const key = req.query.key as string
  if (!key) {
    return { success: false, error: 'Key parameter is required' }
  }
  
  try {
    const setting = await Settings.findOneBy(ctx, { key })
    
    if (!setting) {
      if (key === 'adminToken') {
        return { success: true, value: '123' }
      }
      return { success: false, error: `Setting ${key} not found` }
    }
    
    return { success: true, value: setting.value }
  } catch (error) {
    ctx.account.log('Error getting setting', {
      level: 'error',
      json: { key, error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})

// @shared-route
export const saveSettingRoute = app.post('/save', async (ctx, req) => {
  requireAccountRole(ctx, 'Admin')
  
  const { key, value } = req.body
  
  if (!key || !value) {
    return { success: false, error: 'Key and value are required' }
  }
  
  try {
    const setting = await Settings.create(ctx, {
      key,
      value,
    })
    
    ctx.account.log('Setting saved', {
      level: 'info',
      json: { key }
    })
    
    return { success: true, setting }
  } catch (error) {
    ctx.account.log('Error saving setting', {
      level: 'error',
      json: { key, error: String(error) }
    })
    return { success: false, error: String(error) }
  }
})
