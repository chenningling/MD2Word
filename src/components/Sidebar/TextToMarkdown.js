import React, { useState, useRef, useEffect } from 'react';
import { Button, Modal, Steps, Typography, Space, Input } from 'antd';
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
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
`;

const AIButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
  
  .ai-logo {
    width: 20px;
    height: 20px;
    object-fit: contain;
  }
`;

const StepsContainer = styled.div`
  margin-top: 24px;
  border-top: 1px solid #f0f0f0;
  padding-top: 24px;
`;

const StyledSteps = styled(Steps)`
  .ant-steps-item-title {
    font-size: 14px;
    font-weight: 600;
  }
  
  .ant-steps-item-description {
    font-size: 12px;
    max-width: 240px;
  }
  
  /* 让所有步骤显示相同的高亮效果 */
  .ant-steps-item-icon {
    background-color: #1890ff !important;
    border-color: #1890ff !important;
  }
  
  .ant-steps-item-icon .ant-steps-icon {
    color: #fff !important;
  }
  
  /* 移除未激活步骤的灰色效果 */
  .ant-steps-item-wait .ant-steps-item-icon {
    background-color: #1890ff !important;
    border-color: #1890ff !important;
  }
  
  .ant-steps-item-wait .ant-steps-item-icon .ant-steps-icon {
    color: #fff !important;
  }
  
  /* 移除连接线的灰色效果 */
  .ant-steps-item-tail::after {
    background-color: #1890ff !important;
  }
`;

const StepTitle = styled(Title)`
  font-size: 16px !important;
  margin-bottom: 16px !important;
  color: #333;
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
  const [countdown, setCountdown] = useState(3);
  const [currentPlatform, setCurrentPlatform] = useState({ name: '', url: '' });
  const { updateMarkdown } = useDocument();
  const textAreaRef = useRef(null);
  const timerRef = useRef(null);

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
        // 设置当前平台信息并显示Modal
        setCurrentPlatform({ name: aiPlatform, url: url });
        setModalVisible(true);
        setCountdown(3);
        
        // 开始倒计时
        timerRef.current = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleJump();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      })
      .catch(err => {
        console.error('复制失败:', err);
        Modal.error({
          title: '复制失败',
          content: '无法复制提示词到剪贴板，请检查浏览器权限设置。'
        });
      });
  };
  
  const handleJump = () => {
    window.open(currentPlatform.url, '_blank');
    setModalVisible(false);
  };
  
  const handleCancel = () => {
    clearInterval(timerRef.current);
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
          placeholder="在此粘贴需要转换为Markdown的文本内容..."
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
        请输入需要转换的文本内容
      </EmptyTextWarning>
      
      <ButtonsContainer>
        <AIButton 
          type="primary" 
          onClick={() => handleCopyPrompt('DeepSeek', 'https://chat.deepseek.com/')}
          disabled={isEmpty}
        >
          <img className="ai-logo" src="/images/deepseek-logo.png" alt="DeepSeek" />
          发送给 DeepSeek 转换
        </AIButton>
        
        <AIButton
          onClick={() => handleCopyPrompt('Kimi', 'https://www.kimi.com/')}
          disabled={isEmpty}
        >
          <img className="ai-logo" src="/images/kimi-logo.png" alt="Kimi" />
          发送给 Kimi 转换
        </AIButton>
        
        <AIButton
          onClick={() => handleCopyPrompt('通义千问', 'https://www.tongyi.com/qianwen')}
          disabled={isEmpty}
        >
          <img className="ai-logo" src="/images/tongyi-logo.png" alt="通义千问" />
          发送给 通义 转换
        </AIButton>
      </ButtonsContainer>
      
      <StepsContainer>
        <StepTitle level={4}>转换步骤说明</StepTitle>
        <StyledSteps
          direction="vertical"
          size="small"
          current={0} /* 移除当前步骤高亮 */
          items={[
            {
              title: '复制提示词并跳转',
              description: '点击上方按钮后，系统会自动复制提示词并跳转到对应AI平台',
            },
            {
              title: '粘贴提示词并发送',
              description: '在AI对话框中粘贴提示词(Ctrl+V)，点击发送，等待AI处理',
            },
            {
              title: '复制转换结果',
              description: '复制AI生成的Markdown内容(Ctrl+A, Ctrl+C)到Markdown编辑器',
            },
            {
              title: '设置排版并导出',
              description: '调整右侧排版设置，预览效果并导出Word文档',
            },
          ]}
        />
      </StepsContainer>
      
      <Modal
        title={`提示词已复制到剪贴板`}
        open={modalVisible}
        onCancel={handleCancel}
        footer={null}
        maskClosable={false}
      >
        <Paragraph>
          提示词已成功复制到剪贴板，即将跳转到{currentPlatform.name}...
        </Paragraph>
        
        <CountdownText>
          {countdown}秒后自动跳转
        </CountdownText>
        
        <ModalFooter>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleJump}>立即跳转</Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default TextToMarkdown; 