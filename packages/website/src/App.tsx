import { Add20, Close20, Menu20, Subtract20 } from '@carbon/icons-react';
import { Header, HeaderGlobalAction, HeaderGlobalBar } from 'carbon-components-react';
import Trigger from 'rc-trigger';
import { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Redirect, Router, Switch, Route } from 'react-router-dom';
import { useLocalStorage } from 'react-use';
import { ExtensionBanner } from './components';
import { ExtInstallStatusProvider } from './context/ExtInstallStatus';
import { RenderStackProvider } from './context/RenderStack';
import useLoadDriveFiles from './hooks/useLoadDriveFiles';
import {
  HeaderExtraActions,
  HeaderSearch,
  HeaderTitle,
  Content,
  HeaderUserAction,
  Sider,
  HeaderUserMenu,
} from './layout';
import responsiveStyle from './layout/responsive.module.scss';
import Page from './pages/Page';
import { SearchResult, SearchTag } from './pages/Search';
import SearchAllTags from './pages/Search/AllTags';
import Settings from './pages/Settings';
import { selectMapIdToFile } from './reduxSlices/files';
import {
  collapseAll,
  expand,
  selectSidebarOpen,
  closeSidebar,
  openSidebar,
} from './reduxSlices/siderTree';
import { history } from './utils';

function DriveFilesLoader({ children }) {
  useLoadDriveFiles();
  return <>{children}</>;
}

function useExtensionBannerController() {
  const [isDismissed, setIsDismissed] = useLocalStorage('extension.banner.dismissed', false);
  const [visible, setVisible] = useState(!isDismissed);

  const handleDismiss = useCallback(
    (ev: any) => {
      ev?.preventDefault();
      setIsDismissed(true);
      setVisible(false);
    },
    [setIsDismissed]
  );

  const showBanner = useCallback(() => {
    setVisible(true);
  }, []);

  return {
    visible,
    handleDismiss,
    showBanner,
  };
}

function App() {
  const dispatch = useDispatch();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const mapIdToFile = useSelector(selectMapIdToFile);

  const handleOpenTOC = () => dispatch(openSidebar());
  const handleCloseTOC = () => dispatch(closeSidebar());
  const handleTreeExpand = useCallback(() => {
    let ids: string[] = [];
    for (let id in mapIdToFile) {
      ids.push(id);
    }
    dispatch(expand(ids));
  }, [mapIdToFile, dispatch]);
  const handleTreeCollapse = useCallback(() => dispatch(collapseAll()), [dispatch]);

  const extBannerCtrl = useExtensionBannerController();

  return (
    <ExtInstallStatusProvider>
      <ExtensionBanner visible={extBannerCtrl.visible} onDismiss={extBannerCtrl.handleDismiss} />
      <Router history={history}>
        <DriveFilesLoader>
          <Header aria-label="global actions">
            {!sidebarOpen && (
              <HeaderGlobalAction key="open" aria-label="Open TOC" onClick={handleOpenTOC}>
                <Menu20 />
              </HeaderGlobalAction>
            )}
            {sidebarOpen && [
              <HeaderGlobalAction key="close" aria-label="Close TOC" onClick={handleCloseTOC}>
                <Close20 />
              </HeaderGlobalAction>,
              <HeaderGlobalAction
                key="expand"
                aria-label="Expand All"
                onClick={handleTreeExpand}
                className={responsiveStyle.hideInPhone}
              >
                <Add20 />
              </HeaderGlobalAction>,
              <HeaderGlobalAction
                key="collapse"
                aria-label="Collapse All"
                onClick={handleTreeCollapse}
                className={responsiveStyle.hideInPhone}
              >
                <Subtract20 />
              </HeaderGlobalAction>,
            ]}
            <HeaderTitle />
            <HeaderExtraActions onExtensionAction={extBannerCtrl.showBanner} />
            <HeaderGlobalBar className={responsiveStyle.hideInPhone}>
              <HeaderSearch />
              <Trigger
                popupAlign={{
                  points: ['tr', 'br'],
                }}
                mouseLeaveDelay={0.2}
                zIndex={10000}
                action="hover"
                popup={<HeaderUserMenu />}
                popupTransitionName="slide-up"
              >
                <div>
                  <HeaderUserAction />
                </div>
              </Trigger>
            </HeaderGlobalBar>
            <Sider isExpanded={sidebarOpen} />
          </Header>
          <Content isExpanded={sidebarOpen}>
            <RenderStackProvider>
              <Switch>
                {/* translate lazy copy & paste from Google Docs */}
                <Redirect to="/view/:id" from="/document/d/:id" />
                <Redirect to="/view/:id" from="/document/d/:id/*" />
                <Redirect to="/view/:id" from="/https\://:domain/document/d/:id" />
                <Redirect to="/view/:id" from="/https\://:domain/document/d/:id/*" />

                <Route exact path="/">
                  <Page />
                </Route>
                <Route path="/view/:id/edit">
                  <Page docMode="edit" />
                </Route>
                <Route path="/view/:id/preview">
                  <Page docMode="preview" />
                </Route>
                <Route exact path="/view/:id/settings">
                  <Settings />
                </Route>
                <Route path="/view/:id">
                  <Page docMode="view" />
                </Route>
                <Route exact path="/search/keyword/:keyword">
                  <SearchResult />
                </Route>
                <Route exact path="/search/tag">
                  <SearchAllTags />
                </Route>
                <Route exact path="/search/tag/:tag">
                  <SearchTag />
                </Route>
                <Route path="/n/:slug/:id">
                  <Page />
                </Route>
              </Switch>
            </RenderStackProvider>
          </Content>
        </DriveFilesLoader>
      </Router>
    </ExtInstallStatusProvider>
  );
}

export default App;
