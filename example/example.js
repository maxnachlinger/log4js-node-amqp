var log4js = require('log4js');
var amqpAppender = require('..');

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
