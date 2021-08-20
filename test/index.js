'use strict';

const { Core } = require('@zenweb/core');
const app = module.exports = new Core();

app.setup(require('..').setup, {
  dir: __dirname,
  name: 'testapp',
});
app.setup('@zenweb/router');

async function asyncerr() {
  throw new Error('asyncError');
}

app.boot().then(() => {
  app.router.get('/', ctx => {
    ctx.log.info('infoaa', 111, {aaa:11122});
    ctx.body = 'aaaa';
  });
  app.router.get('/err', ctx => {
    throw new Error('err');
  });
  app.router.get('/asyncerr', ctx => {
    asyncerr();
    ctx.body = 'asyncerr';
  });
  app.router.get('/child', ctx => {
    ctx.log.child({ test: 'child', ip: '111111' }).debug('debug msg: %s', 111, 'append');
    ctx.body = 'child';
  });
  app.listen();
});
