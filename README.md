log4js-node-amqp
================
An AMQP appender for log4js-node

[![travis][travis-image]][travis-url]
[![npm][npm-image]][npm-url]
[![downloads][downloads-image]][downloads-url]
[![standard][standard-image]][standard-url]

[travis-image]: https://travis-ci.org/maxnachlinger/log4js-node-amqp.svg?branch=master
[travis-url]: https://travis-ci.org/maxnachlinger/log4js-node-amqp
[npm-image]: https://img.shields.io/npm/v/log4js-node-amqp.svg?style=flat
[npm-url]: https://npmjs.org/package/log4js-node-amqp
[downloads-image]: https://img.shields.io/npm/dm/log4js-node-amqp.svg?style=flat
[downloads-url]: https://npmjs.org/package/log4js-node-amqp
[standard-image]: https://img.shields.io/badge/code%20style-standard-brightgreen.svg
[standard-url]: http://standardjs.com/

### Installation:
```
npm install log4js-node-amqp
```
### Usage:
Configure in code:
```javascript
var log4js = require('log4js');
var amqpAppender = require('log4js-node-amqp');

log4js.addAppender(
  amqpAppender.appender({
    // more config options available
    connection: {
      url: "amqp://guest:guest@localhost:5672"
    },
    // this is a space for you to add custom bits to every log message
    additionalInfo: {
      machine: require("os").hostname(),
      applicationName: 'example application'
    }
  }),
  'amqp-example'
);
```
or configure via ``configure()`` You could also ``require()`` a config .json or .js file here, any Javascript object will work with log4js.
```javascript
log4js.configure({
  appenders: [
    {
      type: 'console'
    },
    {
      type: 'log4js-node-amqp',
      connection: {
        url: "amqp://guest:guest@localhost:5672"
      },
      // this is a space for you to add custom bits to every log message
      additionalInfo: {
        machine: require("os").hostname(),
        applicationName: 'example application'
      }
      category: 'amqp-example'
    }
  ]
});
```
Log things:
```javascript
var logger = log4js.getLogger('amqp-example');
// strings work
logger.info('a string of log data.');
// so do objects
logger.info({name: 'a string', type: 'a silly example'});
```
You can also have a look at the [example](example/log/example.js).
### Configuration
This is a log4js appender which uses the awesome [node-amqp](https://github.com/postwait/node-amqp) package and shares a good bit of config with it.
```javascript
 {
   // see https://github.com/postwait/node-amqp#connection
  connection: {
    url: "amqp://guest:guest@localhost:5672",
    clientProperties: {
      product: 'log4js'
    }
  },
  // see https://github.com/postwait/node-amqp#connectionexchange
  exchange: {
    name: 'logExchange',
    type: 'fanout',
    durable: true,
    autoDelete: false
  },
  // see https://github.com/postwait/node-amqp#queue - specifying a queue is optional, if you don't
  // specify one, logs will be published to the exchange. If you do specify a queue, it will be 
  // automatically created and bound to the exchange.
  queue: {
    name: 'logQ',
    durable: true,
    autoDelete: false
  },
  // see https://github.com/postwait/node-amqp#exchangepublishroutingkey-message-options-callback
  publish: {
    mandatory: true,
    deliveryMode: 2, // persistent
    routingKey: 'msg'
  },
  // interval at which to flush messages to the queue, 0 means "immediate"
  sendInterval: 0,
  // a log4js layout, this is ignored if the logged item is an object
  layout: log4js.layouts.messagePassThroughLayout,
  // this is a space for you to add custom bits to every log message
  additionalInfo: {
    //
  },
  // if you'd like to alter the logEvent before it's sent to the exchange
  logEventInterceptor: function(logEvent, additionalInfo) {
    //
  }
}

```
### What's sent to the exchange?
```javascript
// Everything log4js provides, + whatever you added to additionalInfo 
// (keys in additionalInfo are added as keys to the log message).
{
  timestamp: Fri Dec 20 2013 20:54:22 GMT-0800 (PST),
  data: 'test-message',
  level: { level: 20000, levelStr: 'INFO' },
  category: 'test'
}

// if you specified a logEventInterceptor in options,
// then whatever logEventInterceptor returns will be sent, e.g.:
log4js.configure({
  appenders: [
    {
      type: 'log4js-node-amqp',
      // more config here
      logEventInterceptor: function(logEvent, additionalInfo) {
        return (logEvent.data || {}).message; // send a simple string to the exchange
      }
    }
  ]
});
```
### Reading things from the log-queue
If you want some ideas on how to read things from the log queue, have a look at this [simple log reader example](example/logReader/example.js).

### License
[The MIT License](http://opensource.org/licenses/MIT) 

Copyright (c) 2015 Max Nachlinger
