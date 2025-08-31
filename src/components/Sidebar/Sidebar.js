import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import { BookOutlined, FormatPainterOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const StyledSidebarContainer = styled.div`
  background-color: #f0f2f5;
  height: 100%;
  width: 100%;
  overflow: hidden;
`;

const StyledMenu = styled(Menu)`
  height: 100%;
  border-right: 0;
  
  .ant-menu-item {
    height: 90px;
    padding: 8px 4px;
    margin: 4px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  .ant-menu-item .anticon {
    font-size: 22px;
    margin: 0 0 8px 0;
  }
  
  .menu-item-text {
    font-size: 12px;
    line-height: 1.3;
    white-space: normal;
    word-break: break-word;
    text-align: center;
    width: 100%;
    font-weight: bold;
  }
  
  .ant-menu-item-selected {
    background-color: #e6f7ff;
    border-right: 3px solid #1890ff;
  }
`;

const Sidebar = ({ openSideContent, sideContentVisible, sideContentType }) => {
  const [activeKey, setActiveKey] = useState('');

  // 当sideContentVisible或sideContentType变化时，更新activeKey
  useEffect(() => {
    if (!sideContentVisible) {
      // 如果侧边内容关闭，重置activeKey
      setActiveKey('');
    } else if (sideContentType) {
      // 如果侧边内容打开，设置对应的activeKey
      setActiveKey(sideContentType);
    }
  }, [sideContentVisible, sideContentType]);

  const handleMenuClick = (key) => {
    // 如果点击的是当前选中的项，则取消选中
    if (key === activeKey) {
      setActiveKey('');
      return;
    }
    
    setActiveKey(key);
    
    if (key === 'markdown-guide') {
      openSideContent('markdown-guide');
    } else if (key === 'text-to-markdown') {
      openSideContent('text-to-markdown');
    }
  };

  return (
    <StyledSidebarContainer>
      <StyledMenu 
        mode="vertical"
        selectedKeys={[activeKey]} 
        onClick={({ key }) => handleMenuClick(key)}
      >
        <Menu.Item key="markdown-guide" icon={<BookOutlined />}>
          <div className="menu-item-text">MD基本<br/>语法学习</div>
        </Menu.Item>
        <Menu.Item key="text-to-markdown" icon={<FormatPainterOutlined />}>
          <div className="menu-item-text">使用AI<br/>转MD</div>
        </Menu.Item>
      </StyledMenu>
    </StyledSidebarContainer>
  );
};

export default Sidebar; 