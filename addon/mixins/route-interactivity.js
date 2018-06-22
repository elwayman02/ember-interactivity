import Ember from 'ember';
import Mixin from '@ember/object/mixin';
import { on } from '@ember/object/evented';
import { assign } from '@ember/polyfills';
import { run } from '@ember/runloop';
import { inject as injectService } from '@ember/service';
import IsFastbootMixin from 'ember-is-fastboot/mixins/is-fastboot';
import getConfig from 'ember-interactivity/utils/config';
import { getTimeAsFloat } from 'ember-interactivity/utils/date';
import { INITIALIZING_LABEL, INTERACTIVE_LABEL, markTimeline } from 'ember-interactivity/utils/timeline-marking';

let hasFirstTransitionCompleted = false;

/**
 * Route Mixin route-interactivity (mix into Ember.Route class or individual routes)
 *
 * All routes should emit the following 3 transition events:
 *   1.) validate (i.e. we have begun validating that transition is possible by fetching relevant data, ie model hooks)
 *   2.) execute  (i.e. we are executing the transition by activating the route and scheduling render tasks)
 *   3.) interactive (i.e. we have completed the transition and the route is now interactive)
 */
export default Mixin.create(IsFastbootMixin, {
  interactivity: injectService(),
  interactivityTracking: injectService(),
  visibility: injectService(),

  /**
   * A route may implement the method isInteractive, which returns true if all conditions for interactivity have been met
   *
   * If isInteractive is defined, it is used to see if conditions are met and then fires the transition complete event.
   * If isInteractive is not defined, the transition complete event automatically fires in the afterRender queue.
   *
   * @method isInteractive
   * @param {function} didReportInteractive - Method that takes a reporter name and returns whether it is interactive
   * @return {boolean} True if all interactivity conditions have been met
   */
  isInteractive: null,

  /**
   * Property for storing the transition object to be accessed in
   * lifecycle hooks that do not have it passed in as a parameter
   * @private
   */
  _latestTransition: null,

  /**
   * True when monitoring is active; do not send events when false
   * @private
   */
  _monitoringInteractivity: false,

  /**
   * Capture the incoming transition and send an event for the validate phase of that transition
   *
   * @method beforeModel
   * @param {object} transition - http://emberjs.com/api/classes/Transition.html
   */
  beforeModel(transition) {
    this.set('_latestTransition', transition);
    this._sendTransitionEvent('Initializing', transition.targetName);
    this._markTimeline(INITIALIZING_LABEL);
    return this._super(...arguments);
  },

  /**
   * Initiate monitoring with the interactivity service and send events upon resolution
   *
   * @method _monitorInteractivity
   * @private
   */
  _monitorInteractivity() {
    let isInteractive = this.isInteractive ? run.bind(this, this.isInteractive) : null;
    let options = {
      isInteractive,
      name: this.get('fullRouteName')
    };

    this.set('_monitoringInteractivity', true);
    this.get('interactivity').subscribeRoute(options).then(() => {
      if (this.get('_monitoringInteractivity')) {
        this.set('_monitoringInteractivity', false);
        this._sendTransitionCompleteEvent();
      }
    }).catch((/* error */) => {
      if (this.isDestroyed) { return; }
      if (this.get('_monitoringInteractivity')) {
        this.set('_monitoringInteractivity', false);
        this.get('interactivityTracking').trackError(); // TODO: Add more information here
      }
    });
  },

  /**
   * Send data for transition event
   *
   * @method _sendTransitionEvent
   * @private
   *
   * @param {string} phase - The phase of the transition that this event tracks, used to construct the event name
   * @param {string} targetName - The destination route for the current transition
   * @param {object} data [Optional] - Data to send with the tracking event
   */
  _sendTransitionEvent(phase, targetName, data = {}) {
    if (this.get('_isFastBoot') || this._isFeaturedDisabled('tracking')) {
      return;
    }

    let baseData = {
      event: `route${phase}`,
      destination: targetName,
      routeName: this.get('fullRouteName'),
      lostVisibility: this.get('documentVisibility.lostVisibility'),
      clientTime: getTimeAsFloat()
    };

    this.get('interactivityTracking').trackRoute(assign(baseData, data));
  },

  /**
   * Send data for the "complete transition" event
   *
   * @method _sendTransitionCompleteEvent
   * @private
   */
  _sendTransitionCompleteEvent() {
    if (this.get('_isFastBoot')) {
      return;
    }

    let data;
    if (hasFirstTransitionCompleted) {
      data = {
        isAppLaunch: false
      };
    } else {
      let time = getTimeAsFloat();
      data = {
        isAppLaunch: true,
        timeElapsed: (time*1000) - performance.timing.fetchStart,
        clientTime: time
      };
    }

    let routeName = this.get('fullRouteName');
    this._markTimeline(INTERACTIVE_LABEL);
    this._sendTransitionEvent('Interactive', routeName, data);
    hasFirstTransitionCompleted = true;
  },

  /**
   * Send an event for the execute phase of a transition
   *
   * @method _sendTransitionExecuteEvent
   * @private
   */
  _sendTransitionExecuteEvent: on('activate', function () {
    let transition = this.get('_latestTransition');
    if (transition) {
      this._sendTransitionEvent('Activating', transition.targetName);
    }
  }),

  /**
   * Determine if this is the destination route for the transition (otherwise, it's a parent)
   *
   * @method _isLeafRoute
   * @private
   *
   * @param {object} transition - http://emberjs.com/api/classes/Transition.html
   * @return {boolean} True if this route is the target of the current transition
   */
  _isLeafRoute(transition = this.get('_latestTransition')) {
    return transition && transition.targetName === this.get('fullRouteName');
  },

  /**
   * Creates a unique label for use in the performance timeline
   *
   * @method _getTimelineLabel
   * @private
   *
   * @param {string} type - The type of label being created
   * @return {string} The timeline label
   */
  _getTimelineLabel(type) {
    return `Route ${type}: ${this.get('fullRouteName')}`;
  },

  /**
   * Marks the performance timeline with route latency events
   *
   * @method _markTimeline
   * @private
   *
   * @param {string} type - The event type
   */
  _markTimeline(type) {
    if(Ember.testing || this.get('_isFastBoot') || this._isFeaturedDisabled('timelineMarking')) {
      return;
    }

    markTimeline(type, run.bind(this, this._getTimelineLabel));
  },

  _isFeaturedDisabled(type) {
    let option = getConfig(this)[type];
    return option && (option.disableRoutes || (option.disableParentRoutes && !this._isLeafRoute()));
  },

  /**
   * Used only for testing, to reset internal variables
   *
   * @method _resetHasFirstTransitionCompleted
   * @private
   */
  _resetHasFirstTransitionCompleted() {
    hasFirstTransitionCompleted = false;
  },

  actions: {
    /**
     * Schedule interactivity tracking for leaf routes
     *
     * @method didTransition
     *
     * @return {boolean} Bubble the action unless a lower-order action stopped bubbling
     */
    didTransition() {
      if (this._isLeafRoute()) {
        if (typeof(this.isInteractive) === 'function') {
          this._monitorInteractivity();
        } else {
          run.scheduleOnce('afterRender', this, this._sendTransitionCompleteEvent);
        }
      }

      return this._super(...arguments) !== false; // Check explicitly for falsey value
    },

    /**
     * Reset interactivity monitoring and fire an event if a new transition occurred before monitoring completed
     *
     * @method willTransition
     *
     * @return {boolean} Bubble the action unless a lower-order action stopped bubbling
     */
    willTransition() {
      if (this._isLeafRoute()) {
        if (this.get('_monitoringInteractivity')) {
          this.set('_monitoringInteractivity', false);
          this.get('interactivityTracking').trackError(); // User transitioned away from this route before completion (TODO: should this be an error?)
        }
        this.get('interactivity').unsubscribeRoute();
      }

      return this._super(...arguments) !== false; // Check explicitly for falsey value
    }
  }
});
