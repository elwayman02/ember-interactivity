import { getOwner } from '@ember/application';

export default function getInteractivityConfig(scope) {
  let env = getOwner(scope).resolveRegistration('config:environment');
  return env.interactivity || {};
}
