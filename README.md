log4js-node-amqp
================
An AMQP appender for log4js-node

[![Build Status](https://travis-ci.org/maxnachlinger/log4js-node-amqp.png?branch=master)](https://travis-ci.org/maxnachlinger/log4js-node-amqp)
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
	// see https://github.com/postwait/node-amqp#exchangepublishroutingkey-message-options-callback
	publish: {
		mandatory: true,
		deliveryMode: 2, // persistent
		routingKey: 'msg'
	},
	// interval at which to flush messages to the queue, 0 means "immediate"
	sendInterval: 0,
	// a log4js layout, this is ignored if the logged item is an object
	layout: log4js.layouts.messagePassThroughLayout
}

```

### Usage:
```javascript
var log4js = require('log4js');
var amqpAppender = require('log4js-node-amqp');

// configure in code
log4js.addAppender(
	amqpAppender.appender({
		// more config options available
		connection: {
			url: "amqp://guest:guest@vm:5672"
		}
	}),
	'amqp-example'
);

var logger = log4js.getLogger('amqp-example');
logThings();

log4js.clearAppenders();

// or configure via configure()
log4js.configure({
	appenders: [
		{
			type: 'console'
		},
		{
			type: 'log4js-node-amqp',
			connection: {
				url: "amqp://guest:guest@vm:5672"
			},
			category: 'amqp-example'
		}
	]
});
var logger = log4js.getLogger('amqp-example');
logThings();

process.exit();

function logThings() {
	// strings work
	logger.info('a string of log data.');
	// so do objects
	logger.info({name: 'a string', type: 'a silly example'});
}
```
### License
[The MIT License](http://opensource.org/licenses/MIT) 

Copyright (c) 2013 Max Nachlinger
