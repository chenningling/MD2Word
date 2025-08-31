import React, { useState, useRef, useEffect } from 'react';
import { Button, Modal, Steps, Typography, Space, Input, Row, Col } from 'antd';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const EmptyTextWarning = styled.div`
  color: #ff4d4f;
  font-size: 12px;
  margin-top: -12px;
  margin-bottom: 8px;
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  height: ${props => props.visible ? 'auto' : '0'};
  transition: all 0.3s;
`;

const ButtonsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
  width: 100%;
`;

const AIButton = styled(Button)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 40px;
  width: 100%;
  padding: 0 8px;
  font-size: 13px;
  
  .ai-logo {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
`;

const StepsContainer = styled.div`
  margin-top: 24px;
  border-top: 1px solid #f0f0f0;
  padding-top: 20px;
  width: 100%; /* 确保容器占满可用宽度 */
`;

const StyledSteps = styled(Steps)`
  .ant-steps-item-title {
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85) !important;
  }
  
  .ant-steps-item-description {
    font-size: 12px;
    max-width: none;
    color: rgba(0, 0, 0, 0.85) !important;
    white-space: normal;
    word-wrap: break-word;
  }
  
  /* 让所有步骤显示相同的高亮效果 */
  .ant-steps-item-icon {
    background-color: #1890ff !important;
    border-color: #1890ff !important;
  }
  
  .ant-steps-item-icon .ant-steps-icon {
    color: #fff !important;
  }
  
  /* 统一连接线颜色 */
  .ant-steps-item-tail::after {
    background-color: #1890ff !important;
  }
  
  /* 优化步骤项的间距 */
  .ant-steps-item {
    padding-bottom: 12px;
  }
  
  /* 确保步骤内容能够适应容器宽度 */
  .ant-steps-item-container {
    width: 100%;
  }
`;

const StepTitle = styled(Title)`
  font-size: 16px !important;
  margin-bottom: 12px !important;
  color: #333;
  position: relative;
  padding-left: 10px;
  
  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 16px;
    background-color: #1890ff;
    border-radius: 2px;
  }
`;

const CountdownText = styled.div`
  font-size: 16px;
  text-align: center;
  margin: 16px 0;
  font-weight: 500;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
`;

const TextToMarkdown = () => {
  const [text, setText] = useState('');
  const [isEmpty, setIsEmpty] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [currentPlatform, setCurrentPlatform] = useState({ name: '', url: '' });
  const { updateMarkdown } = useDocument();
  const textAreaRef = useRef(null);
  const timerRef = useRef(null);
  // 添加一个标志，用于跟踪是否已经执行了跳转
  const hasJumpedRef = useRef(false);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    setIsEmpty(newText.trim() === '');
  };

  const handleCopyPrompt = (aiPlatform, url) => {
    if (!text.trim()) {
      setIsEmpty(true);
      textAreaRef.current?.focus();
      return;
    }

    // 重置跳转标志
    hasJumpedRef.current = false;

    // 清除可能存在的之前的定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 构建提示词
    const prompt = `<text>
${text}
</text>
你是一个专业的Markdown转换专家。请将<text>标签里的文本转换为格式良好的Markdown文档。遵循以下规则：
    1. 合理使用标题分级（#, ##, ###等）
    2. 段落之间用空行分隔
    3. 列表项使用 - 或 1. 
    4. 强调文本使用 *斜体* 或 **粗体**
    5. 代码块使用 \`\`\` 包裹
    6. 链接使用 [描述](URL) 格式
    7. 图片使用 ![描述](URL) 格式
    请直接返回转换后的Markdown内容，不要包含任何解释或额外说明。`;

    // 复制到剪贴板
    navigator.clipboard.writeText(prompt)
      .then(() => {
        // 先设置当前平台信息
        setCurrentPlatform({ name: aiPlatform, url: url });
        
        // 然后在状态更新后显示Modal和开始倒计时
        // 使用setTimeout确保状态已更新
        setTimeout(() => {
          setModalVisible(true);
          setCountdown(5);
          
          // 开始倒计时
          timerRef.current = setInterval(() => {
            setCountdown(prev => {
              if (prev <= 1) {
                clearInterval(timerRef.current);
                // 使用存储的URL进行跳转，而不是依赖状态
                handleJump(url, aiPlatform);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }, 0);
      })
      .catch(err => {
        console.error('复制失败:', err);
        Modal.error({
          title: '复制失败',
          content: '无法复制提示词到剪贴板，请检查浏览器权限设置。'
        });
      });
  };
  
  // 修改handleJump函数，接收URL和平台名称作为参数
  const handleJump = (url, platformName) => {
    // 如果已经跳转过，则不再重复跳转
    if (hasJumpedRef.current) {
      return;
    }
    
    // 标记为已跳转
    hasJumpedRef.current = true;
    
    // 使用传入的URL而不是从状态中获取
    window.open(url, '_blank');
    setModalVisible(false);
  };
  
  const handleCancel = () => {
    // 清除定时器
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    // 重置跳转标志
    hasJumpedRef.current = false;
    setModalVisible(false);
  };
  
  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <Container>
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <textarea
          ref={textAreaRef}
          value={text}
          onChange={handleTextChange}
          placeholder="在此粘贴需要AI转换为Markdown的文本内容..."
          style={{
            width: '100%',
            minHeight: '200px',
            height: '300px',
            resize: 'vertical',
            padding: '8px 12px',
            fontSize: '14px',
            borderRadius: '4px',
            border: isEmpty ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
            outline: 'none',
          }}
        />
      </div>
      
      <EmptyTextWarning visible={isEmpty}>
        请输入需要AI转换的文本内容
      </EmptyTextWarning>
      
      {/* 
        按钮布局：2x2网格
        注意：需要在public/images目录添加doubao-logo.png文件
      */}
      <ButtonsContainer>
        <AIButton 
          type="primary" 
          onClick={() => handleCopyPrompt('DeepSeek', 'https://chat.deepseek.com/')}
          disabled={isEmpty}
        >
          <img className="ai-logo" src="/images/deepseek-logo.png" alt="DeepSeek" />
          发送DeepSeek转换
        </AIButton>
        
        <AIButton
          onClick={() => handleCopyPrompt('Kimi', 'https://www.kimi.com/')}
          disabled={isEmpty}
        >
          <img className="ai-logo" src="/images/kimi-logo.png" alt="Kimi" />
          发送Kimi转换
        </AIButton>
        
        <AIButton
          onClick={() => handleCopyPrompt('通义千问', 'https://www.tongyi.com/qianwen')}
          disabled={isEmpty}
        >
          <img className="ai-logo" src="/images/tongyi-logo.png" alt="通义千问" />
          发送通义千问转换
        </AIButton>
        
        <AIButton
          onClick={() => handleCopyPrompt('豆包', 'https://www.doubao.com/chat')}
          disabled={isEmpty}
        >
          <img className="ai-logo" src="/images/doubao-logo.png" alt="豆包" />
          发送豆包转换
        </AIButton>
      </ButtonsContainer>
      
      <StepsContainer>
        <StepTitle level={4}>AI一键转换步骤</StepTitle>
        <StyledSteps
          direction="vertical"
          size="small"
          current={0} /* 移除当前步骤高亮 */
          items={[
            {
              title: '一键发送AI转换',
              description: '点击上方按钮，自动复制专业提示词并跳转到AI平台',
            },
            {
              title: '粘贴提示词发送',
              description: '在AI对话框中粘贴(Ctrl+V)并发送，AI智能转换中',
            },
            {
              title: '复制MD格式结果',
              description: '复制AI生成的Markdown内容(Ctrl+A, Ctrl+C)到编辑器',
            },
            {
              title: '预览排版并导出',
              description: '调整排版设置，预览效果并导出精美Word文档',
            },
          ]}
        />
      </StepsContainer>
      
      <Modal
        title={`提示词已复制 - 即将前往${currentPlatform.name}`}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        maskClosable={false}
        width={360}
      >
        <div style={{ padding: '5px 0' }}>
          <Paragraph style={{ fontSize: '14px', marginBottom: '10px', textAlign: 'center' }}>
            <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{countdown}秒</span> 后自动跳转到{currentPlatform.name}
          </Paragraph>
          
          <div style={{ 
            background: '#f6f8fa', 
            padding: '12px', 
            borderRadius: '4px',
            marginBottom: '12px',
            border: '1px solid #e1e4e8'
          }}>
            <div style={{ fontSize: '13px', marginBottom: '4px' }}>1. 在AI对话框中<strong>粘贴提示词</strong>(Ctrl+V)</div>
            <div style={{ fontSize: '13px' }}>2. 复制AI生成的Markdown内容回本应用</div>
          </div>
        </div>
        
        <ModalFooter>
          <Button onClick={handleCancel}>取消</Button>
          <Button 
            type="primary" 
            onClick={() => handleJump(currentPlatform.url, currentPlatform.name)}
          >
            立即前往{currentPlatform.name}
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default TextToMarkdown; 