export const INITIALIZING_LABEL = 'Initializing';
export const INTERACTIVE_LABEL = 'Interactive';

const MEASURE_LABEL = 'Latency';

export function markTimeline(type, getTimelineLabel) {
  if (performance && performance.mark) { // TODO: Optional heimdall integration?
    performance.mark(getTimelineLabel(type));

    if (performance.measure && type === INTERACTIVE_LABEL) {
      performance.measure(getTimelineLabel(MEASURE_LABEL), getTimelineLabel(INITIALIZING_LABEL), getTimelineLabel(INTERACTIVE_LABEL));
    }
  }
}
