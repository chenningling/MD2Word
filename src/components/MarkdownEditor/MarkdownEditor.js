import React, { useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';
import { EditorView } from '@codemirror/view';

const EditorContainer = styled.div`
  flex: 1;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
`;

const EditorHeader = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  color: #333;
  background-color: #fafafa;
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

const placeholderText = `# 欢迎使用 MD2Word

这是一个Markdown编辑器，您可以在这里编写Markdown格式的文档。

## 基本用法

- 使用 # 创建标题
- 使用 **文本** 创建粗体
- 使用 *文本* 创建斜体
- 创建列表项

> 这是一段引用文本

如需了解更多Markdown语法，请点击左侧的「Markdown基本语法学习」按钮。

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
  }, [updateMarkdown]);

  const handleChange = (value) => {
    updateMarkdown(value);
  };

  return (
    <EditorContainer>
      <EditorHeader>Markdown 编辑器</EditorHeader>
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