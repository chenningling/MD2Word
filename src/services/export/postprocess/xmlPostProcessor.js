import JSZip from 'jszip';
import { createXMLParser, createXMLBuilder, countXmlElements, analyzeXmlParagraphs } from '../utils/xmlUtils';
import { replaceOmmlPlaceholders, validatePlaceholderReplacement } from './ommlReplacer';
import { recordOriginalElementOrder, reorderXmlElements, analyzeRebuiltElementOrder, validateElementOrder, clearOrderState } from './orderManager';

/**
 * XML后处理主模块
 * 协调OMML替换、元素顺序管理、字符缩进处理等功能
 */

/**
 * 主要的docx后处理函数
 * @param {Blob} blob - 原始docx文件blob
 * @param {Array} ommlResults - OMML转换结果
 * @returns {Promise<Blob>} 处理后的docx文件blob
 */
export const postProcessDocx = async (blob, ommlResults = []) => {
  try {
    console.log('[XML Post-Processor] 开始XML后处理...');
    
    const zip = await JSZip.loadAsync(blob);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      console.warn('[XML Post-Processor] 未找到 word/document.xml，跳过后处理');
      return blob;
    }

    let xmlString = await docXmlFile.async('string');
    
    // 📊 在任何处理之前检查原始Word文档结构
    const originalStats = countXmlElements(xmlString);
    console.log(`[XML Post-Processor] 🚀 原始Word文档包含 ${originalStats.paragraphs} 个段落, ${originalStats.tables} 个表格, ${originalStats.mathElements} 个数学公式`);
    
    // 分析原始段落内容
    const initialParagraphs = analyzeXmlParagraphs(xmlString);
    console.log('[XML Post-Processor] 原始段落分析:');
    initialParagraphs.forEach(para => {
      if (para.hasPlaceholder) {
        console.log(`[XML Post-Processor] 段落 ${para.index}: 📊 包含占位符 - ${para.textPreview}`);
      } else if (para.textContent) {
        console.log(`[XML Post-Processor] 段落 ${para.index}: 📝 文本内容 - "${para.textPreview}"`);
      } else {
        console.log(`[XML Post-Processor] 段落 ${para.index}: 📄 空段落或样式段落`);
      }
    });
    
    // 1. 替换 OMML 占位符为真正的 OMML
    if (ommlResults && ommlResults.length > 0) {
      console.log(`[XML Post-Processor] 开始OMML占位符替换阶段...`);
      xmlString = replaceOmmlPlaceholders(xmlString, ommlResults);
      
      // 验证替换结果
      const replacementValidation = validatePlaceholderReplacement(xmlString, xmlString, ommlResults);
      console.log('[XML Post-Processor] OMML替换验证结果:', replacementValidation);
      
      // 🔍 验证表格结构完整性
      const finalStats = countXmlElements(xmlString);
      console.log(`[XML Post-Processor] OMML替换后文档包含 ${finalStats.paragraphs} 个段落, ${finalStats.tables} 个表格, ${finalStats.mathElements} 个数学公式`);
      
      if (finalStats.tables !== originalStats.tables) {
        console.warn(`[XML Post-Processor] ⚠️ 警告：表格数量发生变化! 原始: ${originalStats.tables}, 处理后: ${finalStats.tables}`);
      } else if (originalStats.tables > 0) {
        console.log(`[XML Post-Processor] ✅ 表格结构保持完整`);
      }
    }

    // 📊 在XML解析前统计段落总数
    const ommlProcessedStats = countXmlElements(xmlString);
    console.log(`[XML Post-Processor] OMML替换后XML中有 ${ommlProcessedStats.paragraphs} 个段落`);
    
    // 📊 详细检查OMML替换后每个段落
    const ommlProcessedParagraphs = analyzeXmlParagraphs(xmlString);
    ommlProcessedParagraphs.forEach(para => {
      if (para.hasFormula) {
        console.log(`[XML Post-Processor] 段落 ${para.index}: 📊 包含OMML公式`);
      } else if (para.textContent) {
        console.log(`[XML Post-Processor] 段落 ${para.index}: 📝 文本 - "${para.textPreview}"`);
      } else {
        console.log(`[XML Post-Processor] 段落 ${para.index}: 📄 空段落`);
      }
    });
    
    // 2. 处理字符缩进（原有逻辑）
    console.log('[XML Post-Processor] 开始字符缩进处理阶段...');
    const processedXml = await processCharacterIndentation(xmlString);
    
    // 写回 zip
    zip.file('word/document.xml', processedXml);
    const outBlob = await zip.generateAsync({ type: 'blob' });
    
    console.log('[XML Post-Processor] docx后处理完成：已写入 firstLineChars 和 OMML 公式');
    
    // 清理状态
    clearOrderState();
    
    return outBlob;
  } catch (e) {
    console.warn('[XML Post-Processor] docx后处理失败，返回原始文档：', e);
    clearOrderState();
    return blob;
  }
};

/**
 * 处理字符缩进
 * @param {string} xmlString - XML字符串
 * @returns {Promise<string>} 处理后的XML字符串
 */
const processCharacterIndentation = async (xmlString) => {
  // 🛡️ 在XML解析前保护OMML内容，避免被XMLParser转义
  const { protectedXml, protectionMap } = protectOmmlContent(xmlString);
    
  const parser = createXMLParser();
  const json = parser.parse(protectedXml);
  
  console.log(`[XML Post-Processor] XML解析完成，检查JSON结构`);
  console.log(`[XML Post-Processor] JSON根键: ${Object.keys(json).join(', ')}`);

  // 处理段落：仅对使用 paragraph-2-chars/4-chars/no-indent 的段落写入 firstLineChars
  const doc = json['w:document'];
  if (!doc) {
    console.error(`[XML Post-Processor] ❌ 未找到w:document，提前返回！JSON结构:`, Object.keys(json));
    return xmlString;
  }
  console.log(`[XML Post-Processor] ✅ 找到w:document`);
  
  const body = doc['w:body'];
  if (!body) {
    console.error(`[XML Post-Processor] ❌ 未找到w:body，提前返回！document结构:`, Object.keys(doc));
    return xmlString;
  }
  console.log(`[XML Post-Processor] ✅ 找到w:body`);
  
  const paragraphs = body['w:p'];
  console.log(`[XML Post-Processor] 段落类型: ${typeof paragraphs}, 是否为数组: ${Array.isArray(paragraphs)}`);
  
  // 📊 详细分析段落处理情况
  if (Array.isArray(paragraphs)) {
    console.log(`[XML Post-Processor] 找到 ${paragraphs.length} 个段落数组`);
    paragraphs.forEach((p, index) => {
      console.log(`[XML Post-Processor] 段落 ${index + 1}: ${JSON.stringify(p).substring(0, 100)}...`);
    });
  } else if (paragraphs) {
    console.log(`[XML Post-Processor] 找到单个段落对象: ${JSON.stringify(paragraphs).substring(0, 100)}...`);
  } else {
    console.warn(`[XML Post-Processor] ⚠️ 未找到任何段落内容`);
  }
  
  // 📊 检查完整的body结构
  console.log(`[XML Post-Processor] w:body的所有键: ${Object.keys(body).join(', ')}`);
  
  // 🔍 详细分析body结构顺序问题
  console.log(`[XML Post-Processor] 🔍 分析body结构中的所有子元素:`);
  for (const [key, value] of Object.entries(body)) {
    if (key === 'w:p') {
      console.log(`[XML Post-Processor] - ${key}: ${Array.isArray(value) ? value.length + ' 个段落' : '1个段落'}`);
    } else if (key === 'w:tbl') {
      console.log(`[XML Post-Processor] - ${key}: ${Array.isArray(value) ? value.length + ' 个表格' : '1个表格'}`);
    } else {
      console.log(`[XML Post-Processor] - ${key}: ${typeof value}`);
    }
  }

  // 处理段落缩进
  processIndentationInParagraphs(paragraphs);

  // 记录原始元素顺序
  recordOriginalElementOrder(xmlString);

  const builder = createXMLBuilder();
  let newXml = builder.build(json);
  
  console.log(`[XML Post-Processor] XMLBuilder构建完成，准备开始恢复阶段`);
  console.log(`[XML Post-Processor] 构建后XML长度: ${newXml.length}`);
  console.log(`[XML Post-Processor] 保护映射表大小: ${protectionMap.size}`);
  
  // 🔧 完整的XML元素顺序重建方案
  newXml = reorderXmlElements(newXml);
  
  // 📊 检查XML重建后段落和表格数量
  const rebuiltStats = countXmlElements(newXml);
  console.log(`[XML Post-Processor] XML重建后有 ${rebuiltStats.paragraphs} 个段落, ${rebuiltStats.tables} 个表格`);
  
  // 🔍 分析重建后的元素顺序
  analyzeRebuiltElementOrder(newXml);
  
  // 验证元素顺序
  const orderValidation = validateElementOrder(xmlString, newXml);
  console.log('[XML Post-Processor] 元素顺序验证结果:', orderValidation);
  
  // 🔄 恢复被保护的OMML内容
  const finalXml = restoreOmmlContent(newXml, protectionMap);
  
  console.log(`[XML Post-Processor] OMML恢复完成，最终XML长度: ${finalXml.length}`);
  
  return finalXml;
};

/**
 * 保护OMML内容
 * @param {string} xmlString - 原始XML字符串
 * @returns {Object} 保护结果 {protectedXml, protectionMap}
 */
const protectOmmlContent = (xmlString) => {
  const ommlProtectionMap = new Map();
  let protectedXmlString = xmlString;
  let protectionCounter = 0;
  
  // 查找并保护所有OMML内容
  const ommlMatches = xmlString.match(/<m:oMath[^>]*>.*?<\/m:oMath>/gs) || [];
  console.log(`[XML Post-Processor] 在已替换OMML的XML中找到 ${ommlMatches.length} 个OMML需要保护`);
  
  if (ommlMatches.length > 0) {
    ommlMatches.forEach((ommlContent, index) => {
      const protectionKey = `__OMML_PROTECTED_${protectionCounter++}__`;
      ommlProtectionMap.set(protectionKey, ommlContent);
      protectedXmlString = protectedXmlString.replace(ommlContent, protectionKey);
      console.log(`[XML Post-Processor] 保护OMML ${index + 1}: ${protectionKey} (长度: ${ommlContent.length})`);
    });
  } else {
    console.warn(`[XML Post-Processor] ⚠️ 未找到OMML内容需要保护，可能OMML替换未成功`);
  }
  
  return {
    protectedXml: protectedXmlString,
    protectionMap: ommlProtectionMap
  };
};

/**
 * 恢复OMML内容
 * @param {string} xmlString - 处理后的XML字符串
 * @param {Map} protectionMap - 保护映射表
 * @returns {string} 恢复后的XML字符串
 */
const restoreOmmlContent = (xmlString, protectionMap) => {
  console.log(`[XML Post-Processor] 开始恢复 ${protectionMap.size} 个被保护的OMML`);
  console.log(`[XML Post-Processor] 恢复前XML长度: ${xmlString.length}`);
  
  let restoredXml = xmlString;
  
  // 检查恢复前的XML内容
  const xmlHasProtectionKeys = Array.from(protectionMap.keys()).some(key => restoredXml.includes(key));
  console.log(`[XML Post-Processor] XML中是否包含保护键: ${xmlHasProtectionKeys}`);
  
  if (xmlHasProtectionKeys) {
    protectionMap.forEach((ommlContent, protectionKey) => {
      const beforeLength = restoredXml.length;
      if (restoredXml.includes(protectionKey)) {
        restoredXml = restoredXml.replace(protectionKey, ommlContent);
        const afterLength = restoredXml.length;
        console.log(`[XML Post-Processor] ✅ 恢复OMML: ${protectionKey} → OMML内容 (XML长度: ${beforeLength} → ${afterLength})`);
      } else {
        console.warn(`[XML Post-Processor] ⚠️ 保护键未找到: ${protectionKey}`);
      }
    });
  } else {
    console.warn(`[XML Post-Processor] ⚠️ 所有保护键都未在XML中找到，可能XML解析过程中丢失了`);
    
    // 检查是否有原始占位符
    const hasOriginalPlaceholder = restoredXml.includes('OMML_PLACEHOLDER');
    console.log(`[XML Post-Processor] XML中是否包含原始占位符: ${hasOriginalPlaceholder}`);
    
    if (hasOriginalPlaceholder) {
      console.warn(`[XML Post-Processor] ⚠️ 检测到原始占位符仍存在，可能是占位符替换没有在保护阶段之前完成`);
    }
  }
  
  console.log(`[XML Post-Processor] 恢复后XML长度: ${restoredXml.length}`);
  
  return restoredXml;
};

/**
 * 处理段落中的缩进设置
 * @param {Array|Object} paragraphs - 段落数组或单个段落对象
 */
const processIndentationInParagraphs = (paragraphs) => {
  const ensureFirstLineChars = (pPr, chars) => {
    if (!pPr['w:ind']) pPr['w:ind'] = {};
    pPr['w:ind']['@_w:firstLineChars'] = String(chars);
    // 确保距离单位首行缩进为0，不干扰字符单位
    if (pPr['w:ind']['@_w:firstLine'] !== undefined) {
      pPr['w:ind']['@_w:firstLine'] = '0';
    }
  };

  const ensureParagraphProcessed = (p) => {
    if (!p['w:pPr']) return;
    const pPr = p['w:pPr'];
    const pStyle = pPr['w:pStyle'];
    const styleId = pStyle && pStyle['@_w:val'];
    if (styleId === 'paragraph-2-chars') {
      ensureFirstLineChars(pPr, 200);
    } else if (styleId === 'paragraph-4-chars') {
      ensureFirstLineChars(pPr, 400);
    } else if (styleId === 'paragraph-no-indent') {
      ensureFirstLineChars(pPr, 0);
    }
  };

  if (Array.isArray(paragraphs)) {
    paragraphs.forEach((p) => ensureParagraphProcessed(p));
  } else if (paragraphs) {
    ensureParagraphProcessed(paragraphs);
  }
};
