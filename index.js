'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const bunyan = require('bunyan');
const assert = require('assert');
const debug = require('debug')('zenweb:log');

class ConsoleStream {
  write(rec) {
    console.log('[%s] [%s]%s %s%s',
      rec.time.toLocaleString(),
      bunyan.nameFromLevel[rec.level].toUpperCase(),
      rec.ctx ? ` [${rec.ctx.ip} ${rec.ctx.method} ${rec.ctx.host}${rec.ctx.url}]` : '',
      rec.msg,
      rec.err ? '\n' + rec.err.stack : '',
    );
  }
}

class FileBufferStream {
  /**
   * @param {object} options
   * @param {string} options.dir - log file dir
   * @param {number} [options.flushInterval = 1000] - interval for flush to file
   * @param {number} [options.maxBufferLength = 1000] - max buffer queue length
   * @param {string} [options.level = INFO] - log level
   */
  constructor(options) {
    assert.ok(options.dir, '"FileBuffer" stream should not give a "dir"');
    this._options = Object.assign({
      flushInterval: 1000,
      maxBufferLength: 1000,
    }, options);
    this._bufSize = 0;
    this._buf = [];
    this._timer = this._createInterval();
  }

  /**
   * create interval to flush log into file
   * @return {Interval}
   * @private
   */
   _createInterval() {
    return setInterval(() => this.flush(), this._options.flushInterval);
  }

  /**
   * close interval
   * @private
   */
  _closeInterval() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /**
   * @param {string} data
   */
  appendFile(data) {
    if (data.length === 0) return;
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const ymd = `${now.getFullYear()}-${m < 10 ? '0' : ''}${m}-${d < 10 ? '0' : ''}${d}`;
    const filename = path.join(this._options.dir, `app.${ymd}.log`);
    debug('append file: %s, %o', filename, data);
    fs.appendFile(filename, data + '\n', 'utf-8', err => {
      if (err) {
        console.error('zenweb:log append file error: %s', err.message);
      }
    });
  }

  /**
   * flush log into file
   */
  flush() {
    if (this._buf.length > 0) {
      this.appendFile(this._buf.join('\n'));
      this._buf = [];
      this._bufSize = 0;
    }
  }

  close() {
    this.flush();
    this._closeInterval();
  }

  write(rec) {
    const data = JSON.stringify(rec);
    this._buf.push(data);
    this._bufSize += data.length;
    if (this._bufSize >= this._options.maxBufferLength) {
      this.flush();
    }
  }
}

/**
 * 初始化 logger
 * @param {import('koa')} app
 * @returns {bunyan}
 */
function initLogger(app, options) {
  const streams = [{
    level: app.env === 'development' ? 'trace' : 'info',
    stream: new ConsoleStream(),
    type: 'raw',
  }];
  if (options.dir) {
    streams.push({
      level: 'info',
      type: 'raw',
      stream: new FileBufferStream(options),
    });
  }
  const logger = bunyan.createLogger({
    name: options.name,
    streams,
    serializers: {
      /** @param {import('koa').Context} ctx */
      ctx: ctx => ({
        method: ctx.method,
        url: ctx.url,
        host: ctx.host,
        ip: ctx.ip,
        headers: ctx.headers,
      }),
    }
  });
  return logger;
}

/**
 * @param {bunyan} logger
 * @param {import('koa').Context} ctx
 */
function contextLogger(logger, ctx) {
  return logger.child({
    ctx,
  });
}

/**
 * 记录应用错误日志
 * @param {import('koa')} app 
 * @param {bunyan} logger
 */
function setupAppLogger(app, logger) {
  process.on('unhandledRejection', reason => {
    logger.error({ err: reason }, 'unhandledRejection');
  });
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
  const logger = initLogger(core.koa, options);
  setupAppLogger(core.koa, logger);
  core.log = logger;
  core.defineContextCacheProperty('log', ctx => contextLogger(logger, ctx));
}

module.exports = {
  setup,
};
