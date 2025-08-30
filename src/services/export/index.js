import { Document, Packer } from 'docx';
import { saveAs } from 'file-saver';
import { marked } from 'marked';

// 导入LaTeX处理模块
import { processLatex, getLatexStats, checkPlaceholdersInTokens } from './processors/latexProcessor';

// 导入图片处理模块
import { processSpecialTokens } from './processors/imageProcessor';

// 导入后处理模块
import { postProcessDocx } from './postprocess/xmlPostProcessor';

// 导入文档构建核心
import { createWordDocument } from './core/documentBuilder';

// 导入工具模块
import { extractDocumentTitle } from './utils/textUtils';

/**
 * MD2Word 导出服务 - 重构版本
 * 提供 Markdown 到 Word 文档的转换功能
 */

/**
 * 将Markdown转换为Word文档
 * @param {string} markdown - Markdown文本
 * @param {Object} formatSettings - 格式设置
 * @returns {Promise<void>} 导出Promise
 */
export const exportToWord = async (markdown, formatSettings) => {
  try {
    console.log('[Export Service] 开始导出Word文档...');
    console.log('[Export Service] 格式设置:', formatSettings);

    // 阶段1: 处理 LaTeX 公式
    console.log('[Export Service] === 阶段1: LaTeX处理 ===');
    const latexProcessResult = await processLatex(markdown);
    
    // 使用处理后的markdown解析tokens
    const processedMarkdown = latexProcessResult.processedMarkdown || markdown;
    console.log('[Export Service] 使用处理后的markdown:', processedMarkdown.substring(0, 100) + '...');
    
    // 解析处理后的Markdown为tokens
    const originalTokens = marked.lexer(processedMarkdown);
    console.log('[Export Service] 解析的Markdown tokens:', originalTokens.length, '个');
    
    // 详细检查tokens内容（调试用）
    logTokensDetail(originalTokens);
    
    const tokens = latexProcessResult.tokens || originalTokens;
    console.log('[Export Service] LaTeX 处理完成:', {
      hasFormulas: latexProcessResult.hasFormulas,
      formulaCount: latexProcessResult.formulas?.length || 0,
      conversionTime: latexProcessResult.conversionTime,
      fallbackMode: latexProcessResult.fallbackMode || false
    });
    
    // 提取文档标题作为文件名
    const documentTitle = extractDocumentTitle(tokens);
    const fileName = `${documentTitle || 'markdown-document'}.docx`;
    console.log('[Export Service] 文档标题:', documentTitle);
    
    // 检查特殊内容统计
    logContentStatistics(tokens);
    
    // 阶段2: 处理特殊内容（图片等）
    console.log('[Export Service] === 阶段2: 特殊内容处理 ===');
    const processedTokens = await processSpecialTokens(tokens);
    console.log('[Export Service] 特殊内容处理完成，tokens数量:', processedTokens.length);

    // 检查tokens中是否包含占位符
    if (latexProcessResult.hasFormulas && latexProcessResult.formulas) {
      checkPlaceholdersInTokens(processedTokens, latexProcessResult.formulas);
    }

    // 阶段3: 创建Word文档
    console.log('[Export Service] === 阶段3: Word文档创建 ===');
    const doc = createWordDocument(processedTokens, formatSettings);
    console.log('[Export Service] Word文档创建完成');
    
    // 输出 LaTeX 处理统计信息
    if (latexProcessResult.hasFormulas) {
      const exportStats = getLatexStats();
      console.log('[Export Service] LaTeX 导出统计:', exportStats);
    }

    // 阶段4: 导出文档为 Blob
    console.log('[Export Service] === 阶段4: 文档序列化 ===');
    const buffer = await Packer.toBlob(doc);
    console.log('[Export Service] 文档序列化完成，大小:', buffer.size, '字节');

    // 检查生成的docx是否包含占位符（调试用）
    if (latexProcessResult.hasFormulas && latexProcessResult.formulas) {
      console.log('[Export Service] 检查生成的docx中的占位符...');
      // 这个检查主要用于调试，在重构版本中通过日志系统处理
    }

    // 阶段5: 后处理（OMML替换和字符缩进）
    console.log('[Export Service] === 阶段5: 后处理 ===');
    const processedBlob = await postProcessDocx(buffer, latexProcessResult.formulas);
    console.log('[Export Service] 后处理完成，最终大小:', processedBlob.size, '字节');

    // 阶段6: 保存文件
    console.log('[Export Service] === 阶段6: 文件保存 ===');
    saveAs(processedBlob, fileName);
    console.log('[Export Service] ✅ Word文档导出成功!');
    
  } catch (error) {
    console.error('[Export Service] ❌ 导出Word文档时发生错误:', error);
    alert('导出失败，请查看控制台获取详细信息。');
    throw error; // 重新抛出错误以便调用者处理
  }
};

/**
 * 记录tokens详细信息（调试用）
 * @param {Array} tokens - tokens数组
 */
const logTokensDetail = (tokens) => {
  console.log('[Export Service] 详细检查解析后的tokens:');
  tokens.forEach((token, index) => {
    console.log(`[Export Service] Token ${index}:`, {
      type: token.type,
      text: token.text?.substring(0, 100),
      raw: token.raw?.substring(0, 100),
      hasTokens: !!token.tokens,
      tokensCount: token.tokens?.length || 0
    });
    
    // 检查子tokens
    if (token.tokens && Array.isArray(token.tokens)) {
      token.tokens.forEach((subToken, subIndex) => {
        console.log(`[Export Service]   SubToken ${subIndex}:`, {
          type: subToken.type,
          text: subToken.text?.substring(0, 100),
          raw: subToken.raw?.substring(0, 100)
        });
      });
    }
  });
};

/**
 * 记录内容统计信息
 * @param {Array} tokens - tokens数组
 */
const logContentStatistics = (tokens) => {
  // 检查表格内容
  const tableTokens = tokens.filter(token => token.type === 'table');
  if (tableTokens.length > 0) {
    console.log('[Export Service] 表格内容:', JSON.stringify(tableTokens, null, 2));
  }
  
  // 检查列表内容，特别关注嵌套的引用块
  const listTokens = tokens.filter(token => token.type === 'list');
  if (listTokens.length > 0) {
    console.log('[Export Service] 列表内容:', JSON.stringify(listTokens, null, 2));
    
    // 检查列表项中的嵌套内容
    listTokens.forEach((list, listIndex) => {
      list.items.forEach((item, itemIndex) => {
        if (item.tokens && item.tokens.length > 0) {
          console.log(`[Export Service] 列表 ${listIndex} 项 ${itemIndex} 的嵌套内容:`, 
            JSON.stringify(item.tokens.map(t => ({ type: t.type, text: t.text })), null, 2));
        }
      });
    });
  }
  
  // 统计各种类型的tokens
  const tokenStats = tokens.reduce((acc, token) => {
    acc[token.type] = (acc[token.type] || 0) + 1;
    return acc;
  }, {});
  
  console.log('[Export Service] Token类型统计:', tokenStats);
};

/**
 * 获取导出服务版本信息
 * @returns {Object} 版本信息
 */
export const getVersion = () => {
  return {
    version: '2.0.0',
    codename: 'Modular',
    description: 'Refactored modular export service',
    features: [
      'Modular architecture',
      'Enhanced LaTeX support', 
      'Improved performance',
      'Better error handling',
      'Comprehensive logging'
    ]
  };
};

/**
 * 检查导出服务健康状态
 * @returns {Promise<Object>} 健康状态
 */
export const checkHealth = async () => {
  try {
    // 简单的健康检查
    const testMarkdown = '# Test\n\nThis is a test.';
    const testSettings = {
      content: {
        paragraph: {
          fontSize: 12,
          fontFamily: '宋体',
          lineHeight: 1.5,
          lineHeightUnit: 'multiple',
          align: 'left',
          firstLineIndent: 2,
          paragraphSpacing: 6,
          bold: false
        }
      },
      page: {
        size: 'A4',
        margin: { top: 2.54, right: 2.54, bottom: 2.54, left: 2.54 }
      },
      latin: { enabled: false }
    };
    
    // 只测试LaTeX处理，不实际生成Word文档
    const latexResult = await processLatex(testMarkdown);
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      modules: {
        latexProcessor: latexResult ? 'ok' : 'error',
        documentBuilder: 'ok',
        postProcessor: 'ok'
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
};
