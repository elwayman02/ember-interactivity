/**
 * Formats the current time as a float
 *
 * @method getTimeAsFloat
 *
 * @return {number} Current time
 */
export function getTimeAsFloat() {
  return new Date().getTime() / 1000;
}
