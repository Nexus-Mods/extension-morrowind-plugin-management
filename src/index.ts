import PluginList from './PluginList';

import Promise from 'bluebird';
import * as path from 'path';
import { fs, log, selectors, types, util } from 'vortex-api';
import IniParser, { WinapiFormat } from 'vortex-parse-ini';

import { setPluginsOrder, setLocalState } from './actions';
import { SessionReducer } from './reducers';

import { genCollectionsData, parseCollectionsData } from './collections/collections';
import CollectionsDataView from './collections/CollectionsDataView';
import { IExtendedInterfaceProps, IMorrowindCollectionsData } from './collections/types';
import { GAME_ID } from './statics';

let watcher: fs.FSWatcher;
let refresher: util.Debouncer;

let _MANIFEST: types.IDeploymentManifest;

function onFileChanged(event: string, fileName: string) {
  if (event === 'rename') {
    const ext = path.extname(fileName).toLowerCase();
    if ((ext === '.esm') || (ext === '.esp')) {
      refresher.schedule();
    }
  }
}

function startWatch(state: types.IState) {
  const discovery = state.settings.gameMode.discovered[GAME_ID];
  if ((discovery === undefined) || (discovery.path === undefined)) {
    // this shouldn't happen because startWatch is only called if the
    // game is activated and it has to be discovered for that
    throw new Error('Morrowind wasn\'t discovered');
  }
  watcher = fs.watch(path.join(discovery.path, 'Data Files'), {}, onFileChanged)
    .on('error', err => {
      log('error', 'failed to watch morrowind mod directory for changes', { message: err.message });
    });
}

function stopWatch() {
  if (watcher !== undefined) {
    watcher.close();
    watcher = undefined;
  }
}

function readGameFiles(iniFilePath: string): Promise<string[]> {
  const parser = new IniParser(new WinapiFormat());
  return parser.read(iniFilePath)
    .then(ini => {
      const files = ini.data['Game Files'];
      return Object.keys(files).map(key => files[key]);
    });
}

function updatePluginOrder(iniFilePath: string, plugins: string[]) {
  const parser = new IniParser(new WinapiFormat());
  return parser.read(iniFilePath)
    .then(ini => {
      ini.data['Game Files'] = plugins.reduce((prev, plugin, idx) => {
        prev[`GameFile${idx}`] = plugin;
        return prev;
      }, {});
      return parser.write(iniFilePath, ini);
    });
}

function updatePluginTimestamps(dataPath: string, plugins: string[]): Promise<void> {
  const offset = 946684800;
  const oneDay = 24 * 60 * 60;
  return Promise.mapSeries(plugins, (fileName, idx) => {
    const mtime = offset + oneDay * idx;
    return fs.utimesAsync(path.join(dataPath, fileName), mtime, mtime)
      .catch(err => err.code === 'ENOENT'
        ? Promise.resolve()
        : Promise.reject(err));
  }).then(() => undefined);
}

export function refreshPlugins(api: types.IExtensionApi): Promise<void> {
  const state = api.store.getState();
  const discovery = state.settings.gameMode.discovered[GAME_ID];
  if ((discovery === undefined) || (discovery.path === undefined)) {
    return Promise.resolve();
  }

  const normalize = (plugin: string) => path.basename(plugin).toLowerCase();
  const findPluginSource = (plugin: string) => _MANIFEST?.files !== undefined
    ? _MANIFEST.files.find(file => normalize(file.relPath) === normalize(plugin))?.source
    : undefined;

  return fs.readdirAsync(path.join(discovery.path, 'Data Files'))
    .filter((fileName: string) =>
              ['.esp', '.esm'].indexOf(path.extname(fileName).toLowerCase()) !== -1)
    .then(plugins =>
      readGameFiles(path.join(discovery.path, 'Morrowind.ini'))
        .then(gameFiles => ({ plugins, gameFiles })))
    .then(result => {
      const sources = result.plugins.reduce((accum, iter) => {
        const source = findPluginSource(iter);
        if (source !== undefined) {
          accum[iter] = source;
        }
        return accum;
      }, {});

      result.gameFiles = result.gameFiles.filter(plugin => result.plugins.includes(plugin));

      api.store.dispatch(setLocalState(result.plugins, result.gameFiles, sources));
    });
}

export function setPluginOrder(api: types.IExtensionApi, plugins: string[]) {
  const state = api.store.getState();
  const discovery = state.settings.gameMode.discovered[GAME_ID];
  const iniFilePath = path.join(discovery.path, 'Morrowind.ini');
  updatePluginOrder(iniFilePath, plugins)
    .then(() => updatePluginTimestamps(path.join(discovery.path, 'Data Files'), plugins))
    .then(() => api.store.dispatch(setPluginsOrder(plugins)))
    .catch(err => {
      api.showErrorNotification('Failed to update morrowind.ini',
                                        err, { allowReport: false });
    });
}

function init(context: types.IExtensionContext) {
  context.registerReducer(['session', 'morrowind'], SessionReducer);
  context.registerMainPage('plugins', 'Plugins', PluginList, {
    id: 'morrowind-plugins',
    hotkey: 'E',
    group: 'per-game',
    visible: () => selectors.activeGameId(context.api.store.getState()) === GAME_ID,
    props: () => ({
      onSetPluginOrder: (plugins: string[]) => setPluginOrder(context.api, plugins),
    }),
  });

  context['registerCollectionFeature'](
    'morrowind_collection_data',
    (gameId: string, includedMods: string[]) =>
      genCollectionsData(context, gameId, includedMods),
    (gameId: string, collection: IMorrowindCollectionsData) =>
      parseCollectionsData(context, gameId, collection),
    (t) => t('Morrowind Data'),
    (state: types.IState, gameId: string) => gameId === GAME_ID,
    (CollectionsDataView),
  );

  context.once(() => {
    context.api.events.on('gamemode-activated', (gameMode: string) => {
      if (gameMode === GAME_ID) {
        util.getManifest(context.api, '', GAME_ID)
          .then(manifest => {
            _MANIFEST = manifest;
            startWatch(context.api.store.getState());
          });
      } else {
        stopWatch();
      }
    });

    refresher = new util.Debouncer(() =>
      refreshPlugins(context.api), 1000);
    refresher.schedule();

    context.api.onAsync('did-deploy', (profileId, deployment) => {
      const state = context.api.getState();
      const profile = selectors.profileById(state, profileId);
      if (profile?.gameId !== GAME_ID) {
        return Promise.resolve();
      }
      _MANIFEST = { version: 0, instance: '', files: deployment[''] };
      return refreshPlugins(context.api);
    });

    context.api.setStylesheet('morrowind-plugin-management',
                              path.join(__dirname, 'stylesheet.scss'));

  });
}

export default init;
