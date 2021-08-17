'use strict';

const { Core } = require('@zenweb/core');
const app = module.exports = new Core();

app.setup(require('..').setup, {
  dir: __dirname,
});
app.setup('@zenweb/router');

async function asyncerr() {
  throw new Error('asyncError');
}

app.boot().then(() => {
  app.router.get('/', ctx => {
    ctx.log.info('infoaa %d %s', 111, {aaa:11122});
    ctx.body = 'aaaa';
  });
  app.router.get('/err', ctx => {
    throw new Error('err');
  });
  app.router.get('/asyncerr', ctx => {
    asyncerr();
    ctx.body = 'asyncerr';
  });
  app.listen();
});
