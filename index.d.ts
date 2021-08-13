import 'koa';
import '@zenweb/core';
import { Logger } from 'winston';

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
