'use strict'
var util = require('util')
var test = require('tape')
var log4js = require('log4js')
var mockery = require('mockery')
var EventEmitter = require('events').EventEmitter

function FakeAmqp (hasQueue) {
  EventEmitter.call(this)

  this.hasQueue = hasQueue
  this.messages = []
  this.setupCb = function () {
  }

  this.exchangeObj = {
    publish: function (routingKey, msg, options) {
      this.messages.push(msg)
    }.bind(this)
  }
}

util.inherits(FakeAmqp, EventEmitter)

FakeAmqp.prototype.connect = function () {
  var self = this
  process.nextTick(self.emit.bind(self, 'ready', {}))
}

FakeAmqp.prototype.exchange = function () {
  var cb = Array.prototype.slice.call(arguments).pop()
  cb(this.exchangeObj)

  if (!this.hasQueue) {
    process.nextTick(this.setupCb.bind(this))
  }
}

FakeAmqp.prototype.queue = function () {
  var fn = Array.prototype.slice.call(arguments).pop()
  fn({
    bind: function () { }
  })

  process.nextTick(this.setupCb.bind(this))
}

function mockeryReset (t) {
  mockery.deregisterAll()
  mockery.resetCache()
  t.end()
}

test('Setup', function (t) {
  mockery.enable({
    useCleanCache: true,
    warnOnReplace: false,
    warnOnUnregistered: false
  })
  t.end()
})

test('a log item written before the appender is connected works', function (t) {
  var fakeAmqp = new FakeAmqp()

  t.test('Setup', function (t) {
    if (log4js.clearAppenders) {
      log4js.clearAppenders()
    }
    mockery.registerMock('amqp', {
      createConnection: function () {
        fakeAmqp.connect()
        return fakeAmqp
      }
    })
    t.end()
  })

  t.test(function (t) {
    var message = 'test-message'
    var index = require('../lib/index')
    log4js.addAppender(index.configure({}), 'test')
    log4js.getLogger('test').info(message)

    process.nextTick(function () {
      t.equal(fakeAmqp.messages.length, 1, 'one message was sent: ' + util.inspect(fakeAmqp.messages))
      t.equal(fakeAmqp.messages[ 0 ].data, message, message + ' was sent')
      t.end()
    })
  })

  t.test('Teardown', mockeryReset)
})

test('a log item written after the appender is connected works', function (t) {
  var fakeAmqp = new FakeAmqp()

  t.test('Setup', function (t) {
    log4js.clearAppenders()
    mockery.registerMock('amqp', {
      createConnection: function () {
        fakeAmqp.connect()
        return fakeAmqp
      }
    })
    t.end()
  })

  t.test(function (t) {
    var message = 'test-message'
    var index = require('../lib/index')

    log4js.addAppender(index.configure({}), 'test')

    fakeAmqp.setupCb = function () {
      log4js.getLogger('test').info(message)
      t.equal(fakeAmqp.messages.length, 1, 'one message was sent: ' + util.inspect(fakeAmqp.messages))
      t.equal(fakeAmqp.messages[ 0 ].data, message, message + ' was sent')
      t.end()
    }
  })

  t.test('Teardown', mockeryReset)
})

test('multiple log items written before the appender is connected work', function (t) {
  var fakeAmqp = new FakeAmqp()

  t.test('Setup', function (t) {
    log4js.clearAppenders()
    mockery.registerMock('amqp', {
      createConnection: function () {
        fakeAmqp.connect()
        return fakeAmqp
      }
    })
    t.end()
  })

  t.test(function (t) {
    var index = require('../lib/index')
    log4js.addAppender(index.configure({}), 'test')

    log4js.getLogger('test').info('test message 0')
    log4js.getLogger('test').info('test message 1')
    log4js.getLogger('test').info('test message 2')

    process.nextTick(function () {
      t.equal(fakeAmqp.messages.length, 3, 'three messages were sent: ' + util.inspect(fakeAmqp.messages))
      t.end()
    })
  })

  t.test('Teardown', mockeryReset)
})

test('multiple log items written after the appender is connected work', function (t) {
  var fakeAmqp = new FakeAmqp()

  t.test('Setup', function (t) {
    log4js.clearAppenders()
    mockery.registerMock('amqp', {
      createConnection: function () {
        fakeAmqp.connect()
        return fakeAmqp
      }
    })
    t.end()
  })

  t.test(function (t) {
    var index = require('../lib/index')

    log4js.addAppender(index.configure({}), 'test')

    fakeAmqp.setupCb = function () {
      setTimeout(function () {
        log4js.getLogger('test').info('test message 0')
      }, 0)
      setTimeout(function () {
        log4js.getLogger('test').info('test message 1')
      }, 100)
      setTimeout(function () {
        log4js.getLogger('test').info('test message 2')
      }, 200)
      setTimeout(function () {
        t.equal(fakeAmqp.messages.length, 3, 'three messages were sent: ' + util.inspect(fakeAmqp.messages))
        t.end()
      }, 300)
    }
  })

  t.test('Teardown', mockeryReset)
})

test('additionalInfo is logged when present', function (t) {
  var message = 'test-message'
  var fakeAmqp = new FakeAmqp()

  t.test('Setup', function (t) {
    log4js.clearAppenders()
    mockery.registerMock('amqp', {
      createConnection: function () {
        fakeAmqp.connect()
        return fakeAmqp
      }
    })
    t.end()
  })

  t.test(function (t) {
    var applicationName = 'test-application-name'
    var index = require('../lib/index')

    log4js.addAppender(index.configure({
      additionalInfo: {
        applicationName: applicationName
      }
    }), 'test')

    fakeAmqp.setupCb = function () {
      log4js.getLogger('test').info(message)
      t.equal(fakeAmqp.messages.length, 1, 'one message was sent: ' + util.inspect(fakeAmqp.messages))
      t.equal(fakeAmqp.messages[ 0 ].applicationName, applicationName, 'applicationName ' + applicationName +
        ' was sent')
      t.end()
    }
  })

  t.test('Teardown', mockeryReset)
})

test('logs objects', function (t) {
  var message = { message: 'test-message' }
  var fakeAmqp = new FakeAmqp()

  t.test('Setup', function (t) {
    log4js.clearAppenders()
    mockery.registerMock('amqp', {
      createConnection: function () {
        fakeAmqp.connect()
        return fakeAmqp
      }
    })
    t.end()
  })

  t.test(function (t) {
    var index = require('../lib/index')

    log4js.addAppender(index.configure({}), 'test')

    fakeAmqp.setupCb = function () {
      log4js.getLogger('test').info(message)
      t.equal(fakeAmqp.messages.length, 1, 'one message was sent: ' + util.inspect(fakeAmqp.messages))
      t.deepEqual(fakeAmqp.messages[ 0 ].data, message)
      t.end()
    }
  })

  t.test('Teardown', mockeryReset)
})

test('logEventInterceptor transforms logEvents', function (t) {
  var message = { message: 'test-message' }
  var fakeAmqp = new FakeAmqp()

  t.test('Setup', function (t) {
    log4js.clearAppenders()
    mockery.registerMock('amqp', {
      createConnection: function () {
        fakeAmqp.connect()
        return fakeAmqp
      }
    })
    t.end()
  })

  t.test(function (t) {
    var index = require('../lib/index')

    log4js.addAppender(index.configure({
      logEventInterceptor: function (logEvent, additionalInfo) {
        return logEvent.data.message
      }
    }), 'test')

    fakeAmqp.setupCb = function () {
      log4js.getLogger('test').info(message)
      t.equal(fakeAmqp.messages.length, 1, 'one message was sent: ' + util.inspect(fakeAmqp.messages))
      t.deepEqual(fakeAmqp.messages[ 0 ], message.message)
      t.end()
    }
  })

  t.test('Teardown', mockeryReset)
})

test('Teardown', function (t) {
  mockery.disable()
  t.end()
})
