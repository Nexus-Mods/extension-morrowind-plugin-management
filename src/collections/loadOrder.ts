import { actions, selectors, types, util } from 'vortex-api';
import { GAME_ID, OFFICIAL_PLUGINS } from '../statics';
import { setPluginOrder, refreshPlugins } from '../index';

import { IMorrowindCollectionsData } from './types';
import { ILocalState } from '../types';

export async function exportLoadOrder(api: types.IExtensionApi,
                                      modIds: string[]): Promise<string[]> {
  const state = api.getState();
  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  if (profileId === undefined) {
    return Promise.reject(new util.ProcessCanceled('Invalid profile id'));
  }

  const reactive: ILocalState = util.getSafe(state, ['session', 'morrowind'], {}) as any;
  if (reactive === undefined) {
    return Promise.resolve(undefined);
  }

  const filteredOrder = reactive.pluginOrder.filter(plugin =>
    OFFICIAL_PLUGINS.includes(plugin) || modIds.includes(reactive.pluginSources[plugin]));

  return Promise.resolve(filteredOrder);
}

export async function importLoadOrder(api: types.IExtensionApi,
                                      collection: IMorrowindCollectionsData): Promise<void> {
  const state = api.getState();

  const profileId = selectors.lastActiveProfileForGame(state, GAME_ID);
  if (profileId === undefined) {
    return Promise.reject(new util.ProcessCanceled(`Invalid profile id ${profileId}`));
  }

  // refresh the local state.
  await refreshPlugins(api);

  // set the plugin order contained in this collection.
  setPluginOrder(api, collection.loadOrder);
  return Promise.resolve(undefined);
}
