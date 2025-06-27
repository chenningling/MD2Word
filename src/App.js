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
import TextToMarkdown from './components/Sidebar/TextToMarkdown';

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
  position: relative;
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

// 创建统一的模块标题样式组件
const ModuleHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  height: 48px; /* 固定高度 */
  box-sizing: border-box;
  
  h3, .module-title {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #333;
  }
  
  .module-actions {
    display: flex;
    align-items: center;
  }
  
  button.close-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    border: none;
    background: none;
    cursor: pointer;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
`;

// 修改左侧内容区域样式，添加宽度属性
const SideContentContainer = styled.div`
  width: ${props => props.width}px;
  height: 100%;
  background-color: white;
  border-right: 1px solid #f0f0f0;
  position: relative;
  min-width: 300px;
  max-width: 600px;
  display: flex;
  flex-direction: column;
`;

// 修改侧边栏样式，固定宽度为80px
const StyledSidebar = styled.div`
  width: 80px;
  height: 100%;
  position: relative;
  border-right: 1px solid #f0f0f0;
`;

// 修改设置面板样式，添加宽度属性
const SettingsContainer = styled.div`
  width: ${props => props.width}px;
  height: 100%;
  position: relative;
  min-width: 250px;
  max-width: 500px;
`;

// 新增内容区域容器，用于滚动
const SideContentBody = styled.div`
  flex: 1;
  overflow: auto;
  padding: 16px;
`;

function App() {
  const [settingsVisible, setSettingsVisible] = useState(true);
  const [editorWidth, setEditorWidth] = useState(50); // 默认编辑器占50%宽度
  const mainContentRef = useRef(null);
  const contentLayoutRef = useRef(null);
  
  // 新增左侧内容区域状态
  const [sideContentVisible, setSideContentVisible] = useState(false);
  const [sideContentType, setSideContentType] = useState(null);
  
  // 新增宽度状态
  const [sideContentWidth, setSideContentWidth] = useState(380); // 默认左侧内容区域宽度
  const [settingsWidth, setSettingsWidth] = useState(300); // 默认设置面板宽度

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

  // 新增左侧内容区域宽度调整处理函数
  const handleSideContentResize = (clientX) => {
    if (!contentLayoutRef.current) return;
    
    const newWidth = clientX - 80; // 减去左侧导航条宽度
    // 限制宽度范围
    const clampedWidth = Math.min(Math.max(newWidth, 300), 600);
    setSideContentWidth(clampedWidth);
    localStorage.setItem('sideContentWidth', clampedWidth.toString());
  };

  // 新增设置面板宽度调整处理函数
  const handleSettingsResize = (clientX) => {
    if (!contentLayoutRef.current) return;
    
    const containerRect = contentLayoutRef.current.getBoundingClientRect();
    const newWidth = containerRect.right - clientX;
    // 限制宽度范围
    const clampedWidth = Math.min(Math.max(newWidth, 250), 500);
    setSettingsWidth(clampedWidth);
    localStorage.setItem('settingsWidth', clampedWidth.toString());
  };

  // 保存宽度设置到localStorage
  useEffect(() => {
    const savedEditorWidth = localStorage.getItem('editorWidth');
    const savedSideContentWidth = localStorage.getItem('sideContentWidth');
    const savedSettingsWidth = localStorage.getItem('settingsWidth');
    
    if (savedEditorWidth) {
      setEditorWidth(parseFloat(savedEditorWidth));
    }
    if (savedSideContentWidth) {
      setSideContentWidth(parseFloat(savedSideContentWidth));
    }
    if (savedSettingsWidth) {
      setSettingsWidth(parseFloat(savedSettingsWidth));
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
          <SideContentContainer width={sideContentWidth}>
            <ModuleHeader>
              <h3>Markdown基本语法学习</h3>
              <button className="close-btn" onClick={closeSideContent}>×</button>
            </ModuleHeader>
            <SideContentBody>
              <MarkdownGuide />
            </SideContentBody>
          </SideContentContainer>
        );
      case 'text-to-markdown':
        return (
          <SideContentContainer width={sideContentWidth}>
            <ModuleHeader>
              <h3>文本内容转Markdown</h3>
              <button className="close-btn" onClick={closeSideContent}>×</button>
            </ModuleHeader>
            <SideContentBody>
              <TextToMarkdown />
            </SideContentBody>
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
        />
        <ContentLayout ref={contentLayoutRef}>
          <StyledSidebar>
            <Sidebar 
              openSideContent={openSideContent}
              sideContentVisible={sideContentVisible}
              sideContentType={sideContentType}
            />
          </StyledSidebar>
          
          {sideContentVisible && (
            <>
              {renderSideContent()}
              <Resizer onResize={handleSideContentResize} />
            </>
          )}
          
          <MainContent ref={mainContentRef}>
            <EditorContainer width={editorWidth}>
              <MarkdownEditor />
            </EditorContainer>
            <Resizer onResize={handleResize} />
            <PreviewContainer editorWidth={editorWidth}>
              <WordPreview />
            </PreviewContainer>
          </MainContent>
          
          {settingsVisible && (
            <>
              <Resizer onResize={handleSettingsResize} />
              <SettingsContainer width={settingsWidth}>
                <FormatSettings 
                  visible={settingsVisible} 
                  toggleSettings={toggleSettings} 
                />
              </SettingsContainer>
            </>
          )}
        </ContentLayout>
      </StyledLayout>
    </DocumentProvider>
  );
}

export default App; 