import Route from '@ember/routing/route';

export default Route.extend({
  redirect() {
    window.location.replace('https://github.com/elwayman02/ember-interactivity/blob/master/README.md');
  }
});
