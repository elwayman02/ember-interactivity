import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import { on } from '@ember/object/evented';
import Mixin from '@ember/object/mixin';
import { assign } from '@ember/polyfills';
import { bind } from '@ember/runloop';
import { inject as injectService } from '@ember/service';
import getConfig from 'ember-interactivity/utils/config';
import { getTimeAsFloat } from 'ember-interactivity/utils/date';
import {
  getLatencySubscriptionId,
  getLatencyReportingName
} from 'ember-interactivity/utils/interactivity';
import { INITIALIZING_LABEL, INTERACTIVE_LABEL, markTimeline } from 'ember-interactivity/utils/timeline-marking';

/**
 * For components that should inform the interactivity service that they are now ready for user interaction.
 *
 * In your component, you MUST call `reportInteractive` or define `isInteractive`.
 */
export default Mixin.create({
  interactivity: injectService(),
  interactivityTracking: injectService(),

  /**
   * A component may implement the method isInteractive, which returns true if all conditions for interactivity have been met
   *
   * If isInteractive is defined, it is used to see if conditions are met and then fires the interactive event.
   * If isInteractive is not defined, the developer must call `reportInteractive` manually.
   *
   * @method isInteractive
   * @param {function} didReportInteractive - Method that takes a reporter name and returns whether it is interactive
   * @returns {boolean} True if all interactivity conditions have been met
   */
  isInteractive: null,

  /**
   * Subscribe component for interactivity tracking
   */
  willInsertElement() {
    this._super(...arguments);

    this._isInitializing();
    if (this._isSubscriber()) { // Component has implemented the `isInteractive` method
      this.get('interactivity').subscribeComponent({
        id: this.get('_latencySubscriptionId'),
        name: this.get('_latencyReportingName'),
        isInteractive: bind(this, this.isInteractive)
      }).then(bind(this, this._becameInteractive));
    }
  },

  /**
   * Unsubscribe component from interactivity tracking
   */
  willDestroyElement() {
    this._super(...arguments);

    if (this._isSubscriber()) {
      this.get('interactivity').unsubscribeComponent(this.get('_latencySubscriptionId'));
    }
  },

  /**
   * This method will notify the `interactivity` service that the component has
   * finished rendering and is now interactive for the user.
   *
   * Example:
   * interactiveAfterRendered: on('didInsertElement', function () {
   *   scheduleOnce('afterRender', this, this.reportInteractive);
   * })
   *
   * @method reportInteractive
   */
  reportInteractive() {
    assert(`Do not invoke reportInteractive if isInteractive is defined: {{${this.get('_latencyReportingName')}}}`, !this._isSubscriber());
    this.get('interactivity').didReporterBecomeInteractive(this);
    this._becameInteractive();
  },

  /**
   * Call this method if the component is no longer interactive (e.g. reloading data)
   * Also executes by default during component teardown
   *
   * @method reportNonInteractive
   */
  reportNonInteractive: on('willDestroyElement', function () {
    this.get('interactivity').didReporterBecomeNonInteractive(this);
  }),

  /**
   * Human-readable component name
   * @private
   */
  _latencyReportingName: computed(function () {
    return getLatencyReportingName(this);
  }),

  /**
   * Unique component ID, useful for distinguishing multiple instances of the same component
   * @private
   */
  _latencySubscriptionId: computed(function () {
    return getLatencySubscriptionId(this);
  }),

  /**
   * Marks that the component has become interactive and sends a tracking event.
   * If enabled, adds the event to the performance timeline.
   *
   * @method _becameInteractive
   * @private
   */
  _becameInteractive() {
    let timestamp = getTimeAsFloat();
    this.get('interactivity').unsubscribeComponent(this.get('_latencySubscriptionId'));
    this._markTimeline(INTERACTIVE_LABEL);

    this._sendEvent('componentInteractive', {
      clientTime: timestamp,
      timeElapsed: timestamp - this._componentInitializingTimestamp
    });

    this.get('interactivity').didReporterBecomeInteractive(this);
  },

  /**
   * Marks that the component has begun rendering.
   * If enabled, adds the event to the performance timeline.
   *
   * @method _isInitializing
   * @private
   */
  _isInitializing() {
    this._componentInitializingTimestamp = getTimeAsFloat();
    this._markTimeline(INITIALIZING_LABEL);
    this._sendEvent('componentInitializing', { clientTime: this._componentInitializingTimestamp });
  },

  /**
   * Determines whether this component is a subscriber (relies on instrumented child components)
   *
   * @method _isSubscriber
   * @private
   *
   * @returns {boolean} Subscriber status
   */
  _isSubscriber() {
    return !!this.isInteractive;
  },

  /**
   * Creates a unique label for use in the performance timeline
   *
   * @method _getTimelineLabel
   * @private
   *
   * @param {string} type - The type of label being created
   * @returns {string} The timeline label
   */
  _getTimelineLabel(type) { // BUG: Components that have "component" in their name will not have a unique label, due to the parsing logic below
    let latencyId = this.get('_latencySubscriptionId').split('component:')[1].slice(0, -1); // Make the component name more readable but still unique
    return `Component ${type}: ${latencyId}`;
  },

  /**
   * Marks the performance timeline with component latency events
   *
   * @method _markTimeline
   * @private
   *
   * @param {string} type - The event type
   */
  _markTimeline(type) {
    let options = getConfig(this);
    if (options.timelineMarking && (options.timelineMarking.disableComponents || (options.timelineMarking.disableLeafComponents && !this._isSubscriber()))) {
      return;
    }

    markTimeline(type, bind(this, this._getTimelineLabel));
  },

  /**
   * Sends tracking information for the component's interactivity
   *
   * @method _sendEvent
   * @private
   *
   * @param {string} name - Name of the event
   * @param {object} data - Data attributes for the event
   */
  _sendEvent(name, data = {}) {
    let options = getConfig(this);
    if (options.tracking && (options.tracking.disableComponents || (options.tracking.disableLeafComponents && !this._isSubscriber()))) {
      return;
    }

    this.get('interactivityTracking').trackComponent(assign({
      event: name,
      component: this.get('_latencyReportingName'),
      componentId: this.get('_latencySubscriptionId')
    }, data));
  }
});
