import React, { useState } from 'react';
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
`;

const Sidebar = ({ visible, toggleSidebar, openSideContent }) => {
  const [activeKey, setActiveKey] = useState('');

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
        mode="inline" 
        selectedKeys={[activeKey]} 
        onClick={({ key }) => handleMenuClick(key)}
        inlineCollapsed={!visible}
      >
        <Menu.Item key="markdown-guide" icon={<BookOutlined />}>
          {visible && "Markdown基本语法学习"}
        </Menu.Item>
        <Menu.Item key="text-to-markdown" icon={<FormatPainterOutlined />}>
          {visible && "文本转Markdown"}
        </Menu.Item>
      </StyledMenu>
    </StyledSidebarContainer>
  );
};

export default Sidebar; 