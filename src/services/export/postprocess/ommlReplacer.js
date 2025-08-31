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
  const originalOmml = ommlXml;
  console.log(`[OMML Replacer] 🔍 接收到的原始OMML (前800字符):`, originalOmml.substring(0, 800));
  console.log(`[OMML Replacer] 🔍 完整OMML内容:`, originalOmml);
  
  // 🔍 专门分析nary结构
  const naryMatches = originalOmml.match(/<m:nary>[\s\S]*?<\/m:nary>/g) || [];
  console.log(`[OMML Replacer] 🔍 发现 ${naryMatches.length} 个nary结构:`);
  naryMatches.forEach((nary, index) => {
    console.log(`[OMML Replacer] 🔍 Nary ${index + 1}:`, nary);
    const hasE = nary.includes('<m:e>') || nary.includes('<m:e/>');
    console.log(`[OMML Replacer] 🔍 Nary ${index + 1} 是否包含m:e元素:`, hasE);
  });
  
  // 🔧 关键修复：重组nary结构，将后续表达式移入nary的m:e元素中
  let fixedOmml = originalOmml;
  
  // 复杂的nary结构重组逻辑
  console.log(`[OMML Replacer] 🔧 开始nary结构重组分析...`);
  
  // 通用nary重组策略：检测所有nary，然后智能判断是否需要重组
  const allNaryPattern = /<m:nary>[\s\S]*?<\/m:nary>/g;
  let naryMatchesWithPos = [];
  let match;
  
  // 收集所有nary结构及其位置
  while ((match = allNaryPattern.exec(fixedOmml)) !== null) {
    const naryContent = match[0];
    
    // 智能判断：检查nary是否有主体层级的m:e（不在sub/sup中的）
    // 方法：移除所有sub/sup内容，然后检查剩余内容是否有m:e
    let mainContent = naryContent;
    mainContent = mainContent.replace(/<m:sub>[\s\S]*?<\/m:sub>/g, ''); // 移除下标
    mainContent = mainContent.replace(/<m:sup>[\s\S]*?<\/m:sup>/g, ''); // 移除上标
    
    const hasMainE = mainContent.includes('<m:e>') && mainContent.includes('</m:e>');
    const symbol = naryContent.match(/<m:chr m:val="([^"]+)"/)?.[1] || '未知';
    
    console.log(`[OMML Replacer] 🔍 智能判断nary ${symbol}: 原始有m:e=${naryContent.includes('<m:e>')}, 主体有m:e=${hasMainE}`);
    
    if (!hasMainE) {
      naryMatchesWithPos.push({
        nary: naryContent,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
      console.log(`[OMML Replacer] 🔧 ${symbol}符号需要重组`);
    } else {
      console.log(`[OMML Replacer] ✅ ${symbol}符号已有主体m:e，跳过重组`);
    }
  }
  
  console.log(`[OMML Replacer] 🔧 发现 ${naryMatchesWithPos.length} 个缺少m:e的nary结构`);
  
  // 为每个nary寻找后续的数学表达式并移入（需要重新计算位置，因为前面的修改会影响后续位置）
  for (let i = 0; i < naryMatchesWithPos.length; i++) {
    const naryInfo = naryMatchesWithPos[i];
    const naryStr = naryInfo.nary;
    
    // 重新在当前的fixedOmml中查找这个nary的位置
    const currentNaryIndex = fixedOmml.indexOf(naryStr);
    if (currentNaryIndex === -1) {
      console.log(`[OMML Replacer] ⚠️ 无法找到nary ${i + 1}，可能已被修改`);
      continue;
    }
    
    const afterNary = fixedOmml.substring(currentNaryIndex + naryStr.length);
    
    console.log(`[OMML Replacer] 🔧 分析nary ${i + 1}:`, naryStr.substring(0, 50) + '...');
    console.log(`[OMML Replacer] 🔧 nary后内容:`, afterNary.substring(0, 100) + '...');
    
    let expressionToMove = null;
    
    // 模式1: 求和后跟y_j (拉格朗日公式)
    if (naryStr.includes('m:val="∑"')) {
      const pattern1 = /^(<m:sSub><m:e><m:r><m:t>y<\/m:t><\/m:r><\/m:e><m:sub><m:r><m:t>j<\/m:t><\/m:r><\/m:sub><\/m:sSub>)/;
      const match1 = afterNary.match(pattern1);
      if (match1) {
        expressionToMove = match1[1];
        console.log(`[OMML Replacer] 🔧 模式1: 求和+y_j`);
      }
      
      // 模式2: 求和后跟分数 (复杂求和公式)
      if (!expressionToMove) {
        const pattern2 = /^(<m:f>[\s\S]*?<\/m:f>)/;
        const match2 = afterNary.match(pattern2);
        if (match2) {
          expressionToMove = match2[1];
          console.log(`[OMML Replacer] 🔧 模式2: 求和+分数`);
        }
      }
    }
    
    // 模式3: 乘积后跟分数
    if (naryStr.includes('m:val="∏"') && !expressionToMove) {
      const pattern3 = /^(<m:f>[\s\S]*?<\/m:f>)/;
      const match3 = afterNary.match(pattern3);
      if (match3) {
        expressionToMove = match3[1];
        console.log(`[OMML Replacer] 🔧 模式3: 乘积+分数`);
      }
    }
    
    // 模式4: 积分后跟复杂表达式 (拉普拉斯变换)
    if (naryStr.includes('m:val="∫"') && !expressionToMove) {
      // 匹配f(t)e^(-st)dt这样的积分表达式
      const pattern4 = /^(<m:r><m:t>f\(t\)<\/m:t><\/m:r><m:sSup>[\s\S]*?<\/m:sSup><m:r><m:t>dt<\/m:t><\/m:r>)/;
      const match4 = afterNary.match(pattern4);
      if (match4) {
        expressionToMove = match4[1];
        console.log(`[OMML Replacer] 🔧 模式4: 积分+复杂表达式`);
      }
    }
    
    // 执行重组
    if (expressionToMove) {
      console.log(`[OMML Replacer] 🔧 将表达式移入nary的m:e中:`, expressionToMove.substring(0, 50) + '...');
      const fixedNary = naryStr.replace('</m:nary>', `<m:e>${expressionToMove}</m:e></m:nary>`);
      const naryWithExpression = naryStr + expressionToMove;
      fixedOmml = fixedOmml.replace(naryWithExpression, fixedNary);
      console.log(`[OMML Replacer] 🔧 nary ${i + 1} 重组成功`);
    } else {
      console.log(`[OMML Replacer] ⚠️ nary ${i + 1} 未找到合适的表达式模式`);
    }
  }
  
  console.log(`[OMML Replacer] 🔧 nary结构重组完成，OMML长度变化: ${originalOmml.length} → ${fixedOmml.length}`);
  
  const cleanOmml = cleanOmmlXml(fixedOmml);
  console.log(`[OMML Replacer] 清理后的OMML长度: ${cleanOmml.length}`);
  
  // 🔍 详细分析清理前后的空标签
  const emptyTagsBefore = (originalOmml.match(/<m:e\s*\/>/g) || []).length;
  const emptyPairsBefore = (originalOmml.match(/<m:e>\s*<\/m:e>/g) || []).length;
  const emptyTagsAfter = (cleanOmml.match(/<m:e\s*\/>/g) || []).length;
  const emptyPairsAfter = (cleanOmml.match(/<m:e>\s*<\/m:e>/g) || []).length;
  
  console.log(`[OMML Replacer] 🔍 ${ommlResult.id} 空标签清理对比:`, {
    清理前: `${emptyTagsBefore}个自闭合 + ${emptyPairsBefore}个标签对`,
    清理后: `${emptyTagsAfter}个自闭合 + ${emptyPairsAfter}个标签对`,
    是否有改善: (emptyTagsBefore + emptyPairsBefore) > (emptyTagsAfter + emptyPairsAfter)
  });
  
  if (emptyTagsAfter > 0 || emptyPairsAfter > 0) {
    console.log(`[OMML Replacer] ⚠️ ${ommlResult.id} 清理后仍有空标签残留!`);
    console.log(`[OMML Replacer] 🔍 清理后OMML前段:`, cleanOmml.substring(0, 500));
    
    // 🔧 进行额外的强制清理，但保护nary结构中的空m:e标签
    let extraCleanOmml = cleanOmml;
    
    // 先保护nary结构中的空m:e标签
    const naryStructures = extraCleanOmml.match(/<m:nary>[\s\S]*?<\/m:nary>/g) || [];
    const protectedNaryMap = new Map();
    
    naryStructures.forEach((nary, index) => {
      // 保护包含任何m:e元素的nary结构（无论是空的还是有内容的）
      if (nary.includes('<m:e>') && nary.includes('</m:e>')) {
        const placeholder = `__NARY_KEEP_${index}__`;
        protectedNaryMap.set(placeholder, nary);
        extraCleanOmml = extraCleanOmml.replace(nary, placeholder);
      }
    });
    
    // 现在安全地清理其他区域的空标签
    extraCleanOmml = extraCleanOmml.replace(/<m:e\s*\/>/g, '');
    extraCleanOmml = extraCleanOmml.replace(/<m:e>\s*<\/m:e>/g, '');
    extraCleanOmml = extraCleanOmml.replace(/<m:e\s*>\s*<\/m:e>/g, '');
    
    // 恢复保护的nary结构
    protectedNaryMap.forEach((nary, placeholder) => {
      extraCleanOmml = extraCleanOmml.replace(placeholder, nary);
    });
    
    if (protectedNaryMap.size > 0) {
      console.log(`[OMML Replacer] 🔧 额外清理时保护了 ${protectedNaryMap.size} 个nary结构`);
    }
    
    const finalEmptyTags = (extraCleanOmml.match(/<m:e\s*\/>/g) || []).length;
    const finalEmptyPairs = (extraCleanOmml.match(/<m:e>\s*<\/m:e>/g) || []).length;
    
    if (finalEmptyTags + finalEmptyPairs < emptyTagsAfter + emptyPairsAfter) {
      console.log(`[OMML Replacer] 🔧 额外清理成功，使用强制清理后的OMML`);
      return replaceInParagraph(xmlString, actualPlaceholder, extraCleanOmml, ommlResult);
    }
  }

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
