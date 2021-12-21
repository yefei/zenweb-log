import * as Koa from 'koa';
import { Core } from '@zenweb/core';
import { createLogger, FileBufferStream, Logger, FileBufferStreamOption } from 'zenlog.js';
import Debug from 'debug';

const debug = Debug('zenweb:log');

export interface LogOption extends FileBufferStreamOption {
  name?: string;
}

const defaultLogOption: LogOption = {
  name: process.env.npm_package_name,
  dir: process.env.LOG_DIR,
};

/**
 * 初始化 logger
 */
function initLogger(option?: LogOption) {
  const fields: LogOption = {};
  if (option.name) fields.name = option.name;
  const logger = createLogger(fields);
  if (option.dir) {
    logger.addStream(new FileBufferStream(option));
  }
  return logger;
}

function contextLogger(logger: Logger, ctx: Koa.Context) {
  return logger.child({
    method: ctx.method,
    url: ctx.url,
    host: ctx.host,
    ip: ctx.ip,
  });
}

/**
 * 记录应用错误日志
 */
function setupAppLogger(app: Koa, logger: Logger) {
  process.on('unhandledRejection', reason => {
    logger.child({ err: reason }).error('unhandledRejection');
  });
  app.on('error', (err, ctx) => {
    if (err.expose) return;
    const log = ctx ? ctx.log : logger;
    if (err instanceof Error) {
      log.child({ err }).error(err.message);
    } else {
      log.error(err);
    }
  });
}

export function setup(core: Core, option?: LogOption) {
  option = Object.assign({}, defaultLogOption, option);
  debug('option: %o', option);
  const logger = initLogger(option);
  setupAppLogger(core.koa, logger);
  core.log = logger;
  core.defineContextCacheProperty('log', ctx => contextLogger(logger, ctx));
}

declare module '@zenweb/core' {
  interface Core {
    log: Logger;
  }
}

declare module 'koa' {
  interface DefaultContext {
    log: Logger;
  }
}
