import EmberObject from '@ember/object';
import RouteInteractivityMixin from 'ember-interactivity/mixins/route-interactivity';
import { module, test } from 'qunit';

module('Unit | Mixin | route interactivity');

// Replace this with your real tests.
test('it works', function(assert) {
  let RouteInteractivityObject = EmberObject.extend(RouteInteractivityMixin);
  let subject = RouteInteractivityObject.create();
  assert.ok(subject);
});
