import EmberRouter from '@ember/routing/router';
import config from 'dummy/config/environment';
import { inject as service } from '@ember/service';
import { scheduleOnce } from '@ember/runloop';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
  @service('metrics') metrics;

  didTransition() {
    this._super(...arguments);
    this._trackPage();
  }

  _trackPage() {
    scheduleOnce('afterRender', this, () => {
      const page = this.get('url');
      const title = this.getWithDefault('currentRouteName', 'unknown');

      this.get('metrics').trackPage({ page, title, event: 'pageViewed' });
    });
  }
}

Router.map(function() {
  this.route('docs');
});
