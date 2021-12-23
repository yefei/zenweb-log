import { SetupFunction } from '@zenweb/core';
import { createLogger, FileBufferStream, Logger, FileBufferStreamOption } from 'zenlog.js';

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

/**
 * 模块安装入口
 */
export default function setup(option?: LogOption): SetupFunction {
  option = Object.assign({}, defaultLogOption, option);
  return function log(setup) {
    setup.debug('option: %o', option);

    const logger = initLogger(option);

    // 安装属性
    setup.defineCoreProperty('log', { value: logger });
    setup.defineContextCacheProperty('log', ctx => logger.child({
      method: ctx.method,
      url: ctx.url,
      host: ctx.host,
      ip: ctx.ip,
    }));

    // async 异常捕获
    process.on('unhandledRejection', reason => {
      logger.child({ err: reason }).error('unhandledRejection');
    });

    // koa 错误事件
    setup.koa.on('error', (err, ctx) => {
      if (err.expose) return;
      const log = ctx ? ctx.log : logger;
      if (err instanceof Error) {
        log.child({ err }).error(err.message);
      } else {
        log.error(err);
      }
    });
  }
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
