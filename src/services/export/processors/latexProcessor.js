import { processLatexForExport, getLatexExportStats } from '../../latexExportService';

/**
 * LaTeX处理模块
 * 负责LaTeX公式的识别、转换和管理
 */

// 当前导出的OMML结果存储
let currentExportOmmlResults = [];

/**
 * 处理Markdown中的LaTeX公式
 * @param {string} markdown - 原始Markdown文本
 * @returns {Object} 处理结果
 */
export const processLatex = async (markdown) => {
  try {
    console.log('[LaTeX Processor] 开始处理 LaTeX 公式...');
    
    // 调用现有的LaTeX处理服务
    const latexProcessResult = await processLatexForExport(markdown, null);
    
    console.log('[LaTeX Processor] LaTeX 处理完成:', {
      hasFormulas: latexProcessResult.hasFormulas,
      formulaCount: latexProcessResult.formulas?.length || 0,
      conversionTime: latexProcessResult.conversionTime,
      fallbackMode: latexProcessResult.fallbackMode || false
    });
    
    // 存储处理结果供后续使用
    if (latexProcessResult.hasFormulas && latexProcessResult.formulas) {
      setCurrentOmmlResults(latexProcessResult.formulas);
    }
    
    return latexProcessResult;
  } catch (error) {
    console.error('[LaTeX Processor] LaTeX处理失败:', error);
    return {
      hasFormulas: false,
      processedMarkdown: markdown,
      formulas: [],
      tokens: null,
      error: error.message
    };
  }
};

/**
 * 设置当前导出的 OMML 结果
 * @param {Array} ommlResults - OMML 转换结果数组
 */
export const setCurrentOmmlResults = (ommlResults) => {
  currentExportOmmlResults = ommlResults || [];
  console.log('[LaTeX Processor] 设置当前导出的 OMML 结果', {
    count: currentExportOmmlResults.length
  });
};

/**
 * 获取当前导出的 OMML 结果
 * @returns {Array} OMML 转换结果数组
 */
export const getCurrentOmmlResults = () => {
  return currentExportOmmlResults;
};

/**
 * 清除当前的 OMML 结果
 */
export const clearCurrentOmmlResults = () => {
  currentExportOmmlResults = [];
  console.log('[LaTeX Processor] 已清除当前 OMML 结果');
};

/**
 * 获取LaTeX导出统计信息
 * @returns {Object} 统计信息
 */
export const getLatexStats = () => {
  try {
    return getLatexExportStats();
  } catch (error) {
    console.error('[LaTeX Processor] 获取统计信息失败:', error);
    return {
      formulaCount: currentExportOmmlResults.length,
      successCount: currentExportOmmlResults.filter(r => r.success).length,
      failureCount: currentExportOmmlResults.filter(r => !r.success).length
    };
  }
};

/**
 * 检查tokens中的占位符
 * @param {Array} tokens - Markdown tokens
 * @param {Array} formulas - 公式数组
 */
export const checkPlaceholdersInTokens = (tokens, formulas) => {
  console.log('[LaTeX Processor] 检查tokens中的占位符...');
  
  const placeholderPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
  
  const checkTokenRecursively = (token) => {
    // 检查token的文本内容
    if (token.text) {
      const placeholders = token.text.match(placeholderPattern) || [];
      if (placeholders.length > 0) {
        console.log(`[LaTeX Processor] Token中发现占位符:`, placeholders, token.type);
      }
    }
    
    if (token.raw) {
      const placeholders = token.raw.match(placeholderPattern) || [];
      if (placeholders.length > 0) {
        console.log(`[LaTeX Processor] Token raw中发现占位符:`, placeholders, token.type);
      }
    }
    
    // 递归检查子tokens
    if (token.tokens && Array.isArray(token.tokens)) {
      token.tokens.forEach(checkTokenRecursively);
    }
  };
  
  tokens.forEach(checkTokenRecursively);
  
  // 总结期望的占位符
  if (formulas && formulas.length > 0) {
    console.log('[LaTeX Processor] 期望在tokens中找到的占位符:');
    formulas.forEach(formula => {
      if (formula.success) {
        console.log(`[LaTeX Processor] - <!--OMML_PLACEHOLDER_${formula.id}-->`);
      }
    });
  }
};

/**
 * 处理文本中的 OMML 公式标记
 * @param {string} text - 包含 OMML 标记的文本
 * @param {Array} ommlResults - OMML 转换结果
 * @returns {Array} 包含 TextRun 和 OMML 元素的数组
 */
export const processOmmlInText = (text, ommlResults) => {
  if (!text || !ommlResults || ommlResults.length === 0) {
    return [{ type: 'text', content: text || '' }];
  }
  
  console.log('[LaTeX Processor] 处理文本中的 OMML 标记', {
    textLength: text.length,
    ommlCount: ommlResults.length
  });
  
  const elements = [];
  let currentText = text;
  let processedFormulas = 0;
  
  // 查找并替换所有 OMML 标记
  const ommlPattern = /<!--OMML_PLACEHOLDER_([^-]+)-->/g;
  let match;
  let lastIndex = 0;
  
  while ((match = ommlPattern.exec(currentText)) !== null) {
    const formulaId = match[1];
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    
    // 添加公式前的文本
    if (startIndex > lastIndex) {
      const beforeText = currentText.substring(lastIndex, startIndex);
      if (beforeText) {
        elements.push({ type: 'text', content: beforeText });
      }
    }
    
    // 查找对应的 OMML 结果
    const ommlResult = ommlResults.find(result => result.id === formulaId);
    
    if (ommlResult && ommlResult.success && ommlResult.omml) {
      try {
        console.log('[LaTeX Processor] 找到OMML结果', {
          formulaId,
          latex: ommlResult.latex?.substring(0, 30) || 'unknown'
        });
        
        // 暂时使用占位符，后续在后处理阶段替换
        elements.push({ 
          type: 'omml_placeholder', 
          content: `<!--OMML_PLACEHOLDER_${formulaId}-->`,
          formulaId,
          ommlResult
        });
        
        processedFormulas++;
      } catch (error) {
        console.error('[LaTeX Processor] OMML 处理失败', {
          formulaId,
          error: error.message
        });
        
        // 失败时使用降级文本
        const fallbackText = ommlResult.latex || `[公式错误: ${formulaId}]`;
        elements.push({ type: 'text', content: fallbackText });
      }
    } else {
      // 没有找到对应的 OMML 结果，使用降级文本
      const fallbackText = ommlResult?.fallbackText || `[公式: ${formulaId}]`;
      elements.push({ type: 'text', content: fallbackText });
      
      console.warn('[LaTeX Processor] OMML 结果未找到，使用降级文本', {
        formulaId,
        fallbackText
      });
    }
    
    lastIndex = endIndex;
  }
  
  // 添加剩余的文本
  if (lastIndex < currentText.length) {
    const remainingText = currentText.substring(lastIndex);
    if (remainingText) {
      elements.push({ type: 'text', content: remainingText });
    }
  }
  
  console.log('[LaTeX Processor] 文本 OMML 处理完成', {
    processedFormulas,
    totalElements: elements.length
  });
  
  // 如果没有找到任何标记，返回原始文本
  if (elements.length === 0) {
    return [{ type: 'text', content: currentText }];
  }
  
  return elements;
};

/**
 * 验证OMML结果的完整性
 * @param {Array} formulas - 公式数组
 * @returns {Object} 验证结果
 */
export const validateOmmlResults = (formulas) => {
  if (!formulas || formulas.length === 0) {
    return {
      isValid: true,
      totalFormulas: 0,
      successfulFormulas: 0,
      failedFormulas: 0,
      errors: []
    };
  }
  
  const successful = formulas.filter(f => f.success && f.omml);
  const failed = formulas.filter(f => !f.success || !f.omml);
  const errors = failed.map(f => ({ id: f.id, error: f.error || 'Unknown error' }));
  
  return {
    isValid: failed.length === 0,
    totalFormulas: formulas.length,
    successfulFormulas: successful.length,
    failedFormulas: failed.length,
    errors
  };
};
