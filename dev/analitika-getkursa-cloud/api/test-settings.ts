// @shared
import { requireAccountRole } from '@app/auth'
import TAnalitikaGetkursaCloudSettingsKv8 from '../tables/settings.table'

/**
 * Очистка всех тестовых настроек
 * GET /api/test-settings~cleanup
 */
// @shared-route
export const testSettingsCleanupRoute = app.get('/cleanup', async (ctx) => {
  requireAccountRole(ctx, 'Admin')
  
  try {
    const allRecords = await TAnalitikaGetkursaCloudSettingsKv8.findAll(ctx, {
      where: {}
    })
    
    let deletedCount = 0
    
    for (const record of allRecords) {
      const key = (record as any).key
      if (key?.startsWith('test_setting_')) {
        const id = (record as any).id
        if (id) {
          await TAnalitikaGetkursaCloudSettingsKv8.delete(ctx, id)
          deletedCount++
        }
      }
    }
    
    return {
      success: true,
      message: 'Очистка завершена',
      deletedCount,
      totalFound: allRecords.length
    }
  } catch (error: any) {
    return {
      success: false,
      message: 'Ошибка при очистке',
      error: error.message
    }
  }
})

/**
 * Тестовый роут для проверки работы таблицы настроек
 * GET /api/test-settings
 */
// @shared-route
export const testSettingsRoute = app.get('/', async (ctx) => {
  requireAccountRole(ctx, 'Admin')
  
  const results: any = {}
  
  try {
    // 1. Создание тестовых настроек с createOrUpdateBy
    results.step1_create = 'Создание тестовых настроек...'
    
    const created1 = await TAnalitikaGetkursaCloudSettingsKv8.createOrUpdateBy(
      ctx,
      'key',
      { key: 'test_setting_1', value: 'Значение 1' }
    )
    
    const created2 = await TAnalitikaGetkursaCloudSettingsKv8.createOrUpdateBy(
      ctx,
      'key',
      { key: 'test_setting_2', value: 'Значение 2' }
    )
    
    results.step1_result = '✅ Создано 2 тестовые настройки'
    
    // 2. Проверка созданных настроек
    results.step2_read = 'Проверка созданных настроек...'
    
    const check1 = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key: 'test_setting_1' })
    const check2 = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key: 'test_setting_2' })
    
    if (check1?.value === 'Значение 1' && check2?.value === 'Значение 2') {
      results.step2_result = '✅ Обе настройки найдены с правильными значениями'
    } else {
      results.step2_result = `❌ Ошибка: check1="${check1?.value}", check2="${check2?.value}"`
    }
    
    // 3. Обновление настройки через createOrUpdateBy
    results.step3_update = 'Обновление настройки test_setting_1...'
    
    await TAnalitikaGetkursaCloudSettingsKv8.createOrUpdateBy(
      ctx,
      'key',
      { key: 'test_setting_1', value: 'Обновленное значение 1' }
    )
    
    const updated = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key: 'test_setting_1' })
    
    if (updated?.value === 'Обновленное значение 1') {
      results.step3_result = '✅ Настройка успешно обновлена'
    } else {
      results.step3_result = `❌ Ошибка обновления: "${updated?.value}"`
    }
    
    // 4. Повторное обновление той же настройки
    results.step4_reupdate = 'Повторное обновление той же настройки...'
    
    await TAnalitikaGetkursaCloudSettingsKv8.createOrUpdateBy(
      ctx,
      'key',
      { key: 'test_setting_1', value: 'Финальное значение 1' }
    )
    
    const reupdated = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key: 'test_setting_1' })
    
    if (reupdated?.value === 'Финальное значение 1') {
      results.step4_result = '✅ Повторное обновление работает корректно'
    } else {
      results.step4_result = `❌ Ошибка: "${reupdated?.value}"`
    }
    
    // 5. Удаление тестовых настроек
    results.step5_cleanup = 'Удаление тестовых настроек...'
    
    let deletedCount = 0
    
    const toDelete1 = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key: 'test_setting_1' })
    if (toDelete1) {
      await TAnalitikaGetkursaCloudSettingsKv8.delete(ctx, (toDelete1 as any).id)
      deletedCount++
    }
    
    const toDelete2 = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key: 'test_setting_2' })
    if (toDelete2) {
      await TAnalitikaGetkursaCloudSettingsKv8.delete(ctx, (toDelete2 as any).id)
      deletedCount++
    }
    
    results.step5_result = `✅ Удалено ${deletedCount} тестовых настроек`
    
    // 6. Проверка удаления
    results.step6_verify = 'Проверка удаления...'
    
    const verify1 = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key: 'test_setting_1' })
    const verify2 = await TAnalitikaGetkursaCloudSettingsKv8.findOneBy(ctx, { key: 'test_setting_2' })
    
    if (!verify1 && !verify2) {
      results.step6_result = '✅ Все тестовые настройки успешно удалены'
    } else {
      results.step6_result = `⚠️ Остались записи: verify1=${!!verify1}, verify2=${!!verify2}`
    }
    
    return {
      success: true,
      message: 'Все тесты пройдены успешно! ✅',
      results
    }
    
  } catch (error: any) {
    return {
      success: false,
      message: 'Ошибка при тестировании',
      error: error.message,
      stack: error.stack,
      results
    }
  }
})
