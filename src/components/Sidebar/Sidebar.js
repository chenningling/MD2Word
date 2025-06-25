import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { BookOutlined, FormatPainterOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Sider } = Layout;

const StyledSider = styled(Sider)`
  background-color: #f0f2f5;
  
  .ant-menu {
    height: 100%;
  }
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

  if (!visible) {
    return (
      <StyledSider 
        width={50} 
        collapsible 
        collapsed={true} 
        trigger={null}
      >
        <Menu 
          mode="inline" 
          selectedKeys={[activeKey]} 
          onClick={({ key }) => handleMenuClick(key)}
        >
          <Menu.Item key="markdown-guide" icon={<BookOutlined />} />
          <Menu.Item key="text-to-markdown" icon={<FormatPainterOutlined />} />
        </Menu>
      </StyledSider>
    );
  }

  return (
    <StyledSider width={200}>
      <Menu 
        mode="inline" 
        selectedKeys={[activeKey]} 
        onClick={({ key }) => handleMenuClick(key)}
      >
        <Menu.Item key="markdown-guide" icon={<BookOutlined />}>
          Markdown基本语法学习
        </Menu.Item>
        <Menu.Item key="text-to-markdown" icon={<FormatPainterOutlined />}>
          文本转Markdown
        </Menu.Item>
      </Menu>
    </StyledSider>
  );
};

export default Sidebar; 