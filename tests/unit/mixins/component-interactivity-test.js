import { module } from 'qunit';
import { setupTest } from 'ember-qunit';
import test from 'ember-sinon-qunit/test-support/test';
import RSVP from 'rsvp';
import EmberObject from '@ember/object';
import Service from '@ember/service';
import { setOwner } from '@ember/application';
import { sendEvent as send } from '@ember/object/events';
import ComponentInteractivityMixin from 'ember-interactivity/mixins/component-interactivity';
import MockInteractivityTrackingService from 'ember-interactivity/test-support/mock-interactivity-tracking-service';

const COMPONENT_NAME = 'foo-bar';

const InteractivityStub = Service.extend({
  didReporterBecomeInteractive() {},
  didReporterBecomeNonInteractive() {},
  subscribeComponent() {},
  unsubscribeComponent() {}
});

module('Unit | Mixin | component interactivity', function (hooks) {
  setupTest(hooks);

  hooks.beforeEach(function () {
    this.BaseObject = EmberObject.extend(ComponentInteractivityMixin, {
      interactivity: InteractivityStub.create(),
      interactivityTracking: MockInteractivityTrackingService.create(),
      toString() {
        return `<ember-interactivity@component:${COMPONENT_NAME}::ember1234>`;
      }
    });
  });

  test('_latencyReportingName', function (assert) {
    assert.expect(1);
    let subject = this.BaseObject.create();
    setOwner(subject, this.owner);
    let id = subject.get('_latencyReportingName');

    assert.equal(id, COMPONENT_NAME, 'latencyReportingName pulls the component name from toString');
  });

  test('didReporterBecomeInteractive fires when reportInteractive is called', function (assert) {
    assert.expect(2);
    let subject = this.BaseObject.create();
    setOwner(subject, this.owner);
    let interactivity = subject.get('interactivity');

    let stub = this.stub(interactivity, 'didReporterBecomeInteractive');

    subject.reportInteractive();

    assert.ok(stub.calledOnce, 'didReporterBecomeInteractive was called on the interactivity service');
    assert.ok(stub.calledWithExactly(subject), 'the component was sent to interactivity service');
  });

  test('didReporterBecomeNonInteractive fires when reportNonInteractive is called', function (assert) {
    assert.expect(2);
    let subject = this.BaseObject.create();
    setOwner(subject, this.owner);
    let interactivity = subject.get('interactivity');

    let stub = this.stub(interactivity, 'didReporterBecomeNonInteractive');

    subject.reportNonInteractive();

    assert.ok(stub.calledOnce, 'didReporterBecomeNonInteractive was called on the interactivity service');
    assert.ok(stub.calledWithExactly(subject), 'the component was sent to interactivity service');
  });

  test('didReporterBecomeNonInteractive fires automatically on willDestroyElement', function (assert) {
    assert.expect(2);
    let subject = this.BaseObject.create();
    setOwner(subject, this.owner);
    let interactivity = subject.get('interactivity');

    let stub = this.stub(interactivity, 'didReporterBecomeNonInteractive');

    send(subject, 'willDestroyElement');

    assert.ok(stub.calledOnce, 'didReporterBecomeNonInteractive was called on the interactivity service');
    assert.ok(stub.calledWithExactly(subject), 'the component was sent to interactivity service');
  });

  test('monitors child components if isInteractive is defined', function (assert) {
    assert.expect(1);
    let subject = this.BaseObject.create({ isInteractive() {} });
    setOwner(subject, this.owner);
    let interactivity = subject.get('interactivity');
    let promise = RSVP.Promise.resolve(null, 'test subscribeComponent promise');
    let stub = this.stub(interactivity, 'subscribeComponent').returns(promise);

    subject.willInsertElement();
    assert.ok(stub.calledOnce, 'the component invokes interactivity.subscribeComponent');
  });

  test('stops monitoring when it is destroyed', function (assert) {
    assert.expect(1);
    let subject = this.BaseObject.create({ isInteractive() {} });
    setOwner(subject, this.owner);
    let interactivity = subject.get('interactivity');
    let stub = this.stub(interactivity, 'unsubscribeComponent');

    subject.willDestroyElement();
    assert.ok(stub.calledOnce, 'the component invokes interactivity.unsubscribeComponent');
  });
});
