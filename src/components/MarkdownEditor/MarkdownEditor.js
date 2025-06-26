import React, { useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';
import { EditorView } from '@codemirror/view';
import { Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

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
  
  .cm-editor {
    height: 100%;
    font-size: 14px;
  }
  
  .cm-scroller {
    overflow: auto;
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

祝您使用愉快！如有任何问题，请参考左侧的Markdown基本语法指南。
`;

const MarkdownEditor = () => {
  const { markdown: content, updateMarkdown } = useDocument();
  const isInitialized = useRef(false);

  useEffect(() => {
    // 只在组件首次加载且内容为空时设置默认内容
    if (!isInitialized.current && !content) {
      updateMarkdown(placeholderText);
      isInitialized.current = true;
    }
  }, [updateMarkdown, content]);

  const handleChange = (value) => {
    updateMarkdown(value);
  };
  
  // 恢复默认文案的处理函数
  const handleRestoreDefault = () => {
    if (window.confirm('确定要恢复默认文案吗？当前内容将被替换。')) {
      updateMarkdown(placeholderText);
    }
  };

  return (
    <EditorContainer>
      <EditorHeader>
        <EditorTitle>Markdown 编辑器</EditorTitle>
        <Tooltip title="恢复默认文案">
          <Button 
            type="text" 
            icon={<ReloadOutlined />} 
            onClick={handleRestoreDefault}
            size="small"
          />
        </Tooltip>
      </EditorHeader>
      <EditorContent>
        <CodeMirror
          value={content}
          height="100%"
          extensions={[
            markdown(),
            EditorView.lineWrapping
          ]}
          onChange={handleChange}
          theme="light"
        />
      </EditorContent>
    </EditorContainer>
  );
};

export default MarkdownEditor; 