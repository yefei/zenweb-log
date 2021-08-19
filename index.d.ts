import 'koa';
import '@zenweb/core';
import * as Logger from 'bunyan';

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
