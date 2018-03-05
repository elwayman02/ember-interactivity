import EmberObject from '@ember/object';
import RouteInteractivityMixin from 'ember-interactivity/mixins/route-interactivity';
import { module, test } from 'qunit';

module('Unit | Mixin | route interactivity', function () {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let RouteObject = EmberObject.extend(RouteInteractivityMixin);
    let subject = RouteObject.create();
    assert.ok(subject);
  });
});
