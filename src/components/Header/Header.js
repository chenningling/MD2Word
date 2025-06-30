import React, { useState, useEffect } from 'react';
import { Layout, Button, Typography, Space, Dropdown, Modal, Tooltip } from 'antd';
import { 
  SettingOutlined, 
  ExportOutlined, 
  GithubOutlined, 
  QuestionCircleOutlined, 
  HeartOutlined,
  MailOutlined,
  LinkOutlined,
  WechatOutlined
} from '@ant-design/icons';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';
import { exportToWord } from '../../services/exportService';

// 自定义小红书图标组件
const XiaohongshuIcon = () => (
  <img 
    src="/images/xiaohongshu-icon.png" 
    alt="小红书" 
    style={{ 
      width: '14px', 
      height: '14px', 
      marginRight: '2px'
    }} 
  />
);

const { Header: AntHeader } = Layout;
const { Title } = Typography;

// 添加全局样式以修复下拉菜单对齐问题
const addGlobalStyle = () => {
  const style = document.createElement('style');
  style.innerHTML = `
    .ant-dropdown-menu-item {
      display: flex !important;
      align-items: center !important;
    }
    
    .ant-dropdown-menu-item .anticon,
    .ant-dropdown-menu-item img {
      margin-right: 8px !important;
      flex-shrink: 0 !important;
    }
    
    .ant-dropdown-menu-title-content {
      flex-grow: 1 !important;
      text-align: left !important;
    }
  `;
  document.head.appendChild(style);
};

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

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
`;

const HeaderTitle = styled(Title)`
  margin: 0 !important;
  font-size: 20px !important;
  color: #1890ff !important;
`;

const ButtonGroup = styled(Space)`
  display: flex;
`;

const MenuButtonGroup = styled(Space)`
  margin-left: 12px;
  .ant-space-item {
    margin-right: 0 !important; /* 移除Space组件的默认间距 */
  }
  display: flex;
  border-radius: 4px;
  overflow: hidden; /* 确保内部元素不会溢出圆角边界 */
`;

const MenuButton = styled(Button)`
  display: flex;
  align-items: center;
  font-size: 13px;
  border-radius: 0;
  border: 1px solid #e8e8e8;
  margin-right: -1px; /* 让边框重叠 */
  padding: 0 8px; /* 减小内边距 */
  height: 28px; /* 减小按钮高度 */
  
  &:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  
  &:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
    margin-right: 0;
  }
  
  .anticon {
    font-size: 14px;
    margin-right: 2px; /* 减小图标和文字的间距 */
  }
  
  &:hover {
    z-index: 1; /* 确保悬停时边框不被相邻按钮覆盖 */
  }
`;

const WechatQRCodeImage = styled.img`
  width: 300px;
  height: 400px;
  display: block;
  margin: 0 auto;
`;

const XiaohongshuQRCodeImage = styled.img`
  width: 300px;
  height: 400px;
  display: block;
  margin: 0 auto;
`;

const DonateQRCodeImage = styled.img`
  width: 300px;
  height: 300px;
  display: block;
  margin: 0 auto;
`;

const QRCodeCaption = styled.p`
  text-align: center;
  margin-top: 8px;
  font-size: 14px;
  color: #666;
`;

const XiaohongshuQRCodeContainer = styled.div`
  margin-top: 30px;
`;

// 自定义下拉菜单样式
const StyledDropdown = styled(Dropdown)`
  .ant-dropdown-menu-item {
    display: flex;
    align-items: center;
    
    .anticon, img {
      flex-shrink: 0;
      margin-right: 8px;
    }
    
    span {
      flex-grow: 1;
      text-align: left;
    }
  }
`;

const Header = ({ toggleSettings, settingsVisible }) => {
  const { markdown, formatSettings } = useDocument();
  const [wechatModalVisible, setWechatModalVisible] = useState(false);
  const [xiaohongshuModalVisible, setXiaohongshuModalVisible] = useState(false);
  const [donateModalVisible, setDonateModalVisible] = useState(false);

  // 添加全局样式
  useEffect(() => {
    addGlobalStyle();
  }, []);

  const handleExport = () => {
    exportToWord(markdown, formatSettings);
  };
  
  // GitHub仓库链接
  const handleGitHubClick = () => {
    window.open('https://github.com/chenningling/MD2Word', '_blank');
  };
  
  // 发送邮件
  const handleEmailClick = () => {
    window.location.href = 'mailto:chenningling648@gmail.com?subject=MD2Word反馈';
  };
  
  // 小红书链接
  const handleXiaohongshuClick = () => {
    setXiaohongshuModalVisible(true);
  };
  
  // 显示微信二维码
  const handleWechatClick = () => {
    setWechatModalVisible(true);
  };
  
  // 显示赞赏二维码
  const handleDonateClick = () => {
    setDonateModalVisible(true);
  };
  
  // 帮助反馈菜单项
  const helpItems = [
    {
      key: 'email',
      label: '发送邮件',
      icon: <MailOutlined />,
      onClick: handleEmailClick
    },
    {
      key: 'xiaohongshu',
      label: '小红书留言',
      icon: <XiaohongshuIcon />,
      onClick: handleXiaohongshuClick
    },
    {
      key: 'wechat',
      label: '添加微信',
      icon: <WechatOutlined />,
      onClick: handleWechatClick
    }
  ];

  return (
    <StyledHeader>
      <HeaderLeft>
        <HeaderTitle level={3}>Word快速排版助手——MD2Word</HeaderTitle>
        <MenuButtonGroup size="small">
          <MenuButton type="default" icon={<GithubOutlined />} onClick={handleGitHubClick}>
            GitHub
          </MenuButton>
          
          <StyledDropdown menu={{ items: helpItems }} placement="bottomLeft">
            <MenuButton type="default" icon={<QuestionCircleOutlined />}>
              帮助反馈
            </MenuButton>
          </StyledDropdown>
          
          <MenuButton type="default" icon={<HeartOutlined />} onClick={handleDonateClick}>
            赞赏作者
          </MenuButton>
        </MenuButtonGroup>
      </HeaderLeft>
      
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
      
      {/* 微信二维码弹窗 */}
      <Modal
        title="添加微信"
        open={wechatModalVisible}
        onCancel={() => setWechatModalVisible(false)}
        footer={null}
        centered
      >
        <WechatQRCodeImage src="/images/wechat-qrcode.png" alt="微信二维码" />
        <QRCodeCaption>添加时请备注来意❤️</QRCodeCaption>
      </Modal>
      
      {/* 小红书二维码弹窗 */}
      <Modal
        title="小红书@玩AI的陈一一"
        open={xiaohongshuModalVisible}
        onCancel={() => setXiaohongshuModalVisible(false)}
        footer={null}
        centered
      >
        <XiaohongshuQRCodeContainer>
          <XiaohongshuQRCodeImage src="/images/xiaohongshu-qrcode.png" alt="小红书二维码" />
        </XiaohongshuQRCodeContainer>
        <QRCodeCaption>有任何反馈建议欢迎来我的小红书私信留言❤️</QRCodeCaption>
      </Modal>
      
      {/* 赞赏二维码弹窗 */}
      <Modal
        title="赞赏作者"
        open={donateModalVisible}
        onCancel={() => setDonateModalVisible(false)}
        footer={null}
        centered
      >
        <DonateQRCodeImage src="/images/donate-qrcode.png" alt="赞赏二维码" />
      </Modal>
    </StyledHeader>
  );
};

export default Header; 