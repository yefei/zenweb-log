'use strict';

const os = require('os');
const pino = require('pino');

/**
 * 初始化 logger
 * @returns {pino.Logger}
 */
function initLogger(options) {
  let logdest;
  if (process.env.LOG_FILE) {
    logdest = pino.destination(process.env.LOG_FILE);
    process.on('SIGHUP', () => {
      console.log('reopen log file');
      logdest.reopen();
    });
  }
  return pino(options, logdest);
}

/**
 * @param {pino.Logger} logger
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
 * @param {pino.Logger} logger
 */
function setupAppLogger(app, logger) {
  app.on('error', (err, ctx) => {
    if (err.expose) return;
    if (ctx) {
      ctx.log.error(err);
    } else {
      logger.error(err);
    }
  });
}

/**
 * @param {import('@zenweb/core').Core} core 
 * @param {*} [options]
 */
function setup(core, options) {
  options = Object.assign({
    name: process.env.npm_package_name || os.hostname(),
    prettyPrint: process.env.NODE_ENV === 'development' ? {
      translateTime: true,
    } : null,
  }, options);
  const logger = initLogger(options);
  setupAppLogger(core.koa, logger);
  core.log = logger;
  core.defineContextCacheProperty('log', ctx => contextLogger(logger, ctx));
}

module.exports = {
  setup,
};
