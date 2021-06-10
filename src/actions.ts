import { createAction } from 'redux-act';

export const setKnownPlugins = createAction('SET_MORROWIND_KNOWN_PLUGINS',
  (knownPlugins: string[]) => knownPlugins);

export const setPluginsOrder = createAction('SET_MORROWIND_PLUGINS_ORDER',
  (pluginOrder: string[]) => pluginOrder);

export const setPluginSources = createAction('SET_MORROWIND_PLUGIN_SOURCES',
  (pluginSources: { [plugin: string]: string }) => pluginSources);

export const setLocalState = createAction('SET_MORROWIND_LOCAL_STATE',
  (knownPlugins: string[], pluginOrder: string[], pluginSources: { [plugin: string]: string }) =>
    ({ knownPlugins, pluginOrder, pluginSources }));