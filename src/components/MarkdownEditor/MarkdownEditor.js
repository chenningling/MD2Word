import React, { useEffect, useRef, useCallback, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';
import { EditorView } from '@codemirror/view';
import { Button, Tooltip, message, Modal } from 'antd';
import { ReloadOutlined, PictureOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons';
import { uploadImageFromClipboard, uploadImageFromLocal, imageUrlToMarkdown } from '../../services/ossService';
import { getWordSupportedImageFormats } from '../../utils/imageUtils';
import { uploadImage } from '../../services/apiService';

const EditorContainer = styled.div`
  flex: 1;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
`;

const EditorHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  height: 48px;
  box-sizing: border-box;
`;

const EditorTitle = styled.div`
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
`;

const EditorContent = styled.div`
  flex: 1;
  overflow: auto;
  position: relative;
  
  .cm-editor {
    height: 100%;
    font-size: 14px;
  }
  
  .cm-scroller {
    overflow: auto;
  }
`;

// 隐藏的文件输入框
const HiddenFileInput = styled.input`
  display: none;
`;

// 段落提醒组件
const ParagraphWarning = styled.div`
  background-color: #fff9e6;
  border: 1px solid #ffec3d;
  border-radius: 4px;
  padding: 10px 16px;
  margin: 0;
  font-size: 12px;
  color: #ff8c00;
  display: flex;
  align-items: center;
  justify-content: space-between;
  animation: slideDown 0.3s ease-out;
  box-sizing: border-box;
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .warning-content {
    display: flex;
    align-items: center;
    flex: 1;
  }
  
  .warning-icon {
    margin-right: 6px;
    color: #ff8c00;
    font-size: 12px;
  }
  
  .close-btn {
    color: #ff8c00;
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    margin-left: 8px;
    display: flex;
    align-items: center;
    border-radius: 2px;
    
    &:hover {
      background-color: rgba(255, 140, 0, 0.1);
      color: #e07600;
    }
  }
`;

// 右键菜单样式 - 不再需要，可以移除或保留以备将来使用
const ContextMenu = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  z-index: 1000;
  min-width: 180px;
  
  .menu-item {
    padding: 8px 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    
    &:hover {
      background-color: #f5f5f5;
    }
    
    .anticon {
      margin-right: 8px;
    }
  }
  
  .menu-item-desc {
    font-size: 12px;
    color: #999;
    margin-top: 2px;
    padding-left: 24px;
  }
`;

const placeholderText = `# 欢迎使用 MD2Word 排版助手

这是一款将Markdown文本快速转换为规范Word文档的工具。您可以在此编辑器中输入Markdown格式的内容，右侧将实时预览Word效果。

## 快速上手指南

### 使用本工具的步骤

1. 在左侧编辑器中输入Markdown格式的文本
2. 在右侧实时预览Word排版效果
3. 点击右上角「排版格式设置」按钮调整文档格式
4. 完成编辑后，点击「导出Word文档」按钮下载文件

### 基本Markdown语法

1. **标题**：使用 # 号创建不同级别的标题（**注意：# 后必须有一个空格**）
   - # 一级标题（# + 空格 + 文本）
   - ## 二级标题（## + 空格 + 文本）
   - ### 三级标题（### + 空格 + 文本）

2. **文本格式**
   - **粗体文本**：使用 **文本** 或 __文本__
   - *斜体文本*：使用 *文本* 或 _文本_
   - ~~删除线~~：使用 ~~文本~~

3. **列表**
   - 无序列表：使用 - 或 * 或 + 开头
   - 有序列表：使用 1. 2. 3. 开头

4. **引用**：使用 > 符号
   > 这是一段引用文本

5. **数学公式**：使用LaTeX语法
   - 行内公式：$E = mc^2$
   - 块级公式：$$\\sum_{i=1}^n x_i = X$$

### 更多功能

- **查看完整语法**：点击左侧导航栏的「MD基本语法学习」，了解更多Markdown语法
- **AI转换**：点击左侧导航栏的「使用AI转MD」，使用AI将普通文本转换为Markdown格式
- **格式设置**：点击右上角「排版格式设置」，可以选择预设模板或自定义格式
- **图片功能**：
  - 直接粘贴剪贴板中的图片
  - 编辑器左上角选择"插入本地图片"
  - 支持图片导出到Word文档
- **LaTeX数学公式**：
  - 行内公式：$E = mc^2$ （用单个$符号包围）
  - 块级公式：$$\\int_{0}^{1} x dx = \\frac{1}{2}$$ （用双$$符号包围）
  - 导出时自动转换**为Word可编辑格式**

祝您使用愉快！如有任何问题，请点击「帮助反馈」联系作者。
`;

const MarkdownEditor = () => {
  const { markdown: content, updateMarkdown } = useDocument();
  const isInitialized = useRef(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  
  // 段落提醒相关状态
  const [showParagraphWarning, setShowParagraphWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const detectionTimeoutRef = useRef(null);

  // 获取编辑器实例
  const handleEditorCreated = (editor) => {
    editorRef.current = editor;
  };

  // 段落检测函数
  const detectParagraphIssues = useCallback((text) => {
    // 如果是默认文案或空内容，不检测
    if (!text || text === placeholderText || text.trim().length === 0) {
      return false;
    }

    // 缺少段落分隔（双换行）是基础条件
    const lacksParagraphBreaks = !text.includes('\n\n');
    if (!lacksParagraphBreaks) return false;

    // 移除代码块和公式，计算实际内容长度
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/\$\$[\s\S]*?\$\$/g, '') // 移除块级数学公式
      .replace(/\$[^$\n]*?\$/g, '') // 移除行内数学公式
      .trim();

    // 方案1：全文字数检测（更宽泛的条件）
    // 如果全文超过500字且没有空行，直接提醒
    if (cleanText.length >= 500) {
      return true;
    }

    // 方案2：段落文本检测（原有的精确条件）
    // 针对较短但明显是段落文本的内容
    if (cleanText.length < 200) return false; // 太短不检测

    const textWithoutStructure = cleanText
      .replace(/#+\s+[^\n]*/g, '') // 移除标题行
      .replace(/>\s+[^\n]*/g, '') // 移除引用行
      .replace(/[-*+]\s+[^\n]*/g, '') // 移除列表项
      .replace(/\d+\.\s+[^\n]*/g, '') // 移除有序列表项
      .trim();

    const lines = text.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    
    // 检测条件：针对段落文本的精确判断
    const hasMultipleSentences = textWithoutStructure.split(/[。！？.!?]/).filter(s => s.trim().length > 0).length >= 3;
    const hasConsecutiveLines = nonEmptyLines.length >= 5; // 连续多行文本
    const averageLineLength = textWithoutStructure.length > 0 ? (textWithoutStructure.length / nonEmptyLines.length > 25) : false;

    // 段落文本需要同时满足多个条件
    return hasMultipleSentences && hasConsecutiveLines && averageLineLength;
  }, []);

  // 处理段落检测
  const handleParagraphDetection = useCallback((text) => {
    // 清除之前的检测定时器
    if (detectionTimeoutRef.current) {
      clearTimeout(detectionTimeoutRef.current);
    }

    // 如果用户已经关闭过警告，不再显示
    if (warningDismissed) return;

    // 延迟检测，避免频繁触发
    detectionTimeoutRef.current = setTimeout(() => {
      const shouldWarn = detectParagraphIssues(text);
      setShowParagraphWarning(shouldWarn);
    }, 3000); // 3秒延迟检测
  }, [detectParagraphIssues, warningDismissed]);

  useEffect(() => {
    // 只在组件首次加载且内容为空时设置默认内容
    if (!isInitialized.current && !content) {
      updateMarkdown(placeholderText);
      isInitialized.current = true;
    }
  }, [updateMarkdown, content]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current);
      }
    };
  }, []);

  const handleChange = (value) => {
    updateMarkdown(value);
    // 触发段落检测
    handleParagraphDetection(value);
  };

  // 关闭段落提醒
  const handleDismissWarning = () => {
    setShowParagraphWarning(false);
    setWarningDismissed(true);
  };
  
  // 恢复默认文案的处理函数
  const handleRestoreDefault = () => {
    setConfirmModalVisible(true);
  };
  
  // 确认恢复默认文案
  const confirmRestore = () => {
    updateMarkdown(placeholderText);
    setConfirmModalVisible(false);
    // 重置段落提醒状态
    setShowParagraphWarning(false);
    setWarningDismissed(false);
  };
  
  // 取消恢复默认文案
  const cancelRestore = () => {
    setConfirmModalVisible(false);
  };
  
  // 处理粘贴事件
  const handlePaste = async (e) => {
    try {
      // 检查是否包含图片
      const items = e.clipboardData.items;
      let imageFile = null;
      
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') !== -1) {
          imageFile = items[i].getAsFile();
          break;
        }
      }
      
      if (!imageFile) return; // 不是图片，不处理
      
      // 阻止默认粘贴行为
      e.preventDefault();
      
      // 显示上传中状态
      const loadingMessage = message.loading('正在上传图片...', 0);
      
      try {
        // 使用新的API服务上传图片
        const imageUrl = await uploadImage(imageFile);
        
        // 关闭加载提示
        loadingMessage();
        
        if (imageUrl) {
          // 获取当前光标位置
          const editor = editorRef.current;
          if (editor) {
            const mdImage = imageUrlToMarkdown(imageUrl);
            
            // 在光标位置插入Markdown图片语法
            const selection = editor.state.selection.main;
            const transaction = editor.state.update({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: mdImage
              }
            });
            editor.dispatch(transaction);
            
            message.success('图片上传成功');
          }
        }
      } catch (uploadError) {
        // 关闭加载提示
        loadingMessage();
        
        // 提供更具体的错误信息
        message.error('图片上传失败：' + (uploadError.message || '请重试'));
        
        throw uploadError;
      }
    } catch (error) {
      console.error('粘贴图片失败:', error);
    }
  };
  
  // 处理插入本地图片
  const handleInsertLocalImage = () => {
    fileInputRef.current?.click();
  };
  
  // 处理文件选择
  const handleFileChange = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;
      
      // 显示上传中状态
      const loadingMessage = message.loading('正在上传图片...', 0);
      
      try {
        // 使用新的API服务上传图片
        const imageUrl = await uploadImage(file);
        
        // 关闭加载提示
        loadingMessage();
        
        if (imageUrl) {
          // 获取当前光标位置
          const editor = editorRef.current;
          if (editor) {
            const mdImage = imageUrlToMarkdown(imageUrl);
            
            // 在光标位置插入Markdown图片语法
            const doc = editor.state.doc;
            const selection = editor.state.selection.main;
            const transaction = editor.state.update({
              changes: {
                from: selection.from,
                to: selection.to,
                insert: mdImage
              }
            });
            editor.dispatch(transaction);
            
            message.success('图片上传成功');
          }
        }
      } catch (uploadError) {
        // 关闭加载提示
        loadingMessage();
        
        // 提供更具体的错误信息
        message.error('图片上传失败：' + (uploadError.message || '请重试'));
        
        throw uploadError;
      }
    } catch (error) {
      console.error('本地图片上传失败:', error);
    }
  };

  // 在组件初始化时获取支持的图片格式
  const supportedFormats = getWordSupportedImageFormats().toLowerCase().replace(/,\s+/g, ',');

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>Markdown 编辑器</EditorTitle>
        <div>
          <Tooltip title="插入本地图片">
            <Button 
              type="text" 
              icon={<PictureOutlined />} 
              onClick={handleInsertLocalImage}
              style={{ marginRight: 8 }}
              size="small"
            />
          </Tooltip>
          <Tooltip title="恢复默认文案">
            <Button 
              type="text" 
              icon={<ReloadOutlined />} 
              onClick={handleRestoreDefault}
              size="small"
            />
          </Tooltip>
        </div>
      </EditorHeader>
      
      {/* 段落提醒组件 */}
      {showParagraphWarning && (
        <div style={{ padding: '0 16px 8px 16px' }}>
          <ParagraphWarning>
            <div className="warning-content">
              <InfoCircleOutlined className="warning-icon" />
              <span>
                检测到较长文本建议在段落间添加空行，这样导出的Word文档排版效果更佳
              </span>
            </div>
            <button className="close-btn" onClick={handleDismissWarning}>
              <CloseOutlined style={{ fontSize: '12px' }} />
            </button>
          </ParagraphWarning>
        </div>
      )}
      
      <EditorContent>
        <CodeMirror
          value={content}
          height="100%"
          extensions={[
            markdown(),
            EditorView.lineWrapping
          ]}
          onChange={handleChange}
          onPaste={handlePaste}
          onCreateEditor={handleEditorCreated}
          theme="light"
        />
        
        {/* 隐藏的文件输入框 */}
        <HiddenFileInput 
          type="file" 
          ref={fileInputRef} 
          accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff,image/webp"
          onChange={handleFileChange}
        />
      </EditorContent>
      
      {/* 自定义确认对话框 */}
      <Modal
        title="温馨提醒"
        open={confirmModalVisible}
        onOk={confirmRestore}
        onCancel={cancelRestore}
        okText="确定"
        cancelText="取消"
        centered
      >
        <p>确定要恢复默认文案吗？当前内容将被替换。</p>
      </Modal>
    </EditorContainer>
  );
};

export default MarkdownEditor; 