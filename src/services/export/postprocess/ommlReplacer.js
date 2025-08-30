import { cleanOmmlXml } from '../utils/xmlUtils';

/**
 * OMML占位符替换模块
 * 负责将XML中的OMML占位符替换为真正的OMML内容
 */

/**
 * 替换XML中的OMML占位符
 * @param {string} xmlString - 原始XML字符串
 * @param {Array} ommlResults - OMML转换结果
 * @returns {string} 替换后的XML字符串
 */
export const replaceOmmlPlaceholders = (xmlString, ommlResults) => {
  if (!ommlResults || ommlResults.length === 0) {
    console.log('[OMML Replacer] 没有OMML结果需要替换');
    return xmlString;
  }

  console.log(`[OMML Replacer] 开始替换 ${ommlResults.length} 个公式占位符`);
  console.log(`[OMML Replacer] XML文档长度: ${xmlString.length}`);

  let processedXml = xmlString;

  // 检查XML中是否包含占位符
  const placeholderPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
  const placeholdersInXml = xmlString.match(placeholderPattern) || [];
  console.log(`[OMML Replacer] XML中找到 ${placeholdersInXml.length} 个占位符:`, placeholdersInXml);

  // 🔍 识别表格结构，避免破坏表格XML
  const tableRegions = identifyTableRegions(xmlString);
  console.log(`[OMML Replacer] 发现 ${tableRegions.length} 个表格区域需要保护`);

  // 按照XML中占位符的出现顺序进行替换，确保公式顺序正确
  const placeholdersInOrder = extractPlaceholdersInOrder(xmlString, tableRegions);
  console.log(`[OMML Replacer] XML中占位符顺序:`, placeholdersInOrder.map(p => `${p.id}@${p.position}`));

  // 创建ID到OMML结果的映射
  const ommlResultMap = createOmmlResultMap(ommlResults);

  // 按照XML中的顺序处理每个占位符
  for (const placeholderInfo of placeholdersInOrder) {
    const ommlResult = ommlResultMap.get(placeholderInfo.id);

    if (!ommlResult) {
      console.warn(`[OMML Replacer] 未找到ID为 ${placeholderInfo.id} 的OMML结果`);
      continue;
    }

    processedXml = replaceSinglePlaceholder(processedXml, placeholderInfo, ommlResult);
  }

  // 最终检查
  const remainingPlaceholders = processedXml.match(placeholderPattern) || [];
  console.log(`[OMML Replacer] 处理完成，剩余占位符: ${remainingPlaceholders.length}`, remainingPlaceholders);

  return processedXml;
};

/**
 * 识别表格区域
 * @param {string} xmlString - XML字符串
 * @returns {Array} 表格区域数组
 */
const identifyTableRegions = (xmlString) => {
  const tableRegions = [];
  const tableMatches = xmlString.matchAll(/<w:tbl\b[^>]*>.*?<\/w:tbl>/gs);
  
  for (const tableMatch of tableMatches) {
    tableRegions.push({
      start: tableMatch.index,
      end: tableMatch.index + tableMatch[0].length,
      content: tableMatch[0]
    });
  }
  
  return tableRegions;
};

/**
 * 按顺序提取占位符信息
 * @param {string} xmlString - XML字符串
 * @param {Array} tableRegions - 表格区域数组
 * @returns {Array} 占位符信息数组
 */
const extractPlaceholdersInOrder = (xmlString, tableRegions) => {
  const placeholdersInOrder = [];
  const placeholderRegex = /<!--OMML_PLACEHOLDER_([^-]+)-->|&lt;!--OMML_PLACEHOLDER_([^-]+)--&gt;/g;
  let match;

  // 检查占位符是否在表格内的辅助函数
  const isPlaceholderInTable = (placeholderIndex) => {
    return tableRegions.some(table => 
      placeholderIndex >= table.start && placeholderIndex < table.end
    );
  };

  // 提取XML中所有占位符的ID及其在XML中的位置
  while ((match = placeholderRegex.exec(xmlString)) !== null) {
    const id = match[1] || match[2]; // 处理两种格式的占位符
    const position = match.index;
    const placeholder = match[0];
    const inTable = isPlaceholderInTable(position);
    
    placeholdersInOrder.push({ id, position, placeholder, inTable });
    
    if (inTable) {
      console.log(`[OMML Replacer] 占位符 ${id} 位于表格内，位置: ${position}`);
    }
  }

  // 按位置排序，确保按照在XML中的实际顺序进行替换
  placeholdersInOrder.sort((a, b) => a.position - b.position);
  
  return placeholdersInOrder;
};

/**
 * 创建OMML结果映射
 * @param {Array} ommlResults - OMML结果数组
 * @returns {Map} ID到结果的映射
 */
const createOmmlResultMap = (ommlResults) => {
  const ommlResultMap = new Map();
  ommlResults.forEach(result => {
    ommlResultMap.set(result.id, result);
  });
  return ommlResultMap;
};

/**
 * 替换单个占位符
 * @param {string} xmlString - XML字符串
 * @param {Object} placeholderInfo - 占位符信息
 * @param {Object} ommlResult - OMML结果
 * @returns {string} 替换后的XML字符串
 */
const replaceSinglePlaceholder = (xmlString, placeholderInfo, ommlResult) => {
  console.log(`[OMML Replacer] 处理OMML结果:`, {
    id: ommlResult.id,
    success: ommlResult.success,
    hasOmml: !!ommlResult.omml,
    latex: ommlResult.latex?.substring(0, 30),
    isDisplayMode: ommlResult.isDisplayMode,
    xmlPosition: placeholderInfo.position
  });

  if (!ommlResult.success || !ommlResult.omml) {
    console.warn(`[OMML Replacer] OMML结果无效:`, {
      id: ommlResult.id,
      success: ommlResult.success,
      hasOmml: !!ommlResult.omml
    });
    return xmlString;
  }

  const actualPlaceholder = placeholderInfo.placeholder;
  const ommlXml = ommlResult.omml;

  console.log(`[OMML Replacer] 查找占位符: ${actualPlaceholder}`);
  console.log(`[OMML Replacer] XML中包含占位符: ${xmlString.includes(actualPlaceholder)}`);

  if (!xmlString.includes(actualPlaceholder)) {
    console.warn(`[OMML Replacer] 占位符未找到: ${actualPlaceholder}`);
    return xmlString;
  }

  // 清理OMML XML，移除XML声明和多余的命名空间
  const cleanOmml = cleanOmmlXml(ommlXml);
  console.log(`[OMML Replacer] 清理后的OMML长度: ${cleanOmml.length}`);

  // 🔍 检查当前公式是否在表格内
  if (placeholderInfo.inTable) {
    // 🔧 表格内公式：使用简单替换，不破坏表格结构
    return replaceInTable(xmlString, actualPlaceholder, cleanOmml, ommlResult.id);
  } else {
    // 非表格内公式：使用段落替换策略
    return replaceInParagraph(xmlString, actualPlaceholder, cleanOmml, ommlResult);
  }
};

/**
 * 在表格内替换占位符
 * @param {string} xmlString - XML字符串
 * @param {string} placeholder - 占位符
 * @param {string} cleanOmml - 清理后的OMML
 * @param {string} formulaId - 公式ID
 * @returns {string} 替换后的XML字符串
 */
const replaceInTable = (xmlString, placeholder, cleanOmml, formulaId) => {
  console.log(`[OMML Replacer] 🔧 处理表格内公式: ${formulaId}`);
  console.log(`[OMML Replacer] 🔍 查找占位符: ${placeholder}`);
  console.log(`[OMML Replacer] 🔍 XML中是否包含该占位符: ${xmlString.includes(placeholder)}`);

  // 尝试替换实际找到的占位符格式
  const beforeReplace = xmlString.length;
  let processedXml = xmlString.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cleanOmml);
  const afterReplace = processedXml.length;

  if (beforeReplace !== afterReplace) {
    console.log(`[OMML Replacer] ✅ 表格内公式替换成功: ${formulaId} (XML长度: ${beforeReplace} → ${afterReplace})`);
    return processedXml;
  }

  console.log(`[OMML Replacer] ⚠️ 表格内公式替换失败: ${formulaId} - 占位符未找到`);
  console.log(`[OMML Replacer] 🔍 尝试查找其他格式的占位符...`);

  // 尝试未转义的格式
  const unescapedPlaceholder = `<!--OMML_PLACEHOLDER_${formulaId}-->`;
  const escapedPlaceholder = `&lt;!--OMML_PLACEHOLDER_${formulaId}--&gt;`;

  if (xmlString.includes(unescapedPlaceholder)) {
    console.log(`[OMML Replacer] 🔍 找到未转义格式，进行替换`);
    return xmlString.replace(new RegExp(unescapedPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cleanOmml);
  } else if (xmlString.includes(escapedPlaceholder)) {
    console.log(`[OMML Replacer] 🔍 找到转义格式，进行替换`);
    return xmlString.replace(new RegExp(escapedPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cleanOmml);
  } else {
    console.log(`[OMML Replacer] ❌ 无法找到任何格式的占位符`);
    return xmlString;
  }
};

/**
 * 在段落内替换占位符
 * @param {string} xmlString - XML字符串
 * @param {string} placeholder - 占位符
 * @param {string} cleanOmml - 清理后的OMML
 * @param {Object} ommlResult - OMML结果
 * @returns {string} 替换后的XML字符串
 */
const replaceInParagraph = (xmlString, placeholder, cleanOmml, ommlResult) => {
  // 新策略：替换整个包含占位符的段落，生成与参考文档完全一致的结构
  // 查找包含占位符的整个段落 - 使用负向先行断言确保不跨段落匹配
  const paragraphRegex = new RegExp(`<w:p[^>]*>(?:(?!<w:p\\b)[\\s\\S])*?${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:(?!<w:p\\b)[\\s\\S])*?</w:p>`);

  console.log(`[OMML Replacer] 查找包含占位符的段落: ${paragraphRegex.test(xmlString)}`);

  // 📊 检查是否为行内公式（段落包含其他文本内容）
  paragraphRegex.lastIndex = 0;
  const matchedParagraph = xmlString.match(paragraphRegex);
  if (matchedParagraph && matchedParagraph[0]) {
    const paragraphContent = matchedParagraph[0];
    // 检查段落是否包含占位符之外的文本内容
    const textWithoutPlaceholder = paragraphContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    const hasOtherText = /<w:t[^>]*>(?:\s*(?!<!--)[^<\s]+|[^<]*[^\s<][^<]*)\s*<\/w:t>/.test(textWithoutPlaceholder);
    
    console.log(`[OMML Replacer] 🔍 段落是否包含其他文本内容: ${hasOtherText}`);
    
    if (hasOtherText) {
      // 🔄 行内公式：需要特殊处理，确保公式不被包装在w:t标签内
      return replaceInlineFormula(xmlString, placeholder, cleanOmml);
    } else {
      // 🔄 独立公式：替换整个段落
      return replaceBlockFormula(xmlString, paragraphRegex, cleanOmml, ommlResult.id);
    }
  }

  // 降级方案：直接替换
  return xmlString.replace(placeholder, cleanOmml);
};

/**
 * 替换行内公式
 * @param {string} xmlString - XML字符串
 * @param {string} placeholder - 占位符
 * @param {string} cleanOmml - 清理后的OMML
 * @returns {string} 替换后的XML字符串
 */
const replaceInlineFormula = (xmlString, placeholder, cleanOmml) => {
  console.log(`[OMML Replacer] 🔄 处理行内公式，确保正确的XML结构`);

  // 查找包含占位符的w:t标签
  const wTextRegex = new RegExp(`(<w:t[^>]*>)(.*?)${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(.*?)(<\/w:t>)`, 'g');

  if (wTextRegex.test(xmlString)) {
    console.log(`[OMML Replacer] 🔍 找到包含占位符的w:t标签`);

    // 重置正则状态
    wTextRegex.lastIndex = 0;

    // 替换：将包含占位符的w:t标签拆分为三部分
    const result = xmlString.replace(wTextRegex, (match, openTag, beforeText, afterText, closeTag) => {
      console.log(`[OMML Replacer] 🔧 拆分w:t标签: "${beforeText}" + 公式 + "${afterText}"`);

      let replacement = '';

      // 前置文本（如果有）
      if (beforeText.trim()) {
        replacement += `${openTag}${beforeText}${closeTag}`;
      }

      // 公式（独立元素，不包装在w:t中）
      replacement += cleanOmml;

      // 后置文本（如果有）
      if (afterText.trim()) {
        replacement += `${openTag}${afterText}${closeTag}`;
      }

      return replacement;
    });

    console.log(`[OMML Replacer] ✅ 行内公式w:t标签拆分完成`);
    return result;
  } else {
    // 降级：直接替换占位符（可能已经在正确位置）
    console.log(`[OMML Replacer] 🔄 降级处理：直接替换占位符`);
    const result = xmlString.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), cleanOmml);
    console.log(`[OMML Replacer] ✅ 行内公式占位符替换完成`);
    return result;
  }
};

/**
 * 替换块级公式
 * @param {string} xmlString - XML字符串
 * @param {RegExp} paragraphRegex - 段落正则表达式
 * @param {string} cleanOmml - 清理后的OMML
 * @param {string} formulaId - 公式ID
 * @returns {string} 替换后的XML字符串
 */
const replaceBlockFormula = (xmlString, paragraphRegex, cleanOmml, formulaId) => {
  console.log(`[OMML Replacer] 🔄 处理独立公式，替换整个段落`);
  const replacementParagraph = `<w:p>${cleanOmml}</w:p>`;

  const beforeLength = xmlString.length;
  const result = xmlString.replace(paragraphRegex, replacementParagraph);
  const afterLength = result.length;

  console.log(`[OMML Replacer] 替换整个段落: ${formulaId}，生成参考文档格式`);
  console.log(`[OMML Replacer] 新段落结构: <w:p><m:oMath>...</w:p>`);
  console.log(`[OMML Replacer] XML长度变化: ${beforeLength} → ${afterLength}`);
  console.log(`[OMML Replacer] 长度减少: ${beforeLength - afterLength} 字节`);
  
  return result;
};

/**
 * 验证占位符替换结果
 * @param {string} originalXml - 原始XML
 * @param {string} processedXml - 处理后的XML
 * @param {Array} ommlResults - OMML结果数组
 * @returns {Object} 验证结果
 */
export const validatePlaceholderReplacement = (originalXml, processedXml, ommlResults) => {
  const originalPlaceholders = (originalXml.match(/<!--OMML_PLACEHOLDER_[^-]+-->/g) || []).length;
  const remainingPlaceholders = (processedXml.match(/<!--OMML_PLACEHOLDER_[^-]+-->/g) || []).length;
  const mathElements = (processedXml.match(/<m:oMath[^>]*>.*?<\/m:oMath>/g) || []).length;
  
  const expectedReplacements = ommlResults.filter(r => r.success).length;
  const actualReplacements = originalPlaceholders - remainingPlaceholders;
  
  return {
    isValid: remainingPlaceholders === 0 && actualReplacements === expectedReplacements,
    originalPlaceholders,
    remainingPlaceholders,
    mathElements,
    expectedReplacements,
    actualReplacements,
    replacementRate: originalPlaceholders > 0 ? (actualReplacements / originalPlaceholders) * 100 : 100
  };
};
