import { module } from 'qunit';
import { setupTest } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';
import { waitUntil } from '@ember/test-helpers';
import RSVP from 'rsvp';
import EmberObject from '@ember/object';
import Service from '@ember/service';
import { run } from '@ember/runloop';
import RouteInteractivityMixin from 'ember-interactivity/mixins/route-interactivity';
import MockInteractivityTrackingService from 'ember-interactivity/test-support/mock-interactivity-tracking-service';

const ROUTE_NAME = 'foo.bar';
const CRITICAL_COMPONENTS = ['foo', 'bar'];
let resolved;
let resolve;

const InteractivityStub = Service.extend({
  subscribeRoute() {
    return new RSVP.Promise((res) => {
      resolve = () => {
        res();
        resolved = true;
      };
    });
  },

  unsubscribeRoute() {}
});

const VisibilityStub = Service.extend({ lostVisibility: false });

module('Unit | Mixin | route interactivity', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.BaseObject = EmberObject.extend(RouteInteractivityMixin, {
      routeName: ROUTE_NAME,
      criticalComponents: CRITICAL_COMPONENTS,
      documentVisibility: VisibilityStub.create(),
      interactivity: InteractivityStub.create(),
      interactivityTracking: MockInteractivityTrackingService.create(),
    });
    resolved = false;
  });

  test('_isLeafRoute - truthy', function (assert) {
    let transition = { targetName: ROUTE_NAME };

    let subject = this.BaseObject.create();
    let isLeafRoute = subject._isLeafRoute(transition);

    assert.ok(isLeafRoute, 'correctly identifies leaf route');
  });

  test('_isLeafRoute - falsey', function (assert) {
    let transition = { targetName: 'stuff.things' };

    let subject = this.BaseObject.create();
    let isLeafRoute = subject._isLeafRoute(transition);

    assert.notOk(isLeafRoute, 'correctly identifies non-leaf route');
  });

  test('_isLeafRoute - truthy w/ saved transition', function (assert) {
    let transition = { targetName: ROUTE_NAME };

    let subject = this.BaseObject.create({
      _latestTransition: transition
    });
    let isLeafRoute = subject._isLeafRoute();

    assert.ok(isLeafRoute, 'correctly identifies leaf route');
  });

  test('_isLeafRoute - falsey w/ saved transition', function (assert) {
    let transition = { targetName: 'stuff.things' };
    let subject = this.BaseObject.create({
      _latestTransition: transition
    });

    let isLeafRoute = subject._isLeafRoute();

    assert.notOk(isLeafRoute, 'correctly identifies non-leaf route');
  });

  test('_sendTransitionEvent', function (assert) {
    let transition = { targetName: ROUTE_NAME };

    let subject = this.BaseObject.create({
      _latestTransition: transition
    });

    let phase = 'Yarrr';
    let targetName = 'Narf';
    let lostVisibility = subject.get('documentVisibility.lostVisibility');
    let additionalData = { foo: 'bar' };

    subject._sendTransitionEvent(phase, targetName, additionalData);

    assert.equal(subject.get('interactivityTracking._trackedRouteCalls').length, 1, 'tracking event was sent');

    let data = subject.get('interactivityTracking._trackedRouteCalls')[0];
    assert.equal(data.event, `route${phase}`, 'event name passed');
    assert.equal(data.destination, targetName, 'target name passed');
    assert.equal(data.routeName, ROUTE_NAME, 'route name passed');
    assert.equal(data.lostVisibility, lostVisibility, 'lost visibility status passed');
    assert.ok(data.clientTime, 'timestamp created');
    assert.equal(data.foo, additionalData.foo, 'additional data passed');
  });

  test('_monitorInteractivity', function (assert) {
    assert.expect(5);

    let subject = this.BaseObject.create({
      isInteractive() {}
    });
    let interactivity = subject.get('interactivity');

    let spy = this.spy(interactivity, 'subscribeRoute');

    subject._monitorInteractivity();

    assert.ok(spy.calledOnce, 'subscribeRoute was called');
    assert.ok(subject.get('_monitoringInteractivity'), 'monitoring active');

    let { args } = spy.firstCall;
    assert.equal(typeof(args[0].isInteractive), 'function', 'isInteractive method passed');

    let stub = this.stub(subject, '_sendTransitionCompleteEvent');

    resolve();

    waitUntil(() => {
      return resolved;
    }).then(() => {
      assert.notOk(subject.get('_monitoringInteractivity'), 'monitoring inactive');
      assert.ok(stub.calledOnce, '_sendTransitionCompleteEvent called');
    });
  });

  test('monitorInteractivity - not monitoring', function (assert) {
    assert.expect(1);

    let subject = this.BaseObject.create();

    subject._monitorInteractivity();

    let stub = this.stub(subject, '_sendTransitionCompleteEvent');

    subject.set('_monitoringInteractivity', false);
    resolve();

    waitUntil(() => {
      return resolved;
    }).then(() => {
      assert.notOk(stub.calledOnce, '_sendTransitionCompleteEvent not called if monitoring is inactive');
    });
  });

  test('didTransition - not leaf route', function (assert) {
    let subject = this.BaseObject.create();
    let stub = this.stub(subject, '_isLeafRoute').callsFake(() => false);

    let result = subject.actions.didTransition.call(subject);

    assert.ok(stub.calledOnce, '_isLeafRoute was called');
    assert.ok(result, 'returns true unless _super is false');
  });

  test('didTransition - default', function (assert) {
    let stub = this.stub(run, 'scheduleOnce');

    let subject = this.BaseObject.create();
    this.stub(subject, '_isLeafRoute').callsFake(() => true);

    subject.actions.didTransition.call(subject);

    assert.ok(stub.calledOnce, 'scheduleOnce was called');
    let { args } = stub.firstCall;
    assert.equal(args[0], 'afterRender', 'afterRender scheduled');
    assert.equal(args[1], subject, 'correct context passed');
    assert.equal(args[2], subject._sendTransitionCompleteEvent, 'correct method passed');
  });

  test('didTransition - interactivity', function (assert) {
    let subject = this.BaseObject.create({
      isInteractive() {}
    });
    this.stub(subject, '_isLeafRoute').callsFake(() => true);

    let stub = this.stub(subject, '_monitorInteractivity');

    subject.actions.didTransition.call(subject);

    assert.ok(stub.calledOnce, '_monitorInteractivity was called');
  });

  test('_sendTransitionCompleteEvent', function (assert) {
    let subject = this.BaseObject.create();
    let sendTransitionStub = this.stub(subject, '_sendTransitionEvent');

    subject._resetHasFirstTransitionCompleted();

    subject._sendTransitionCompleteEvent(1234);
    let additionalData1 = sendTransitionStub.firstCall.args[2];
    assert.equal(additionalData1.isAppLaunch, true, 'first complete transition marked as app launch');
    assert.ok(additionalData1.timeElapsed, 'first complete transition includes time elapsed');

    subject._sendTransitionCompleteEvent(1234);
    let additionalData2 = sendTransitionStub.secondCall.args[2];
    assert.equal(additionalData2.isAppLaunch, false, 'second complete transition not marked as app launch');
    assert.notOk(additionalData2.timeElapsed, 'second complete transition does not include time elapsed');
  });
});
