import { Logger } from 'zenlog.js';

declare module '@zenweb/core' {
  interface Core {
    log: Logger;
  }
}

declare module 'koa' {
  interface BaseContext {
    log: Logger;
  }
}
