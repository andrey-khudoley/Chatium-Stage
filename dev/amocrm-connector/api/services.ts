// @shared-route
import ServicesTable from '../tables/services.table'
import SettingsTable from '../tables/settings.table'

export const apiGetServicesRoute = app.get('/services/list', async (ctx) => {
  // Проверяем, что таблица инициализирована
  if (!ServicesTable) {
    return { success: true, services: [] }
  }
  
  try {
    const services = await ServicesTable.findAll(ctx, {
      order: [{ title: 'asc' }],
      limit: 1000
    })
    
    return { success: true, services: services || [] }
  } catch (error) {
    console.error('Ошибка при загрузке сервисов:', error)
    return { success: true, services: [] }
  }
})

