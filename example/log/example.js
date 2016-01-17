var log4js = require('log4js')

// This could be require()'d too. If you don't want to configure in this way,
// you can also call log4js.addAppender(amqpAppender.appender(CONFIG-HERE))
var config = {
  appenders: [
    {
      type: 'console'
    },
    {
      type: 'log4js-node-amqp',
      connection: {
        url: 'amqp://guest:guest@localhost:5672'
      },
      category: 'example',
      additionalInfo: {
        application: 'example application'
      }
    }
  ]
}

log4js.configure(config)
var logger = log4js.getLogger('example')

// strings work
logger.info('a string of log data.')

// so do objects
logger.info({ name: 'a string', type: 'a silly example' })

process.exit()
