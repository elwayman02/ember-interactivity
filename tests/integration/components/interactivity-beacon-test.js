import { module } from 'ember-qunit';
import { setupRenderingTest } from 'ember-qunit';
import { clearRender, render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import test from 'ember-sinon-qunit/test-support/test';
import MockInteractivityService from 'ember-interactivity/test-support/mock-interactivity-service';
import MockInteractivityTrackingService from 'ember-interactivity/test-support/mock-interactivity-tracking-service';

module('interactivity-beacon', 'Integration | Component | interactivity beacon', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.owner.register('service:interactivity', MockInteractivityService);
    this.owner.register('service:interactivity-tracking', MockInteractivityTrackingService);
  });

  test('Beacon registers itself on render', async function (assert) {
    assert.expect(5);

    let interactivityService = this.owner.__container__.lookup('service:interactivity');
    let didReporterBecomeInteractiveSpy = this.spy(interactivityService, 'didReporterBecomeInteractive');
    let didReporterBecomeNonInteractiveSpy = this.spy(interactivityService, 'didReporterBecomeNonInteractive');

    this.set('beaconId', 'myBeaconId');
    await render(hbs('{{interactivity-beacon beaconId=beaconId}}'));

    assert.ok(didReporterBecomeInteractiveSpy.calledOnce, 'beacon called didReporterBecomeInteractive on render');
    assert.equal(didReporterBecomeInteractiveSpy.getCalls()[0].args[0].get('_latencyReportingName'), 'beacon:myBeaconId', 'beacon called didReporterBecomeInteractive with the correct arguments');
    assert.notOk(didReporterBecomeNonInteractiveSpy.calledOnce, 'beacon has not called didReporterBecomeNonInteractive while rendered');

    await clearRender();
    assert.ok(didReporterBecomeNonInteractiveSpy.calledOnce, 'beacon called didReporterBecomeNonInteractive on unrender');
    assert.equal(didReporterBecomeNonInteractiveSpy.getCalls()[0].args[0].get('_latencyReportingName'), 'beacon:myBeaconId', 'beacon called didReporterBecomeNonInteractive with the correct arguments');
  });
});
