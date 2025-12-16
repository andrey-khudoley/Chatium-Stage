// @shared
import { requireAccountRole } from '@app/auth';
import { apiRunAllTestsRoute } from './api/run-tests';

/**
 * JSON API для автоматического тестирования
 * Используется AI-агентами и системами мониторинга
 * 
 * Автоматически выполняет все тесты и возвращает результаты в JSON формате
 */
export const testsAiPageRoute = app.get('/', async (ctx, req) => {
  // Защищаем страницу авторизацией Admin
  requireAccountRole(ctx, 'Admin');
  
  // Вызываем API который выполнит все тесты
  const result = await apiRunAllTestsRoute.run(ctx);
  
  // Возвращаем результат напрямую (JSON)
  return result;
});

export default testsAiPageRoute;

