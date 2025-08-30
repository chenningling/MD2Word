import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, Table, TableRow, TableCell, WidthType, BorderStyle, HorizontalPositionAlign, HorizontalPositionRelativeFrom, ThematicBreak, Shading, ExternalHyperlink, ImageRun, ImportedXmlComponent } from 'docx';
import JSZip from 'jszip';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { saveAs } from 'file-saver';
import { marked } from 'marked';
import { dataUriToUint8Array, downloadImage, isImageUrl } from '../utils/imageUtils';
import axios from 'axios';
import { processLatexForExport, getLatexExportStats } from './latexExportService';

// 计算首行缩进的辅助函数
const calculateFirstLineIndent = (settings) => {
  const fontSizeInPoints = settings.fontSize;
  const charCount = settings.firstLineIndent || 0;
  
  if (charCount === 0) return 0;
  
  // 根据字体类型确定字符宽度系数
  const chineseFonts = ['宋体', '微软雅黑', '黑体', '仿宋', '楷体', '小标宋体', '华文宋体', '华文楷体', '华文黑体', '方正书宋', '方正黑体'];
  const isChineseFont = chineseFonts.includes(settings.fontFamily);
  
  // 字符宽度系数：中文字体为1.0，英文字体为0.5
  const charWidthRatio = isChineseFont ? 1.0 : 0.5;
  
  // 计算字符宽度（以英寸为单位）
  const charWidthInInches = (fontSizeInPoints * charWidthRatio) / 72;
  
  // 转换为twip
  const firstLineIndentTwips = convertInchesToTwip(charWidthInInches * charCount);
  
  console.log('首行缩进计算详情:', {
    fontSizeInPoints,
    charCount,
    fontFamily: settings.fontFamily,
    isChineseFont,
    charWidthRatio,
    charWidthInInches,
    firstLineIndentTwips
  });
  
  return firstLineIndentTwips;
};

// 提取文档标题作为文件名
const extractDocumentTitle = (tokens) => {
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

// 将Markdown转换为Word文档
export const exportToWord = async (markdown, formatSettings) => {
  try {
    console.log('开始导出Word文档...');
    console.log('格式设置:', formatSettings);

    // 处理 LaTeX 公式 - 在marked解析之前处理
    console.log('[Export] 开始处理 LaTeX 公式...');
    const latexProcessResult = await processLatexForExport(markdown, null);
    
    // 使用处理后的markdown解析tokens
    const processedMarkdown = latexProcessResult.processedMarkdown || markdown;
    console.log('[Export] 使用处理后的markdown:', processedMarkdown.substring(0, 100) + '...');
    
    // 解析处理后的Markdown为tokens
    const originalTokens = marked.lexer(processedMarkdown);
    console.log('解析的Markdown tokens:', originalTokens);
    
    // 详细检查tokens内容
    console.log('[OMML Debug] 详细检查解析后的tokens:');
    originalTokens.forEach((token, index) => {
      console.log(`[OMML Debug] Token ${index}:`, {
        type: token.type,
        text: token.text?.substring(0, 100),
        raw: token.raw?.substring(0, 100),
        hasTokens: !!token.tokens,
        tokensCount: token.tokens?.length || 0
      });
      
      // 检查子tokens
      if (token.tokens && Array.isArray(token.tokens)) {
        token.tokens.forEach((subToken, subIndex) => {
          console.log(`[OMML Debug]   SubToken ${subIndex}:`, {
            type: subToken.type,
            text: subToken.text?.substring(0, 100),
            raw: subToken.raw?.substring(0, 100)
          });
        });
      }
    });
    
    const tokens = latexProcessResult.tokens || originalTokens;
    console.log('[Export] LaTeX 处理完成:', {
      hasFormulas: latexProcessResult.hasFormulas,
      formulaCount: latexProcessResult.formulas?.length || 0,
      conversionTime: latexProcessResult.conversionTime,
      fallbackMode: latexProcessResult.fallbackMode || false
    });
    
    // 提取文档标题作为文件名
    const documentTitle = extractDocumentTitle(tokens);
    const fileName = `${documentTitle || 'markdown-document'}.docx`;
    
    // 检查表格内容
    const tableTokes = tokens.filter(token => token.type === 'table');
    if (tableTokes.length > 0) {
      console.log('表格内容:', JSON.stringify(tableTokes, null, 2));
    }
    
    // 检查列表内容，特别关注嵌套的引用块
    const listTokens = tokens.filter(token => token.type === 'list');
    if (listTokens.length > 0) {
      console.log('列表内容:', JSON.stringify(listTokens, null, 2));
      
      // 检查列表项中的嵌套内容
      listTokens.forEach((list, listIndex) => {
        list.items.forEach((item, itemIndex) => {
          if (item.tokens && item.tokens.length > 0) {
            console.log(`列表 ${listIndex} 项 ${itemIndex} 的嵌套内容:`, 
              JSON.stringify(item.tokens.map(t => ({ type: t.type, text: t.text })), null, 2));
          }
        });
      });
    }

    // 处理Mermaid流程图和图片
    const processedTokens = await processSpecialTokens(tokens);

    // 检查tokens中是否包含占位符
    checkPlaceholdersInTokens(processedTokens, latexProcessResult.formulas);

    // 设置当前导出的 OMML 结果，供后续处理使用
    if (latexProcessResult.hasFormulas && latexProcessResult.formulas) {
      setCurrentOmmlResults(latexProcessResult.formulas);
    }

    // 创建Word文档
    const doc = createWordDocument(processedTokens, formatSettings);
    
    // 输出 LaTeX 处理统计信息
    if (latexProcessResult.hasFormulas) {
      const exportStats = getLatexExportStats();
      console.log('[Export] LaTeX 导出统计:', exportStats);
    }

    // 导出文档为 Blob
    const buffer = await Packer.toBlob(doc);

    // 检查生成的docx是否包含占位符
    await checkPlaceholdersInDocx(buffer, latexProcessResult.formulas);

    // 对 docx 做后处理：将正文段落实体写入 w:firstLineChars
    const processedBlob = await postProcessDocx(buffer);

    saveAs(processedBlob, fileName);
    console.log('Word文档导出成功!');
  } catch (error) {
    console.error('导出Word文档时发生错误:', error);
    alert('导出失败，请查看控制台获取详细信息。');
  }
};

// 检查tokens中的占位符
const checkPlaceholdersInTokens = (tokens, formulas) => {
  console.log('[OMML Debug] 检查tokens中的占位符...');
  
  const placeholderPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
  
  const checkTokenRecursively = (token) => {
    // 检查token的文本内容
    if (token.text) {
      const placeholders = token.text.match(placeholderPattern) || [];
      if (placeholders.length > 0) {
        console.log(`[OMML Debug] Token中发现占位符:`, placeholders, token.type);
      }
    }
    
    if (token.raw) {
      const placeholders = token.raw.match(placeholderPattern) || [];
      if (placeholders.length > 0) {
        console.log(`[OMML Debug] Token raw中发现占位符:`, placeholders, token.type);
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
    console.log('[OMML Debug] 期望在tokens中找到的占位符:');
    formulas.forEach(formula => {
      if (formula.success) {
        console.log(`[OMML Debug] - <!--OMML_PLACEHOLDER_${formula.id}-->`);
      }
    });
  }
};

// 检查docx中的占位符
const checkPlaceholdersInDocx = async (blob, formulas) => {
  try {
    console.log('[OMML Debug] 检查生成的docx中的占位符...');
    
    const zip = await JSZip.loadAsync(blob);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      console.warn('[OMML Debug] 未找到 word/document.xml');
      return;
    }

    const xmlString = await docXmlFile.async('string');
    console.log('[OMML Debug] document.xml长度:', xmlString.length);
    
    // 检查占位符
    const placeholderPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
    const placeholdersInXml = xmlString.match(placeholderPattern) || [];
    console.log('[OMML Debug] XML中的占位符:', placeholdersInXml);
    
    // 检查期望的占位符
    if (formulas && formulas.length > 0) {
      formulas.forEach(formula => {
        if (formula.success) {
          const expectedPlaceholder = `<!--OMML_PLACEHOLDER_${formula.id}-->`;
          const escapedPlaceholder = `&lt;!--OMML_PLACEHOLDER_${formula.id}--&gt;`;
          const originalFound = xmlString.includes(expectedPlaceholder);
          const escapedFound = xmlString.includes(escapedPlaceholder);
          console.log(`[OMML Debug] 期望占位符 ${expectedPlaceholder}: ${originalFound ? '✅找到' : '❌未找到'}`);
          console.log(`[OMML Debug] 转义占位符 ${escapedPlaceholder}: ${escapedFound ? '✅找到' : '❌未找到'}`);
        }
      });
    }
    
    // 显示XML的一些片段来调试
    const xmlPreview = xmlString.substring(0, 500);
    console.log('[OMML Debug] XML开头预览:', xmlPreview);
    
  } catch (error) {
    console.error('[OMML Debug] 检查占位符失败:', error);
  }
};

// docx 后处理：对 word/document.xml 的正文段落写入字符单位缩进并替换 OMML 占位符
const postProcessDocx = async (blob) => {
  try {
    const zip = await JSZip.loadAsync(blob);
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      console.warn('未找到 word/document.xml，跳过后处理');
      return blob;
    }

    let xmlString = await docXmlFile.async('string');
    
    // 1. 替换 OMML 占位符为真正的 OMML
    if (currentExportOmmlResults && currentExportOmmlResults.length > 0) {
      console.log(`[OMML Post-process Debug] 开始替换 ${currentExportOmmlResults.length} 个公式占位符`);
      console.log(`[OMML Post-process Debug] XML文档长度: ${xmlString.length}`);
      
      // 检查XML中是否包含占位符
      const placeholderPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
      const placeholdersInXml = xmlString.match(placeholderPattern) || [];
      console.log(`[OMML Post-process Debug] XML中找到 ${placeholdersInXml.length} 个占位符:`, placeholdersInXml);
      
      for (const ommlResult of currentExportOmmlResults) {
        console.log(`[OMML Post-process Debug] 处理OMML结果:`, {
          id: ommlResult.id,
          success: ommlResult.success,
          hasOmml: !!ommlResult.omml,
          latex: ommlResult.latex?.substring(0, 30),
          isDisplayMode: ommlResult.isDisplayMode
        });
        
        if (ommlResult.success && ommlResult.omml) {
          const placeholder = `<!--OMML_PLACEHOLDER_${ommlResult.id}-->`;
          const escapedPlaceholder = `&lt;!--OMML_PLACEHOLDER_${ommlResult.id}--&gt;`;
          const ommlXml = ommlResult.omml;
          
          console.log(`[OMML Post-process Debug] 查找占位符: ${placeholder}`);
          console.log(`[OMML Post-process Debug] 查找转义占位符: ${escapedPlaceholder}`);
          console.log(`[OMML Post-process Debug] XML中包含原始占位符: ${xmlString.includes(placeholder)}`);
          console.log(`[OMML Post-process Debug] XML中包含转义占位符: ${xmlString.includes(escapedPlaceholder)}`);
          
          // 优先查找转义后的占位符，如果没有则查找原始占位符
          const actualPlaceholder = xmlString.includes(escapedPlaceholder) ? escapedPlaceholder : placeholder;
          
          if (xmlString.includes(actualPlaceholder)) {
            // 清理OMML XML，移除XML声明和多余的命名空间
            let cleanOmml = ommlXml;
            
            // 移除XML声明
            cleanOmml = cleanOmml.replace(/<\?xml[^>]*\?>/g, '');
            
            // 移除多余的命名空间声明（保留必要的m:命名空间）
            cleanOmml = cleanOmml.replace(/xmlns:mml="[^"]*"/g, '');
            
            console.log(`[OMML Post-process Debug] 清理后的OMML长度: ${cleanOmml.length}`);
            console.log(`[OMML Post-process Debug] 清理后的OMML预览: ${cleanOmml.substring(0, 150)}`);
            
            // 定义替换内容 - 使用正确的Word XML结构
            const replacement = `<w:r><w:rPr><w:rFonts w:ascii="Cambria Math" w:cs="Cambria Math" w:eastAsia="Cambria Math" w:hAnsi="Cambria Math"/></w:rPr>${cleanOmml}</w:r>`;
            
            // 尝试多种匹配模式
            let replaced = false;
            
            // 查找包含占位符的w:t标签，确保不会错误匹配其他内容
            const placeholderRegex = new RegExp(`<w:t[^>]*>\\s*${actualPlaceholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*</w:t>`, 'gs');
            
            console.log(`[OMML Post-process Debug] 测试正则匹配: ${placeholderRegex.test(xmlString)}`);
            
            // 重置正则状态
            placeholderRegex.lastIndex = 0;
            
            if (placeholderRegex.test(xmlString)) {
              // 重置正则状态用于替换
              placeholderRegex.lastIndex = 0;
              
              // 替换为正确的OMML结构
              const beforeLength = xmlString.length;
              xmlString = xmlString.replace(placeholderRegex, replacement);
              const afterLength = xmlString.length;
              
              console.log(`[OMML Post-process Debug] 替换占位符: ${ommlResult.id}，使用正确的OMML结构`);
              console.log(`[OMML Post-process Debug] XML长度变化: ${beforeLength} → ${afterLength}`);
              replaced = true;
            } else {
              // 如果找不到w:t结构，使用简单的文本替换（降级方案）
              const beforeLength = xmlString.length;
              xmlString = xmlString.replace(placeholder, replacement);
              const afterLength = xmlString.length;
              
              console.log(`[OMML Post-process Debug] 使用降级方案替换占位符: ${ommlResult.id}`);
              console.log(`[OMML Post-process Debug] XML长度变化: ${beforeLength} → ${afterLength}`);
              replaced = true;
            }
            
            // 验证替换是否成功
            if (replaced && !xmlString.includes(placeholder)) {
              console.log(`[OMML Post-process Debug] ✅ 占位符 ${placeholder} 替换成功`);
            } else if (replaced) {
              console.warn(`[OMML Post-process Debug] ⚠️ 占位符 ${placeholder} 可能未完全替换`);
            }
          } else {
            console.warn(`[OMML Post-process Debug] ❌ 未找到占位符: ${placeholder}`);
          }
        } else {
          console.warn(`[OMML Post-process Debug] ❌ OMML结果无效:`, {
            id: ommlResult.id,
            success: ommlResult.success,
            hasOmml: !!ommlResult.omml
          });
        }
      }
      
      // 最终检查
      const remainingPlaceholders = xmlString.match(placeholderPattern) || [];
      console.log(`[OMML Post-process Debug] 处理完成，剩余占位符: ${remainingPlaceholders.length}`, remainingPlaceholders);
    }

    // 2. 处理字符缩进（原有逻辑）
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      preserveOrder: false,
    });
    const json = parser.parse(xmlString);

    // 处理段落：仅对使用 paragraph-2-chars/4-chars/no-indent 的段落写入 firstLineChars
    const doc = json['w:document'];
    if (!doc) return blob;
    const body = doc['w:body'];
    if (!body) return blob;
    const paragraphs = body['w:p'];

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

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const newXml = builder.build(json);

    // 写回 zip
    zip.file('word/document.xml', newXml);
    const outBlob = await zip.generateAsync({ type: 'blob' });
    console.log('docx后处理完成：已写入 firstLineChars 和 OMML 公式');
    return outBlob;
  } catch (e) {
    console.warn('docx后处理失败，返回原始文档：', e);
    return blob;
  }
};

// 处理特殊类型的token（Mermaid流程图和图片）
const processSpecialTokens = async (tokens) => {
  const processedTokens = [];
  
  // 首先处理所有图片，创建一个映射表
  const imageMap = new Map();
  
  // 遍历所有段落，找出所有图片
  for (const token of tokens) {
    if (token.type === 'paragraph' && token.tokens) {
      const imageTokens = token.tokens.filter(t => t.type === 'image');
      for (const imgToken of imageTokens) {
        try {
          if (isImageUrl(imgToken.href)) {
            console.log('预处理图片:', imgToken.href);
            const imageData = await downloadImageAsBase64(imgToken.href);
            if (imageData) {
              imageMap.set(imgToken.href, {
                dataUrl: imageData.dataUrl,
                width: imageData.width,
                height: imageData.height
              });
              console.log('图片预处理成功:', imgToken.href);
            }
          }
        } catch (error) {
          console.error('图片预处理失败:', imgToken.href, error);
        }
      }
    }
  }
  
  console.log(`预处理完成，共处理 ${imageMap.size} 张图片`);
  
  // 然后处理所有token
  for (const token of tokens) {
    if (token.type === 'code') {
      // 处理普通代码块，确保它们被正确添加到处理后的tokens中
      console.log('处理普通代码块:', token.lang, token.text ? token.text.substring(0, 30) + '...' : '无内容');
      processedTokens.push({
        ...token,
        type: 'code',  // 确保类型是'code'
        text: token.text || '',  // 确保有文本内容
        lang: token.lang || ''   // 确保有语言标识
      });
    } else if (token.type === 'paragraph') {
      try {
        // 检查段落中是否包含单个图片
        if (token.tokens && token.tokens.length === 1 && token.tokens[0].type === 'image') {
          const imageToken = token.tokens[0];
          const imageUrl = imageToken.href;
          
          // 检查预处理的图片映射表
          if (imageMap.has(imageUrl)) {
            const imageData = imageMap.get(imageUrl);
            processedTokens.push({
              type: 'image',
              href: imageUrl,
              text: imageToken.text,
              dataUrl: imageData.dataUrl,
              width: imageData.width,
              height: imageData.height,
              raw: token.raw
            });
            console.log('使用预处理的图片数据:', imageUrl);
            continue; // 跳过后续处理
          }
          
          // 如果映射表中没有，尝试直接处理
          if (isImageUrl(imageUrl)) {
            console.log('处理段落中的单个图片:', imageUrl);
            const imageData = await downloadImageAsBase64(imageUrl);
            if (imageData) {
              processedTokens.push({
                type: 'image',
                href: imageUrl,
                text: imageToken.text,
                dataUrl: imageData.dataUrl,
                width: imageData.width,
                height: imageData.height,
                raw: token.raw
              });
              console.log('图片处理成功:', imageUrl);
              continue; // 跳过后续处理
            }
          }
        }
        
        // 处理包含多个元素的段落
        if (token.tokens) {
          // 检查段落中是否包含图片
          const hasImages = token.tokens.some(t => t.type === 'image');
          
          if (hasImages) {
            // 创建新的段落，替换图片token为文本描述
            const newParagraph = { ...token };
            newParagraph.tokens = token.tokens.map(t => {
              if (t.type === 'image') {
                // 如果是图片，在段落后面添加一个图片元素
                const imageUrl = t.href;
                if (imageMap.has(imageUrl)) {
                  const imageData = imageMap.get(imageUrl);
                  // 添加图片到处理后的tokens
                  processedTokens.push({
                    type: 'image',
                    href: imageUrl,
                    text: t.text,
                    dataUrl: imageData.dataUrl,
                    width: imageData.width,
                    height: imageData.height,
                    raw: `![${t.text}](${imageUrl})`
                  });
                  console.log('添加段落内嵌图片:', imageUrl);
                }
                
                // 返回一个文本token，表示图片位置
                return {
                  type: 'text',
                  text: ''  // 使用空字符串，这样图片就会在单独的行中显示
                };
              }
              return t;
            });
            
            // 添加处理后的段落
            processedTokens.push(newParagraph);
          } else {
            // 没有图片的段落，直接添加
            processedTokens.push(token);
          }
        } else {
          // 没有tokens的段落，直接添加
          processedTokens.push(token);
        }
      } catch (error) {
        console.error('处理段落中的图片失败:', error);
        processedTokens.push(token);
      }
    } else {
      // 其他类型的token直接添加
      processedTokens.push(token);
    }
  }
  
  console.log('处理后的tokens:', processedTokens.map(t => ({ 
    type: t.type, 
    text: t.text || (t.raw ? t.raw.substring(0, 20) : ''), 
    isImage: t.type === 'image'
  })));
  return processedTokens;
};

// 下载图片并转换为base64
const downloadImageAsBase64 = async (url) => {
  try {
    console.log('开始下载图片:', url);
    
    // 处理OSS图片URL的CORS问题
    // 如果是阿里云OSS的URL，添加额外的参数来绕过防盗链
    let fetchUrl = url;
    if (url.includes('aliyuncs.com')) {
      // 添加图片处理参数，可能有助于绕过某些限制
      fetchUrl = url.includes('?') ? `${url}&x-oss-process=image/resize,m_lfit,w_800` : `${url}?x-oss-process=image/resize,m_lfit,w_800`;
      console.log('修改后的OSS URL:', fetchUrl);
    }
    
    // 使用axios下载图片
    const response = await axios.get(fetchUrl, { 
      responseType: 'arraybuffer',
      // 添加请求头以模拟浏览器行为
      headers: {
        'Referer': window.location.origin,
        'User-Agent': navigator.userAgent
      }
    });
    
    // 获取图片类型
    const contentType = response.headers['content-type'];
    console.log('图片类型:', contentType);
    
    // 转换为base64 (浏览器环境中不能使用Node.js的Buffer)
    const arrayBufferView = new Uint8Array(response.data);
    let binary = '';
    for (let i = 0; i < arrayBufferView.length; i++) {
      binary += String.fromCharCode(arrayBufferView[i]);
    }
    const base64 = btoa(binary);
    const dataUrl = `data:${contentType};base64,${base64}`;
    
    // 获取图片尺寸
    const dimensions = await getImageDimensions(dataUrl);
    console.log('图片尺寸:', dimensions);
    
    return {
      dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      contentType
    };
  } catch (error) {
    console.error('下载图片失败:', error);
    return null;
  }
};

// 获取图片尺寸
const getImageDimensions = (dataUrl) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 限制图片最大宽度为600px，保持原始比例
      const maxWidth = 600;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }
      
      resolve({ width, height });
    };
    img.onerror = (err) => reject(new Error('获取图片尺寸失败'));
    img.src = dataUrl;
  });
};

// 创建Word文档
const createWordDocument = (tokens, formatSettings) => {
  const { content, page, latin } = formatSettings;
  const latinSettings = latin || { enabled: false, fontFamily: 'Times New Roman' };
  
  // 设置页面边距（将厘米转换为英寸，再转换为twip）
  const margins = {
    top: convertInchesToTwip(page.margin.top / 2.54),
    right: convertInchesToTwip(page.margin.right / 2.54),
    bottom: convertInchesToTwip(page.margin.bottom / 2.54),
    left: convertInchesToTwip(page.margin.left / 2.54)
  };

  // 设置页面大小
  let pageSize = {};
  
  switch (page.size) {
    case 'A4':
      pageSize = {
        width: 11906, // 210mm = 8.27in = 11906 twips
        height: 16838, // 297mm = 11.69in = 16838 twips
        orientation: 'portrait'
      };
      break;
    case 'A3':
      pageSize = {
        width: 16838, // 297mm = 11.69in = 16838 twips
        height: 23811, // 420mm = 16.54in = 23811 twips
        orientation: 'portrait'
      };
      break;
    case '8K':
      pageSize = {
        width: 14748, // 260mm = 10.24in = 14748 twips
        height: 20866, // 368mm = 14.49in = 20866 twips
        orientation: 'portrait'
      };
      break;
    case '16K':
      pageSize = {
        width: 10433, // 184mm = 7.24in = 10433 twips
        height: 14748, // 260mm = 10.24in = 14748 twips
        orientation: 'portrait'
      };
      break;
    default:
      pageSize = {
        width: 11906, // A4 default
        height: 16838,
        orientation: 'portrait'
      };
  }

  // 创建自定义段落样式（避免与导入的 firstLineChars 样式同名冲突，这里返回空数组）
  const createParagraphStyles = (contentSettings) => {
    return [];
  };

  // 额外注入OOXML样式，使Word以"字符"单位显示（w:firstLineChars）
  const createImportedIndentStyles = (contentSettings) => {
    const xmlComponents = [];

    const makeStyleXml = (styleId, name, firstLineChars) => `
      <w:style w:type="paragraph" w:styleId="${styleId}" xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:name w:val="${name}"/>
        <w:basedOn w:val="Normal"/>
        <w:uiPriority w:val="1"/>
        <w:qFormat/>
        <w:pPr>
          <w:ind w:firstLineChars="${firstLineChars}" w:firstLine="0"/>
        </w:pPr>
      </w:style>
    `;

    // 2字符 = 200；4字符 = 400；无缩进 = 0
    xmlComponents.push(ImportedXmlComponent.fromXmlString(makeStyleXml('paragraph-2-chars', '段落-首行缩进2字符', 200)));
    xmlComponents.push(ImportedXmlComponent.fromXmlString(makeStyleXml('paragraph-4-chars', '段落-首行缩进4字符', 400)));
    xmlComponents.push(ImportedXmlComponent.fromXmlString(makeStyleXml('paragraph-no-indent', '段落-无缩进', 0)));

    return xmlComponents;
  };

  // 创建文档
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "unordered-list",
          levels: [
            {
              level: 0,
              format: "bullet",
              text: "●", // 使用实心圆点，比普通圆点大
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) }
                },
                run: {
                  // 使用段落字体大小
                  size: Math.round(content.paragraph.fontSize * 2),
                  bold: true, // 加粗显示
                  font: { name: content.paragraph.fontFamily }
                }
              }
            },
            {
              level: 1,
              format: "bullet",
              text: "○", // 空心圆点
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.25) }
                },
                run: {
                  size: Math.round(content.paragraph.fontSize * 2),
                  bold: true,
                  font: { name: content.paragraph.fontFamily }
                }
              }
            },
            {
              level: 2,
              format: "bullet",
              text: "▪", // 使用较小的实心方块
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(0.25) }
                },
                run: {
                  size: Math.round(content.paragraph.fontSize * 2),
                  bold: true,
                  font: { name: content.paragraph.fontFamily }
                }
              }
            }
          ]
        },
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) }
                },
                run: {
                  // 数字标号使用段落字体大小和西文字体
                  size: Math.round(content.paragraph.fontSize * 2),
                  bold: content.paragraph.bold, // 跟随段落粗体设置
                  font: { name: latinSettings.enabled ? (latinSettings.fontFamily || 'Times New Roman') : content.paragraph.fontFamily }
                }
              }
            },
            {
              level: 1,
              format: "lowerLetter",
              text: "%2.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1.0), hanging: convertInchesToTwip(0.25) }
                },
                run: {
                  size: Math.round(content.paragraph.fontSize * 2),
                  bold: content.paragraph.bold,
                  font: { name: latinSettings.enabled ? (latinSettings.fontFamily || 'Times New Roman') : content.paragraph.fontFamily }
                }
              }
            },
            {
              level: 2,
              format: "lowerRoman",
              text: "%3.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(1.5), hanging: convertInchesToTwip(0.25) }
                },
                run: {
                  size: Math.round(content.paragraph.fontSize * 2),
                  bold: content.paragraph.bold,
                  font: { name: latinSettings.enabled ? (latinSettings.fontFamily || 'Times New Roman') : content.paragraph.fontFamily }
                }
              }
            }
          ]
        }
      ]
    },
    styles: {
      paragraphStyles: createParagraphStyles(content),
      importedStyles: createImportedIndentStyles(content)
    },
    customProperties: [
      {
        name: "首行缩进设置",
        value: `段落首行缩进：${content.paragraph.firstLineIndent}字符`
      },
      {
        name: "文档格式说明",
        value: "本文档使用MD2Word排版助手生成，段落首行缩进基于字符数计算"
      }
    ],
    sections: [
      {
        properties: {
          page: {
            margin: margins,
            size: pageSize
          }
        },
        children: parseTokensToDocxElements(tokens, content, latinSettings)
      }
    ]
  });
  
  // 调试：输出样式注入情况
  try {
    console.log('样式已注入（importedStyles）：paragraph-2-chars / paragraph-4-chars / paragraph-no-indent');
  } catch (_) {}

  return doc;
};

/**
 * 处理文本中的 OMML 公式标记
 * @param {string} text - 包含 OMML 标记的文本
 * @param {Array} ommlResults - OMML 转换结果
 * @returns {Array} 包含 TextRun 和 OMML 元素的数组
 */
const processOmmlInText = (text, ommlResults) => {
  if (!text || !ommlResults || ommlResults.length === 0) {
    return [new TextRun({ text: text || '' })];
  }
  
  console.log('[Export OMML] 处理文本中的 OMML 标记', {
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
        elements.push(new TextRun({ text: beforeText }));
      }
    }
    
    // 查找对应的 OMML 结果
    const ommlResult = ommlResults.find(result => result.id === formulaId);
    
    if (ommlResult && ommlResult.success && ommlResult.omml) {
      try {
        // 清理和验证 OMML XML
        let cleanOmml = ommlResult.omml.trim();
        
        // 确保 OMML 格式正确
        if (!cleanOmml.startsWith('<m:oMath')) {
          console.warn('[Export OMML] OMML 格式不正确，尝试包装:', cleanOmml.substring(0, 50));
          cleanOmml = `<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">${cleanOmml}</m:oMath>`;
        }
        
        // 验证 XML 命名空间
        if (!cleanOmml.includes('xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"')) {
          cleanOmml = cleanOmml.replace('<m:oMath', '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"');
        }
        
        console.log('[Export OMML] 准备创建 OMML 组件:', {
          formulaId,
          ommlLength: cleanOmml.length,
          ommlPreview: cleanOmml.substring(0, 100)
        });
        
        // 创建正确的 Word XML 结构来包装 OMML
        // 参考标准 Word 文档格式，OMML 应该直接嵌入，不需要额外包装
        const wordXmlMath = cleanOmml;
        
        console.log('[Export OMML] 生成的 Word XML:', {
          formulaId,
          xmlPreview: wordXmlMath.substring(0, 150)
        });
        
        // 暂时使用占位符文本，稍后通过后处理替换为真正的 OMML
        const placeholderText = `<!--OMML_PLACEHOLDER_${formulaId}-->`;
        elements.push(new TextRun({ text: placeholderText }));
        
        console.log('[Export OMML] 使用占位符，稍后后处理替换:', placeholderText);
        processedFormulas++;
        
        console.log('[Export OMML] OMML 公式已添加', {
          formulaId,
          latex: ommlResult.latex?.substring(0, 30) || 'unknown'
        });
      } catch (error) {
        console.error('[Export OMML] OMML 组件创建失败', {
          formulaId,
          error: error.message,
          ommlData: ommlResult.omml?.substring(0, 200)
        });
        
        // 失败时使用降级文本
        const fallbackText = ommlResult.latex || `[公式错误: ${formulaId}]`;
        elements.push(new TextRun({ text: fallbackText }));
      }
    } else {
      // 没有找到对应的 OMML 结果，使用降级文本
      const fallbackText = ommlResult?.fallbackText || `[公式: ${formulaId}]`;
      elements.push(new TextRun({ text: fallbackText }));
      
      console.warn('[Export OMML] OMML 结果未找到，使用降级文本', {
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
      elements.push(new TextRun({ text: remainingText }));
    }
  }
  
  console.log('[Export OMML] 文本 OMML 处理完成', {
    processedFormulas,
    totalElements: elements.length
  });
  
  // 如果没有找到任何标记，返回原始文本
  if (elements.length === 0) {
    return [new TextRun({ text: currentText })];
  }
  
  return elements;
};

// 全局变量存储当前导出的公式结果
let currentExportOmmlResults = [];

/**
 * 设置当前导出的 OMML 结果
 * @param {Array} ommlResults - OMML 转换结果数组
 */
const setCurrentOmmlResults = (ommlResults) => {
  currentExportOmmlResults = ommlResults || [];
  console.log('[Export OMML] 设置当前导出的 OMML 结果', {
    count: currentExportOmmlResults.length
  });
};

// 将tokens解析为Word文档元素
const parseTokensToDocxElements = (tokens, contentSettings, latinSettings) => {
  console.log(`开始解析 ${tokens.length} 个tokens为Word文档元素`);
  console.log('tokens类型统计:', tokens.reduce((acc, token) => {
    acc[token.type] = (acc[token.type] || 0) + 1;
    return acc;
  }, {}));
  
  const elements = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    switch (token.type) {
      case 'heading':
        elements.push(createHeading(token, contentSettings, latinSettings));
        break;
      case 'paragraph':
        elements.push(createParagraph(token, contentSettings.paragraph, latinSettings));
        break;
      case 'blockquote':
        elements.push(createBlockquote(token, contentSettings.quote, latinSettings));
        break;
      case 'code':
        console.log('处理代码块用于Word导出:', token.lang, token.text ? token.text.substring(0, 30) + '...' : '无内容');
        const codeElements = createCodeBlock(token, contentSettings.paragraph);
        console.log(`生成了 ${codeElements.length} 个代码块段落元素`);
        elements.push(...codeElements);
        break;
      case 'list':
        elements.push(...createList(token, contentSettings.paragraph, 0, latinSettings));
        break;
      case 'table':
        elements.push(createTable(token, contentSettings.paragraph, latinSettings));
        break;
      case 'hr':
        elements.push(createHorizontalRule());
        break;
      case 'image':
        elements.push(createImageElement(token));
        break;
      case 'html':
        // 处理HTML token，特别是OMML占位符
        if (token.text && token.text.includes('OMML_PLACEHOLDER_')) {
          console.log(`[OMML Debug] 处理HTML token中的占位符: ${token.text.trim()}`);
          // 创建包含占位符的段落，后续会被后处理替换
          const placeholderParagraph = new Paragraph({
            children: [new TextRun({ text: token.text.trim() })]
          });
          elements.push(placeholderParagraph);
        } else {
          console.warn(`未处理的HTML token: ${token.text?.substring(0, 50)}`);
        }
        break;
      default:
        console.warn(`未处理的token类型: ${token.type}`);
    }
  }
  
  console.log(`解析完成，共生成 ${elements.length} 个Word文档元素`);
  console.log('Word文档元素类型统计:', elements.reduce((acc, element) => {
    if (element && element.constructor) {
      const type = element.constructor.name;
      acc[type] = (acc[type] || 0) + 1;
    } else {
      acc['unknown'] = (acc['unknown'] || 0) + 1;
    }
    return acc;
  }, {}));
  
  return elements;
};

// 创建代码块
const createCodeBlock = (token, settings) => {
  // 分割代码行
  const codeLines = token.text.split('\n');
  
  // 行间距支持倍数和磅数
  let lineSpacingTwips, lineRule;
  if (settings.lineHeightUnit === 'pt') {
    lineSpacingTwips = Math.round(settings.lineHeight * 20);
    lineRule = 'exact';
  } else {
    lineSpacingTwips = Math.round(settings.lineHeight * 240);
    lineRule = 'auto';
  }
  
  // 创建代码块元素
  const codeElements = [];
  
  // 处理每一行代码
  codeLines.forEach((line, index) => {
    codeElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            font: { name: 'Courier New' }, // 使用等宽字体
            size: Math.round(settings.fontSize * 2),
            color: "000000"
          })
        ],
        spacing: {
          before: index === 0 ? 120 : 0,      // 6磅
          after: index === codeLines.length - 1 ? 120 : 0,  // 6磅
          line: lineSpacingTwips,
          lineRule
        },
        shading: {
          type: 'solid',
          color: 'F8F8F8', // 浅灰色背景
          fill: 'F8F8F8'
        },
        border: {
          // 只有第一行需要上边框，最后一行需要下边框
          top: index === 0 ? { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } : undefined,
          bottom: index === codeLines.length - 1 ? { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } : undefined,
          left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" }
        },
        indent: {
          left: convertInchesToTwip(0.25),
          right: convertInchesToTwip(0.25)
        }
      })
    );
  });
  
  // 如果代码块为空，添加一个空行
  if (codeElements.length === 0) {
    codeElements.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '',
            font: { name: 'Courier New' },
            size: Math.round(settings.fontSize * 2),
            color: "000000"
          })
        ],
        spacing: {
          before: 120,  // 6磅
          after: 120,   // 6磅
          line: lineSpacingTwips,
          lineRule
        },
        shading: {
          type: 'solid',
          color: 'F8F8F8',
          fill: 'F8F8F8'
        },
        border: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" }
        },
        indent: {
          left: convertInchesToTwip(0.25),
          right: convertInchesToTwip(0.25)
        }
      })
    );
  }
  
  return codeElements;
};

// 创建水平线
const createHorizontalRule = () => {
  return new Paragraph({
    children: [
      new TextRun({
        text: "",
      })
    ],
    spacing: {
      before: 240,
      after: 240,
    },
    border: {
      bottom: {
        color: "999999",
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
    // 确保水平线占据整个页面宽度
    alignment: AlignmentType.CENTER,
  });
};

// 创建标题
const createHeading = (token, contentSettings, latinSettings) => {
  const level = token.depth;
  const headingType = `heading${level}`;
  const settings = contentSettings[headingType];
  
  if (!settings) {
    console.warn(`找不到标题级别 ${level} 的设置，使用默认设置`);
    return new Paragraph({
      text: token.text,
      heading: getHeadingLevel(level),
      bold: true // 默认标题使用粗体
    });
  }
  
  // 处理标题内容
  const inlineTokens = parseInlineTokens(token.text, settings, true, latinSettings);
  
  // 段前/段后间距（Word中使用twip单位，1磅约等于20twip）
  const spacingBeforeTwips = settings.spacingBefore ? settings.spacingBefore * 20 : 0;
  const spacingAfterTwips = settings.spacingAfter ? settings.spacingAfter * 20 : 0;
  
  // 行间距支持倍数和磅数
  let lineSpacingTwips, lineRule;
  if (settings.lineHeightUnit === 'pt') {
    lineSpacingTwips = Math.round(settings.lineHeight * 20);
    lineRule = 'exact';
  } else {
    lineSpacingTwips = Math.round(settings.lineHeight * 240);
    lineRule = 'auto';
  }
  
  console.log(`标题${level}设置:`, {
    spacingBefore: settings.spacingBefore,
    spacingBeforeTwips,
    spacingAfter: settings.spacingAfter,
    spacingAfterTwips,
    lineHeight: settings.lineHeight,
    lineSpacingTwips,
    bold: settings.bold
  });
  
  // 创建标题段落，明确指定不使用斜体
  return new Paragraph({
    children: inlineTokens,
    heading: getHeadingLevel(level),
    alignment: convertAlignment(settings.align),
    spacing: {
      before: spacingBeforeTwips,
      after: spacingAfterTwips,
      line: lineSpacingTwips,
      lineRule
    }
  });
};

// 创建段落
const createParagraph = (token, settings, latinSettings) => {
  // 处理段落内容
  let inlineTokens;
  
  if (token.tokens) {
    // 如果有tokens数组，使用processTokensToTextRuns处理
    inlineTokens = processTokensToTextRuns(token.tokens, settings, false, latinSettings);
  } else if (token.text || token.raw) {
    // 否则使用parseInlineTokens处理文本
    inlineTokens = parseInlineTokens(String(token.text || token.raw || ''), settings, false, latinSettings);
  } else {
    inlineTokens = [new TextRun({ text: '' })];
  }
  
  // 使用新的首行缩进计算方法
  const firstLineIndentTwips = calculateFirstLineIndent(settings);
  
  // 段落间距（Word中使用twip单位，1磅约等于20twip）
  const spacingAfterTwips = settings.paragraphSpacing ? settings.paragraphSpacing * 20 : 0;
  
  // 行间距支持倍数和磅数
  let lineSpacingTwips, lineRule;
  if (settings.lineHeightUnit === 'pt') {
    lineSpacingTwips = Math.round(settings.lineHeight * 20);
    lineRule = 'exact';
  } else {
    lineSpacingTwips = Math.round(settings.lineHeight * 240);
    lineRule = 'auto';
  }
  
  console.log('段落设置:', {
    firstLineIndent: settings.firstLineIndent,
    firstLineIndentTwips,
    paragraphSpacing: settings.paragraphSpacing,
    spacingAfterTwips,
    lineHeight: settings.lineHeight,
    lineSpacingTwips,
    lineRule
  });
  
  // 根据首行缩进选择对应的样式
  const getParagraphStyleId = (firstLineIndent) => {
    switch (firstLineIndent) {
      case 0:
        return 'paragraph-no-indent';
      case 2:
        return 'paragraph-2-chars';
      case 4:
        return 'paragraph-4-chars';
      default:
        return undefined; // 其它数值时，不使用字符样式
    }
  };

  const chosenStyleId = getParagraphStyleId(settings.firstLineIndent);
  try {
    console.log('创建段落：' + JSON.stringify({
      chosenStyleId,
      firstLineIndent: settings.firstLineIndent,
      willSetIndentAtParagraphLevel: !chosenStyleId,
    }));
  } catch (_) {}

  // 创建段落
  return new Paragraph({
    children: inlineTokens,
    style: chosenStyleId,
    alignment: convertAlignment(settings.align),
    spacing: {
      before: 0,
      after: spacingAfterTwips,
      line: lineSpacingTwips,
      lineRule
    },
    // 使用字符样式时，不设置段落级 firstLine，避免覆盖样式中的 firstLineChars
    indent: chosenStyleId ? undefined : { firstLine: firstLineIndentTwips }
  });
};

// 创建引用块
const createBlockquote = (token, settings, latinSettings) => {
  // 转换对齐方式
  const alignment = convertAlignment(settings.align);

  // 行间距支持倍数和磅数
  let lineSpacingTwips, lineRule;
  if (settings.lineHeightUnit === 'pt') {
    lineSpacingTwips = Math.round(settings.lineHeight * 20);
    lineRule = 'exact';
  } else {
    lineSpacingTwips = Math.round(settings.lineHeight * 240);
    lineRule = 'auto';
  }
  
  // 确定引用内容
  let textRuns;
  
  if (token.tokens) {
    // 如果有tokens数组，使用processTokensToTextRuns处理
    textRuns = processTokensToTextRuns(token.tokens, settings, false, latinSettings);
  } else {
    // 确保token.text是字符串
    const textContent = String(token.text || token.raw || '');
    // 处理引用中的内联格式
    textRuns = parseInlineTokens(textContent, settings, false, latinSettings);
  }

  return new Paragraph({
    children: textRuns,
    alignment,
    spacing: {
      before: 120, // 6磅
      after: 120,  // 6磅
      line: lineSpacingTwips,
      lineRule
    },
    indent: {
      left: convertInchesToTwip(0.5)
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

// 创建列表
const createList = (token, settings, nestLevel = 0, latinSettings) => {
  const paragraphs = [];
  
  // 行间距支持倍数和磅数
  let lineSpacingTwips, lineRule;
  if (settings.lineHeightUnit === 'pt') {
    lineSpacingTwips = Math.round(settings.lineHeight * 20);
    lineRule = 'exact';
  } else {
    lineSpacingTwips = Math.round(settings.lineHeight * 240);
    lineRule = 'auto';
  }
  
  // 确定列表类型
  const isOrdered = token.ordered;
  
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
      // 处理所有嵌套内容
      item.tokens.forEach(token => {
        if (token.type === 'list') {
          // 递归处理嵌套列表，增加嵌套级别
          const nestedParagraphs = createList(token, settings, nestLevel + 1, latinSettings);
          paragraphs.push(...nestedParagraphs);
        } 
        else if (token.type === 'blockquote') {
          // 处理引用块，使用缩进来保持在列表项下方
          
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
          
          paragraphs.push(
            new Paragraph({
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
            })
          );
        }
        else if (token.type === 'code') {
          // 处理代码块
          const codeBlocks = createCodeBlock(token, settings);
          // 增加左缩进以对齐列表项
          codeBlocks.forEach(block => {
            const indentLevel = nestLevel + 1;
            const currentIndent = block.indent?.left || 0;
            block.indent = {
              ...block.indent,
              left: currentIndent + convertInchesToTwip(indentLevel * 0.5)
            };
          });
          paragraphs.push(...codeBlocks);
        }
        // 可以根据需要添加其他类型的嵌套内容处理
      });
    }
  });
  
  return paragraphs;
};

// 创建表格
const createTable = (token, settings, latinSettings) => {
  console.log('创建表格:', token);
  
  // 表格行
  const rows = [];
  
  // 添加表头
  if (token.header && token.header.length > 0) {
    console.log('表格表头:', token.header);
    
    const headerCells = token.header.map((headerCell, index) => {
      // 提取表头文本内容
      const cellContent = typeof headerCell === 'string' 
        ? headerCell 
        : (headerCell.text || '');
      
      console.log(`表头单元格 ${index}:`, cellContent);
      
      return new TableCell({
        children: [new Paragraph({
          children: [
            new TextRun({
              text: String(cellContent),
              bold: true,
              font: { name: settings.fontFamily },
              size: Math.round(settings.fontSize * 2)
            })
          ],
          alignment: convertAlignment(settings.align)
        })],
        shading: {
          fill: "F2F2F2"
        }
      });
    });
    
    rows.push(new TableRow({ children: headerCells }));
  }
  
  // 添加表格内容
  if (token.rows && token.rows.length > 0) {
    console.log('表格行数:', token.rows.length);
    
    token.rows.forEach((row, rowIndex) => {
      console.log(`表格行 ${rowIndex}:`, row);
      
      const cells = row.map((cell, cellIndex) => {
        // 提取单元格文本内容
        const cellContent = typeof cell === 'string' 
          ? cell 
          : (cell.text || '');
        
        console.log(`单元格 [${rowIndex},${cellIndex}]:`, cellContent);
        
        // 检查单元格内容是否包含格式标记
        const hasBold = cellContent.includes('**') || cellContent.includes('__');
        const hasItalic = cellContent.includes('*') || cellContent.includes('_');
        
        // 如果单元格包含tokens，尝试提取格式化内容
        let children;
        if (cell && cell.tokens && cell.tokens.length > 0) {
          // 处理单元格中的格式化内容
          children = processTokensToTextRuns(cell.tokens, settings, false, latinSettings);
        } else if (hasBold || hasItalic) {
          // 如果有格式标记，使用parseInlineTokens处理
          children = parseInlineTokens(cellContent, settings, false, latinSettings);
        } else {
          // 否则直接创建TextRun
          children = [
            new TextRun({
              text: String(cellContent),
              font: { name: settings.fontFamily },
              size: Math.round(settings.fontSize * 2),
              color: "000000" // 设置为黑色
            })
          ];
        }
        
        return new TableCell({
          children: [new Paragraph({
            children: children,
            alignment: convertAlignment(settings.align)
          })]
        });
      });
      
      rows.push(new TableRow({ children: cells }));
    });
  }
  
  // 创建表格
  return new Table({
    rows,
    width: {
      size: 100,
      type: WidthType.PERCENTAGE
    },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" }
    }
  });
};

// 处理tokens数组转换为TextRun数组，支持 OMML 公式标记
const processTokensToTextRuns = (tokens, settings, isHeading = false, latinSettings) => {
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
            console.log('[Export OMML] Token 文本包含 OMML 标记');
            const ommlElements = processOmmlInText(token.text, currentExportOmmlResults);
            textRuns.push(...ommlElements);
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

// 将一段文本按西文/数字与非西文拆分为多个 TextRun，同时处理 OMML 公式标记
const splitLatinRuns = (text, settings, isHeading, latinSettings, additionalStyles = {}) => {
  const result = [];
  const enableLatin = latinSettings && latinSettings.enabled;
  
  // 检查文本中是否包含 OMML 标记
  const ommlPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
  const hasOmmlMarkers = ommlPattern.test(text);
  
  if (hasOmmlMarkers) {
    console.log('[Export OMML] 文本包含 OMML 标记，使用专用处理');
    return processOmmlInText(text, currentExportOmmlResults);
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

// 解析内联格式，支持 OMML 公式标记
const parseInlineTokens = (text, settings, isHeading = false, latinSettings) => {
  // 确保text是字符串
  const textContent = String(text || '');
  console.log('处理内联格式:', textContent, isHeading ? '(标题)' : '');
  
  // 优先检查是否包含 OMML 标记
  const ommlPattern = /<!--OMML_PLACEHOLDER_[^-]+-->/g;
  if (ommlPattern.test(textContent)) {
    console.log('[Export OMML] 内联文本包含 OMML 标记，使用专用处理');
    return processOmmlInText(textContent, currentExportOmmlResults);
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

// 获取标题级别
const getHeadingLevel = (level) => {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    case 6:
      return HeadingLevel.HEADING_6;
    default:
      return HeadingLevel.HEADING_1;
  }
};

// 转换对齐方式
const convertAlignment = (align) => {
  switch (align) {
    case 'left':
      return AlignmentType.LEFT;
    case 'center':
      return AlignmentType.CENTER;
    case 'right':
      return AlignmentType.RIGHT;
    case 'justify':
      return AlignmentType.JUSTIFIED;
    default:
      return AlignmentType.LEFT;
  }
};

// 创建图片元素
const createImageElement = (token) => {
  try {
    console.log('创建图片元素:', token.text);
    
    // 将dataUrl转换为二进制数据
    const imageData = dataUriToUint8Array(token.dataUrl);
    
    // 计算合适的图片尺寸（以点为单位，1点=1/72英寸）
    const widthInPoints = token.width * 0.75; // 将像素转换为大致的点数
    const heightInPoints = token.height * 0.75;
    
    console.log('图片尺寸(points):', widthInPoints, heightInPoints);
    
    // 创建图片段落
    return new Paragraph({
      children: [
        new ImageRun({
          data: imageData,
          transformation: {
            width: widthInPoints,
            height: heightInPoints
          }
        })
      ],
      spacing: {
        before: 200,
        after: 200
      },
      alignment: AlignmentType.CENTER
    });
  } catch (error) {
    console.error('创建图片元素失败:', error, token);
    // 如果图片创建失败，返回一个包含图片描述的段落
    return new Paragraph({
      children: [
        new TextRun({ text: `[图片: ${token.text || '无法加载'}]`, italics: true })
      ],
      alignment: AlignmentType.CENTER
    });
  }
}; 