'use strict';

const { Core } = require('@zenweb/core');
const app = module.exports = new Core();

app.setup(require('..').setup, {
  dir: __dirname,
});
app.setup('@zenweb/router');

app.boot().then(() => {
  app.router.get('/', ctx => {
    ctx.log.info('infoaa %d %s', 111, {aaa:11122});
    ctx.body = 'aaaa';
  });
  app.listen();
});
