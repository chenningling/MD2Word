import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, Table, TableRow, TableCell, WidthType, BorderStyle, HorizontalPositionAlign, HorizontalPositionRelativeFrom, ThematicBreak, Shading, ExternalHyperlink, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { marked } from 'marked';
import { dataUriToUint8Array, downloadImage, isImageUrl } from '../utils/imageUtils';
import axios from 'axios';

// 将Markdown转换为Word文档
export const exportToWord = async (markdown, formatSettings) => {
  try {
    console.log('开始导出Word文档...');
    console.log('格式设置:', formatSettings);

    // 解析Markdown为tokens
    const tokens = marked.lexer(markdown);
    console.log('解析的Markdown tokens:', tokens);
    
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

    // 创建Word文档
    const doc = createWordDocument(processedTokens, formatSettings);

    // 导出文档
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, 'markdown-document.docx');
    console.log('Word文档导出成功!');
  } catch (error) {
    console.error('导出Word文档时发生错误:', error);
    alert('导出失败，请查看控制台获取详细信息。');
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
  const { content, page } = formatSettings;
  
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
                  // 增大字体大小，使圆点更大
                  size: 24, // 12pt字体大小的2倍
                  bold: true // 加粗显示
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
                  size: 20, // 比一级列表小一些，但不要太小
                  bold: true
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
                  size: 18, // 比二级列表再小一些
                  bold: true
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
                  // 增大字体大小，使数字更明显
                  size: 22, // 11pt字体大小的2倍
                  bold: true // 加粗显示
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
                  size: 20, // 略小于一级列表
                  bold: true
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
                  size: 18, // 略小于二级列表
                  bold: true
                }
              }
            }
          ]
        }
      ]
    },
    sections: [
      {
        properties: {
          page: {
            margin: margins,
            size: pageSize
          }
        },
        children: parseTokensToDocxElements(tokens, content)
      }
    ]
  });

  return doc;
};

// 将tokens解析为Word文档元素
const parseTokensToDocxElements = (tokens, contentSettings) => {
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
        elements.push(createHeading(token, contentSettings));
        break;
      case 'paragraph':
        elements.push(createParagraph(token, contentSettings.paragraph));
        break;
      case 'blockquote':
        elements.push(createBlockquote(token, contentSettings.quote));
        break;
      case 'code':
        console.log('处理代码块用于Word导出:', token.lang, token.text ? token.text.substring(0, 30) + '...' : '无内容');
        const codeElements = createCodeBlock(token, contentSettings.paragraph);
        console.log(`生成了 ${codeElements.length} 个代码块段落元素`);
        elements.push(...codeElements);
        break;
      case 'list':
        elements.push(...createList(token, contentSettings.paragraph));
        break;
      case 'table':
        elements.push(createTable(token, contentSettings.paragraph));
        break;
      case 'hr':
        elements.push(createHorizontalRule());
        break;
      case 'image':
        elements.push(createImageElement(token));
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
  console.log('创建代码块, token:', JSON.stringify({
    type: token.type,
    lang: token.lang,
    text: token.text ? (token.text.length > 50 ? token.text.substring(0, 50) + '...' : token.text) : '无内容'
  }));
  
  const codeText = token.text || '';
  // 按换行符分割代码文本
  const codeLines = codeText.split('\n');
  console.log(`代码块有 ${codeLines.length} 行`);
  
  // 创建代码块容器
  const codeElements = [];
  
  // 行间距（Word中使用240为单倍行距的基准）
  const lineSpacingTwips = Math.round(settings.lineHeight * 240);
  
  // 为每一行代码创建单独的段落
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
          // 只有第一行需要上边距，最后一行需要下边距
          before: index === 0 ? 120 : 0,      // 6磅
          after: index === codeLines.length - 1 ? 120 : 0,  // 6磅
          line: lineSpacingTwips,
          lineRule: 'exact'
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
          lineRule: 'exact'
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
const createHeading = (token, contentSettings) => {
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
  // 传递一个明确的标志，表示这是标题内容
  const inlineTokens = parseInlineTokens(token.text, settings, true);
  
  // 段前/段后间距（Word中使用twip单位，1磅约等于20twip）
  const spacingBeforeTwips = settings.spacingBefore ? settings.spacingBefore * 20 : 0;
  const spacingAfterTwips = settings.spacingAfter ? settings.spacingAfter * 20 : 0;
  
  // 行间距（Word中使用240为单倍行距的基准）
  const lineSpacingTwips = Math.round(settings.lineHeight * 240);
  
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
      lineRule: 'exact' // 使用确切的行间距，而不是最小值
    }
  });
};

// 创建段落
const createParagraph = (token, settings) => {
  // 处理段落内容
  let inlineTokens;
  
  if (token.tokens) {
    // 如果有tokens数组，使用processTokensToTextRuns处理
    inlineTokens = processTokensToTextRuns(token.tokens, settings);
  } else if (token.text || token.raw) {
    // 否则使用parseInlineTokens处理文本
    inlineTokens = parseInlineTokens(String(token.text || token.raw || ''), settings);
  } else {
    inlineTokens = [new TextRun({ text: '' })];
  }
  
  // 计算首行缩进值（Word中使用twip单位，1字符约等于120twip）
  // 中文字符宽度约为英文的2倍，所以乘以240
  const firstLineIndentTwips = settings.firstLineIndent ? settings.firstLineIndent * 240 : 0;
  
  // 段落间距（Word中使用twip单位，1磅约等于20twip）
  const spacingAfterTwips = settings.paragraphSpacing ? settings.paragraphSpacing * 20 : 0;
  
  // 行间距（Word中使用240为单倍行距的基准）
  const lineSpacingTwips = Math.round(settings.lineHeight * 240);
  
  console.log('段落设置:', {
    firstLineIndent: settings.firstLineIndent,
    firstLineIndentTwips,
    paragraphSpacing: settings.paragraphSpacing,
    spacingAfterTwips,
    lineHeight: settings.lineHeight,
    lineSpacingTwips
  });
  
  // 创建段落
  return new Paragraph({
    children: inlineTokens,
    alignment: convertAlignment(settings.align),
    spacing: {
      before: 0,
      after: spacingAfterTwips,
      line: lineSpacingTwips,
      lineRule: 'exact' // 使用确切的行间距，而不是最小值
    },
    indent: {
      firstLine: firstLineIndentTwips
    }
  });
};

// 创建引用块
const createBlockquote = (token, settings) => {
  // 转换对齐方式
  const alignment = convertAlignment(settings.align);

  // 行间距（Word中使用240为单倍行距的基准）
  const lineSpacingTwips = Math.round(settings.lineHeight * 240);
  
  // 确定引用内容
  let textRuns;
  
  if (token.tokens) {
    // 如果有tokens数组，使用processTokensToTextRuns处理
    textRuns = processTokensToTextRuns(token.tokens, settings);
  } else {
    // 确保token.text是字符串
    const textContent = String(token.text || token.raw || '');
    // 处理引用中的内联格式
    textRuns = parseInlineTokens(textContent, settings);
  }

  return new Paragraph({
    children: textRuns,
    alignment,
    spacing: {
      before: 120, // 6磅
      after: 120,  // 6磅
      line: lineSpacingTwips,
      lineRule: 'exact'
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
const createList = (token, settings, nestLevel = 0) => {
  const paragraphs = [];
  
  // 行间距（Word中使用240为单倍行距的基准）
  const lineSpacingTwips = Math.round(settings.lineHeight * 240);
  
  // 确定列表类型
  const isOrdered = token.ordered;
  
  // 处理列表项
  token.items.forEach((item, index) => {
    // 确保item.text是字符串
    const itemText = String(item.text || '');
    
    // 处理列表项中的内联格式，不再添加前缀，让Word自动处理
    const textRuns = parseInlineTokens(itemText, settings);
    
          // 创建带有正确列表格式的段落
      paragraphs.push(
        new Paragraph({
          children: textRuns,
          spacing: {
            before: 40,  // 2磅
            after: 40,   // 2磅
            line: lineSpacingTwips,
            lineRule: 'exact'
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
          const nestedParagraphs = createList(token, settings, nestLevel + 1);
          paragraphs.push(...nestedParagraphs);
        } 
        else if (token.type === 'blockquote') {
          // 处理引用块，使用缩进来保持在列表项下方
          
          // 确定引用内容
          let textRuns;
          
          if (token.tokens) {
            // 如果有tokens数组，使用processTokensToTextRuns处理
            textRuns = processTokensToTextRuns(token.tokens, settings);
          } else {
            // 确保token.text是字符串
            const quoteText = String(token.text || token.raw || '');
            // 处理引用中的内联格式
            textRuns = parseInlineTokens(quoteText, settings);
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
                lineRule: 'exact'
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
const createTable = (token, settings) => {
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
          children = processTokensToTextRuns(cell.tokens, settings);
        } else if (hasBold || hasItalic) {
          // 如果有格式标记，使用parseInlineTokens处理
          children = parseInlineTokens(cellContent, settings);
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

// 处理tokens数组转换为TextRun数组
const processTokensToTextRuns = (tokens, settings, isHeading = false) => {
  const textRuns = [];
  
  tokens.forEach(token => {
    switch (token.type) {
      case 'strong':
        textRuns.push(
          new TextRun({
            text: token.text,
            bold: true,
            font: { name: settings.fontFamily },
            size: Math.round(settings.fontSize * 2),
            color: "000000", // 设置为黑色
            italics: false // 确保不使用斜体
          })
        );
        break;
      case 'em':
        textRuns.push(
          new TextRun({
            text: token.text,
            italics: true,
            font: { name: settings.fontFamily },
            size: Math.round(settings.fontSize * 2),
            color: "000000" // 设置为黑色
          })
        );
        break;
      case 'del':
        textRuns.push(
          new TextRun({
            text: token.text,
            strike: true,
            font: { name: settings.fontFamily },
            size: Math.round(settings.fontSize * 2),
            color: "000000" // 设置为黑色
          })
        );
        break;
      case 'link':
        textRuns.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: token.text,
                style: "Hyperlink",
                font: { name: settings.fontFamily },
                size: Math.round(settings.fontSize * 2),
                bold: isHeading ? settings.bold : undefined, // 如果是标题，应用粗体设置
                italics: false // 确保不使用斜体
              })
            ],
            link: token.href
          })
        );
        break;
      case 'codespan':
        textRuns.push(
          new TextRun({
            text: token.text,
            font: { name: 'Courier New' },
            size: Math.round(settings.fontSize * 2),
            color: "000000", // 设置为黑色
            shading: { 
              fill: "F0F0F0" // 浅灰色背景
            },
            italics: false // 确保不使用斜体
          })
        );
        break;
      case 'text':
      default:
        if (token.text) {
          textRuns.push(
            new TextRun({
              text: token.text,
              font: { name: settings.fontFamily },
              size: Math.round(settings.fontSize * 2),
              // 如果是标题或者设置了粗体，则使用粗体
              bold: isHeading ? settings.bold : settings.bold,
              color: "000000", // 设置为黑色
              italics: false // 如果是标题，确保不使用斜体
            })
          );
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

// 解析内联格式
const parseInlineTokens = (text, settings, isHeading = false) => {
  // 确保text是字符串
  const textContent = String(text || '');
  console.log('处理内联格式:', textContent, isHeading ? '(标题)' : '');
  
  // 使用marked解析内联标记
  const inlineTokens = marked.lexer(textContent, { gfm: true });
  
  // 如果解析成功并且包含内联标记，使用processTokensToTextRuns处理
  if (inlineTokens && inlineTokens.length > 0 && inlineTokens[0].type === 'paragraph' && inlineTokens[0].tokens) {
    return processTokensToTextRuns(inlineTokens[0].tokens, settings, isHeading);
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
        textRuns.push(
          new TextRun({
            text: segment.text,
            bold: true,
            font: { name: settings.fontFamily },
            size: Math.round(settings.fontSize * 2),
            color: "000000", // 设置为黑色
            italics: false // 确保不使用斜体
          })
        );
        break;
      case 'italic':
        textRuns.push(
          new TextRun({
            text: segment.text,
            italics: true,
            font: { name: settings.fontFamily },
            size: Math.round(settings.fontSize * 2),
            color: "000000" // 设置为黑色
          })
        );
        break;
      case 'strike':
        textRuns.push(
          new TextRun({
            text: segment.text,
            strike: true,
            font: { name: settings.fontFamily },
            size: Math.round(settings.fontSize * 2),
            color: "000000" // 设置为黑色
          })
        );
        break;
      case 'code':
        textRuns.push(
          new TextRun({
            text: segment.text,
            font: { name: 'Courier New' },
            size: Math.round(settings.fontSize * 2),
            color: "000000", // 设置为黑色
            shading: { 
              fill: "F0F0F0" // 浅灰色背景
            },
            italics: false // 确保不使用斜体
          })
        );
        break;
      case 'link':
        textRuns.push(
          new ExternalHyperlink({
            children: [
              new TextRun({
                text: segment.text,
                style: "Hyperlink",
                font: { name: settings.fontFamily },
                size: Math.round(settings.fontSize * 2),
                bold: isHeading ? settings.bold : undefined, // 如果是标题，应用粗体设置
                italics: false // 确保不使用斜体
              })
            ],
            link: segment.url
          })
        );
        break;
      case 'normal':
      default:
        if (segment.text.trim()) {
          textRuns.push(
            new TextRun({
              text: segment.text,
              font: { name: settings.fontFamily },
              size: Math.round(settings.fontSize * 2),
              // 如果是标题或者设置了粗体，则使用粗体
              bold: isHeading ? settings.bold : settings.bold,
              color: "000000", // 设置为黑色
              italics: false // 如果是标题，确保不使用斜体
            })
          );
        }
        break;
    }
  });
  
  // 如果没有生成任何TextRun，添加一个包含原始文本的TextRun
  if (textRuns.length === 0) {
    textRuns.push(
      new TextRun({
        text: textContent,
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