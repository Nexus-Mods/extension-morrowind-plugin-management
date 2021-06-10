import DraggableList from './DraggableList';
import PluginEntry from './PluginEntry';

import * as React from 'react';
import { Panel } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ComponentEx, DNDContainer, FlexLayout, MainPage, util } from 'vortex-api';

import { NAMESPACE } from './statics';

import { ILocalState } from './types';

const PanelX: any = Panel;

interface IPluginListProps {
  onSetPluginOrder: (enabled: string[]) => void;
}

interface IConnectedProps {
  localState: ILocalState;
}

type IProps = IPluginListProps & IConnectedProps;

class PluginList extends ComponentEx<IProps, {}> {
  public render(): JSX.Element {
    const { t } = this.props;
    const { knownPlugins, pluginOrder } = this.props.localState;
    const disabledPlugins = (knownPlugins || []).filter(plugin => (pluginOrder || []).indexOf(plugin) === -1);

    return (
      <MainPage>
        <MainPage.Body>
          <Panel id='morrowind-plugin-panel'>
            <PanelX.Body>
              <DNDContainer style={{ height: '100%' }}>
                <FlexLayout type='row'>
                  <FlexLayout.Flex>
                    <FlexLayout type='column' className='plugin-column'>
                      <FlexLayout.Fixed>
                        <h4>{t('Enabled')}</h4>
                      </FlexLayout.Fixed>
                      <FlexLayout.Flex>
                        <DraggableList
                          id='enabled'
                          items={pluginOrder || []}
                          itemRenderer={PluginEntry}
                          apply={this.applyEnabled}
                        />
                      </FlexLayout.Flex>
                    </FlexLayout>
                  </FlexLayout.Flex>
                  <FlexLayout.Flex>
                    <FlexLayout type='column' className='plugin-column'>
                      <FlexLayout.Fixed>
                        <h4>{t('Disabled')}</h4>
                      </FlexLayout.Fixed>
                      <FlexLayout.Flex>
                        <DraggableList
                          id='disabled'
                          items={disabledPlugins}
                          itemRenderer={PluginEntry}
                          apply={this.applyDisabled}
                        />
                      </FlexLayout.Flex>
                    </FlexLayout>
                  </FlexLayout.Flex>
                </FlexLayout>
              </DNDContainer>
            </PanelX.Body>
          </Panel>
        </MainPage.Body>
      </MainPage>
    );
  }

  private applyEnabled = (ordered: string[]) => {
    this.props.onSetPluginOrder(ordered);
  }

  private applyDisabled = (ordered: string[]) => {
    // this event doesn't really matter, does it?
  }
}

const emptyObj = {};
function mapStateToProps(state: any, ownProps: IProps): IConnectedProps {
  return {
    localState: util.getSafe(state, ['session', 'morrowind'], emptyObj) as any,
  };
}

function mapDispatchToProps(dispatch: any): any {
  return emptyObj;
}

export default withTranslation(['common', NAMESPACE])(
  connect(mapStateToProps, mapDispatchToProps)(
    PluginList) as any) as React.ComponentClass<IPluginListProps>;
