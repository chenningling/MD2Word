import React, { useMemo, useEffect, useState } from 'react';
import { marked } from 'marked';
import styled from 'styled-components';
import { useDocument } from '../../contexts/DocumentContext/DocumentContext';
import Prism from 'prismjs';
import 'prismjs/themes/prism.css';
import { renderMermaidToPng, isMermaidCode } from '../../utils/mermaidUtils';
import { InfoCircleOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import { Tooltip, Button, Dropdown, Space } from 'antd';
import { getMappedFont } from '../../utils/fontUtils';
import { extractLatexFormulas, FORMULA_TYPES } from '../../utils/latexUtils';
import { processLatexInPreview, getLatexPreviewStyles } from '../WordPreview/LaTeXRenderer';
import { addDebugTools, waitAndTestMathJax } from '../../utils/latexDebug';

// 导入字体
import '@fontsource/source-serif-pro';
import '@fontsource/source-sans-pro';
import '@fontsource/source-code-pro';


const PreviewContainer = styled.div`
  flex: 1;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

// 使用与ModuleHeader一致的样式
const PreviewHeader = styled.div`
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

const PreviewTitle = styled.div`
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
`;

const ZoomControls = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  
  .zoom-button {
    color: #666;
    font-size: 14px;
    padding: 4px 8px;
    &:hover {
      color: #1890ff;
    }
  }
  
  .zoom-value {
    margin: 0 4px;
    min-width: 50px;
    text-align: center;
    font-size: 14px;
    color: #666;
  }
`;

const PreviewHint = styled.div`
  color: #ff8c00; /* 明亮的橙色 */
  font-size: 12px;
  display: flex;
  align-items: center;
  
  .anticon {
    margin-right: 4px;
  }
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
  transform: scale(${props => props.zoom});
  transform-origin: top center;
  transition: transform 0.2s ease;
  
  /* 添加图片样式，确保图片不会超出页面宽度 */
  img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1em auto;
  }
  
  /* 图片容器样式 */
  .image-container {
    text-align: center;
    margin: 1.5em 0;
    max-width: 100%;
  }
  
  .markdown-image {
    max-width: 100%;
    border-radius: 0;
    box-shadow: none;
  }
  
  /* 不同尺寸图片的样式 */
  .large-image {
    max-width: 95%;
    margin: 0 auto;
  }
  
  .medium-image {
    max-width: 85%;
    margin: 0 auto;
  }
  
  .small-image {
    max-width: 60%;
    margin: 0 auto;
  }
  
  /* 处理超长图片 */
  .tall-image {
    max-height: 500px;
    object-fit: contain;
  }
  
  h1, h2, h3, h4, h5, h6 {
    font-family: ${props => getMappedFont(props.heading1.fontFamily)};
    font-weight: ${props => props.heading1.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading1.lineHeightUnit === 'pt' ? `${props.heading1.lineHeight}pt` : props.heading1.lineHeight};
    text-align: ${props => props.heading1.align};
    margin-top: ${props => props.heading1.spacingBefore ? `${props.heading1.spacingBefore}pt` : '12pt'};
    margin-bottom: ${props => props.heading1.spacingAfter ? `${props.heading1.spacingAfter}pt` : '8pt'};
  }
  
  h1 {
    font-size: ${props => props.heading1.fontSize}pt;
  }
  
  h2 {
    font-size: ${props => props.heading2.fontSize}pt;
    font-family: ${props => getMappedFont(props.heading2.fontFamily)};
    font-weight: ${props => props.heading2.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading2.lineHeightUnit === 'pt' ? `${props.heading2.lineHeight}pt` : props.heading2.lineHeight};
    text-align: ${props => props.heading2.align};
    margin-top: ${props => props.heading2.spacingBefore ? `${props.heading2.spacingBefore}pt` : '10pt'};
    margin-bottom: ${props => props.heading2.spacingAfter ? `${props.heading2.spacingAfter}pt` : '6pt'};
  }
  
  h3 {
    font-size: ${props => props.heading3.fontSize}pt;
    font-family: ${props => getMappedFont(props.heading3.fontFamily)};
    font-weight: ${props => props.heading3.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading3.lineHeightUnit === 'pt' ? `${props.heading3.lineHeight}pt` : props.heading3.lineHeight};
    text-align: ${props => props.heading3.align};
    margin-top: ${props => props.heading3.spacingBefore ? `${props.heading3.spacingBefore}pt` : '8pt'};
    margin-bottom: ${props => props.heading3.spacingAfter ? `${props.heading3.spacingAfter}pt` : '6pt'};
  }
  
  h4 {
    font-size: ${props => props.heading4.fontSize}pt;
    font-family: ${props => getMappedFont(props.heading4.fontFamily)};
    font-weight: ${props => props.heading4.bold ? 'bold' : 'normal'};
    line-height: ${props => props.heading4.lineHeightUnit === 'pt' ? `${props.heading4.lineHeight}pt` : props.heading4.lineHeight};
    text-align: ${props => props.heading4.align};
    margin-top: ${props => props.heading4.spacingBefore ? `${props.heading4.spacingBefore}pt` : '6pt'};
    margin-bottom: ${props => props.heading4.spacingAfter ? `${props.heading4.spacingAfter}pt` : '4pt'};
  }
  
  p {
    font-family: ${props => getMappedFont(props.paragraph.fontFamily)};
    font-size: ${props => props.paragraph.fontSize}pt;
    font-weight: ${props => props.paragraph.bold ? 'bold' : 'normal'};
    line-height: ${props => props.paragraph.lineHeightUnit === 'pt' ? `${props.paragraph.lineHeight}pt` : props.paragraph.lineHeight};
    text-align: ${props => props.paragraph.align};
    margin-bottom: ${props => props.paragraph.paragraphSpacing ? `${props.paragraph.paragraphSpacing}pt` : '6pt'};
    text-indent: ${props => {
      const charCount = props.paragraph.firstLineIndent || 0;
      if (charCount === 0) return '0';
      
      // 根据字体类型确定字符宽度系数
      const chineseFonts = ['宋体', '微软雅黑', '黑体', '仿宋', '楷体', '小标宋体', '华文宋体', '华文楷体', '华文黑体', '方正书宋', '方正黑体'];
      const isChineseFont = chineseFonts.includes(props.paragraph.fontFamily);
      const charWidthRatio = isChineseFont ? 1.0 : 0.5;
      
      // 计算字符宽度（以pt为单位）
      const charWidthInPoints = props.paragraph.fontSize * charWidthRatio;
      
      return `${charWidthInPoints * charCount}pt`;
    }};
  }
  
  blockquote {
    font-family: ${props => getMappedFont(props.quote.fontFamily)};
    font-size: ${props => props.quote.fontSize}pt;
    font-weight: ${props => props.quote.bold ? 'bold' : 'normal'};
    line-height: ${props => props.quote.lineHeightUnit === 'pt' ? `${props.quote.lineHeight}pt` : props.quote.lineHeight};
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
    font-family: ${props => getMappedFont(props.paragraph.fontFamily)};
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
    font-family: ${props => getMappedFont(props.paragraph.fontFamily)};
    font-size: ${props => props.paragraph.fontSize}pt;
    line-height: ${props => props.paragraph.lineHeightUnit === 'pt' ? `${props.paragraph.lineHeight}pt` : props.paragraph.lineHeight};
    margin-bottom: 1em;
    padding-left: 2em;
  }
  
  li {
    font-family: ${props => getMappedFont(props.paragraph.fontFamily)};
    font-size: ${props => props.paragraph.fontSize}pt;
    line-height: ${props => props.paragraph.lineHeightUnit === 'pt' ? `${props.paragraph.lineHeight}pt` : props.paragraph.lineHeight};
    margin-bottom: 0.3em;
  }
  
  /* 内联格式 */
  strong {
    font-weight: bold !important;
    /* 在某些字体下增强加粗效果 */
    -webkit-font-smoothing: auto;
    -moz-osx-font-smoothing: auto;
  }
  
  /* 确保列表中的加粗文本显示明显 */
  li strong {
    font-weight: bold !important;
    font-family: inherit;
    /* 进一步增强列表中加粗文本的显示 */
    -webkit-font-smoothing: auto;
    -moz-osx-font-smoothing: auto;
  }
  
  /* 段落中的加粗文本 */
  p strong {
    font-weight: bold !important;
    -webkit-font-smoothing: auto;
    -moz-osx-font-smoothing: auto;
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
    font-family: 'Source Code Pro', 'Courier New', Courier, monospace;
  }
  
  code {
    font-family: 'Source Code Pro', 'Courier New', Courier, monospace;
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
    display: block;
    margin: 0 auto; /* 保持居中对齐 */
  }

  /* 添加字体样式预览效果 */
  .font-preview {
    transition: all 0.2s ease;
  }
  
  /* 西文/数字片段字体 */
  .latin-run {
    font-family: ${props => getMappedFont(props.latinFont || 'Times New Roman')};
  }
  
  /* LaTeX 公式样式 */
  .latex-formula {
    font-family: "Latin Modern Math", "STIX Two Math", "TeX Gyre Termes Math", serif;
  }
  
  .latex-inline {
    display: inline;
    vertical-align: middle;
    margin: 0 2px;
  }
  
  .latex-block {
    display: block;
    text-align: center;
    margin: 1em auto;
    overflow-x: auto;
  }
  
  .latex-error {
    background-color: #ffe6e6;
    border: 1px solid #ff9999;
    padding: 2px 4px;
    border-radius: 3px;
    color: #cc0000;
    font-family: monospace;
    font-size: 0.9em;
  }
  
  .latex-placeholder {
    background-color: #f0f0f0;
    border: 1px dashed #ccc;
    padding: 2px 6px;
    border-radius: 3px;
    color: #666;
    font-style: italic;
    font-size: 0.9em;
  }
  
  /* SVG 数学公式的样式优化 */
  .latex-formula svg {
    max-width: 100%;
    height: auto;
  }
  
  .latex-block svg {
    margin: 0 auto;
  }
  
  /* 响应式设计：小屏幕上的公式处理 */
  @media (max-width: 768px) {
    .latex-block {
      font-size: 0.9em;
      overflow-x: scroll;
      padding: 0 10px;
    }
    
    .latex-inline {
      font-size: 0.95em;
    }
  }
`;

const WordPreview = () => {
  const { markdown, formatSettings } = useDocument();
  const [processedHtml, setProcessedHtml] = useState('');
  const [zoom, setZoom] = useState(1); // 默认缩放比例为1 (100%)
  
  // 在组件加载时添加调试工具
  useEffect(() => {
    addDebugTools();
    
    // 延迟测试 MathJax
    setTimeout(async () => {
      const success = await waitAndTestMathJax();
      console.log('[Word Preview] MathJax 功能测试:', success ? '成功' : '失败');
    }, 1000);
  }, []);
  
  // 缩放级别选项
  const zoomOptions = [
    { key: '0.5', label: '50%', value: 0.5 },
    { key: '0.75', label: '75%', value: 0.75 },
    { key: '1', label: '100%', value: 1 },
    { key: '1.25', label: '125%', value: 1.25 },
    { key: '1.5', label: '150%', value: 1.5 },
    { key: '2', label: '200%', value: 2 },
  ];
  
  // 处理缩放变化
  const handleZoomChange = (newZoom) => {
    setZoom(newZoom);
  };
  
  // 缩小
  const zoomOut = () => {
    const currentIndex = zoomOptions.findIndex(option => option.value === zoom);
    if (currentIndex > 0) {
      setZoom(zoomOptions[currentIndex - 1].value);
    }
  };
  
  // 放大
  const zoomIn = () => {
    const currentIndex = zoomOptions.findIndex(option => option.value === zoom);
    if (currentIndex < zoomOptions.length - 1) {
      setZoom(zoomOptions[currentIndex + 1].value);
    }
  };
  
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
  
  // 处理Markdown内容，包括Mermaid图表渲染、LaTeX公式渲染与西文字体包裹
  useEffect(() => {
    const processMarkdown = async () => {
      try {
        console.log('[Word Preview] 开始处理 Markdown 内容');
        
        // 第一步：提取 LaTeX 公式并替换为占位符
        const latexFormulas = extractLatexFormulas(markdown);
        let processedMarkdown = markdown;
        
        if (latexFormulas.length > 0) {
          console.log(`[Word Preview] 发现 ${latexFormulas.length} 个 LaTeX 公式`);
          // 暂时先不替换，让 marked 正常解析，后续在 HTML 中处理
        }
        
        // 设置marked选项
        marked.setOptions(markedOptions);
        
        // 先将markdown转换为HTML
        let html = marked(processedMarkdown);
        
        // 🔍 调试：检查Markdown转HTML后是否存在HTML实体编码
        if (html.includes('&amp;')) {
          console.log('[Word Preview] ⚠️ 检测到HTML中包含&amp;实体编码');
          const ampMatches = html.match(/[^&]*&amp;[^&]*/g);
          if (ampMatches) {
            console.log('[Word Preview] 🔍 &amp;出现的上下文:', ampMatches.slice(0, 3));
          }
          
          // 🚨 紧急修复：在HTML阶段直接替换数学公式中的HTML实体
          // 这是因为marked将LaTeX中的&符号编码成了&amp;
          const originalHtml = html;
          console.log(`[Word Preview] 🔍 修复前完整HTML:`, html);
          html = html.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g, (match) => {
            console.log(`[Word Preview] 🔍 处理公式: "${match}"`);
            const decodedMatch = match.replace(/&amp;/g, '&')
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&quot;/g, '"')
                                    .replace(/&#39;/g, "'");
            console.log(`[Word Preview] 🔧 解码结果: "${decodedMatch}"`);
            console.log(`[Word Preview] 🔍 是否改变: ${decodedMatch !== match}`);
            if (decodedMatch !== match) {
              console.log(`[Word Preview] 🔧 紧急修复公式HTML实体: "${match}" → "${decodedMatch}"`);
            }
            return decodedMatch;
          });
          
          // 🔍 验证HTML修复效果
          console.log(`[Word Preview] 🔍 修复后完整HTML:`, html);
          const htmlStillContainsAmp = html.includes('&amp;');
          console.log(`[Word Preview] ✅ HTML阶段修复完成。还包含&amp;: ${htmlStillContainsAmp}`);
          if (htmlStillContainsAmp) {
            console.warn(`[Word Preview] ⚠️ 警告：HTML修复后仍包含&amp;！`);
            console.log(`[Word Preview] 🔍 修复前HTML预览:`, originalHtml.substring(0, 200));
            console.log(`[Word Preview] 🔍 修复后HTML预览:`, html.substring(0, 200));
            // 额外检查：查找所有&amp;的位置
            const ampMatches = html.match(/[^&]*&amp;[^&]*/g);
            if (ampMatches) {
              console.log(`[Word Preview] 🔍 剩余的&amp;上下文:`, ampMatches.slice(0, 5));
            }
          }
          
          if (originalHtml !== html) {
            console.log('[Word Preview] ✅ 已在HTML阶段修复所有公式中的HTML实体编码');
          }
        }
        
        // 查找所有Mermaid占位符
        const tempDiv = document.createElement('div');
        // 🔧 关键修复：使用修复后的HTML
        tempDiv.innerHTML = html;
        
        // 🔍 调试：检查DOM设置后是否重新编码了HTML实体
        console.log(`[Word Preview] 🔍 设置tempDiv.innerHTML后检查:`, {
          原始html包含amp: html.includes('&amp;'),
          tempDiv包含amp: tempDiv.innerHTML.includes('&amp;'),
          是否被重新编码: !html.includes('&amp;') && tempDiv.innerHTML.includes('&amp;')
        });
        
        // 处理所有图片，添加样式类
        const imgElements = tempDiv.querySelectorAll('img:not(.mermaid-diagram img)');
        imgElements.forEach(img => {
          // 添加样式类
          img.classList.add('markdown-image');
          
          // 为图片添加父容器，便于控制样式
          if (!img.parentElement.classList.contains('image-container')) {
            const container = document.createElement('div');
            container.className = 'image-container';
            img.parentNode.insertBefore(container, img);
            container.appendChild(img);
            
            // 添加加载事件，处理图片尺寸
            img.onload = function() {
              // 获取图片原始尺寸
              const width = this.naturalWidth;
              const height = this.naturalHeight;
              
              // 根据图片尺寸应用不同的样式类
              if (width > 800) {
                this.classList.add('large-image');
              } else if (width < 300) {
                this.classList.add('small-image');
              } else {
                this.classList.add('medium-image');
              }
              
              // 处理超长图片
              if (height > width * 1.5) {
                this.classList.add('tall-image');
              }
            };
            
            // 为已经加载的图片触发onload事件
            if (img.complete) {
              img.onload();
            }
          }
        });
        
        const mermaidPlaceholders = tempDiv.querySelectorAll('.mermaid-placeholder');
        
        // 如果没有Mermaid图表，仍需要处理LaTeX公式
        if (mermaidPlaceholders.length === 0) {
          console.log('[Word Preview] 没有Mermaid图表，但需要处理LaTeX公式');
          // 不要在这里直接返回，继续处理LaTeX公式
        }
        
        // 处理每个Mermaid图表
        for (const placeholder of mermaidPlaceholders) {
          try {
            const code = decodeURIComponent(placeholder.getAttribute('data-code'));
            const { dataUrl } = await renderMermaidToPng(code);
            
            // 创建图片元素替换占位符
            const imgElement = document.createElement('div');
            imgElement.className = 'mermaid-diagram';
            imgElement.innerHTML = `<img src="${dataUrl}" alt="Mermaid Diagram" class="markdown-image" />`;
            
            // 为Mermaid图表添加加载事件
            const mermaidImg = imgElement.querySelector('img');
            if (mermaidImg) {
              mermaidImg.onload = function() {
                // 获取图片原始尺寸
                const width = this.naturalWidth;
                const height = this.naturalHeight;
                
                // 根据图片尺寸应用不同的样式类
                if (width > 800) {
                  this.classList.add('large-image');
                } else if (width < 300) {
                  this.classList.add('small-image');
                } else {
                  this.classList.add('medium-image');
                }
                
                // 处理超长图表
                if (height > width * 1.5) {
                  this.classList.add('tall-image');
                }
              };
            }
            
            placeholder.parentNode.replaceChild(imgElement, placeholder);
          } catch (error) {
            console.error('渲染Mermaid图表失败:', error);
            // 如果渲染失败，显示错误信息
            placeholder.innerHTML = `<div class="mermaid-error">Mermaid图表渲染失败: ${error.message}</div>`;
          }
        }
        
        // 第二步：处理 LaTeX 公式渲染
        console.log(`[Word Preview] LaTeX 公式检查: 发现 ${latexFormulas.length} 个公式`);
        console.log(`[Word Preview] 当前HTML长度: ${tempDiv.innerHTML.length}`);
        console.log(`[Word Preview] HTML内容预览:`, tempDiv.innerHTML.substring(0, 200));
        
        // 🔍 重要调试：检查进入LaTeX处理时HTML的实体编码状态
        const htmlContainsAmp = tempDiv.innerHTML.includes('&amp;');
        console.log(`[Word Preview] 📊 进入LaTeX处理时HTML状态: 包含&amp;=${htmlContainsAmp}`);
        if (htmlContainsAmp) {
          const ampMatches = tempDiv.innerHTML.match(/[^&]*&amp;[^&]*/g);
          console.log(`[Word Preview] 🔍 &amp;出现的上下文:`, ampMatches ? ampMatches.slice(0, 3) : []);
          
          // 🚨 关键修复：由于DOM重新编码了HTML实体，我们需要再次修复tempDiv.innerHTML
          console.log(`[Word Preview] 🔧 DOM重新编码检测：开始修复tempDiv.innerHTML中的HTML实体`);
          let fixedHtml = tempDiv.innerHTML;
          fixedHtml = fixedHtml.replace(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g, (match) => {
            const decodedMatch = match.replace(/&amp;/g, '&')
                                    .replace(/&lt;/g, '<')
                                    .replace(/&gt;/g, '>')
                                    .replace(/&quot;/g, '"')
                                    .replace(/&#39;/g, "'");
            if (decodedMatch !== match) {
              console.log(`[Word Preview] 🔧 DOM修复公式HTML实体: "${match}" → "${decodedMatch}"`);
            }
            return decodedMatch;
          });
          
          // 重新设置修复后的HTML
          tempDiv.innerHTML = fixedHtml;
          console.log(`[Word Preview] ✅ tempDiv.innerHTML HTML实体修复完成`);
        }
        
        // 内联 LaTeX 渲染实现（避免模块导入问题）
        console.log('[Word Preview] 开始内联 LaTeX 公式处理');
        try {
          if (window.MathJax && window.MathJax.tex2svg) {
            let processedHtml = tempDiv.innerHTML;
            let formulaCount = 0;
            
            // 处理块级公式 $$...$$ - 改进正则表达式以处理包含HTML标签的情况
            const blockMatches = [...processedHtml.matchAll(/\$\$\s*([\s\S]*?)\s*\$\$/g)];
            console.log(`[Word Preview] 发现 ${blockMatches.length} 个块级公式`);
            
            for (const match of blockMatches) {
              try {
                const fullMatch = match[0];
                let latexCode = match[1].trim();
                
                // 🔍 调试：检查正则匹配时的LaTeX代码
                console.log(`[Word Preview] 🔍 正则匹配到块级公式:`, {
                  完整匹配: fullMatch.substring(0, 100) + (fullMatch.length > 100 ? '...' : ''),
                  LaTeX代码: latexCode.substring(0, 100) + (latexCode.length > 100 ? '...' : ''),
                  包含amp: latexCode.includes('&amp;')
                });
                
                if (!latexCode) continue;
                
                // 🚨 关键修复：在清理HTML标签之前先进行HTML实体解码！
                const originalLatexCode = latexCode;
                latexCode = latexCode.replace(/&amp;/g, '&')
                                   .replace(/&lt;/g, '<')
                                   .replace(/&gt;/g, '>')
                                   .replace(/&quot;/g, '"')
                                   .replace(/&#39;/g, "'")
                                   .replace(/&nbsp;/g, ' ');
                
                // 🔍 调试：检查HTML实体解码效果
                if (originalLatexCode !== latexCode) {
                  console.log(`[Word Preview] 🔧 块级公式HTML实体解码:`, {
                    原始: originalLatexCode.substring(0, 100) + (originalLatexCode.length > 100 ? '...' : ''),
                    解码后: latexCode.substring(0, 100) + (latexCode.length > 100 ? '...' : ''),
                    解码生效: true
                  });
                }
                
                // 清理HTML标签，提取纯LaTeX代码
                // 🔧 关键修复：正确处理LaTeX矩阵换行符
                const beforeBrReplace = latexCode;
                
                // 步骤1：智能处理<br>标签替换
                // 检查是否在矩阵环境中（pmatrix、bmatrix、matrix等）
                const isInMatrix = /\\begin\{[pb]?matrix\}/.test(latexCode);
                if (isInMatrix) {
                  // 矩阵环境：智能处理<br>标签
                  // 1. 不要在\begin{pmatrix}后直接添加\\
                  // 2. 只在行与行之间添加\\
                  latexCode = latexCode.replace(/\\begin\{([pb]?matrix)\}\s*<br\s*\/?>\s*/gi, '\\begin{$1}\n  ');
                  // 3. 中间的<br>替换为\\换行
                  latexCode = latexCode.replace(/<br\s*\/?>\s*(?!\\end)/gi, ' \\\\ \n  ');
                  // 4. \end前的<br>只需要换行
                  latexCode = latexCode.replace(/<br\s*\/?>\s*(?=\\end)/gi, '\n');
                } else {
                  // 其他环境：<br>替换为换行符
                  latexCode = latexCode.replace(/<br\s*\/?>/gi, '\n');
                }
                const afterBrReplace = latexCode;
                
                // 步骤2：移除其他可能的HTML标签
                latexCode = latexCode.replace(/<[^>]*>/g, '');
                const afterTagRemoval = latexCode;
                
                // 步骤3：清理多余的空白字符，但保留LaTeX结构
                if (isInMatrix) {
                  // 矩阵环境：保持清晰的格式，清理多余的空白
                  latexCode = latexCode.replace(/\n\s+/g, '\n  ')         // 统一缩进为2空格
                                     .replace(/\s*\\\\\s*/g, ' \\\\ ')    // 标准化\\前后空格
                                     .replace(/\s{2,}/g, ' ')             // 多个空格合并为一个
                                     .replace(/\\\\\s*\n\s*/g, '\\\\\n  ') // \\后换行并缩进
                                     .trim();
                } else {
                  // 其他环境：清理换行符
                  latexCode = latexCode.replace(/\n\s*\n/g, '\n').trim();
                }
                const afterWhitespaceCleanup = latexCode;
                
                // 🔍 调试：检查HTML标签清理的每个步骤
                console.log(`[Word Preview] 🔧 HTML标签清理过程:`, {
                  '1_原始': beforeBrReplace.substring(0, 80) + (beforeBrReplace.length > 80 ? '...' : ''),
                  '2_br替换后': afterBrReplace.substring(0, 80) + (afterBrReplace.length > 80 ? '...' : ''),
                  '3_标签移除后': afterTagRemoval.substring(0, 80) + (afterTagRemoval.length > 80 ? '...' : ''),
                  '4_空白清理后': afterWhitespaceCleanup.substring(0, 80) + (afterWhitespaceCleanup.length > 80 ? '...' : ''),
                  是否包含换行: latexCode.includes('\\\\') || latexCode.includes('\n')
                });
                
                if (!latexCode) continue;
                
                // 🔍 最终调试：传给MathJax的LaTeX代码
                console.log(`[Word Preview] 🚀 最终传给MathJax的LaTeX代码:`, {
                  代码: latexCode,
                  长度: latexCode.length,
                  包含双反斜杠: latexCode.includes('\\\\'),
                  包含换行: latexCode.includes('\n'),
                  代码展示: JSON.stringify(latexCode)
                });
                
                window.MathJax.texReset();
                const result = window.MathJax.tex2svg(latexCode, { display: true });
                
                if (result && result.firstChild) {
                  const svg = result.firstChild.outerHTML;
                  const formulaHtml = `<div class="latex-formula latex-block">${svg}</div>`;
                  processedHtml = processedHtml.replace(fullMatch, formulaHtml);
                  formulaCount++;
                  console.log(`[Word Preview] 块级公式渲染成功 #${formulaCount}:`, latexCode.substring(0, 30));
                }
              } catch (error) {
                console.error('[Word Preview] 块级公式渲染失败:', error);
              }
            }
            
            // 处理行内公式 $...$ - 同样改进正则表达式
            const inlineMatches = [...processedHtml.matchAll(/(?<!\$)\$(?!\$)([^$\n]*?[^$\s][^$\n]*?)\$(?!\$)/g)];
            console.log(`[Word Preview] 发现 ${inlineMatches.length} 个行内公式`);
            
            for (const match of inlineMatches) {
              try {
                const fullMatch = match[0];
                let latexCode = match[1].trim();
                
                if (!latexCode) continue;
                
                // 🚨 关键修复：行内公式也需要HTML实体解码！
                const originalLatexCode = latexCode;
                latexCode = latexCode.replace(/&amp;/g, '&')
                                   .replace(/&lt;/g, '<')
                                   .replace(/&gt;/g, '>')
                                   .replace(/&quot;/g, '"')
                                   .replace(/&#39;/g, "'")
                                   .replace(/&nbsp;/g, ' ');
                
                // 🔍 调试：检查行内公式HTML实体解码效果
                if (originalLatexCode !== latexCode) {
                  console.log(`[Word Preview] 🔧 行内公式HTML实体解码:`, {
                    原始: originalLatexCode,
                    解码后: latexCode,
                    解码生效: true
                  });
                }
                
                // 清理HTML标签 - 行内公式也需要矩阵支持
                const isInMatrix = /\\begin\{[pb]?matrix\}/.test(latexCode);
                if (isInMatrix) {
                  // 行内矩阵：智能处理<br>标签（简化版，因为行内一般不换行）
                  latexCode = latexCode.replace(/\\begin\{([pb]?matrix)\}\s*<br\s*\/?>\s*/gi, '\\begin{$1} ');
                  latexCode = latexCode.replace(/<br\s*\/?>\s*(?!\\end)/gi, ' \\\\ ');
                  latexCode = latexCode.replace(/<br\s*\/?>\s*(?=\\end)/gi, ' ');
                }
                latexCode = latexCode.replace(/<[^>]*>/g, '').trim();
                
                // 清理行内矩阵的空白字符
                if (isInMatrix) {
                  latexCode = latexCode.replace(/\s+/g, ' ')
                                     .replace(/\s*\\\\\s*/g, ' \\\\ ')
                                     .trim();
                }
                
                if (!latexCode) continue;
                
                window.MathJax.texReset();
                const result = window.MathJax.tex2svg(latexCode, { display: false });
                
                if (result && result.firstChild) {
                  const svg = result.firstChild.outerHTML;
                  const formulaHtml = `<span class="latex-formula latex-inline">${svg}</span>`;
                  processedHtml = processedHtml.replace(fullMatch, formulaHtml);
                  formulaCount++;
                  console.log(`[Word Preview] 行内公式渲染成功 #${formulaCount}:`, latexCode.substring(0, 30));
                }
              } catch (error) {
                console.error('[Word Preview] 行内公式渲染失败:', error);
              }
            }
            
            tempDiv.innerHTML = processedHtml;
            console.log(`[Word Preview] LaTeX 公式处理完成，共渲染 ${formulaCount} 个公式`);
          } else {
            console.error('[Word Preview] MathJax 不可用，跳过 LaTeX 渲染');
          }
        } catch (error) {
          console.error('[Word Preview] LaTeX 公式处理失败:', error);
        }
        
        // 西文/数字字体包裹：仅在开启时执行，跳过代码相关容器和LaTeX公式
        const enableLatin = formatSettings?.latin?.enabled;
        if (enableLatin) {
          const skipSelectors = 'pre, code, kbd, samp, script, style, .latex-formula, .latex-error';
          const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
              // 跳过空白文本
              if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
              // 跳过位于禁用容器内的文本
              let p = node.parentElement;
              while (p) {
                if (p.matches && p.matches(skipSelectors)) return NodeFilter.FILTER_REJECT;
                p = p.parentElement;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          });
          const latinRegex = /[A-Za-z0-9@._\-]+/g;
          const textNodes = [];
          let n;
          while ((n = walker.nextNode())) textNodes.push(n);
          textNodes.forEach(node => {
            const text = node.nodeValue;
            latinRegex.lastIndex = 0;
            const parts = [];
            let lastIndex = 0;
            let m;
            while ((m = latinRegex.exec(text)) !== null) {
              if (m.index > lastIndex) {
                const chunk = text.slice(lastIndex, m.index);
                if (chunk) parts.push({ t: chunk, latin: false });
              }
              // 确保西文内容不为空
              if (m[0]) parts.push({ t: m[0], latin: true });
              lastIndex = m.index + m[0].length;
            }
            if (lastIndex < text.length) {
              const tail = text.slice(lastIndex);
              if (tail) parts.push({ t: tail, latin: false });
            }
            if (parts.length <= 1) return;
            const frag = document.createDocumentFragment();
            parts.forEach(p => {
              // 移除空字符串检查，确保数字0不被过滤
              if (p.t !== undefined && p.t !== null) {
                if (p.latin) {
                  const span = document.createElement('span');
                  span.className = 'latin-run';
                  span.textContent = p.t;
                  frag.appendChild(span);
                } else {
                  frag.appendChild(document.createTextNode(p.t));
                }
              }
            });
            node.parentNode && node.parentNode.replaceChild(frag, node);
          });
        }

        // 🎯 直接在这里进行 LaTeX 渲染处理 - 最简单有效的方法
        let finalHtml = tempDiv.innerHTML;
        console.log('[Word Preview] 最终 HTML 处理 - LaTeX 渲染');
        
        if (window.MathJax && window.MathJax.tex2svg) {
          let formulaCount = 0;
          
          // 处理块级公式 $$...$$ - 改进正则表达式以处理包含HTML标签的情况
          const blockMatches = [...finalHtml.matchAll(/\$\$\s*([\s\S]*?)\s*\$\$/g)];
          console.log(`[Word Preview] 最终处理 - 发现 ${blockMatches.length} 个块级公式`);
          
          for (const match of blockMatches) {
            try {
              const fullMatch = match[0];
              let latexCode = match[1].trim();
              
              if (!latexCode) continue;
              
              // 清理HTML标签，提取纯LaTeX代码
              // 🔧 最终处理阶段：也需要正确处理矩阵换行符
              const isInMatrix = /\\begin\{[pb]?matrix\}/.test(latexCode);
              if (isInMatrix) {
                // 矩阵环境：智能处理<br>标签
                latexCode = latexCode.replace(/\\begin\{([pb]?matrix)\}\s*<br\s*\/?>\s*/gi, '\\begin{$1}\n  ');
                latexCode = latexCode.replace(/<br\s*\/?>\s*(?!\\end)/gi, ' \\\\ \n  ');
                latexCode = latexCode.replace(/<br\s*\/?>\s*(?=\\end)/gi, '\n');
              } else {
                // 其他环境：<br>替换为换行符
                latexCode = latexCode.replace(/<br\s*\/?>/gi, '\n');
              }
              // 移除其他可能的HTML标签
              latexCode = latexCode.replace(/<[^>]*>/g, '');
              // 🔧 解码HTML实体，特别是&amp;等
              const originalLatexCode = latexCode;
              latexCode = latexCode.replace(/&amp;/g, '&')
                                   .replace(/&lt;/g, '<')
                                   .replace(/&gt;/g, '>')
                                   .replace(/&quot;/g, '"')
                                   .replace(/&#39;/g, "'");
              
              // 🔍 详细调试：检查HTML实体解码效果
              console.log(`[Word Preview] 🔍 块级公式LaTeX代码提取:`, {
                原始码: originalLatexCode.substring(0, 100) + (originalLatexCode.length > 100 ? '...' : ''),
                解码后: latexCode.substring(0, 100) + (latexCode.length > 100 ? '...' : ''),
                包含amp: originalLatexCode.includes('&amp;'),
                包含lt: originalLatexCode.includes('&lt;'),
                包含gt: originalLatexCode.includes('&gt;'),
                是否需要解码: originalLatexCode !== latexCode
              });
              
              if (originalLatexCode !== latexCode) {
                console.log(`[Word Preview] 🔧 块级公式HTML实体解码生效`);
              } else if (originalLatexCode.includes('&amp;')) {
                console.warn(`[Word Preview] ⚠️ 警告：块级公式仍包含&amp;但解码未生效！`);
              }
              
              // 清理多余的空白字符
              if (isInMatrix) {
                // 矩阵环境：保持清晰的格式
                latexCode = latexCode.replace(/\n\s+/g, '\n  ')
                                   .replace(/\s*\\\\\s*/g, ' \\\\ ')
                                   .replace(/\s{2,}/g, ' ')
                                   .replace(/\\\\\s*\n\s*/g, '\\\\\n  ')
                                   .trim();
              } else {
                // 其他环境：清理换行符
                latexCode = latexCode.replace(/\n\s*\n/g, '\n').trim();
              }
              
              if (originalLatexCode !== latexCode) {
                console.log(`[Word Preview] 🔧 HTML实体解码: "${originalLatexCode}" → "${latexCode}"`);
              }
              
              if (!latexCode) continue;
              
              // 🔍 最终检查：确保传给MathJax的代码已完全清理
              if (latexCode.includes('&amp;') || latexCode.includes('&lt;') || latexCode.includes('&gt;')) {
                console.warn(`[Word Preview] ⚠️ 警告：传给MathJax的块级公式仍包含HTML实体:`, {
                  latex: latexCode,
                  包含amp: latexCode.includes('&amp;'),
                  包含lt: latexCode.includes('&lt;'),
                  包含gt: latexCode.includes('&gt;')
                });
              }
              
              window.MathJax.texReset();
              const result = window.MathJax.tex2svg(latexCode, { display: true });
              
              if (result && result.firstChild) {
                const svg = result.firstChild.outerHTML;
                const formulaHtml = `<div class="latex-formula latex-block">${svg}</div>`;
                finalHtml = finalHtml.replace(fullMatch, formulaHtml);
                formulaCount++;
                console.log(`[Word Preview] ✅ 块级公式渲染成功 #${formulaCount}:`, latexCode.substring(0, 50));
              }
            } catch (error) {
              console.error('[Word Preview] ❌ 块级公式渲染失败:', error);
            }
          }
          
          // 处理行内公式 $...$ - 同样改进正则表达式
          const inlineMatches = [...finalHtml.matchAll(/(?<!\$)\$(?!\$)([^$\n]*?[^$\s][^$\n]*?)\$(?!\$)/g)];
          console.log(`[Word Preview] 最终处理 - 发现 ${inlineMatches.length} 个行内公式`);
          
          for (const match of inlineMatches) {
            try {
              const fullMatch = match[0];
              let latexCode = match[1].trim();
              
              if (!latexCode) continue;
              
              // 清理HTML标签
              latexCode = latexCode.replace(/<[^>]*>/g, '');
              // 🔧 解码HTML实体，特别是&amp;等
              const originalLatexCodeInline = latexCode;
              latexCode = latexCode.replace(/&amp;/g, '&')
                                   .replace(/&lt;/g, '<')
                                   .replace(/&gt;/g, '>')
                                   .replace(/&quot;/g, '"')
                                   .replace(/&#39;/g, "'")
                                   .trim();
              
              // 🔍 详细调试：检查行内公式HTML实体解码效果
              if (originalLatexCodeInline !== latexCode) {
                console.log(`[Word Preview] 🔧 行内公式HTML实体解码:`, {
                  原始: originalLatexCodeInline,
                  解码后: latexCode,
                  包含amp: originalLatexCodeInline.includes('&amp;'),
                  包含lt: originalLatexCodeInline.includes('&lt;'),
                  包含gt: originalLatexCodeInline.includes('&gt;')
                });
              }
              
              if (!latexCode) continue;
              
              // 🔍 最终检查：确保传给MathJax的代码已完全清理
              if (latexCode.includes('&amp;') || latexCode.includes('&lt;') || latexCode.includes('&gt;')) {
                console.warn(`[Word Preview] ⚠️ 警告：传给MathJax的行内公式仍包含HTML实体:`, {
                  latex: latexCode,
                  包含amp: latexCode.includes('&amp;'),
                  包含lt: latexCode.includes('&lt;'),
                  包含gt: latexCode.includes('&gt;')
                });
              }
              
              window.MathJax.texReset();
              const result = window.MathJax.tex2svg(latexCode, { display: false });
              
              if (result && result.firstChild) {
                const svg = result.firstChild.outerHTML;
                const formulaHtml = `<span class="latex-formula latex-inline">${svg}</span>`;
                finalHtml = finalHtml.replace(fullMatch, formulaHtml);
                formulaCount++;
                console.log(`[Word Preview] ✅ 行内公式渲染成功 #${formulaCount}:`, latexCode.substring(0, 30));
              }
            } catch (error) {
              console.error('[Word Preview] ❌ 行内公式渲染失败:', error);
            }
          }
          
          console.log(`[Word Preview] 🎉 LaTeX 处理完成！总计渲染 ${formulaCount} 个公式`);
        } else {
          console.error('[Word Preview] ❌ MathJax 不可用，跳过 LaTeX 渲染');
        }

        setProcessedHtml(finalHtml);
      } catch (error) {
        console.error('处理Markdown内容失败:', error);
        setProcessedHtml(`<p>渲染失败: ${error.message}</p>`);
      }
    };
    
    processMarkdown();
  }, [markdown, markedOptions, formatSettings]);
  
  // 在渲染后应用Prism语法高亮
  useEffect(() => {
    if (processedHtml) {
      Prism.highlightAll();
    }
  }, [processedHtml]);

  const { content, page, latin } = formatSettings;
  
  // 缩放下拉菜单项
  const zoomMenuItems = zoomOptions.map(option => ({
    key: option.key,
    label: option.label,
    onClick: () => handleZoomChange(option.value)
  }));
  
  return (
    <PreviewContainer>
      <PreviewHeader>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <PreviewTitle>Word 预览</PreviewTitle>
          <ZoomControls>
            <Button 
              type="text" 
              className="zoom-button" 
              icon={<ZoomOutOutlined />} 
              onClick={zoomOut}
              disabled={zoom <= zoomOptions[0].value}
            />
            <Dropdown menu={{ items: zoomMenuItems }} trigger={['click']}>
              <Button type="text" className="zoom-value">
                <Space>
                  {(zoom * 100).toFixed(0)}%
                </Space>
              </Button>
            </Dropdown>
            <Button 
              type="text" 
              className="zoom-button" 
              icon={<ZoomInOutlined />} 
              onClick={zoomIn}
              disabled={zoom >= zoomOptions[zoomOptions.length - 1].value}
            />
          </ZoomControls>
        </div>
        <PreviewHint>
          <Tooltip title="由于浏览器渲染限制，预览效果与实际Word文档可能存在差异，特别是字体显示。导出后的文档将正确应用您选择的所有格式。">
            <InfoCircleOutlined /> 预览仅供参考，导出后查看实际效果
          </Tooltip>
        </PreviewHint>
      </PreviewHeader>
      <PreviewContent>
        <WordDocument 
          marginTop={page.margin.top}
          marginRight={page.margin.right}
          marginBottom={page.margin.bottom}
          marginLeft={page.margin.left}
          heading1={content.heading1}
          heading2={content.heading2}
          heading3={content.heading3}
          heading4={content.heading4}
          paragraph={content.paragraph}
          quote={content.quote}
          zoom={zoom}
          latinFont={latin?.fontFamily}
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      </PreviewContent>
    </PreviewContainer>
  );
};

export default WordPreview; 