import { moduleFor, test } from 'ember-qunit';

moduleFor('service:interactivity-tracking', 'Unit | Service | interactivity tracking', {
  needs: ['service:metrics']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});
