import { extractBodyContent, replaceBodyContent, countXmlElements } from '../utils/xmlUtils';

/**
 * 元素顺序管理模块
 * 负责保持XML文档中元素的原始顺序
 */

// 存储原始元素顺序信息
let originalElementOrder = null;

/**
 * 记录原始XML中body元素的完整信息
 * @param {string} xmlString - 原始XML字符串
 */
export const recordOriginalElementOrder = (xmlString) => {
  console.log(`[Order Manager] 🔧 启动原始元素顺序记录方案...`);
  
  // 第一步：扫描并记录原始XML中所有body元素的完整信息
  const bodyContent = extractBodyContent(xmlString);
  if (!bodyContent) {
    console.warn('[Order Manager] 未找到body内容，跳过顺序记录');
    return;
  }
  
  // 📊 记录所有body子元素的完整信息
  const originalBodyElements = [];
  
  // 使用更精确的正则表达式捕获所有直接子元素
  const elementPattern = /<w:(p|tbl|sectPr)\b[^>]*>.*?<\/w:\1>|<w:(sectPr)\b[^>]*\/>/gs;
  const elementMatches = [...bodyContent.matchAll(elementPattern)];
  
  elementMatches.forEach((match, index) => {
    const elementType = match[1] || match[2]; // 处理自闭合标签
    const fullElement = match[0];
    
    let elementInfo = {
      type: elementType,
      position: match.index,
      xmlContent: fullElement,
      index: index
    };
    
    // 为段落添加文本内容标识
    if (elementType === 'p') {
      const textContent = (fullElement.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
        .map(m => m.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1')).join('').trim();
      elementInfo.textContent = textContent;
      elementInfo.displayName = `段落: "${textContent.substring(0, 15)}${textContent.length > 15 ? '...' : ''}"`;
    } else if (elementType === 'tbl') {
      elementInfo.displayName = `表格${originalBodyElements.filter(e => e.type === 'tbl').length + 1}`;
    } else if (elementType === 'sectPr') {
      elementInfo.displayName = '页面设置';
    }
    
    originalBodyElements.push(elementInfo);
  });
  
  console.log(`[Order Manager] 📊 扫描到 ${originalBodyElements.length} 个body子元素:`);
  originalBodyElements.forEach((elem, idx) => {
    console.log(`[Order Manager] ${idx + 1}. ${elem.displayName} (类型: w:${elem.type}, 位置: ${elem.position})`);
  });
  
  // 📝 保存完整的元素顺序信息
  originalElementOrder = {
    elements: originalBodyElements,
    needsReordering: true,
    bodyContent: bodyContent,
    totalElements: originalBodyElements.length
  };
  
  console.log(`[Order Manager] ✅ 原始元素顺序信息已保存，共 ${originalBodyElements.length} 个元素`);
};

/**
 * 重建XML元素顺序
 * @param {string} newXml - 重建后的XML字符串
 * @returns {string} 顺序修正后的XML字符串
 */
export const reorderXmlElements = (newXml) => {
  if (!originalElementOrder || !originalElementOrder.needsReordering) {
    console.log('[Order Manager] 无需重新排序元素');
    return newXml;
  }

  console.log(`[Order Manager] 🔧 开始完整的XML元素顺序重建...`);
  
  const orderInfo = originalElementOrder;
  const originalElements = orderInfo.elements;
  
  // 提取当前重建XML中的所有body元素
  const currentBodyContent = extractBodyContent(newXml);
  if (!currentBodyContent) {
    console.warn('[Order Manager] 未找到重建XML的body内容');
    return newXml;
  }
  
  // 📊 收集当前XML中的所有元素
  const currentElements = {
    paragraphs: [...currentBodyContent.matchAll(/<w:p\b[^>]*>.*?<\/w:p>/gs)],
    tables: [...currentBodyContent.matchAll(/<w:tbl\b[^>]*>.*?<\/w:tbl>/gs)],
    sectPr: [...currentBodyContent.matchAll(/<w:sectPr\b[^>]*>.*?<\/w:sectPr>|<w:sectPr\b[^>]*\/>/gs)]
  };
  
  console.log(`[Order Manager] 📊 当前XML中元素统计: ${currentElements.paragraphs.length}个段落, ${currentElements.tables.length}个表格, ${currentElements.sectPr.length}个sectPr`);
  
  // 🔧 按原始顺序重建body内容
  const orderedBodyContent = [];
  let paragraphIndex = 0;
  let tableIndex = 0;
  let sectPrIndex = 0;
  
  originalElements.forEach((originalElem, idx) => {
    console.log(`[Order Manager] 🔧 处理第${idx + 1}个元素: ${originalElem.displayName}`);
    
    if (originalElem.type === 'p' && paragraphIndex < currentElements.paragraphs.length) {
      // 使用当前XML中对应的段落（可能已经被OMML处理过）
      const currentParagraph = currentElements.paragraphs[paragraphIndex][0];
      orderedBodyContent.push(currentParagraph);
      console.log(`[Order Manager] ✅ 添加段落${paragraphIndex + 1}: "${originalElem.textContent}"`);
      paragraphIndex++;
    } else if (originalElem.type === 'tbl' && tableIndex < currentElements.tables.length) {
      // 🚨 关键修复：使用原始XML中包含公式的表格，而不是重建后的空表格
      const originalTableXml = originalElem.xmlContent;
      
      // 🔍 检查原始表格是否包含OMML公式
      const ommlCount = (originalTableXml.match(/<m:oMath/g) || []).length;
      const placeholderCount = (originalTableXml.match(/OMML_PLACEHOLDER/g) || []).length;
      console.log(`[Order Manager] 🔍 表格${tableIndex + 1}内容检查: ${ommlCount}个OMML公式, ${placeholderCount}个占位符`);
      console.log(`[Order Manager] 🔧 使用原始表格XML (长度: ${originalTableXml.length}) 而非重建表格`);
      
      orderedBodyContent.push(originalTableXml);
      console.log(`[Order Manager] ✅ 添加表格${tableIndex + 1} (使用原始表格内容，保持已转换的公式)`);
      tableIndex++;
    } else if (originalElem.type === 'sectPr' && sectPrIndex < currentElements.sectPr.length) {
      // 使用当前XML中的sectPr
      const currentSectPr = currentElements.sectPr[sectPrIndex][0];
      orderedBodyContent.push(currentSectPr);
      console.log(`[Order Manager] ✅ 添加页面设置`);
      sectPrIndex++;
    }
  });
  
  // 🔧 替换body内容
  const newBodyContent = orderedBodyContent.join('');
  const reorderedXml = replaceBodyContent(newXml, newBodyContent);
  
  console.log(`[Order Manager] ✅ XML元素顺序重建完成！`);
  console.log(`[Order Manager] 📊 重建后XML长度: ${reorderedXml.length}`);
  console.log(`[Order Manager] 📊 重建后元素顺序: ${orderedBodyContent.length}个元素按原始顺序排列`);
  
  return reorderedXml;
};

/**
 * 分析重建后的元素顺序
 * @param {string} xmlString - XML字符串
 */
export const analyzeRebuiltElementOrder = (xmlString) => {
  console.log(`[Order Manager] 🔍 分析重建XML中所有body子元素的顺序:`);
  
  const bodyElementsPattern = /<w:(p|tbl)\b[^>]*>.*?<\/w:\1>/gs;
  const bodyElements = [...xmlString.matchAll(bodyElementsPattern)];
  
  bodyElements.forEach((match, index) => {
    const elementType = match[1]; // 'p' 或 'tbl'
    const position = match.index;
    
    if (elementType === 'tbl') {
      console.log(`[Order Manager] 元素 ${index + 1}: 📋 表格 (位置: ${position})`);
    } else {
      const textContent = (match[0].match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
        .map(m => m.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1')).join('');
      if (textContent.trim()) {
        console.log(`[Order Manager] 元素 ${index + 1}: 📝 段落 - "${textContent.substring(0, 30)}..." (位置: ${position})`);
      } else {
        console.log(`[Order Manager] 元素 ${index + 1}: 📄 空段落 (位置: ${position})`);
      }
    }
  });
};

/**
 * 验证元素顺序完整性
 * @param {string} originalXml - 原始XML
 * @param {string} reorderedXml - 重排序后的XML
 * @returns {Object} 验证结果
 */
export const validateElementOrder = (originalXml, reorderedXml) => {
  const originalStats = countXmlElements(originalXml);
  const reorderedStats = countXmlElements(reorderedXml);
  
  // 检查表格完整性
  const tableIntact = originalStats.tables === reorderedStats.tables;
  
  // 检查段落数量（考虑到OMML转换可能会改变段落数量）
  const paragraphReasonable = reorderedStats.paragraphs >= originalStats.paragraphs - originalStats.mathElements;
  
  const isValid = tableIntact && paragraphReasonable;
  
  return {
    isValid,
    tableIntact,
    paragraphReasonable,
    originalStats,
    reorderedStats,
    differences: {
      paragraphs: reorderedStats.paragraphs - originalStats.paragraphs,
      tables: reorderedStats.tables - originalStats.tables,
      mathElements: reorderedStats.mathElements - originalStats.mathElements
    }
  };
};

/**
 * 清理顺序管理状态
 */
export const clearOrderState = () => {
  originalElementOrder = null;
  console.log('[Order Manager] 顺序管理状态已清理');
};

/**
 * 获取当前顺序状态
 * @returns {Object|null} 当前顺序状态
 */
export const getOrderState = () => {
  return originalElementOrder;
};
