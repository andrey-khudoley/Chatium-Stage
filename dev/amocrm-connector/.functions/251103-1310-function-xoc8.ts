export async function main(ctx: app.Ctx) {
  try {
    const ServicesTable = await import('../tables/services.table')
    return { success: true, message: 'Services table loaded', table: ServicesTable.default || ServicesTable }
  } catch (error) {
    return { success: false, error: error.message, stack: error.stack }
  }
}

app.function('/').handle(async ctx => {
  try {
    return {
      success: true,
      result: await main(ctx),
    }
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
    }
  }
})