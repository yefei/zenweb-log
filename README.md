# ZenWeb Log module

[ZenWeb](https://www.npmjs.com/package/zenweb)

```javascript
ctx.log.info('msg', 111, {aaa:11122});
ctx.log.child({ err: new Error('err') }).debug('debug msg: %s', 111, 'append');
```
