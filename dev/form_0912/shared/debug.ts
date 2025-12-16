/**
 * Debug — логгер для Chatium.
 * Всегда логирует на уровне info.
 */
export class Debug {
  /** Префикс для серверных логов. */
  static logPrefix: string = '[form_0912]'

  /** Установить префикс серверных логов. */
  static setLogPrefix(prefix: string): void {
    Debug.logPrefix = prefix
  }

  /** Лог уровня `info`. */
  static info(ctx: RichUgcCtx, message: string): void {
    const ts = new Date().toISOString()
    const line = `[INFO][${ts}]: ${message}`

    try { 
      ctx.log?.(line) 
    } catch (e) {
      // Игнорируем ошибки логирования
    }
    try { 
      ctx.account?.log?.(`${Debug.logPrefix}${line}`) 
    } catch (e) {
      // Игнорируем ошибки логирования
    }
  }

  /** Лог уровня `warn`. */
  static warn(ctx: RichUgcCtx, message: string): void {
    const ts = new Date().toISOString()
    const line = `[WARN][${ts}]: ${message}`

    try { 
      ctx.log?.(line) 
    } catch (e) {
      // Игнорируем ошибки логирования
    }
    try { 
      ctx.account?.log?.(`${Debug.logPrefix}${line}`) 
    } catch (e) {
      // Игнорируем ошибки логирования
    }
  }

  /** Лог уровня `error` без выброса. */
  static error(ctx: RichUgcCtx, message: string, code?: string): void {
    const ts = new Date().toISOString()
    const head = `[ERROR][${ts}]${code ? `[${code}]` : ''}`
    const line = `${head}: ${message}`

    try { 
      ctx.log?.(line) 
    } catch (e) {
      // Игнорируем ошибки логирования
    }
    try { 
      ctx.account?.log?.(`${Debug.logPrefix}${line}`) 
    } catch (e) {
      // Игнорируем ошибки логирования
    }
  }

  /** Выброс ошибки. */
  static throw(ctx: RichUgcCtx, message: string, code?: string): never {
    Debug.error(ctx, message, code)
    throw new Error(message)
  }
}

