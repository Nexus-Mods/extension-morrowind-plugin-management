import { types, util } from 'vortex-api';
import { setKnownPlugins, setPluginsOrder, setPluginSources, setLocalState } from './actions';

// reducer
export const SessionReducer: types.IReducerSpec = {
  reducers: {
    [setLocalState as any]: (state, payload) => {
      const { knownPlugins, pluginSources, pluginOrder } = payload;
      const copy = { ...state, knownPlugins, pluginSources, pluginOrder };
      return copy;
    },
    [setKnownPlugins as any]: (state, payload) => {
      const copy = { ...state, knownPlugins: payload };
      return copy;
    },
    [setPluginsOrder as any]: (state, payload) => {
      const copy = { ...state, pluginOrder: payload };
      return copy;
    },
    [setPluginSources as any]: (state, payload) => {
      const copy = { ...state, pluginSources: payload };
      return copy;
    },
  },
  defaults: {},
};
