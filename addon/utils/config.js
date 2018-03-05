import { getOwner } from '@ember/application';

export default function getInteractivityConfig(scope) {
  let owner = getOwner(scope);
  if (owner) {
    let env = owner.resolveRegistration('config:environment');
    if (env) {
      return env.interactivity || {};
    }
  }

  return {};
}
