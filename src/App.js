import React, { useState, useRef, useEffect } from 'react';
import { Layout } from 'antd';
import styled from 'styled-components';

// 导入组件
import Header from './components/Header/Header';
import MarkdownEditor from './components/MarkdownEditor/MarkdownEditor';
import WordPreview from './components/WordPreview/WordPreview';
import FormatSettings from './components/FormatSettings/FormatSettings';
import Sidebar from './components/Sidebar/Sidebar';
import Resizer from './components/Resizer/Resizer';

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

const EditorContainer = styled.div`
  width: ${props => props.width}%;
  height: 100%;
  min-width: 20%;
  max-width: 80%;
`;

const PreviewContainer = styled.div`
  width: ${props => 100 - props.editorWidth}%;
  height: 100%;
  min-width: 20%;
`;

function App() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(true);
  const [editorWidth, setEditorWidth] = useState(50); // 默认编辑器占50%宽度
  const mainContentRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const toggleSettings = () => {
    setSettingsVisible(!settingsVisible);
  };

  const handleResize = (clientX) => {
    if (!mainContentRef.current) return;
    
    const containerRect = mainContentRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const newWidth = ((clientX - containerRect.left) / containerWidth) * 100;
    
    // 限制宽度范围在20%-80%之间
    const clampedWidth = Math.min(Math.max(newWidth, 20), 80);
    setEditorWidth(clampedWidth);
  };

  // 保存宽度设置到localStorage
  useEffect(() => {
    const savedEditorWidth = localStorage.getItem('editorWidth');
    if (savedEditorWidth) {
      setEditorWidth(parseFloat(savedEditorWidth));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('editorWidth', editorWidth.toString());
  }, [editorWidth]);

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
          <MainContent ref={mainContentRef}>
            <EditorContainer width={editorWidth}>
              <MarkdownEditor />
            </EditorContainer>
            <Resizer onResize={handleResize} />
            <PreviewContainer editorWidth={editorWidth}>
              <WordPreview />
            </PreviewContainer>
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