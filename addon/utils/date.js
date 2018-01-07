/**
 * Formats the current time as a float
 *
 * @method getTimeAsFloat
 *
 * @returns {number} Current time
 */
export function getTimeAsFloat() {
  return new Date().getTime() / 1000;
}
