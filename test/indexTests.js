"use strict";
var util = require('util');
var test = require('tape');
var log4js = require('log4js');
var mockery = require('mockery');
var EventEmitter = require('events').EventEmitter;

function FakeAmqp() {
	var self = this;
	EventEmitter.call(self);

	self.messages = [];
	self.setupCb = function() {};

	self.exchangeObj = {
		publish: function (routingKey, msg, options) {
			self.messages.push(msg);
		}
	};
}
util.inherits(FakeAmqp, EventEmitter);

FakeAmqp.prototype.connect = function () {
	var self = this;
	process.nextTick(function () {
		self.emit("ready", {});
	});
};

FakeAmqp.prototype.exchange = function () {
	var self = this;

	var cb = Array.prototype.slice.call(arguments).pop();
	cb(self.exchangeObj);

	process.nextTick(function() {
		self.setupCb();
	});
};

test("Setup", function (t) {
	mockery.enable({
		useCleanCache: true,
		warnOnReplace: false,
		warnOnUnregistered: false
	});
	t.end();
});

test("a log item written before the appender is connected works", function(t) {
	var fakeAmqp = new FakeAmqp();

	t.test("Setup", function(t) {
		log4js.clearAppenders();
		mockery.registerMock('amqp', {
			createConnection: function () {
				fakeAmqp.connect();
				return fakeAmqp;
			}
		});
		t.end();
	});

	t.test(function (t) {
		var message = 'test-message';
		var index = require('../lib/index');
		log4js.addAppender(index.configure({}), 'test');
		log4js.getLogger('test').info(message);

		process.nextTick(function() {
			t.equal(fakeAmqp.messages.length, 1, "one message was sent: " + util.inspect(fakeAmqp.messages));
			t.equal(fakeAmqp.messages[0], message, "'" + message + "' was sent");
			t.end();
		});
	});

	t.test("Teardown", function (t) {
		mockery.deregisterAll();
		mockery.resetCache();
		t.end();
	});
});

test("a log item written after the appender is connected works", function(t) {
	var fakeAmqp = new FakeAmqp();

	t.test("Setup", function(t) {
		log4js.clearAppenders();
		mockery.registerMock('amqp', {
			createConnection: function () {
				fakeAmqp.connect();
				return fakeAmqp;
			}
		});
		t.end();
	});

	t.test(function (t) {
		var message = 'test-message';
		var index = require('../lib/index');

		log4js.addAppender(index.configure({}), 'test');

		fakeAmqp.setupCb = function() {
			log4js.getLogger('test').info(message);
			t.equal(fakeAmqp.messages.length, 1, "one message was sent: " + util.inspect(fakeAmqp.messages));
			t.equal(fakeAmqp.messages[0], message, "'" + message + "' was sent");
			t.end();
		};
	});

	t.test("Teardown", function (t) {
		mockery.deregisterAll();
		mockery.resetCache();
		t.end();
	});
});

test("multiple log items written before the appender is connected work", function(t) {
	var fakeAmqp = new FakeAmqp();

	t.test("Setup", function(t) {
		log4js.clearAppenders();
		mockery.registerMock('amqp', {
			createConnection: function () {
				fakeAmqp.connect();
				return fakeAmqp;
			}
		});
		t.end();
	});

	t.test(function (t) {
		var message = 'test-message';
		var index = require('../lib/index');
		log4js.addAppender(index.configure({}), 'test');

		log4js.getLogger('test').info('test message 0');
		log4js.getLogger('test').info('test message 1');
		log4js.getLogger('test').info('test message 2');

		process.nextTick(function() {
			t.equal(fakeAmqp.messages.length, 3, "three messages were sent: " + util.inspect(fakeAmqp.messages));
			t.end();
		});
	});

	t.test("Teardown", function (t) {
		mockery.deregisterAll();
		mockery.resetCache();
		t.end();
	});
});

test("multiple log items written after the appender is connected work", function(t) {
	var fakeAmqp = new FakeAmqp();

	t.test("Setup", function(t) {
		log4js.clearAppenders();
		mockery.registerMock('amqp', {
			createConnection: function () {
				fakeAmqp.connect();
				return fakeAmqp;
			}
		});
		t.end();
	});

	t.test(function (t) {
		var message = 'test-message';
		var index = require('../lib/index');

		log4js.addAppender(index.configure({}), 'test');

		fakeAmqp.setupCb = function() {
			setTimeout(function () {
				log4js.getLogger('test').info('test message 0');
			}, 0);
			setTimeout(function () {
				log4js.getLogger('test').info('test message 1');
			}, 100);
			setTimeout(function () {
				log4js.getLogger('test').info('test message 2');
			}, 200);
			setTimeout(function () {
				t.equal(fakeAmqp.messages.length, 3, "three messages were sent: " + util.inspect(fakeAmqp.messages));
				t.end();
			}, 300);
		};
	});

	t.test("Teardown", function (t) {
		mockery.deregisterAll();
		mockery.resetCache();
		t.end();
	});
});

test("Teardown", function (t) {
	mockery.disable();
	t.end();
});
