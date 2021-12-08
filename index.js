import { createLogger, FileBufferStream } from 'zenlog.js';

/**
 * 初始化 logger
 * @returns {import('zenlog.js').Logger}
 */
function initLogger(options) {
  const fields = {};
  if (options.name) fields.name = options.name;
  const logger = createLogger(fields);
  if (options.dir) {
    logger.addStream(new FileBufferStream(options));
  }
  return logger;
}

/**
 * @param {import('zenlog.js').Logger} logger
 * @param {import('koa').Context} ctx
 */
function contextLogger(logger, ctx) {
  return logger.child({
    method: ctx.method,
    url: ctx.url,
    host: ctx.host,
    ip: ctx.ip,
  });
}

/**
 * 记录应用错误日志
 * @param {import('koa')} app 
 * @param {import('zenlog.js').Logger} logger
 */
function setupAppLogger(app, logger) {
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

/**
 * @param {import('@zenweb/core').Core} core 
 * @param {*} [options]
 */
export function setup(core, options) {
  options = Object.assign({
    name: process.env.npm_package_name,
    dir: process.env.LOG_DIR,
  }, options);
  const logger = initLogger(options);
  setupAppLogger(core.koa, logger);
  core.log = logger;
  core.defineContextCacheProperty('log', ctx => contextLogger(logger, ctx));
}
