import { gcQueryAi } from "@gc-mcp-server/sdk"

export const testRoute = app.get('/', async(ctx,req) => {
  const orderIds = ['661453047', '661466892', '661478952']
  
  const query = `
    SELECT 
      action_param1 as order_id,
      urlPath as event_type,
      action_param1_float as amount_float,
      action_param2_float as payment_float,
      action_param3 as status,
      dt,
      ts
    FROM chatium_ai.access_log
    WHERE action_param1 IN (${orderIds.map(id => `'${id}'`).join(',')})
      AND urlPath IN (
        'event://getcourse/dealCreated',
        'event://getcourse/dealMoneyValuesChanged', 
        'event://getcourse/dealPaid',
        'event://getcourse/dealStatusChanged'
      )
    ORDER BY action_param1, ts ASC
  `
  
  return await gcQueryAi(ctx, query)
})
