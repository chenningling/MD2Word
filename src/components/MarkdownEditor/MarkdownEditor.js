import React, { useEffect, useRef, useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';
import { EditorView } from '@codemirror/view';
import { Button, Tooltip, message, Modal } from 'antd';
import { ReloadOutlined, PictureOutlined } from '@ant-design/icons';
import { uploadImageFromClipboard, uploadImageFromLocal, imageUrlToMarkdown } from '../../services/ossService';

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

// 右键菜单样式
const ContextMenu = styled.div`
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 8px 0;
  z-index: 1000;
  min-width: 150px;
  
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
`;

const placeholderText = `# 欢迎使用 MD2Word 排版助手

这是一款将Markdown文本快速转换为规范Word文档的工具。您可以在此编辑器中输入Markdown格式的内容，右侧将实时预览Word效果。

## 快速上手指南

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

### 使用本工具的步骤

1. 在左侧编辑器中输入Markdown格式的文本
2. 在右侧实时预览Word排版效果
3. 点击右上角「排版格式设置」按钮调整文档格式
4. 完成编辑后，点击「导出Word文档」按钮下载文件

### 更多功能

- **查看完整语法**：点击左侧导航栏的「MD基本语法学习」，了解更多Markdown语法
- **文本转换**：点击左侧导航栏的「文本内容转MD」，将普通文本转换为Markdown格式
- **格式设置**：点击右上角「排版格式设置」，可以选择预设模板或自定义格式
- **图片功能**：
  - 直接粘贴剪贴板中的图片
  - 右键菜单选择"插入本地图片"
  - 支持图片导出到Word文档

祝您使用愉快！如有任何问题，请参考左侧的Markdown基本语法指南。
`;

const MarkdownEditor = () => {
  const { markdown: content, updateMarkdown } = useDocument();
  const isInitialized = useRef(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [contextMenu, setContextMenu] = React.useState({
    visible: false,
    x: 0,
    y: 0
  });

  // 获取编辑器实例
  const handleEditorCreated = (editor) => {
    editorRef.current = editor;
  };

  useEffect(() => {
    // 只在组件首次加载且内容为空时设置默认内容
    if (!isInitialized.current && !content) {
      updateMarkdown(placeholderText);
      isInitialized.current = true;
    }
    
    // 添加全局点击事件监听，用于关闭右键菜单
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [updateMarkdown, content, contextMenu]);

  const handleChange = (value) => {
    updateMarkdown(value);
  };
  
  // 恢复默认文案的处理函数
  const handleRestoreDefault = () => {
    if (window.confirm('确定要恢复默认文案吗？当前内容将被替换。')) {
      updateMarkdown(placeholderText);
    }
  };
  
  // 处理粘贴事件
  const handlePaste = useCallback(async (e) => {
    try {
      // 检查是否粘贴了图片
      const imageUrl = await uploadImageFromClipboard(e);
      if (imageUrl) {
        e.preventDefault(); // 阻止默认粘贴行为
        
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
    } catch (error) {
      console.error('粘贴图片处理失败:', error);
      
      // 提供更具体的错误信息
      if (error.message && error.message.includes('CORS')) {
        message.error('图片上传失败：跨域请求被拒绝，请检查OSS的CORS设置');
      } else if (error.status === 403) {
        message.error('图片上传失败：没有权限访问OSS，请检查AccessKey权限');
      } else {
        message.error('图片上传失败，请重试');
      }
    }
  }, []);
  
  // 处理右键菜单
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };
  
  // 处理插入本地图片
  const handleInsertLocalImage = () => {
    setContextMenu({ ...contextMenu, visible: false });
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
        // 上传图片
        const imageUrl = await uploadImageFromLocal(file);
        
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
        if (uploadError.message && uploadError.message.includes('CORS')) {
          message.error('图片上传失败：跨域请求被拒绝，请检查OSS的CORS设置');
        } else if (uploadError.status === 403) {
          message.error('图片上传失败：没有权限访问OSS，请检查AccessKey权限');
        } else {
          message.error('图片上传失败，请重试');
        }
        
        throw uploadError;
      }
    } catch (error) {
      console.error('本地图片上传失败:', error);
    } finally {
      // 重置文件输入框，允许选择相同文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

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
      <EditorContent onContextMenu={handleContextMenu}>
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
        
        {/* 右键菜单 */}
        {contextMenu.visible && (
          <ContextMenu 
            style={{ 
              left: `${contextMenu.x}px`, 
              top: `${contextMenu.y}px` 
            }}
          >
            <div className="menu-item" onClick={handleInsertLocalImage}>
              <PictureOutlined /> 插入本地图片
            </div>
          </ContextMenu>
        )}
        
        {/* 隐藏的文件输入框 */}
        <HiddenFileInput 
          type="file" 
          ref={fileInputRef} 
          accept="image/*"
          onChange={handleFileChange}
        />
      </EditorContent>
    </EditorContainer>
  );
};

export default MarkdownEditor; 