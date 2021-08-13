'use strict';

const { Core } = require('@zenweb/core');
const app = module.exports = new Core();

app.setup(require('..').setup, {
  dir: __dirname,
});
app.setup('@zenweb/router');

app.boot().then(() => {
  app.router.get('/', ctx => {
    ctx.log.info('infoaa');
    ctx.body = 'aaaa';
  });
  app.listen();
});
