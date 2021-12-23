import { Core } from '@zenweb/core';
import router from '@zenweb/router';
import log from '../src/index';

const app = new Core();

app.setup(log({
  dir: process.cwd(),
  name: 'testapp',
}));
app.setup(router());

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
