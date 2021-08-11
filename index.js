'use strict';

const os = require('os');
const winston = require('winston');

/**
 * 初始化 logger
 * @returns {winston.Logger}
 */
function initLogger(options) {
  const logger = winston.createLogger({
    defaultMeta: {
      name: options.name,
    },
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.printf(info => {
          return `${info.level.toUpperCase()} ${info.timestamp}${ info.method ? ' ' + info.method + ' ' + info.url : '' }: ${info.message}`;
        })
      }),
    ],
  });

  if (options.file) {
    logger.add(new winston.transports.File({ filename: options.file }));
  }

  return logger;
}

/**
 * @param {winston.Logger} logger
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
 * @param {winston.Logger} logger
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
    file: process.env.LOG_FILE,
  }, options);
  const logger = initLogger(options);
  setupAppLogger(core.koa, logger);
  core.log = logger;
  core.defineContextCacheProperty('log', ctx => contextLogger(logger, ctx));
}

module.exports = {
  setup,
};
