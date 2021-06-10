import * as _ from 'lodash';
import * as React from 'react';
import { Button, ListGroup, ListGroupItem } from 'react-bootstrap';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ComponentEx, EmptyPlaceholder, FlexLayout, selectors, types, util } from 'vortex-api';

import { sanitizeLocalState } from './util';
import { IExtendedInterfaceProps } from './types';
import { ILocalState } from '../types';

import { NAMESPACE, OFFICIAL_PLUGINS } from '../statics';

interface IBaseState {
  enabled: string[];
  disabled: string[];
}

interface IConnectedProps {
  gameId: string;
  mods: { [modId: string]: types.IMod };
  profile: types.IProfile;
  localState: ILocalState;
}

type IProps = IExtendedInterfaceProps & IConnectedProps;
type IComponentState = IBaseState;

class CollectionsDataView extends ComponentEx<IProps, IComponentState> {
  private static genState(props: IProps) {
    const { localState, mods, collection } = props;
    const sanitized = sanitizeLocalState(localState, mods, collection);
    const { knownPlugins, pluginOrder } = sanitized;
    const known = [].concat(OFFICIAL_PLUGINS, knownPlugins);
    const disabled = known.filter(plugin => !pluginOrder.includes(plugin));
    const enabled = known.filter(plugin => pluginOrder.includes(plugin));
    return { enabled, disabled };
  }

  public static getDerivedStateFromProps(newProps: IProps, state: IComponentState) {
    const { enabled, disabled } = CollectionsDataView.genState(newProps);
    return (enabled !== state.enabled || disabled !== state.disabled)
      ? { enabled, disabled } : null;
  }

  constructor(props: IProps) {
    super(props);
    this.initState({
      enabled: [],
      disabled: [],
    });
  }

  public componentDidMount() {
    this.nextState = CollectionsDataView.genState(this.props);
  }

  public render(): JSX.Element {
    const { t } = this.props;
    const { enabled, disabled } = this.state;
    return (!!enabled && Object.keys(enabled).length !== 0)
      ? (
        <div style={{ overflow: 'auto' }}>
          <h4>{t('Load Order')}</h4>
          <p>
          {t('Below is a preview of the load order for the mods that ' +
             'are included in the current collection. If you wish to modify the load ' +
             'please do so by opening the Load Order page; any changes made there ' +
             'will be reflected in this collection.')
          }
          </p>
          <FlexLayout id='morrowind-collections-layout' type='row'>
            <FlexLayout.Fixed style={{ width: '100%' }}>
              <h6>{t('Enabled Mods')}</h6>
              <ListGroup id='morrowind-list-group'>
                {enabled.map((en, idx) => this.renderModEntry(en, idx))}
              </ListGroup>
            </FlexLayout.Fixed>
            <FlexLayout.Fixed style={{ width: '100%' }}>
              <h6>{t('Disabled Mods')}</h6>
              <ListGroup id='morrowind-list-group'>
                {disabled.map((dis, idx) => this.renderModEntry(dis, idx))}
              </ListGroup>
            </FlexLayout.Fixed>
          </FlexLayout>
        </div>
    ) : this.renderPlaceholder();
  }

  private openLoadOrderPage = () => {
    this.context.api.events.emit('show-main-page', 'generic-loadorder');
  }
  private renderOpenLOButton = () => {
    const { t } = this.props;
    return (<Button
      id='btn-more-mods'
      className='collection-add-mods-btn'
      onClick={this.openLoadOrderPage}
      bsStyle='ghost'
    >
      {t('Open Load Order Page')}
    </Button>);
  }

  private renderPlaceholder = () => {
    const { t } = this.props;
    return (
      <EmptyPlaceholder
        icon='sort-none'
        text={t('You have no load order entries (for the current mods in the collection)')}
        subtext={this.renderOpenLOButton()}
      />
    );
  }

  private renderModEntry = (loEntry: string, idx: number) => {
    const key = `${idx}-${loEntry}`;
    const classes = ['morrowind-load-order-entry'];
    return (
      <ListGroupItem
        key={key}
        className={classes.join(' ')}
      >
        <FlexLayout type='row'>
          <p className='load-order-index'>{idx}</p>
          <p>{loEntry}</p>
        </FlexLayout>
      </ListGroupItem>
    );
  }
}

const emptyObj = {};
function mapStateToProps(state: types.IState, ownProps: IProps): IConnectedProps {
  const profile = selectors.activeProfile(state) || undefined;
  return {
    gameId: profile?.gameId,
    mods: util.getSafe(state, ['persistent', 'mods', profile.gameId], emptyObj),
    profile,
    localState: util.getSafe(state, ['session', 'morrowind'], emptyObj) as any,
  };
}

function mapDispatchToProps(dispatch: any): any {
  return emptyObj;
}

export default withTranslation(['common', NAMESPACE])(
  connect(mapStateToProps, mapDispatchToProps)(
    CollectionsDataView) as any) as React.ComponentClass<IExtendedInterfaceProps>;
