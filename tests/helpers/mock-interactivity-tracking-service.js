import InteractivityTrackingService from 'ember-interactivity/services/interactivity-tracking';

export default InteractivityTrackingService.extend({
  _trackedComponentCalls: null,
  _trackedRouteCalls: null,

  init() {
    this._super(...arguments);
    this.resetInvocations();
  },

  trackComponent(data) {
    this._trackedComponentCalls.push(data);
  },

  trackRoute(data) {
    this._trackedRouteCalls.push(data);
  },

  resetInvocations() {
    this._trackedComponentCalls = [];
    this._trackedRouteCalls = [];
  }
});
