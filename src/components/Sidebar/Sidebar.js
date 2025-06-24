import React, { useState } from 'react';
import { Layout, Menu, Typography, Drawer } from 'antd';
import { BookOutlined, FormatPainterOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import MarkdownGuide from './MarkdownGuide';

const { Sider } = Layout;
const { Title, Paragraph } = Typography;

const StyledSider = styled(Sider)`
  background-color: #f0f2f5;
  
  .ant-menu {
    height: 100%;
  }
`;

const StyledDrawer = styled(Drawer)`
  .ant-drawer-body {
    padding: 24px;
  }
`;

const DrawerTitle = styled(Title)`
  margin-bottom: 24px !important;
`;

const Sidebar = ({ visible, toggleSidebar }) => {
  const [activeKey, setActiveKey] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null);
  const [drawerTitle, setDrawerTitle] = useState('');

  const handleMenuClick = (key) => {
    setActiveKey(key);
    
    if (key === 'markdown-guide') {
      setDrawerTitle('Markdown基本语法学习');
      setDrawerContent(<MarkdownGuide />);
      setDrawerVisible(true);
    } else if (key === 'text-to-markdown') {
      setDrawerTitle('文本转Markdown');
      setDrawerContent(
        <Typography>
          <Paragraph>
            此功能将在后续版本中开放，敬请期待！
          </Paragraph>
          <Paragraph>
            该功能将允许您将普通文本转换为Markdown格式，方便排版。
          </Paragraph>
        </Typography>
      );
      setDrawerVisible(true);
    }
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
    setActiveKey('');
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
        
        <StyledDrawer
          title={drawerTitle}
          placement="left"
          onClose={closeDrawer}
          visible={drawerVisible}
          width={600}
        >
          {drawerContent}
        </StyledDrawer>
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
      
      <StyledDrawer
        title={drawerTitle}
        placement="left"
        onClose={closeDrawer}
        visible={drawerVisible}
        width={600}
      >
        {drawerContent}
      </StyledDrawer>
    </StyledSider>
  );
};

export default Sidebar; 