import Component from '@ember/component';
import { run } from '@ember/runloop';
import { computed } from '@ember/object';
import ComponentInteractivity from 'ember-interactivity/mixins/component-interactivity';
import layout from '../templates/components/interactivity-beacon';

export default Component.extend(ComponentInteractivity, {
  layout,
  beaconId: '',
  _latencyReportingName: computed('beaconId', function () {
    return `beacon:${this.get('beaconId')}`;
  }),
  didInsertElement() {
    this._super(...arguments);
    run.scheduleOnce('afterRender', this, this.reportInteractive);
  }
});
