import { Add20, ChevronDown20, Close20, Menu20, Subtract20 } from '@carbon/icons-react';
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderNavigation,
  InlineLoading,
} from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import Trigger from 'rc-trigger';
import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import { NavMenu } from './components';
import { getConfig } from './config';
import { PageReloaderProvider } from './context/PageReloader';
import { RenderStackProvider } from './context/RenderStack';
import useGapi from './hooks/useGapi';
import useLoadDriveFiles from './hooks/useLoadDriveFiles';
import { HeaderTitle, Content, HeaderUserAction, Sider, HeaderUserMenu } from './layout';
import HeaderSearch from './layout/HeaderSearch';
import Page from './pages/Page';
import { SearchResult } from './pages/Search';
import { selectMapIdToFile } from './reduxSlices/files';
import { collapseAll, expand } from './reduxSlices/sider-tree';

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
          {getConfig().NavItems.length > 0 && (
            <HeaderNavigation>
              {getConfig().NavItems.map((item) => {
                switch (item.type) {
                  case 'link':
                    return (
                      <HeaderMenuItem href={item.href} target={item.target}>
                        {item.text ?? ''}
                      </HeaderMenuItem>
                    );
                  case 'group':
                    return (
                      <Trigger
                        popupAlign={{
                          points: ['tl', 'bl'],
                        }}
                        action="hover"
                        popup={
                          <NavMenu>
                            {item.children?.map((childItem) => {
                              switch (childItem.type) {
                                case 'divider':
                                  return <NavMenu.Divider>{childItem.text ?? ''}</NavMenu.Divider>;
                                case 'link':
                                  return (
                                    <NavMenu.Link href={childItem.href} target={childItem.target}>
                                      {childItem.text ?? ''}
                                    </NavMenu.Link>
                                  );
                                default:
                                  return null;
                              }
                            })}
                          </NavMenu>
                        }
                        popupTransitionName="slide-up"
                      >
                        <HeaderMenuItem href="javascript:;">
                          <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
                            <span>{item.text ?? ''}</span>
                            <ChevronDown20 />
                          </Stack>
                        </HeaderMenuItem>
                      </Trigger>
                    );
                  default:
                    return null;
                }
              })}
            </HeaderNavigation>
          )}
          <HeaderGlobalBar>
            <HeaderSearch />
            <Trigger
              popupAlign={{
                points: ['tr', 'br'],
              }}
              action="hover"
              popup={<HeaderUserMenu />}
              popupTransitionName="slide-up"
            >
              <div>
                <HeaderUserAction />
              </div>
            </Trigger>
          </HeaderGlobalBar>
          <Route exact path="/">
            <Sider isExpanded={isExpanded} overrideId={getConfig().REACT_APP_ROOT_ID} />
          </Route>
          <Route exact path="/view/:id">
            <Sider isExpanded={isExpanded} />
          </Route>
          <Route path="/search/:keyword">
            <Sider isExpanded={isExpanded} overrideId={getConfig().REACT_APP_ROOT_ID} />
          </Route>
        </Header>
        <Content isExpanded={isExpanded}>
          <RenderStackProvider>
            <PageReloaderProvider>
              <Switch>
                <Route exact path="/">
                  <Page overrideId={getConfig().REACT_APP_ROOT_ID} />
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
