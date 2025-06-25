import React from 'react';
import { Layout, Button, Typography, Space } from 'antd';
import { SettingOutlined, ExportOutlined, MenuOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';
import { exportToWord } from '../../services/exportService';

const { Header: AntHeader } = Layout;
const { Title } = Typography;

const StyledHeader = styled(AntHeader)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: 64px;
  line-height: 64px;
`;

const HeaderTitle = styled(Title)`
  margin: 0 !important;
  font-size: 20px !important;
  color: #1890ff !important;
`;

const ButtonGroup = styled(Space)`
  display: flex;
`;

const Header = ({ toggleSettings, settingsVisible, toggleSidebar, sidebarVisible }) => {
  const { markdown, formatSettings } = useDocument();

  const handleExport = () => {
    exportToWord(markdown, formatSettings);
  };

  return (
    <StyledHeader>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button 
          type="text" 
          icon={<MenuOutlined />} 
          onClick={toggleSidebar}
          style={{ marginRight: '16px' }}
        />
        <HeaderTitle level={3}>Word快速排版助手——MD2Word</HeaderTitle>
      </div>
      <ButtonGroup>
        <Button 
          type={settingsVisible ? "primary" : "default"}
          icon={<SettingOutlined />} 
          onClick={toggleSettings}
        >
          排版格式设置
        </Button>
        <Button 
          type="primary" 
          icon={<ExportOutlined />} 
          onClick={handleExport}
        >
          导出Word文档
        </Button>
      </ButtonGroup>
    </StyledHeader>
  );
};

export default Header; 