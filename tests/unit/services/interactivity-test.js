import { module } from 'qunit';
import { setupTest } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';
import EmberObject from '@ember/object';

let service;

module('Unit | Service | interactivity', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    service = this.owner.lookup('service:interactivity');
  });

  test('tracks interactive reporters', function (assert) {
    assert.expect(2);

    service.subscribeRoute({
      name: 'test.dummy.route.foo',
      isInteractive() {}
    });

    let reporterName = 'foo-bar';

    let mockReporter = EmberObject.create({
      _latencyReportingName: reporterName
    });

    service.didReporterBecomeInteractive(mockReporter);
    assert.equal(service._currentRouteSubscriber._reporters[reporterName], 1, 'registered that the reporter is interactive');
    service.didReporterBecomeNonInteractive(mockReporter);
    assert.equal(service._currentRouteSubscriber._reporters[reporterName], 0, 'registered that the reporter is no longer interactive');
  });

  test('tracks counts for multiple instances of a reporter', function (assert) {
    assert.expect(3);

    service.subscribeRoute({
      name: 'test.dummy.route.foo',
      isInteractive() {}
    });

    let reporterName = 'foo-bar';

    let mockReporter = EmberObject.create({
      _latencyReportingName: reporterName
    });

    let mockReporter2 = EmberObject.create({
      _latencyReportingName: reporterName
    });

    service.didReporterBecomeInteractive(mockReporter);
    assert.equal(service._currentRouteSubscriber._reporters[reporterName], 1, 'registered that the reporter is interactive');
    service.didReporterBecomeInteractive(mockReporter2);
    assert.equal(service._currentRouteSubscriber._reporters[reporterName], 2, 'registered that 2 instances of the reporter are interactive');
    service.didReporterBecomeNonInteractive(mockReporter);
    assert.equal(service._currentRouteSubscriber._reporters[reporterName], 1, 'registered that a single instance is still interactive');
  });

  test('monitors for route interactivity criteria via isInteractive', function (assert) {
    assert.expect(2);

    let completed = false;
    let criticalComponents = ['foo-bar-1', 'foo-bar-2'];
    let options = {
      name: 'test.dummy.route.foo',
      isInteractive(didReportInteractive) {
        return criticalComponents.every((name) => {
          return didReportInteractive(name);
        });
      }
    };

    let mockReporter1 = EmberObject.create({
      _latencyReportingName: criticalComponents[0]
    });

    let mockReporter2 = EmberObject.create({
      _latencyReportingName: criticalComponents[1]
    });

    service.didReporterBecomeInteractive(mockReporter1);
    service.subscribeRoute(options).then(() => {
      completed = true;
      assert.ok(completed, 'reported interactive when all conditions were met');
    });

    assert.notOk(completed, 'did not report interactive before all conditions were met');
    service.didReporterBecomeInteractive(mockReporter2);
  });

  test('checks interactivity for the first parent subscriber', function (assert) {
    assert.expect(3);
    let mockSubscriber = EmberObject.create({
      _latencyReportingId: 'test-parent-subscriber-id',

      isInteractive(didReportInteractive) {
        return didReportInteractive('test-reporter-1');
      },

      parentView: {
        isInteractive() {
          throw new Error('Interactivity traversal should stop at the first subscriber parent');
        }
      }
    });

    let isInteractiveSpy = this.spy(mockSubscriber, 'isInteractive');

    let parentView = {
      parentView: {
        parentView: mockSubscriber
      }
    };

    let mockReporter = EmberObject.create({
      _latencyReportingName: 'test-reporter-1',
      parentView
    });

    service.subscribeComponent({
      id: mockSubscriber.toString(),
      isInteractive: mockSubscriber.isInteractive
    }).then(() => {
      assert.ok(isInteractiveSpy.calledTwice, 'called isInteractive twice');
      assert.ok(isInteractiveSpy.firstCall.returned(false), 'returned false on the first isInteractive check');
      assert.ok(isInteractiveSpy.secondCall.returned(true), 'returned true on the second isInteractive check');
    });

    service.didReporterBecomeInteractive(mockReporter);
  });
});


