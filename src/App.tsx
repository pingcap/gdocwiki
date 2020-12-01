import React, { useCallback, useState } from 'react';
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderName,
  InlineLoading,
} from 'carbon-components-react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Content, HeaderUserAction, Sider } from './layout';
import { DocTreeProvider } from './context/DocTree';
import { Add20, Close20, Menu20, Subtract20 } from '@carbon/icons-react';
import Page from './pages/Page';
import useGapi from './hooks/useGapi';

function App() {
  const { gapiLoaded } = useGapi();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleOpenTOC = useCallback(() => setIsExpanded(true), []);
  const handleCloseTOC = useCallback(() => setIsExpanded(false), []);

  if (!gapiLoaded) {
    return <InlineLoading description="Loading Google API" />;
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
          <HeaderName href="#" prefix="Gdoc Wiki:">
            Home
          </HeaderName>
          <HeaderGlobalBar>
            <HeaderUserAction />
          </HeaderGlobalBar>
          <Sider isExpanded={isExpanded} />
        </Header>
        <Content isExpanded={isExpanded}>
          <Switch>
            <Route path="/view/:id">
              <Page />
            </Route>
          </Switch>
        </Content>
      </DocTreeProvider>
    </Router>
  );
}

export default App;
