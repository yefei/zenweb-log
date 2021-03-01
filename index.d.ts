import 'koa';
import '@zenweb/core';
import * as pino from 'pino';

declare module '@zenweb/core' {
  interface Core {
    log: pino.Logger;
  }
}

declare module 'koa' {
  interface BaseContext {
    log: pino.Logger;
  }
}
