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
import MarkdownGuide from './components/Sidebar/MarkdownGuide';

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

// 新增左侧内容区域样式
const SideContentContainer = styled.div`
  width: 300px;
  height: 100%;
  background-color: white;
  border-right: 1px solid #f0f0f0;
  overflow: auto;
  padding: 16px;
`;

// 新增左侧内容标题样式
const SideContentHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  margin: -16px -16px 16px -16px;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

function App() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(true);
  const [editorWidth, setEditorWidth] = useState(50); // 默认编辑器占50%宽度
  const mainContentRef = useRef(null);
  
  // 新增左侧内容区域状态
  const [sideContentVisible, setSideContentVisible] = useState(false);
  const [sideContentType, setSideContentType] = useState(null);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const toggleSettings = () => {
    // 如果打开设置面板，则关闭左侧内容区域
    if (!settingsVisible && sideContentVisible) {
      setSideContentVisible(false);
    }
    setSettingsVisible(!settingsVisible);
  };

  // 新增打开左侧内容区域的函数
  const openSideContent = (contentType) => {
    // 如果打开左侧内容，则关闭右侧设置面板
    if (settingsVisible) {
      setSettingsVisible(false);
    }
    setSideContentType(contentType);
    setSideContentVisible(true);
  };

  // 新增关闭左侧内容区域的函数
  const closeSideContent = () => {
    setSideContentVisible(false);
    setSideContentType(null);
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

  // 渲染左侧内容区域
  const renderSideContent = () => {
    switch (sideContentType) {
      case 'markdown-guide':
        return (
          <SideContentContainer>
            <SideContentHeader>
              <h3>Markdown基本语法学习</h3>
              <button onClick={closeSideContent} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </SideContentHeader>
            <MarkdownGuide />
          </SideContentContainer>
        );
      case 'text-to-markdown':
        return (
          <SideContentContainer>
            <SideContentHeader>
              <h3>文本转Markdown</h3>
              <button onClick={closeSideContent} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
            </SideContentHeader>
            <div>
              <p>此功能将在后续版本中开放，敬请期待！</p>
              <p>该功能将允许您将普通文本转换为Markdown格式，方便排版。</p>
            </div>
          </SideContentContainer>
        );
      default:
        return null;
    }
  };

  return (
    <DocumentProvider>
      <StyledLayout>
        <Header 
          toggleSettings={toggleSettings} 
          settingsVisible={settingsVisible}
          toggleSidebar={toggleSidebar}
          sidebarVisible={sidebarVisible}
        />
        <ContentLayout>
          <Sidebar 
            visible={sidebarVisible} 
            toggleSidebar={toggleSidebar}
            openSideContent={openSideContent}
          />
          {sideContentVisible && renderSideContent()}
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