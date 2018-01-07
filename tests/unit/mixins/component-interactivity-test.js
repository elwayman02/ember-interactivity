import EmberObject from '@ember/object';
import ComponentInteractivityMixin from 'ember-interactivity/mixins/component-interactivity';
import { module, test } from 'qunit';

module('Unit | Mixin | component interactivity');

// Replace this with your real tests.
test('it works', function(assert) {
  let ComponentInteractivityObject = EmberObject.extend(ComponentInteractivityMixin);
  let subject = ComponentInteractivityObject.create();
  assert.ok(subject);
});
