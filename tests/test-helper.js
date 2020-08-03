import Application from 'dummy/app';
import config from 'dummy/config/environment';
import { setApplication } from '@ember/test-helpers';
import { start } from 'ember-qunit';

import 'ember-interactivity/test-support/assert-interactivity';

setApplication(Application.create(config.APP));

start();
