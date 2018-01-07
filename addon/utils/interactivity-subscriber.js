import { assert } from '@ember/debug';
import RSVP from 'rsvp';

/**
 * The base class for all interactivity subscribers
 *
 * @class InteractivitySubscriber
 */
class InteractivitySubscriber {
  /**
   * Creates the InteractivitySubscriber
   *
   * @method constructor
   *
   * @param {object} options - Single configuration parameter that expects the following attributes:
   *    {string} name - The name of the subscriber (used in testing) // TODO: Still needed?
   *    {function} isInteractive - Method for checking interactivity conditions as reports come in
   */
  constructor({ name, isInteractive } = {}) {
    this.name = name;
    this._isInteractive = isInteractive;
    this._reporters = {};
    this._didReportInteractive = this._didReportInteractive.bind(this);
  }

  /**
   * Checks if the subscriber is now interactive. If so, it resolves the pending promise.
   */
  checkInteractivity() {
    if (this._isInteractive(this._didReportInteractive)) {
      this.resolve();
    }
  }

  /**
   * Marks a child reporter as interactive.
   * Updates a count of how many instances of this component are currently interactive.
   *
   * @method childBecameInteractive
   * @param {Ember.Component} reporter - The child component
   */
  childBecameInteractive(reporter) {
    let latencyReportingName = reporter.get('_latencyReportingName');

    if (!this._reporters[latencyReportingName]) {
      this._reporters[latencyReportingName] = 1;
    } else {
      this._reporters[latencyReportingName]++;
    }
  }

  /**
   * Marks a child reporter as non-interactive.
   * Updates a count of how many instances of this component are currently interactive.
   *
   * @method childBecameNonInteractive
   * @param {Ember.Component} reporter - The child component
   */
  childBecameNonInteractive(reporter) {
    let latencyReportingName = reporter.get('_latencyReportingName');

    if (this._reporters[latencyReportingName]) {
      this._reporters[latencyReportingName]--;
    }
  }

  /**
   * Check to see if a particular reporter is interactive
   *
   * @method _didReportInteractive
   * @private
   *
   * @param {string} name - Name of a reporter
   * @param {object} options - Options for modifying the check
   *    {number} count - If provided, expects a reporter to have become interactive exactly this many times
   * @returns {boolean} - Whether or not the reporter is currently interactive
   */
  _didReportInteractive(name, options) {
    if (options && options.count) {
      return this._reporters[name] === options.count;
    }

    return !!this._reporters[name];
  }
}

/**
 * Extends InteractivitySubscriber with component-specific functionality
 *
 * @class ComponentInteractivitySubscriber
 */
export class ComponentInteractivitySubscriber extends InteractivitySubscriber {
  /**
   * Creates the ComponentInteractivitySubscriber
   *
   * @method constructor
   *
   * @param {object} options - Single configuration parameter that expects the following attributes:
   *    {string} id - The id of the subscriber // TODO: Is this needed?
   *    {function} isInteractive - Method for checking interactivity conditions as reports come in
   */
  constructor({ id, isInteractive }) {
    assert('Every subscriber must provide an isInteractive method', typeof(isInteractive) === 'function');
    super(...arguments);
    this.id = id;
    this.promise = new RSVP.Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });

    // If the subscriber is already interactive, we should resolve immediately.
    this.checkInteractivity();
  }
}

/**
 * Extends InteractivitySubscriber with route-specific functionality
 *
 * @class RouteInteractivitySubscriber
 */
export class RouteInteractivitySubscriber extends InteractivitySubscriber {
  /**
   * Creates the RouteInteractivitySubscriber
   *
   * @method constructor
   */
  constructor() {
    super(...arguments);
    this.isActive = false;
  }

  /**
   * Make this the active route subscriber
   *
   * @method subscribe
   *
   * @param {object} options - Single configuration parameter that expects the following attributes:
   *    {string} name - The name of the subscriber (used in testing) // TODO: Still needed?
   *    {function} isInteractive - Method for checking interactivity conditions as reports come in
   */
  subscribe({ name, isInteractive }) {
    this.isActive = true;
    this.name = name;
    this._isInteractive = isInteractive;
    this.promise = new RSVP.Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  /**
   * Unsubscribe this route
   *
   * @method unsubscribe
   */
  unsubscribe() {
    this.isActive = false;
    this.name = null;
    this.promise = null;
    this.resolve = null;
    this.reject = null;
  }

  /**
   * Check interactivity if this is the active route
   *
   * @method checkInteractivity
   */
  checkInteractivity() {
    if (!this.isActive) {
      return;
    }

    super.checkInteractivity();
  }
}
