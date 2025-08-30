import { TextRun, ExternalHyperlink } from 'docx';
import { marked } from 'marked';

/**
 * 文本处理工具模块
 * 提供文本分割、格式化等功能
 */

/**
 * 将一段文本按西文/数字与非西文拆分为多个 TextRun，同时处理 OMML 公式标记
 * @param {string} text - 要处理的文本
 * @param {Object} settings - 文本设置
 * @param {boolean} isHeading - 是否为标题
 * @param {Object} latinSettings - 西文字体设置
 * @param {Object} additionalStyles - 额外样式
 * @returns {Array} TextRun数组
 */
export const splitLatinRuns = (text, settings, isHeading, latinSettings, additionalStyles = {}) => {
  const result = [];
  const enableLatin = latinSettings && latinSettings.enabled;
  
  // 检查文本中是否包含 OMML 标记
  const ommlPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
  const hasOmmlMarkers = ommlPattern.test(text);
  
  if (hasOmmlMarkers) {
    console.log('[Export OMML] 文本包含 OMML 标记，在表格等结构中保持原样');
    // 🔧 避免在Word文档创建阶段进行OMML转换，保持占位符原样
    // 这样后处理阶段可以正确识别和替换
    return [new TextRun({
      text,
      font: { name: settings.fontFamily },
      size: Math.round(settings.fontSize * 2),
      bold: isHeading ? settings.bold : settings.bold,
      color: "000000",
      ...additionalStyles
    })];
  }
  
  // 基础样式设置
  const baseStyle = {
    font: { name: settings.fontFamily },
    size: Math.round(settings.fontSize * 2),
    bold: isHeading ? settings.bold : settings.bold,
    color: "000000",
    italics: false,
    ...additionalStyles
  };
  
  if (!enableLatin) {
    result.push(new TextRun({
      text,
      ...baseStyle
    }));
    return result;
  }
  
  // 优化正则表达式，确保能正确匹配所有西文字符、数字和常见符号
  const regex = /[A-Za-z0-9@._\-]+/g;
  let lastIndex = 0;
  let m;
  
  while ((m = regex.exec(text)) !== null) {
    // 添加西文字符前的中文内容
    if (m.index > lastIndex) {
      const chunk = text.slice(lastIndex, m.index);
      if (chunk) {
        result.push(new TextRun({
          text: chunk,
          ...baseStyle
        }));
      }
    }
    
    // 添加西文字符，使用西文字体
    const latinChunk = m[0];
    if (latinChunk) {
      result.push(new TextRun({
        text: latinChunk,
        ...baseStyle,
        font: { name: latinSettings.fontFamily || 'Times New Roman' }
      }));
    }
    
    lastIndex = m.index + m[0].length;
  }
  
  // 添加剩余的中文内容
  if (lastIndex < text.length) {
    const tail = text.slice(lastIndex);
    if (tail) {
      result.push(new TextRun({
        text: tail,
        ...baseStyle
      }));
    }
  }
  
  return result;
};

/**
 * 处理tokens数组转换为TextRun数组，支持 OMML 公式标记
 * @param {Array} tokens - 标记数组
 * @param {Object} settings - 设置
 * @param {boolean} isHeading - 是否为标题
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Array} TextRun数组
 */
export const processTokensToTextRuns = (tokens, settings, isHeading = false, latinSettings) => {
  const textRuns = [];
  
  tokens.forEach(token => {
    switch (token.type) {
      case 'strong':
        // 加粗文本也要应用西文字体设置
        if (token.text) {
          const runs = splitLatinRuns(token.text, settings, isHeading, latinSettings, { 
            bold: true, 
            italics: false 
          });
          textRuns.push(...runs);
        }
        break;
      case 'em':
        // 斜体文本也要应用西文字体设置
        if (token.text) {
          const runs = splitLatinRuns(token.text, settings, isHeading, latinSettings, { 
            italics: true 
          });
          textRuns.push(...runs);
        }
        break;
      case 'del':
        // 删除线文本也要应用西文字体设置
        if (token.text) {
          const runs = splitLatinRuns(token.text, settings, isHeading, latinSettings, { 
            strike: true, 
            italics: false 
          });
          textRuns.push(...runs);
        }
        break;
      case 'link':
        // 链接文本特殊处理：需要用ExternalHyperlink包装，但内部的TextRun要应用西文字体
        if (token.text) {
          const runs = splitLatinRuns(token.text, settings, isHeading, latinSettings, { 
            style: "Hyperlink",
            bold: isHeading ? settings.bold : undefined,
            italics: false
          });
          
          // 如果启用了西文字体且文本包含西文，创建多个超链接
          if (runs.length > 1) {
            runs.forEach(run => {
              textRuns.push(
                new ExternalHyperlink({
                  children: [run],
                  link: token.href
                })
              );
            });
          } else {
            textRuns.push(
              new ExternalHyperlink({
                children: runs,
                link: token.href
              })
            );
          }
        }
        break;
      case 'codespan':
        // 行内代码不应用西文字体设置，保持等宽字体
        textRuns.push(
          new TextRun({
            text: token.text,
            font: { name: 'Courier New' },
            size: Math.round(settings.fontSize * 2),
            color: "000000",
            shading: { 
              fill: "F0F0F0"
            },
            italics: false
          })
        );
        break;
      case 'text':
      default:
        if (token.text) {
          // 检查文本是否包含 OMML 标记
          const ommlPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
          if (ommlPattern.test(token.text)) {
            console.log('[Export OMML] Token 文本包含 OMML 标记，在表格中保持原样');
            // 🔧 在表格创建阶段，保持OMML占位符为纯文本，避免二次包装
            // 这样后处理阶段可以正确识别和替换占位符
            textRuns.push(new TextRun({ text: token.text }));
          } else {
            const runs = splitLatinRuns(token.text, settings, isHeading, latinSettings);
            textRuns.push(...runs);
          }
        }
        break;
    }
  });
  
  // 如果没有生成任何TextRun，返回一个空的TextRun
  if (textRuns.length === 0) {
    textRuns.push(
      new TextRun({
        text: '',
        font: { name: settings.fontFamily },
        size: Math.round(settings.fontSize * 2),
        // 如果是标题或者设置了粗体，则使用粗体
        bold: isHeading ? settings.bold : settings.bold,
        color: "000000", // 设置为黑色
        italics: false // 确保不使用斜体
      })
    );
  }
  
  return textRuns;
};

/**
 * 解析内联格式，支持 OMML 公式标记
 * @param {string} text - 要解析的文本
 * @param {Object} settings - 设置
 * @param {boolean} isHeading - 是否为标题
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Array} TextRun数组
 */
export const parseInlineTokens = (text, settings, isHeading = false, latinSettings) => {
  // 确保text是字符串
  const textContent = String(text || '');
  console.log('处理内联格式:', textContent, isHeading ? '(标题)' : '');
  
  // 优先检查是否包含 OMML 标记
  const ommlPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
  if (ommlPattern.test(textContent)) {
    console.log('[Export OMML] 内联文本包含 OMML 标记，保持占位符原样');
    // 🔧 在Word文档创建阶段保持OMML占位符为纯文本，避免复杂处理
    return [new TextRun({ 
      text: textContent,
      font: { name: settings.fontFamily },
      size: Math.round(settings.fontSize * 2),
      bold: isHeading,
      color: "000000"
    })];
  }
  
  // 使用marked解析内联标记
  const inlineTokens = marked.lexer(textContent, { gfm: true });
  
  // 如果解析成功并且包含内联标记，使用processTokensToTextRuns处理
  if (inlineTokens && inlineTokens.length > 0 && inlineTokens[0].type === 'paragraph' && inlineTokens[0].tokens) {
    return processTokensToTextRuns(inlineTokens[0].tokens, settings, isHeading, latinSettings);
  }
  
  // 简化处理方式，直接使用正则表达式查找和替换
  const textRuns = [];
  
  // 处理简单的内联格式
  // 先将文本按照格式标记分割成多个部分
  const segments = [];
  let currentText = textContent;
  let lastIndex = 0;
  
  // 查找所有的格式标记
  const regex = /(\*\*.*?\*\*)|(__.*?__)|(\*.*?\*)|(_.*?_)|(~~.*?~~)|(`.*?`)|(\[.*?\]\(.*?\))/g;
  let match;
  
  while ((match = regex.exec(currentText)) !== null) {
    // 添加格式标记前的普通文本
    if (match.index > lastIndex) {
      segments.push({
        type: 'normal',
        text: currentText.substring(lastIndex, match.index)
      });
    }
    
    const matchedText = match[0];
    
    // 判断格式类型
    if (matchedText.startsWith('**') || matchedText.startsWith('__')) {
      // 粗体
      const content = matchedText.substring(2, matchedText.length - 2);
      segments.push({
        type: 'bold',
        text: content
      });
    } else if (matchedText.startsWith('~~')) {
      // 删除线
      const content = matchedText.substring(2, matchedText.length - 2);
      segments.push({
        type: 'strike',
        text: content
      });
    } else if (matchedText.startsWith('`')) {
      // 行内代码
      const content = matchedText.substring(1, matchedText.length - 1);
      segments.push({
        type: 'code',
        text: content
      });
    } else if (matchedText.startsWith('[') && matchedText.includes('](')) {
      // 链接
      const linkTextEnd = matchedText.indexOf(']');
      const linkText = matchedText.substring(1, linkTextEnd);
      const linkUrlStart = matchedText.indexOf('(', linkTextEnd) + 1;
      const linkUrlEnd = matchedText.lastIndexOf(')');
      const linkUrl = matchedText.substring(linkUrlStart, linkUrlEnd);
      
      segments.push({
        type: 'link',
        text: linkText,
        url: linkUrl
      });
    } else {
      // 斜体
      const content = matchedText.substring(1, matchedText.length - 1);
      segments.push({
        type: 'italic',
        text: content
      });
    }
    
    lastIndex = match.index + matchedText.length;
  }
  
  // 添加剩余的普通文本
  if (lastIndex < currentText.length) {
    segments.push({
      type: 'normal',
      text: currentText.substring(lastIndex)
    });
  }
  
  console.log('文本分段:', segments);
  
  // 将分段转换为TextRun对象
  segments.forEach(segment => {
    switch (segment.type) {
      case 'bold':
        // 加粗文本也要应用西文字体设置
        if (segment.text.trim()) {
          const runs = splitLatinRuns(segment.text, settings, isHeading, latinSettings, { 
            bold: true, 
            italics: false 
          });
          textRuns.push(...runs);
        }
        break;
      case 'italic':
        // 斜体文本也要应用西文字体设置
        if (segment.text.trim()) {
          const runs = splitLatinRuns(segment.text, settings, isHeading, latinSettings, { 
            italics: true 
          });
          textRuns.push(...runs);
        }
        break;
      case 'strike':
        // 删除线文本也要应用西文字体设置
        if (segment.text.trim()) {
          const runs = splitLatinRuns(segment.text, settings, isHeading, latinSettings, { 
            strike: true, 
            italics: false 
          });
          textRuns.push(...runs);
        }
        break;
      case 'code':
        // 行内代码不应用西文字体设置，保持等宽字体
        textRuns.push(
          new TextRun({
            text: segment.text,
            font: { name: 'Courier New' },
            size: Math.round(settings.fontSize * 2),
            color: "000000",
            shading: { 
              fill: "F0F0F0"
            },
            italics: false
          })
        );
        break;
      case 'link':
        // 链接文本特殊处理：需要用ExternalHyperlink包装，但内部的TextRun要应用西文字体
        if (segment.text.trim()) {
          const runs = splitLatinRuns(segment.text, settings, isHeading, latinSettings, { 
            style: "Hyperlink",
            bold: isHeading ? settings.bold : undefined,
            italics: false
          });
          
          // 如果启用了西文字体且文本包含西文，创建多个超链接
          if (runs.length > 1) {
            runs.forEach(run => {
              textRuns.push(
                new ExternalHyperlink({
                  children: [run],
                  link: segment.url
                })
              );
            });
          } else {
            textRuns.push(
              new ExternalHyperlink({
                children: runs,
                link: segment.url
              })
            );
          }
        }
        break;
      case 'normal':
      default:
        if (segment.text.trim()) {
          const runs = splitLatinRuns(segment.text, settings, isHeading, latinSettings);
          textRuns.push(...runs);
        }
        break;
    }
  });
  
  // 如果没有生成任何TextRun，添加一个包含原始文本的TextRun
  if (textRuns.length === 0) {
    textRuns.push(...splitLatinRuns(textContent, settings, isHeading, latinSettings));
  }
  
  return textRuns;
};

/**
 * 提取文档标题作为文件名
 * @param {Array} tokens - Markdown tokens
 * @returns {string} 文档标题
 */
export const extractDocumentTitle = (tokens) => {
  // 查找第一个一级标题
  const firstHeading = tokens.find(token => token.type === 'heading' && token.depth === 1);
  
  if (firstHeading) {
    // 使用一级标题作为文件名
    return firstHeading.text;
  } else {
    // 查找第一个段落文本
    const firstParagraph = tokens.find(token => token.type === 'paragraph');
    if (firstParagraph) {
      // 提取段落文本
      let paragraphText = '';
      if (firstParagraph.tokens) {
        // 合并段落中的所有文本
        paragraphText = firstParagraph.tokens
          .filter(t => t.type === 'text' || t.type === 'strong' || t.type === 'em')
          .map(t => t.text || '')
          .join('');
      } else if (firstParagraph.text) {
        paragraphText = firstParagraph.text;
      } else if (firstParagraph.raw) {
        paragraphText = firstParagraph.raw;
      }
      
      // 截取前10个字符
      return paragraphText.substring(0, 10);
    }
  }
  
  // 默认文件名
  return 'markdown-document';
};
