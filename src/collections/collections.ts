import { selectors, types, util } from 'vortex-api';
import { IMorrowindCollectionsData } from './types';

import { exportLoadOrder, importLoadOrder } from './loadOrder';

export async function genCollectionsData(context: types.IExtensionContext,
                                         gameId: string,
                                         includedMods: string[]) {
  const api = context.api;
  try {
    const loadOrder: string[] = await exportLoadOrder(api, includedMods);
    const collectionData: IMorrowindCollectionsData = {
      loadOrder,
    };
    return Promise.resolve(collectionData);
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function parseCollectionsData(context: types.IExtensionContext,
                                           gameId: string,
                                           collection: IMorrowindCollectionsData) {
  const api = context.api;
  const state = api.getState();
  const profileId = selectors.lastActiveProfileForGame(state, gameId);
  const profile = selectors.profileById(state, profileId);
  if (profile?.gameId !== gameId) {
    return Promise.reject(new util.ProcessCanceled('Last active profile is missing'));
  }
  try {
    await importLoadOrder(api, collection);
  } catch (err) {
    return Promise.reject(err);
  }
}
