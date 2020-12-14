import { Add20, Close20, Menu20, Subtract20 } from '@carbon/icons-react';
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  InlineLoading,
} from 'carbon-components-react';
import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import config from './config';
import { PageReloaderProvider } from './context/PageReloader';
import { RenderStackProvider } from './context/RenderStack';
import useGapi from './hooks/useGapi';
import useLoadDriveFiles from './hooks/useLoadDriveFiles';
import { HeaderTitle, Content, HeaderUserAction, Sider, HeaderMenu } from './layout';
import Page from './pages/Page';
import { selectMapIdToFile } from './reduxSlices/files';
import { collapseAll, expand } from './reduxSlices/sider-tree';
import HeaderSearch from './layout/HeaderSearch';
import { SearchResult } from './pages/Search';

function DriveFilesLoader({ children }) {
  useLoadDriveFiles();
  return <>{children}</>;
}

function App() {
  const dispatch = useDispatch();
  const { gapiLoaded } = useGapi();
  const [isExpanded, setIsExpanded] = useState(true);
  const mapIdToFile = useSelector(selectMapIdToFile);

  const handleOpenTOC = useCallback(() => setIsExpanded(true), []);
  const handleCloseTOC = useCallback(() => setIsExpanded(false), []);
  const handleTreeExpand = useCallback(() => {
    let ids: string[] = [];
    for (let id in mapIdToFile) {
      ids.push(id);
    }
    dispatch(expand(ids));
  }, [mapIdToFile, dispatch]);
  const handleTreeCollapse = useCallback(() => dispatch(collapseAll()), [dispatch]);

  const [isMenuOpen, setMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMenuOpen((v) => !v), []);

  if (!gapiLoaded) {
    return <InlineLoading description="Loading Google API..." />;
  }

  return (
    <Router>
      <DriveFilesLoader>
        <Header>
          {!isExpanded && (
            <HeaderGlobalAction key="open" aria-label="Open TOC" onClick={handleOpenTOC}>
              <Menu20 />
            </HeaderGlobalAction>
          )}
          {isExpanded && (
            <HeaderGlobalAction key="close" aria-label="Close TOC" onClick={handleCloseTOC}>
              <Close20 />
            </HeaderGlobalAction>
          )}
          {isExpanded && (
            <HeaderGlobalAction key="expand" aria-label="Expand All" onClick={handleTreeExpand}>
              <Add20 />
            </HeaderGlobalAction>
          )}
          {isExpanded && (
            <HeaderGlobalAction
              key="collapse"
              aria-label="Collapse All"
              onClick={handleTreeCollapse}
            >
              <Subtract20 />
            </HeaderGlobalAction>
          )}
          <HeaderTitle />
          <HeaderGlobalBar>
            <HeaderSearch/>
            <HeaderUserAction toggleMenu={toggleMenu} />
          </HeaderGlobalBar>
          <Route exact path="/">
            <Sider isExpanded={isExpanded} overrideId={config.REACT_APP_ROOT_ID} />
          </Route>
          <Route exact path="/view/:id">
            <Sider isExpanded={isExpanded} />
          </Route>
          <Route path="/search/:keyword">
            <Sider isExpanded={isExpanded} overrideId={config.REACT_APP_ROOT_ID} />
          </Route>
        </Header>
        <HeaderMenu open={isMenuOpen} />
        <Content isExpanded={isExpanded}>
          <RenderStackProvider>
            <PageReloaderProvider>
              <Switch>
                <Route exact path="/">
                  <Page overrideId={config.REACT_APP_ROOT_ID} />
                </Route>
                <Route exact path="/view/:id">
                  <Page />
                </Route>
                <Route path="/search/:keyword">
                  <SearchResult />
                </Route>
              </Switch>
            </PageReloaderProvider>
          </RenderStackProvider>
        </Content>
      </DriveFilesLoader>
    </Router>
  );
}

export default App;
