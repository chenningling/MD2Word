import { XMLParser, XMLBuilder } from 'fast-xml-parser';

/**
 * XML处理工具模块
 * 提供XML解析、构建、验证等功能
 */

/**
 * 创建XML解析器
 * @returns {XMLParser} 配置好的XML解析器
 */
export const createXMLParser = () => {
  return new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: false,  // 回退到false以保持JSON结构兼容性
    processEntities: false,  // 添加此选项防止实体转义
    parseTagValue: false,    // 添加此选项防止标签值被处理
  });
};

/**
 * 创建XML构建器
 * @returns {XMLBuilder} 配置好的XML构建器
 */
export const createXMLBuilder = () => {
  return new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    preserveOrder: false,  // 与parser保持一致
    processEntities: false,  // 防止实体转义
  });
};

/**
 * 检查占位符在XML中的存在情况
 * @param {string} xmlString - XML字符串
 * @param {Array} formulas - 公式数组
 */
export const checkPlaceholdersInXml = (xmlString, formulas) => {
  console.log('[XML Utils] 检查XML中的占位符...');
  
  const placeholderPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
  const placeholdersInXml = xmlString.match(placeholderPattern) || [];
  console.log('[XML Utils] XML中的占位符:', placeholdersInXml);
  
  // 检查期望的占位符
  if (formulas && formulas.length > 0) {
    formulas.forEach(formula => {
      if (formula.success) {
        const expectedPlaceholder = `<!--OMML_PLACEHOLDER_${formula.id}-->`;
        const escapedPlaceholder = `&lt;!--OMML_PLACEHOLDER_${formula.id}--&gt;`;
        const originalFound = xmlString.includes(expectedPlaceholder);
        const escapedFound = xmlString.includes(escapedPlaceholder);
        console.log(`[XML Utils] 期望占位符 ${expectedPlaceholder}: ${originalFound ? '✅找到' : '❌未找到'}`);
        console.log(`[XML Utils] 转义占位符 ${escapedPlaceholder}: ${escapedFound ? '✅找到' : '❌未找到'}`);
      }
    });
  }
};

/**
 * 提取Body内容
 * @param {string} xmlString - XML字符串
 * @returns {string|null} Body内容
 */
export const extractBodyContent = (xmlString) => {
  const bodyMatch = xmlString.match(/<w:body[^>]*>([\s\S]*?)<\/w:body>/);
  return bodyMatch ? bodyMatch[1] : null;
};

/**
 * 替换Body内容
 * @param {string} xmlString - 原始XML字符串
 * @param {string} newBodyContent - 新的Body内容
 * @returns {string} 更新后的XML字符串
 */
export const replaceBodyContent = (xmlString, newBodyContent) => {
  const bodyStartMatch = xmlString.match(/<w:body[^>]*>/);
  if (bodyStartMatch) {
    const bodyStart = bodyStartMatch[0];
    const beforeBody = xmlString.substring(0, xmlString.indexOf(bodyStart));
    const afterBody = xmlString.substring(xmlString.indexOf('</w:body>') + '</w:body>'.length);
    
    return beforeBody + bodyStart + newBodyContent + '</w:body>' + afterBody;
  }
  return xmlString;
};

/**
 * 统计XML中的元素数量
 * @param {string} xmlString - XML字符串
 * @returns {Object} 元素统计
 */
export const countXmlElements = (xmlString) => {
  const paragraphCount = (xmlString.match(/<w:p\b[^>]*>.*?<\/w:p>/gs) || []).length;
  const tableCount = (xmlString.match(/<w:tbl\b[^>]*>.*?<\/w:tbl>/gs) || []).length;
  const mathCount = (xmlString.match(/<m:oMath[^>]*>.*?<\/m:oMath>/gs) || []).length;
  
  return {
    paragraphs: paragraphCount,
    tables: tableCount,
    mathElements: mathCount
  };
};

/**
 * 分析XML段落结构
 * @param {string} xmlString - XML字符串
 * @returns {Array} 段落信息数组
 */
export const analyzeXmlParagraphs = (xmlString) => {
  const paragraphMatches = xmlString.match(/<w:p\b[^>]*>.*?<\/w:p>/gs) || [];
  const paragraphInfos = [];
  
  paragraphMatches.forEach((paragraph, index) => {
    const textContent = (paragraph.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
      .map(match => match.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1')).join('');
    
    const info = {
      index: index + 1,
      hasFormula: paragraph.includes('<m:oMath'),
      hasPlaceholder: paragraph.includes('OMML_PLACEHOLDER'),
      textContent: textContent.trim(),
      textPreview: textContent.substring(0, 30) + (textContent.length > 30 ? '...' : ''),
      length: paragraph.length
    };
    
    paragraphInfos.push(info);
  });
  
  return paragraphInfos;
};

/**
 * 清理OMML XML内容
 * @param {string} ommlXml - 原始OMML XML
 * @returns {string} 清理后的OMML XML
 */
export const cleanOmmlXml = (ommlXml) => {
  let cleanOmml = ommlXml;
  
  // 移除XML声明
  cleanOmml = cleanOmml.replace(/<\?xml[^>]*\?>/g, '');
  
  // 🔧 新增：清理字符编码问题
  // 移除零宽字符和其他不可见字符
  cleanOmml = cleanOmml.replace(/[\u200B-\u200D\uFEFF]/g, ''); // 零宽字符
  cleanOmml = cleanOmml.replace(/[\u00A0]/g, ' '); // 非断行空格转换为普通空格
  cleanOmml = cleanOmml.replace(/[\u2028\u2029]/g, ''); // 行分隔符和段落分隔符
  
  // 🔧 新增：修复常见的XML实体编码残留
  cleanOmml = cleanOmml.replace(/&amp;/g, '&');
  cleanOmml = cleanOmml.replace(/&lt;/g, '<');
  cleanOmml = cleanOmml.replace(/&gt;/g, '>');
  cleanOmml = cleanOmml.replace(/&quot;/g, '"');
  cleanOmml = cleanOmml.replace(/&#39;/g, "'");
  
  // 🔧 新增：清理多余的空白字符
  cleanOmml = cleanOmml.replace(/\s+/g, ' '); // 多个空白字符合并为单个空格
  cleanOmml = cleanOmml.replace(/>\s+</g, '><'); // 移除标签间的空白
  
  // 移除多余的命名空间声明（保留必要的m:命名空间）
  cleanOmml = cleanOmml.replace(/xmlns:mml="[^"]*"/g, '');
  
  // 🔧 增强：确保有完整的命名空间声明
  if (!cleanOmml.includes('xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"')) {
    cleanOmml = cleanOmml.replace('<m:oMath', '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"');
  }
  
  // 🔧 新增：确保有必要的Word命名空间（如果缺失）
  if (cleanOmml.includes('<w:') && !cleanOmml.includes('xmlns:w=')) {
    cleanOmml = cleanOmml.replace('<m:oMath', '<m:oMath xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"');
  }
  
  // 🔧 新增：修复特殊数学符号的编码问题
  cleanOmml = fixMathSymbolEncoding(cleanOmml);
  
  return cleanOmml.trim();
};

/**
 * 修复数学符号编码问题
 * @param {string} ommlXml - OMML XML字符串
 * @returns {string} 修复后的OMML XML
 */
const fixMathSymbolEncoding = (ommlXml) => {
  let fixed = ommlXml;
  
  // 常见的数学符号编码修复映射
  const symbolFixes = {
    // Unicode私有区域字符修复
    '\uE000': '',  // 私有区域起始字符，通常是编码错误
    '\uE001': '',  // 
    '\uE002': '',  //
    '\uE003': '',  //
    
    // 常见的LaTeX符号编码问题修复
    '&#xE000;': '',
    '&#57344;': '',  // 十进制形式的私有区域字符
    '&#57345;': '',
    '&#57346;': '',
    '&#57347;': '',
    
    // 修复积分号后的空白字符问题
    '∫\u200B': '∫',  // 积分号+零宽空格
    '∑\u200B': '∑',  // 求和号+零宽空格
    '∏\u200B': '∏',  // 乘积号+零宽空格
    
    // 修复其他数学符号的空白问题
    '∞\u200B': '∞',  // 无穷大+零宽空格
    '≠\u200B': '≠',  // 不等号+零宽空格
    '≤\u200B': '≤',  // 小于等于+零宽空格
    '≥\u200B': '≥',  // 大于等于+零宽空格
  };
  
  // 应用符号修复
  Object.entries(symbolFixes).forEach(([problem, fix]) => {
    fixed = fixed.replace(new RegExp(problem, 'g'), fix);
  });
  
  // 🔧 特别处理：移除m:t标签内的不可见字符
  fixed = fixed.replace(/<m:t>([^<]*)<\/m:t>/g, (match, content) => {
    // 清理文本内容中的不可见字符
    const cleanContent = content
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // 零宽字符
      .replace(/[\uE000-\uF8FF]/g, '') // 私有使用区域字符
      .replace(/[\uF000-\uFFFF]/g, ''); // 其他可能的问题字符
    
    return `<m:t>${cleanContent}</m:t>`;
  });
  
  // 🔧 关键修复：移除空的m:e标签（空白方块的根源）
  const beforeEmptyFix = fixed.length;
  const emptyTagsBefore = (fixed.match(/<m:e\s*\/>/g) || []).length;
  const emptyPairsBefore = (fixed.match(/<m:e>\s*<\/m:e>/g) || []).length;
  const naryWithEmptyBefore = (fixed.match(/<m:nary>.*?<m:e\s*\/>.*?<\/m:nary>/gs) || []).length;
  
  // 🔧 特别处理：修复nary结构中的空元素问题
  fixed = fixed.replace(/<m:nary>(.*?)<m:e\s*\/>(.*?)<\/m:nary>/gs, (match, before, after) => {
    console.log(`[XML Utils] 🔧 修复nary中的空元素:`, { 
      原始长度: match.length,
      修复策略: '移除空的m:e标签'
    });
    return `<m:nary>${before}${after}</m:nary>`;
  });
  
  // 🔧 保护nary结构中的空m:e标签，因为它们是必需的
  // 先临时保护nary结构中的空标签
  const naryWithEmptyE = fixed.match(/<m:nary>[\s\S]*?<\/m:nary>/g) || [];
  const protectedNaries = [];
  
  naryWithEmptyE.forEach((nary, index) => {
    // 检查nary内部是否包含任何<m:e>元素（可能是空的，也可能包含重组后的内容）
    if (nary.includes('<m:e>') && nary.includes('</m:e>')) {
      const placeholder = `__NARY_PROTECTED_${index}__`;
      protectedNaries.push({ placeholder, content: nary });
      fixed = fixed.replace(nary, placeholder);
      console.log(`[XML Utils] 🔧 保护nary结构 ${index + 1}:`, nary.substring(0, 100) + '...');
    }
  });
  
  // 现在安全地清理其他区域的空标签
  fixed = fixed.replace(/<m:e\s*\/>/g, ''); // 移除自闭合空标签
  fixed = fixed.replace(/<m:e>\s*<\/m:e>/g, ''); // 移除空内容标签
  
  // 恢复受保护的nary结构
  protectedNaries.forEach(({ placeholder, content }) => {
    fixed = fixed.replace(placeholder, content);
  });
  
  if (protectedNaries.length > 0) {
    console.log(`[XML Utils] 🔧 保护了 ${protectedNaries.length} 个nary结构中的空m:e标签`);
  }
  
  // 🔧 修复：移除空的m:num和m:den标签
  fixed = fixed.replace(/<m:num>\s*<\/m:num>/g, '');
  fixed = fixed.replace(/<m:den>\s*<\/m:den>/g, '');
  
  // 🔧 修复：清理空的m:sub和m:sup标签
  fixed = fixed.replace(/<m:sub>\s*<\/m:sub>/g, '');
  fixed = fixed.replace(/<m:sup>\s*<\/m:sup>/g, '');
  
  const afterEmptyFix = fixed.length;
  const emptyTagsAfter = (fixed.match(/<m:e\s*\/>/g) || []).length;
  const emptyPairsAfter = (fixed.match(/<m:e>\s*<\/m:e>/g) || []).length;
  const naryWithEmptyAfter = (fixed.match(/<m:nary>.*?<m:e\s*\/>.*?<\/m:nary>/gs) || []).length;
  
  if (emptyTagsBefore > 0 || emptyPairsBefore > 0 || naryWithEmptyBefore > 0) {
    console.log(`[XML Utils] 🔧 空标签清理统计:`, {
      清理前长度: beforeEmptyFix,
      清理后长度: afterEmptyFix,
      减少字节: beforeEmptyFix - afterEmptyFix,
      空标签清理: `${emptyTagsBefore}→${emptyTagsAfter}个自闭合, ${emptyPairsBefore}→${emptyPairsAfter}个标签对`,
      nary中空元素: `${naryWithEmptyBefore}→${naryWithEmptyAfter}个问题结构`
    });
  }
  
  return fixed;
};

/**
 * 验证XML结构完整性
 * @param {string} originalXml - 原始XML
 * @param {string} processedXml - 处理后的XML
 * @returns {Object} 验证结果
 */
export const validateXmlStructure = (originalXml, processedXml) => {
  const originalStats = countXmlElements(originalXml);
  const processedStats = countXmlElements(processedXml);
  
  const isValid = originalStats.paragraphs <= processedStats.paragraphs + processedStats.mathElements &&
                  originalStats.tables === processedStats.tables;
  
  return {
    isValid,
    originalStats,
    processedStats,
    differences: {
      paragraphs: processedStats.paragraphs - originalStats.paragraphs,
      tables: processedStats.tables - originalStats.tables,
      mathElements: processedStats.mathElements
    }
  };
};
