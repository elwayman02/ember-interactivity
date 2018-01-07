import { bind } from '@ember/runloop';
import Service from '@ember/service';
import {
  getLatencySubscriptionId,
  getLatencyReportingName
} from 'ember-interactivity/utils/interactivity';
import {
  RouteInteractivitySubscriber,
  ComponentInteractivitySubscriber
} from 'ember-interactivity/utils/interactivity-subscriber';

/**
 * This service keeps track of all rendered components that have reported that they
 * are ready for user interaction. This service also allows a Route to monitor for a
 * custom interactivity condition to be met.
 *
 * Use with these mixins: component-interactivity & route-interactivity
 */
export default Service.extend({
  /**
   * The current route being tracked for interactivity
   */
  _currentRouteSubscriber: null,

  /**
   * Components that rely on their children to report interactivity
   */
  _componentSubscribers: null,

  /**
   * Setup private variables
   *
   * @method init
   */
  init() {
    this._super(...arguments);

    this._componentSubscribers = {};
    this._currentRouteSubscriber = new RouteInteractivitySubscriber();
  },

  /**
   * Track a component's latency. When components become interactive or non-interactive, check the component's
   * `isInteractive()` to determine if the component is deemed "ready for user interaction".
   *
   * @method subscribeComponent
   *
   * @param {object} options - Single configuration parameter that expects the following attributes:
   *    {string} id - Unique component id
   *    {function} isInteractive - Method for checking interactivity conditions as reports come in
   * @returns {RSVP.Promise} Resolves when interactivity conditions are met
   */
  subscribeComponent({ id, isInteractive }) {
    let subscriber = new ComponentInteractivitySubscriber({
      id,
      isInteractive
    });

    this._componentSubscribers[id] = subscriber;
    return subscriber.promise;
  },

  /**
   * Unsubscribe the component from latency tracking. This is used for teardown.
   *
   * @method unsubscribeComponent
   */
  unsubscribeComponent(subscriberId) {
    this._componentSubscribers[subscriberId] = null;
  },

  /**
   * Track a route's latency. When components become interactive or non-interactive, check the route's
   * `isInteractive()` to determine if the route is deemed "ready for user interaction". Only one route should be tracked at a time.
   *
   * @method subscribeRoute
   *
   * @param {object} options - Single configuration parameter that expects the following attributes:
   *    {string} name - The name of the subscriber (used in testing) // TODO: Still needed?
   *    {function} isInteractive - Method for checking interactivity conditions as reports come in
   * @returns {RSVP.Promise} Resolves when interactivity conditions are met
   */
  subscribeRoute(options) {
    this.unsubscribeRoute();
    this._currentRouteSubscriber.subscribe(options);
    this._currentRouteSubscriber.checkInteractivity();
    return this._currentRouteSubscriber.promise.then(bind(this, this.unsubscribeRoute));
  },

  /**
   * Unsubscribe the current route from latency tracking. This is used for teardown.
   *
   * @method unsubscribeRoute
   */
  unsubscribeRoute() {
    this._currentRouteSubscriber.unsubscribe();
  },

  /**
   * Find the correct parent subscriber for the given component
   *
   * @method subscriberFor
   *
   * @param {Ember.Component} reporter - The component reporting interactivity
   * @returns {ComponentInteractivitySubscriber|RouteInteractivitySubscriber} The parent subscriber
   */
  subscriberFor(reporter) {
    let componentSubscriber = this._findParentSubscriber(reporter);

    if (componentSubscriber) {
      return componentSubscriber;
    }

    return this._currentRouteSubscriber;
  },

  /**
   * Notify the service that a reporter became interactive.
   * Checks the appropriate subscriber for interactivity conditions.
   *
   * @method didReporterBecomeInteractive
   *
   * @param {Ember.Component} reporter - The component that is now interactive
   */
  didReporterBecomeInteractive(reporter) {
    let subscriber = this.subscriberFor(reporter);
    subscriber.childBecameInteractive(reporter);
    subscriber.checkInteractivity();
  },

  /**
   * Notify the service that a reporter became non-interactive.
   * Checks the appropriate subscriber for interactivity conditions.
   *
   * @method didReporterBecomeNonInteractive
   *
   * @param {Ember.Component} reporter - The component that is no longer interactive
   */
  didReporterBecomeNonInteractive(reporter) {
    let subscriber = this.subscriberFor(reporter);
    subscriber.childBecameNonInteractive(reporter);
    subscriber.checkInteractivity();
  },

  /**
   * Finds whether a parent of this component is subscribed to the interactivity service
   *
   * @method _findParentSubscriber
   * @private
   *
   * @param {Ember.Component} child - The child component
   * @returns {ComponentInteractivitySubscriber|undefined} The parent subscriber, if it exists
   */
  _findParentSubscriber(child) {
    let parentId, parentName;

    while (parentName !== 'application-wrapper' && child.parentView) {
      parentId = getLatencySubscriptionId(child.parentView);
      if (this._componentSubscribers[parentId]) {
        return this._componentSubscribers[parentId];
      }
      parentName = getLatencyReportingName(child.parentView);
      child = child.parentView;
    }
  }
});
