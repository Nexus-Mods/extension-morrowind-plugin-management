import { types, util } from 'vortex-api';

import { OFFICIAL_PLUGINS } from '../statics';
import { ILocalState } from '../types';

export function isModInCollection(collectionMod: types.IMod, mod: types.IMod) {
  if (collectionMod.rules === undefined) {
    return false;
  }

  return collectionMod.rules.find(rule =>
    util.testModReference(mod, rule.reference)) !== undefined;
}

export function isPluginInCollection(pluginSources: { [pluginName: string]: string },
                                     mods: { [modId: string]: types.IMod },
                                     collection: types.IMod,
                                     plugin: string): boolean {
  if (OFFICIAL_PLUGINS.includes(plugin)) {
    return true;
  }

  const modId = pluginSources?.[plugin];
  if (modId === undefined) {
    return false;
  }

  return (isModInCollection(collection, mods[modId]));
}

export function sanitizeLocalState(localState: ILocalState,
                                   mods: { [modId: string]: types.IMod },
                                   collection?: types.IMod): ILocalState {
  const sanitized = { ...localState };
  sanitized.pluginOrder = (sanitized.pluginOrder || []).filter(plugin =>
    isPluginInCollection(localState.pluginSources, mods, collection, plugin));

  sanitized.knownPlugins = (sanitized.knownPlugins || []).filter(plugin =>
    isPluginInCollection(localState.pluginSources, mods, collection, plugin));

  return sanitized;
}
