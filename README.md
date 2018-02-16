Ember Interactivity
===================

[![Build Status](https://travis-ci.org/elwayman02/ember-interactivity.svg?branch=master)](https://travis-ci.org/elwayman02/ember-interactivity)
[![Ember Observer Score](https://emberobserver.com/badges/ember-interactivity.svg)](https://emberobserver.com/addons/ember-interactivity)
[![Code Climate](https://codeclimate.com/github/elwayman02/ember-interactivity/badges/gpa.svg)](https://codeclimate.com/github/elwayman02/ember-interactivity)
[![Greenkeeper badge](https://badges.greenkeeper.io/elwayman02/ember-interactivity.svg)](https://greenkeeper.io/)

Using Google's [RAIL model](https://developers.google.com/web/fundamentals/performance/rail#load), 
we learn to focus on the more critical aspects of a page or component 
in order to improve the user's perception application speed. We define 
*Time to Interactivity* to be the time it takes for the user to perceive 
that the application is ready for interaction.

Check out the [Demo]()!

Installation
------------------------------------------------------------------------------

```
ember install ember-interactivity
```


Usage
------------------------------------------------------------------------------

Ember Interactivity requires developers to instrument routes and 
critical components in order to report when they have completed rendering.

### Route Instrumentation

The `route-interactivity` mixin provides instrumentation for 
route latency. This can be added to all routes:

```javascript
// ext/route.js
import Route from '@ember/routing/route';
import RouteInteractivityMixin from 'ember-interactivity/mixins/route-interactivity';

Route.reopen(RouteInteractivityMixin);
```

```javascript
// app.js
import './ext/route';
```

Alternatively, add the mixin only to the routes you want instrumented:

```javascript
// routes/foo.js
import Route from '@ember/routing/route';
import RouteInteractivityMixin from 'ember-interactivity/mixins/route-interactivity';

export default Route.extend(RouteInteractivityMixin);
```

By default, routes will naively report that it is interactive by 
scheduling an event in the `afterRender` queue. The instrumentation 
will take latency of the model hook into account, as well as any 
top-level render tasks This is an easy, but relatively inaccurate 
method of instrumentation. It is only recommended for routes that 
are either low priority for instrumentation or render only basic 
HTML elements with no components.

For better instrumentation, read how to utilize the 
[isInteractive](#isInteractive) method.

### Components

The `component-interactivity` mixin provides instrumentation for 
component latency. This mixin should be added to all components that 
are required for a route to be interactive. For the most accurate data, 
instrument each top-level component's critical children as well. Non-critical 
components can also be instrumented to understand their own latency, 
even if they are not critical for a route or parent component to render.

Like routes above, we can implement a basic instrumentation strategy via 
the `afterRender` queue. If a component renders only basic HTML elements 
and does not depend on any asynchronous behavior to render, this is an 
ideal approach: 

```handlebars
// templates/components/foo-bar.hbs
<p>I am a basic template with no child components.</p>
```

```javascript
// components/foo-bar.js
import Component from '@ember/component';
import { run } from '@ember/runloop';
import ComponentInteractivity from 'ember-interactivity/mixins/component-interactivity';

export default Component.extend(ComponentInteractivity, {
  didInsertElement() {
    this._super(...arguments);
    run.scheduleOnce('afterRender', this, this.reportInteractive);
  }
});
```

If your component relies on asynchronous behavior (such as data loading), 
you can delay your `afterRender` scheduling until after that behavior completes.

```javascript
// components/foo-bar.js
import Component from '@ember/component';
import { run } from '@ember/runloop';
import ComponentInteractivity from 'ember-interactivity/mixins/component-interactivity';

export default Component.extend(ComponentInteractivity, {
  init() {
    this._super(...arguments);
    
    this.loadData().then(() => {
      run.scheduleOnce('afterRender', this, this.reportInteractive);
    });
  }
});
```

For components that rely on their child components to be interactive, 
read how to utilize the [isInteractive](#isInteractive) method.

### isInteractive

In order to instrument latency more accurately, we define the list of 
components we expect to report as interactive in order to complete 
the critical rendering path of the route/component (known as the "subscriber"). 
This is handled by implementing an `isInteractive` method in each subscriber. 
This method is passed a function that will tell you if a reporter is interactive.

```javascript
// routes/foo.js or components/foo-bar.js
isInteractive(didReportInteractive) {
  return didReportInteractive('first-component') && didReportInteractive('second-component');
}
```

Pass `didReportInteractive` the name of a component the subscriber renders 
that is considered critical for interactivity. Once `isInteractive` 
returns true, the relevant tracking events will be fired.

If you expect the subscriber to render multiple instances of the same component 
(e.g. an `#each` loop), you can pass the expected number to `didReportInteractive`:

```javascript
// routes/foo.js or components/foo-bar.js
isInteractive(didReportInteractive) {
  let count = this.get('someData.length');
  return didReportInteractive('first-component', { count }) && didReportInteractive('second-component');
}
```

If there are multiple interactivity states to consider, simply add those 
conditions to `isInteractive`:

```handlebars
// templates/foo.hbs or templates/components/foo-bar.hbs
{{if someState}}
  {{first-component}}
{{else}}
  {{second-component}}
{{/if}}
```

```javascript
// routes/foo.js or components/foo-bar.js
isInteractive(didReportInteractive) {
  if (this.get('someState')) {
    return didReportInteractive('first-component');
  }
  return didReportInteractive('second-component');
}
```

### Beacons

Often a template has multiple rendering states (e.g. a loading state), 
which may or may not render child components. If such a situation occurs, 
neither basic or complex instrumentation is a perfect fit. To address this, 
Ember Interactivity provides an `interactivity-beacon` component. These 
beacons are simple components that you can append to the end of a template 
block in order to time the rendering of that block.

Provide the beacon with a `beaconId` to give it a unique identifier: 

```handlebars
// routes/foo.js or components/foo-bar.js
{{#if isLoading}}
  <p>Loading...</p>
  {{interactivity-beacon beaconId='foo-loading'}}
{{else}}
  {{first-component}}
  {{second-component}}
{{/if}}
```

Each `beaconId` is appended with 'beacon:' for use in `didReportInteractive`:

```javascript
// routes/foo.js or components/foo-bar.js
isInteractive(didReportInteractive) {
  if (this.get('isLoading')) {
    return didReportInteractive('beacon:foo-loading');
  }
  return didReportInteractive('first-component') && didReportInteractive('second-component');
}
```

### Tracking

~TODO~

### Timeline Marking

Ember Interactivity automatically marks each route/component using the 
[Performance Timeline](https://developer.mozilla.org/en-US/docs/Web/API/Performance_Timeline/Using_Performance_Timeline) 
standard. DevTools such as the [Chrome Timeline](https://developers.google.com/web/tools/chrome-devtools/evaluate-performance/reference) 
can display the timings for easy visualization of the critical rendering waterfall. 
This can help developers identify bottlenecks for optimizing time to interactivity.

Note: It's important to realize that in some cases, components you may not 
consider to be critical are creating rendering bottlenecks in your application. 
Look for suspicious gaps in the rendering visualization to identify these situations.

### Configuration

Developers can toggle individual features of Ember Interactivity by 
adding an `interactivity` object to their application's environment config. 
This can be useful if you only want features run in certain environments, 
or if you want to sample a percentage of your users to stay within data storage limits.

Three features can be configured:

* `instrumentation` - Toggle instrumentation altogether
* `timelineMarking` - Toggle marking the performance timeline
* `tracking` - Toggle sending tracking events

Each feature can be configured for three subsets of the addon:

* `disableComponents` - Set true to disable for all components
* `disableLeafComponents` - Set true to disable for child components 
(those that do not implement `isInteractive`). This is useful if you 
only want a feature enabled for subscribers (parent routes/components).
* `disableRoutes` - Set true to disable for all routes

```javascript
// config/environment.js
module.exports = function(environment) {
  let ENV = {
    interactivity: {
      tracking: {
        disableLeafComponents: true
      },
      timelineMarking: {
        disableRoutes: true
      }
    }
  };
  return ENV;
};
```

#### Overrides

TODO: Per-instance Overrides


Contributing
------------------------------------------------------------------------------

### Installation

* `git clone https://www.github.com/elwayman02/ember-interactivity.git`
* `cd ember-interactivity`
* `yarn install`

### Linting

* `yarn lint:js`
* `yarn lint:js --fix`

### Running tests

* `ember test` – Runs the test suite on the current Ember version
* `ember test --server` – Runs the test suite in "watch mode"
* `yarn test` – Runs `ember try:each` to test your addon against multiple Ember versions

### Running the dummy application

* `ember serve`
* Visit the dummy application at [http://localhost:4200](http://localhost:4200).

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).

License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
