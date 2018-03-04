import InteractivityService from 'ember-interactivity/services/interactivity';

export default InteractivityService.extend({
  _reportedSubscribers: null,

  init() {
    this._super(...arguments);
    this.resetInvocations();
  },

  subscribeComponent(options) {
    return this._super(...arguments).then(() => {
      this._reportedSubscribers.push(options);
    });
  },

  subscribeRoute(options) {
    return this._super(...arguments).then(() => {
      this._reportedSubscribers.push(options);
    });
  },

  resetInvocations() {
    this._reportedSubscribers = [];
  }
});
