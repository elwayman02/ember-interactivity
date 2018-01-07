import Service from '@ember/service';
import getConfig from 'ember-interactivity/utils/config';

export default Service.extend({
  trackComponent() {
    if (this.isComponentInstrumentationDisabled()) {
      return;
    }
  },

  trackRoute() {

  },

  error() {

  },

  isComponentInstrumentationDisabled() {
    let options = getConfig(this);

    return options.instrumentation && options.instrumentation.disableComponents;
  }
});
