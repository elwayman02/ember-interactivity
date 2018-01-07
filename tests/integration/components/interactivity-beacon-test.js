import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('interactivity-beacon', 'Integration | Component | interactivity beacon', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{interactivity-beacon}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#interactivity-beacon}}
      template block text
    {{/interactivity-beacon}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
