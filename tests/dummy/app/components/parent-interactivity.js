import Component from '@ember/component';
import ComponentInteractivity from 'ember-interactivity/mixins/component-interactivity';

export default Component.extend(ComponentInteractivity, {
  isInteractive(didReportInteractive) {
    return didReportInteractive('default-interactivity') &&
      didReportInteractive('delayed-interactivity') && didReportInteractive('beacon:myBeacon');
  }
});
