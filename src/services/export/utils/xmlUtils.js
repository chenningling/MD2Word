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
  
  // 移除多余的命名空间声明（保留必要的m:命名空间）
  cleanOmml = cleanOmml.replace(/xmlns:mml="[^"]*"/g, '');
  
  // 确保有正确的命名空间
  if (!cleanOmml.includes('xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"')) {
    cleanOmml = cleanOmml.replace('<m:oMath', '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"');
  }
  
  return cleanOmml.trim();
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
