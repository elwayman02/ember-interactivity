import Service from '@ember/service';
import FastbootCompatMixin from 'ember-interactivity/mixins/fastboot-compat';
import { module, test } from 'qunit';

module('Unit | Mixin | fastboot compat');

test('mixin fastboot service available - mocked', function (assert) {
  let FastbootCompatObject = Service.extend(FastbootCompatMixin, {
    _fastboot: { isFastBoot: true } // eslint-disable-line ember/avoid-leaking-state-in-ember-objects
  });
  let subject = FastbootCompatObject.create();
  assert.ok(subject.get('_isFastBoot'), 'it should be true');
});


test('mixin fastboot service not available - mocked', function (assert) {
  let FastbootCompatObject = Service.extend(FastbootCompatMixin, {
    _fastboot: null
  });
  let subject = FastbootCompatObject.create();
  assert.notOk(subject.get('_isFastBoot'), 'it should be false');
});
