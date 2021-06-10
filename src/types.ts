export interface ILocalState {
  knownPlugins: string[];
  pluginOrder: string[];
  pluginSources: { [id: string]: string };
}
