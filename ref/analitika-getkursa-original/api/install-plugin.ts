import { installSupportedApp } from '@store/sdk'

// @shared-route
export const installPluginRoute = app.post('/install-plugin', async (ctx, req) => {
  try {
    
    return { success: true, result: await installSupportedApp(ctx, 'gc-mcp-server') }
  } catch (error) {
    ctx.account.log('Plugin installation failed', {
      level: 'error',
      json: { error: error.message }
    })
    return { success: false, error: error.message }
  }
})