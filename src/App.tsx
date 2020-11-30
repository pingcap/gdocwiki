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
import { HeaderUserAction, Nav } from './components';
import { DocTreeProvider } from './context/DocTree';

function App() {
  const { gapiLoaded } = useGapi();

  if (!gapiLoaded) {
    return <InlineLoading description="Loading Google API" status="active" />;
  }

  return (
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
                  <section className="bx--offset-lg-3 bx--col-lg-13">hello</section>
                </div>
              </div>
            </Content>
          </>
        )}
      />
    </DocTreeProvider>
  );
}

export default App;
