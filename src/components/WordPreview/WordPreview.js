import React, { useMemo, useEffect, useState } from 'react';
import { marked } from 'marked';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { renderMermaidToPng, isMermaidCode } from '../../utils/mermaidUtils';

const PreviewContainer = styled.div`
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const PreviewHeader = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 500;
  color: #333;
  background-color: #fafafa;
`;

const PreviewContent = styled.div`
  flex: 1;
  overflow: auto;
  padding: 20px;
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.05) inset;
`;

const WordDocument = styled.div`
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: ${props => `${props.marginTop}cm ${props.marginRight}cm ${props.marginBottom}cm ${props.marginLeft}cm`};
  background-color: white;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  
  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => props.heading1.fontFamily};
    font-weight: ${props => props.heading1.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading1.lineHeight};
    text-align: ${props => props.heading1.align};
  }
  
  h1 {
    font-size: ${props => props.heading1.fontSize}pt;
  }
  
  h2 {
    font-size: ${props => props.heading2.fontSize}pt;
    font-family: ${props => props.heading2.fontFamily};
    font-weight: ${props => props.heading2.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading2.lineHeight};
    text-align: ${props => props.heading2.align};
  }
  
  h3 {
    font-size: ${props => props.heading3.fontSize}pt;
    font-family: ${props => props.heading3.fontFamily};
    font-weight: ${props => props.heading3.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading3.lineHeight};
    text-align: ${props => props.heading3.align};
  }
  
  p {
    font-family: ${props => props.paragraph.fontFamily};
    font-size: ${props => props.paragraph.fontSize}pt;
    font-weight: ${props => props.paragraph.bold ? 'bold' : 'normal'};
    line-height: ${props => props.paragraph.lineHeight};
    text-align: ${props => props.paragraph.align};
    margin-bottom: 1em;
  }
  
  blockquote {
    font-family: ${props => props.quote.fontFamily};
    font-size: ${props => props.quote.fontSize}pt;
    font-weight: ${props => props.quote.bold ? 'bold' : 'normal'};
    line-height: ${props => props.quote.lineHeight};
    text-align: ${props => props.quote.align};
    border-left: 4px solid #ddd;
    padding-left: 1em;
    margin-left: 0;
    color: #666;
  }
  
  /* 表格样式 */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1em 0;
    font-family: ${props => props.paragraph.fontFamily};
    font-size: ${props => props.paragraph.fontSize}pt;
  }
  
  th {
    background-color: #f2f2f2;
    font-weight: bold;
    text-align: left;
    padding: 8px;
    border: 1px solid #cccccc;
  }
  
  td {
    padding: 8px;
    border: 1px solid #cccccc;
    text-align: left;
  }
  
  /* 列表样式 */
  ul, ol {
    font-family: ${props => props.paragraph.fontFamily};
    font-size: ${props => props.paragraph.fontSize}pt;
    line-height: ${props => props.paragraph.lineHeight};
    margin-bottom: 1em;
    padding-left: 2em;
  }
  
  /* 内联格式 */
  strong {
    font-weight: bold;
  }
  
  em {
    font-style: italic;
  }
  
  /* 代码块样式 */
  pre {
    background-color: #f6f8fa;
    border: 1px solid #e1e4e8;
    border-radius: 3px;
    padding: 16px;
    overflow: auto;
    margin-bottom: 1em;
    font-family: 'Courier New', Courier, monospace;
  }
  
  code {
    font-family: 'Courier New', Courier, monospace;
    background-color: #f6f8fa;
    padding: 2px 4px;
    border-radius: 3px;
    font-size: 0.9em;
  }
  
  pre > code {
    background-color: transparent;
    padding: 0;
    border-radius: 0;
    display: block;
  }
  
  /* Mermaid图表样式 */
  .mermaid-diagram {
    text-align: center;
    margin: 1em 0;
    max-width: 100%;
  }
  
  .mermaid-diagram img {
    max-width: 100%;
    height: auto;
  }
`;

const WordPreview = () => {
  const { markdown, formatSettings } = useDocument();
  const [processedHtml, setProcessedHtml] = useState('');
  
  // 配置marked选项，确保表格正确渲染
  const markedOptions = useMemo(() => {
    return {
      gfm: true, // 启用GitHub风格的Markdown
      breaks: true, // 允许回车换行
      tables: true, // 启用表格支持
      highlight: (code, lang) => {
        if (isMermaidCode(lang)) {
          // 对于Mermaid代码，返回一个特殊标记，后续会被替换
          return `<div class="mermaid-placeholder" data-code="${encodeURIComponent(code)}"></div>`;
        }
        // 使用Prism进行代码高亮
        if (Prism.languages[lang]) {
          return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code; // 如果没有对应的语言，返回原始代码
      }
    };
  }, []);
  
  // 处理Markdown内容，包括Mermaid图表渲染
  useEffect(() => {
    const processMarkdown = async () => {
      try {
        // 设置marked选项
        marked.setOptions(markedOptions);
        
        // 先将markdown转换为HTML
        const html = marked(markdown);
        
        // 查找所有Mermaid占位符
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        const mermaidPlaceholders = tempDiv.querySelectorAll('.mermaid-placeholder');
        
        // 如果没有Mermaid图表，直接使用HTML
        if (mermaidPlaceholders.length === 0) {
          setProcessedHtml(html);
          return;
        }
        
        // 处理每个Mermaid图表
        for (const placeholder of mermaidPlaceholders) {
          try {
            const code = decodeURIComponent(placeholder.getAttribute('data-code'));
            const { dataUrl } = await renderMermaidToPng(code);
            
            // 创建图片元素替换占位符
            const imgElement = document.createElement('div');
            imgElement.className = 'mermaid-diagram';
            imgElement.innerHTML = `<img src="${dataUrl}" alt="Mermaid Diagram" />`;
            
            placeholder.parentNode.replaceChild(imgElement, placeholder);
          } catch (error) {
            console.error('渲染Mermaid图表失败:', error);
            // 如果渲染失败，显示错误信息
            placeholder.innerHTML = `<div class="mermaid-error">Mermaid图表渲染失败: ${error.message}</div>`;
          }
        }
        
        setProcessedHtml(tempDiv.innerHTML);
      } catch (error) {
        console.error('处理Markdown内容失败:', error);
        setProcessedHtml(`<p>渲染失败: ${error.message}</p>`);
      }
    };
    
    processMarkdown();
  }, [markdown, markedOptions]);
  
  // 在渲染后应用Prism语法高亮
  useEffect(() => {
    if (processedHtml) {
      Prism.highlightAll();
    }
  }, [processedHtml]);

  const { content, page } = formatSettings;
  
  return (
    <PreviewContainer>
      <PreviewHeader>Word 预览</PreviewHeader>
      <PreviewContent>
        <WordDocument 
          marginTop={page.margin.top}
          marginRight={page.margin.right}
          marginBottom={page.margin.bottom}
          marginLeft={page.margin.left}
          heading1={content.heading1}
          heading2={content.heading2}
          heading3={content.heading3}
          paragraph={content.paragraph}
          quote={content.quote}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      </PreviewContent>
    </PreviewContainer>
  );
};

export default WordPreview; 