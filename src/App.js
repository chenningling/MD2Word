import React, { useState } from 'react';
import { Layout } from 'antd';
import styled from 'styled-components';

// 导入组件
import Header from './components/Header/Header';
import MarkdownEditor from './components/MarkdownEditor/MarkdownEditor';
import WordPreview from './components/WordPreview/WordPreview';
import FormatSettings from './components/FormatSettings/FormatSettings';
import Sidebar from './components/Sidebar/Sidebar';

// 导入上下文
import { DocumentProvider } from './contexts/DocumentContext/DocumentContext';

// 样式
const StyledLayout = styled(Layout)`
  height: 100vh;
`;

const ContentLayout = styled(Layout)`
  display: flex;
  flex-direction: row;
  flex: 1;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

function App() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const toggleSettings = () => {
    setSettingsVisible(!settingsVisible);
  };

  return (
    <DocumentProvider>
      <StyledLayout>
        <Header 
          toggleSettings={toggleSettings} 
          settingsVisible={settingsVisible}
        />
        <ContentLayout>
          <Sidebar 
            visible={sidebarVisible} 
            toggleSidebar={toggleSidebar} 
          />
          <MainContent>
            <MarkdownEditor />
            <WordPreview />
          </MainContent>
          <FormatSettings 
            visible={settingsVisible} 
            toggleSettings={toggleSettings} 
          />
        </ContentLayout>
      </StyledLayout>
    </DocumentProvider>
  );
}

export default App; 