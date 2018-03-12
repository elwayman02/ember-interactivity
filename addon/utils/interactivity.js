/**
 * Utility functions which can be used to compose isInteractive definitions
 */

/**
 * Builds the component name based on its `toString` property
 * Ex: <app@component:foo-bar/baz-bat::ember1234>
 * Returns 'foo-bar/baz-bat'
 *
 * WARNING: These ids are not unique! Use `getLatencySubscriptionId` for
 * a unique identifier. Use these names for linking top-down relationships
 * where the unique id is not known by the parent.
 *
 * @method getLatencyReportingName
 *
 * @param {Ember.Component} component - An Ember Component
 * @return {string} The name of the component
 */

export function getLatencyReportingName(component) {
  return component.toString().split(':')[1];
}

/**
 * Builds the unique component id based on its `toString` property
 * Ex: <app@component:foo-bar/baz-bat::ember1234>
 *
 * @method getLatencySubscriptionId
 *
 * @param {Ember.Component} component - An Ember Component
 * @return {string} The unique id of the component
 */
export function getLatencySubscriptionId(component) {
  return component.toString();
}
