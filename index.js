'use strict';

const os = require('os');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const devTransport = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    return `[${info.level} ${info.timestamp}${ info.method ? ' ' + info.method + ' ' + info.url : '' }] ${info.message}`;
  }),
);

const prodTransport = winston.format.printf(info => {
  return `[${info.level} ${info.timestamp}${ info.method ? ' ' + info.method + ' ' + info.host + info.url : '' }] ${info.message}`;
});

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
      winston.format.splat(),
      winston.format.json(),
    ),
    transports: [
      new winston.transports.Console({
        format: process.env.NODE_ENV === 'production' ? prodTransport : devTransport,
      }),
    ],
  });

  if (options.dir) {
    logger.add(new winston.transports.DailyRotateFile({
      filename: path.join(options.dir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
    }));
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
    dir: process.env.LOG_DIR,
  }, options);
  const logger = initLogger(options);
  setupAppLogger(core.koa, logger);
  core.log = logger;
  core.defineContextCacheProperty('log', ctx => contextLogger(logger, ctx));
}

module.exports = {
  setup,
};
