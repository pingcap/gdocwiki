import React from 'react';
import { useGapi } from './utils';
import {
  Content,
  Header,
  HeaderContainer,
  HeaderGlobalBar,
  HeaderName,
  InlineLoading,
  SideNav,
} from 'carbon-components-react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { HeaderUserAction, Nav } from './layout';
import { DocTreeProvider } from './context/DocTree';
import DocPage from './pages/DocPage';

function App() {
  const { gapiLoaded } = useGapi();

  if (!gapiLoaded) {
    return <InlineLoading description="Loading Google API" />;
  }

  return (
    <Router>
      <DocTreeProvider>
        <HeaderContainer
          render={() => (
            <>
              <Header>
                <HeaderName href="#" prefix="Gdoc Wiki">
                  Home
                </HeaderName>
                <HeaderGlobalBar>
                  <HeaderUserAction />
                </HeaderGlobalBar>
                <SideNav expanded>
                  <Nav />
                </SideNav>
              </Header>
              <Content>
                <div className="bx--grid">
                  <div className="bx--row">
                    <section className="bx--offset-lg-3 bx--col-lg-13">
                      <Switch>
                        <Route path="/doc/:id">
                          <DocPage />
                        </Route>
                      </Switch>
                    </section>
                  </div>
                </div>
              </Content>
            </>
          )}
        />
      </DocTreeProvider>
    </Router>
  );
}

export default App;
