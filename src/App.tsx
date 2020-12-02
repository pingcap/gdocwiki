import { Add20, Close20, Menu20, Subtract20 } from '@carbon/icons-react';
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  InlineLoading,
} from 'carbon-components-react';
import React, { useCallback, useState } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import config from './config';
import { DocTreeProvider } from './context/DocTree';
import { RenderStackProvider } from './context/RenderStack';
import useGapi from './hooks/useGapi';
import { Content, HeaderUserAction, Sider } from './layout';
import HeaderTitle from './layout/HeaderTitle';
import Page from './pages/Page';

function App() {
  const { gapiLoaded } = useGapi();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleOpenTOC = useCallback(() => setIsExpanded(true), []);
  const handleCloseTOC = useCallback(() => setIsExpanded(false), []);

  if (!gapiLoaded) {
    return <InlineLoading description="Loading Google API..." />;
  }

  return (
    <Router>
      <DocTreeProvider>
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
            <HeaderGlobalAction key="expand" aria-label="Expand All">
              <Add20 />
            </HeaderGlobalAction>
          )}
          {isExpanded && (
            <HeaderGlobalAction key="collapse" aria-label="Collapse All">
              <Subtract20 />
            </HeaderGlobalAction>
          )}
          <HeaderTitle />
          <HeaderGlobalBar>
            <HeaderUserAction />
          </HeaderGlobalBar>
          <Sider isExpanded={isExpanded} />
        </Header>
        <Content isExpanded={isExpanded}>
          <RenderStackProvider>
            <Switch>
              <Route exact path="/">
                <Page overrideId={config.rootId} />
              </Route>
              <Route exact path="/view/:id">
                <Page />
              </Route>
            </Switch>
          </RenderStackProvider>
        </Content>
      </DocTreeProvider>
    </Router>
  );
}

export default App;
