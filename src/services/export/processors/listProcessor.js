import { Paragraph, TextRun, convertInchesToTwip } from 'docx';
import { parseInlineTokens, processTokensToTextRuns } from '../utils/textUtils';
import { calculateLineSpacing } from '../utils/converters';

/**
 * 列表处理模块
 * 负责有序和无序列表的创建
 */

/**
 * 创建列表
 * @param {Object} token - 列表token
 * @param {Object} settings - 段落设置
 * @param {number} nestLevel - 嵌套级别
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Array} 段落数组
 */
export const createList = (token, settings, nestLevel = 0, latinSettings) => {
  const paragraphs = [];
  
  // 行间距支持倍数和磅数
  const { lineSpacingTwips, lineRule } = calculateLineSpacing(settings);
  
  // 确定列表类型
  const isOrdered = token.ordered;
  
  console.log(`[List Processor] 创建${isOrdered ? '有序' : '无序'}列表，嵌套级别: ${nestLevel}`);
  
  // 处理列表项
  token.items.forEach((item, index) => {
    // 确保item.text是字符串
    const itemText = String(item.text || '');
    
    // 处理列表项中的内联格式，不再添加前缀，让Word自动处理
    const textRuns = parseInlineTokens(itemText, settings, false, latinSettings);
    
    // 创建带有正确列表格式的段落
    paragraphs.push(
      new Paragraph({
        children: textRuns,
        spacing: {
          before: 40,  // 2磅
          after: 40,   // 2磅
          line: lineSpacingTwips,
          lineRule
        },
        numbering: {
          reference: isOrdered ? 'ordered-list' : 'unordered-list',
          level: nestLevel,
        }
      })
    );
    
    // 处理嵌套内容（列表、引用等）
    if (item.tokens) {
      const nestedElements = processNestedTokens(item.tokens, settings, nestLevel, latinSettings);
      paragraphs.push(...nestedElements);
    }
  });
  
  console.log(`[List Processor] 列表处理完成，生成 ${paragraphs.length} 个段落`);
  return paragraphs;
};

/**
 * 处理嵌套内容
 * @param {Array} tokens - 嵌套tokens
 * @param {Object} settings - 段落设置
 * @param {number} nestLevel - 当前嵌套级别
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Array} 段落数组
 */
const processNestedTokens = (tokens, settings, nestLevel, latinSettings) => {
  const paragraphs = [];
  const { lineSpacingTwips, lineRule } = calculateLineSpacing(settings);
  
  // 处理所有嵌套内容
  tokens.forEach(token => {
    if (token.type === 'list') {
      // 递归处理嵌套列表，增加嵌套级别
      const nestedParagraphs = createList(token, settings, nestLevel + 1, latinSettings);
      paragraphs.push(...nestedParagraphs);
    } 
    else if (token.type === 'blockquote') {
      // 处理引用块，使用缩进来保持在列表项下方
      const quoteElement = createNestedBlockquote(token, settings, nestLevel, latinSettings);
      paragraphs.push(quoteElement);
    }
    else if (token.type === 'code') {
      // 处理代码块
      const codeBlocks = createNestedCodeBlock(token, settings, nestLevel);
      paragraphs.push(...codeBlocks);
    }
    // 可以根据需要添加其他类型的嵌套内容处理
  });
  
  return paragraphs;
};

/**
 * 创建嵌套的引用块
 * @param {Object} token - 引用token
 * @param {Object} settings - 段落设置
 * @param {number} nestLevel - 嵌套级别
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Paragraph} 引用段落
 */
const createNestedBlockquote = (token, settings, nestLevel, latinSettings) => {
  const { lineSpacingTwips, lineRule } = calculateLineSpacing(settings);
  
  // 确定引用内容
  let textRuns;
  
  if (token.tokens) {
    // 如果有tokens数组，使用processTokensToTextRuns处理
    textRuns = processTokensToTextRuns(token.tokens, settings, false, latinSettings);
  } else {
    // 确保token.text是字符串
    const quoteText = String(token.text || token.raw || '');
    // 处理引用中的内联格式
    textRuns = parseInlineTokens(quoteText, settings, false, latinSettings);
  }
  
  // 创建引用段落，增加左缩进以对齐列表项
  const indentLevel = nestLevel + 1;
  const leftIndent = convertInchesToTwip(0.5 + (indentLevel * 0.5));
  
  return new Paragraph({
    children: textRuns,
    spacing: {
      before: 40,  // 2磅
      after: 40,   // 2磅
      line: lineSpacingTwips,
      lineRule
    },
    indent: {
      left: leftIndent
    },
    border: {
      left: {
        color: "#CCCCCC",
        space: 10,
        style: "single",
        size: 10
      }
    }
  });
};

/**
 * 创建嵌套的代码块
 * @param {Object} token - 代码token
 * @param {Object} settings - 段落设置
 * @param {number} nestLevel - 嵌套级别
 * @returns {Array} 代码段落数组
 */
const createNestedCodeBlock = (token, settings, nestLevel) => {
  // 这里简化处理，创建基本的代码块
  const codeText = token.text || '';
  const codeLines = codeText.split('\n');
  const { lineSpacingTwips, lineRule } = calculateLineSpacing(settings);
  
  const codeBlocks = codeLines.map((line, index) => {
    return new Paragraph({
      children: [
        new TextRun({
          text: line,
          font: { name: 'Courier New' },
          size: Math.round(settings.fontSize * 2),
          color: "000000"
        })
      ],
      spacing: {
        before: index === 0 ? 120 : 0,
        after: index === codeLines.length - 1 ? 120 : 0,
        line: lineSpacingTwips,
        lineRule
      },
      shading: {
        type: 'solid',
        color: 'F8F8F8',
        fill: 'F8F8F8'
      }
    });
  });
  
  // 增加左缩进以对齐列表项
  codeBlocks.forEach(block => {
    const indentLevel = nestLevel + 1;
    const currentIndent = block.indent?.left || 0;
    block.indent = {
      ...block.indent,
      left: currentIndent + convertInchesToTwip(indentLevel * 0.5)
    };
  });
  
  return codeBlocks;
};

/**
 * 验证列表结构
 * @param {Object} token - 列表token
 * @returns {Object} 验证结果
 */
export const validateListStructure = (token) => {
  const issues = [];
  
  // 检查基本结构
  if (!token.items || !Array.isArray(token.items)) {
    issues.push('列表缺少items数组');
    return { isValid: false, issues };
  }
  
  if (token.items.length === 0) {
    issues.push('列表为空');
  }
  
  // 检查列表项
  token.items.forEach((item, index) => {
    if (!item.text && (!item.tokens || item.tokens.length === 0)) {
      issues.push(`第${index + 1}项为空`);
    }
    
    // 检查嵌套结构
    if (item.tokens) {
      const nestedLists = item.tokens.filter(t => t.type === 'list');
      if (nestedLists.length > 0) {
        console.log(`[List Processor] 第${index + 1}项包含${nestedLists.length}个嵌套列表`);
      }
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    itemCount: token.items.length,
    isOrdered: token.ordered,
    hasNestedContent: token.items.some(item => item.tokens && item.tokens.length > 0)
  };
};

/**
 * 计算列表复杂度
 * @param {Object} token - 列表token
 * @param {number} currentDepth - 当前深度
 * @returns {Object} 复杂度信息
 */
export const calculateListComplexity = (token, currentDepth = 0) => {
  let maxDepth = currentDepth;
  let totalItems = token.items.length;
  let hasFormattedContent = false;
  let hasNestedLists = false;
  let hasOtherNestedContent = false;
  
  token.items.forEach(item => {
    if (item.tokens) {
      // 检查格式化内容
      const hasFormatTokens = item.tokens.some(t => 
        ['strong', 'em', 'del', 'link', 'codespan'].includes(t.type)
      );
      if (hasFormatTokens) hasFormattedContent = true;
      
      // 检查嵌套列表
      const nestedLists = item.tokens.filter(t => t.type === 'list');
      if (nestedLists.length > 0) {
        hasNestedLists = true;
        
        // 递归计算嵌套列表的复杂度
        nestedLists.forEach(nestedList => {
          const nestedComplexity = calculateListComplexity(nestedList, currentDepth + 1);
          maxDepth = Math.max(maxDepth, nestedComplexity.maxDepth);
          totalItems += nestedComplexity.totalItems;
          if (nestedComplexity.hasFormattedContent) hasFormattedContent = true;
        });
      }
      
      // 检查其他类型的嵌套内容
      const otherNested = item.tokens.filter(t => 
        ['blockquote', 'code', 'image'].includes(t.type)
      );
      if (otherNested.length > 0) hasOtherNestedContent = true;
    }
  });
  
  // 计算复杂度评分
  let complexityScore = 0;
  if (maxDepth >= 3) complexityScore += 3;
  else if (maxDepth >= 2) complexityScore += 2;
  else if (maxDepth >= 1) complexityScore += 1;
  
  if (totalItems > 20) complexityScore += 2;
  else if (totalItems > 10) complexityScore += 1;
  
  if (hasFormattedContent) complexityScore += 1;
  if (hasNestedLists) complexityScore += 1;
  if (hasOtherNestedContent) complexityScore += 1;
  
  const complexityLevel = complexityScore >= 5 ? 'high' : 
                         complexityScore >= 3 ? 'medium' : 'low';
  
  return {
    maxDepth,
    totalItems,
    hasFormattedContent,
    hasNestedLists,
    hasOtherNestedContent,
    complexityScore,
    complexityLevel
  };
};
