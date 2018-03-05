import { getOwner } from '@ember/application';
import QUnit from 'qunit';

function _getOwner() {
  let context = QUnit.config.current.testEnvironment;

  // getOwner(context) is set by ember-qunit for integration and unit tests
  // context.owner is set by our tests/helpers/module-for-acceptance.js for acceptance tests
  return getOwner(context) || context.owner;
}

QUnit.assert.trackNonInteractivity = function (subscriberName) {
  let service = _getOwner().lookup('service:interactivity');

  let reported = service._reportedSubscribers.findBy('name', subscriberName);

  this.pushResult({
    result: !reported,
    actual: reported,
    expected: 'undefined',
    message: `${subscriberName} reported interactive when it should not have`
  });
};

QUnit.assert.trackInteractivity = function (subscriberName, { count }={}) {
  let service = _getOwner().lookup('service:interactivity');

  let reported = service._reportedSubscribers.filter((subscriber) => {
    return subscriber.name === subscriberName;
  }).map((subscriber) => subscriber.name);

  let result, message;

  if (count) {
    result = reported.length === count;
    if (!result) {
      message = `Expected ${subscriberName} to report interactive at least ${count} times`;
    }
  } else {
    result = !!reported.length;
    if (!result) {
      message = `${subscriberName} did not report interactive`;
    }
  }

  this.pushResult({
    result,
    actual: reported,
    expected: `[ ${count || 1} x ${subscriberName} ]`,
    message
  });
};
