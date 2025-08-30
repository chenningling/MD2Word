import { Document, Paragraph, TextRun, ImportedXmlComponent, HeadingLevel, AlignmentType, convertInchesToTwip, BorderStyle, ThematicBreak } from 'docx';
import { calculatePageMargins, getPageSize, calculateLineSpacing, convertAlignment, getHeadingLevel, calculateFirstLineIndent } from '../utils/converters';
import { parseInlineTokens, processTokensToTextRuns } from '../utils/textUtils';
import { createTable } from '../processors/tableProcessor';
import { createList } from '../processors/listProcessor';
import { createImageElement } from '../processors/imageProcessor';

/**
 * Word文档构建核心模块
 * 负责创建Word文档和解析tokens为Word元素
 */

/**
 * 创建Word文档
 * @param {Array} tokens - 处理后的tokens
 * @param {Object} formatSettings - 格式设置
 * @returns {Document} Word文档对象
 */
export const createWordDocument = (tokens, formatSettings) => {
  const { content, page, latin } = formatSettings;
  const latinSettings = latin || { enabled: false, fontFamily: 'Times New Roman' };
  
  console.log('[Document Builder] 开始创建Word文档...');
  console.log('[Document Builder] 格式设置:', { content: Object.keys(content), page, latin });
  
  // 设置页面边距和大小
  const margins = calculatePageMargins(page.margin);
  const pageSize = getPageSize(page.size);
  
  console.log('[Document Builder] 页面设置:', { margins, pageSize });

  // 创建文档
  const doc = new Document({
    numbering: createNumberingConfig(content, latinSettings),
    styles: {
      paragraphStyles: [], // 避免与导入的样式冲突
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
  
  console.log('[Document Builder] Word文档创建完成');
  console.log('[Document Builder] 样式已注入：paragraph-2-chars / paragraph-4-chars / paragraph-no-indent');

  return doc;
};

/**
 * 创建编号配置
 * @param {Object} content - 内容设置
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Object} 编号配置
 */
const createNumberingConfig = (content, latinSettings) => {
  return {
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
  };
};

/**
 * 创建导入的缩进样式
 * @param {Object} contentSettings - 内容设置
 * @returns {Array} 导入的样式组件
 */
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

/**
 * 将tokens解析为Word文档元素
 * @param {Array} tokens - tokens数组
 * @param {Object} contentSettings - 内容设置
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Array} Word文档元素数组
 */
const parseTokensToDocxElements = (tokens, contentSettings, latinSettings) => {
  console.log(`[Document Builder] 开始解析 ${tokens.length} 个tokens为Word文档元素`);
  console.log('[Document Builder] tokens类型统计:', tokens.reduce((acc, token) => {
    acc[token.type] = (acc[token.type] || 0) + 1;
    return acc;
  }, {}));
  
  const elements = [];
  
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    
    try {
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
          console.log('[Document Builder] 处理代码块用于Word导出:', token.lang, token.text ? token.text.substring(0, 30) + '...' : '无内容');
          const codeElements = createCodeBlock(token, contentSettings.paragraph);
          console.log(`[Document Builder] 生成了 ${codeElements.length} 个代码块段落元素`);
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
            console.log(`[Document Builder] 处理HTML token中的占位符: ${token.text.trim()}`);
            // 创建包含占位符的段落，后续会被后处理替换
            const placeholderParagraph = new Paragraph({
              children: [new TextRun({ text: token.text.trim() })]
            });
            elements.push(placeholderParagraph);
          } else {
            console.warn(`[Document Builder] 未处理的HTML token: ${token.text?.substring(0, 50)}`);
          }
          break;
        default:
          console.warn(`[Document Builder] 未处理的token类型: ${token.type}`);
      }
    } catch (error) {
      console.error(`[Document Builder] 处理token时发生错误:`, {
        tokenType: token.type,
        tokenIndex: i,
        error: error.message
      });
      // 创建一个错误占位符段落
      elements.push(new Paragraph({
        children: [new TextRun({ text: `[处理错误: ${token.type}]`, color: "FF0000" })]
      }));
    }
  }
  
  console.log(`[Document Builder] 解析完成，共生成 ${elements.length} 个Word文档元素`);
  console.log('[Document Builder] Word文档元素类型统计:', elements.reduce((acc, element) => {
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

/**
 * 创建标题
 * @param {Object} token - 标题token
 * @param {Object} contentSettings - 内容设置
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Paragraph} 标题段落
 */
const createHeading = (token, contentSettings, latinSettings) => {
  const level = token.depth;
  const headingType = `heading${level}`;
  const settings = contentSettings[headingType];
  
  if (!settings) {
    console.warn(`[Document Builder] 找不到标题级别 ${level} 的设置，使用默认设置`);
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
  const { lineSpacingTwips, lineRule } = calculateLineSpacing(settings);
  
  console.log(`[Document Builder] 标题${level}设置:`, {
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

/**
 * 创建段落
 * @param {Object} token - 段落token
 * @param {Object} settings - 段落设置
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Paragraph} 段落对象
 */
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
  const { lineSpacingTwips, lineRule } = calculateLineSpacing(settings);
  
  console.log('[Document Builder] 段落设置:', {
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
  console.log('[Document Builder] 创建段落：', {
    chosenStyleId,
    firstLineIndent: settings.firstLineIndent,
    willSetIndentAtParagraphLevel: !chosenStyleId,
  });

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

/**
 * 创建引用块
 * @param {Object} token - 引用token
 * @param {Object} settings - 引用设置
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Paragraph} 引用段落
 */
const createBlockquote = (token, settings, latinSettings) => {
  // 转换对齐方式
  const alignment = convertAlignment(settings.align);

  // 行间距支持倍数和磅数
  const { lineSpacingTwips, lineRule } = calculateLineSpacing(settings);
  
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

/**
 * 创建代码块
 * @param {Object} token - 代码token
 * @param {Object} settings - 段落设置
 * @returns {Array} 代码段落数组
 */
const createCodeBlock = (token, settings) => {
  // 分割代码行
  const codeLines = token.text.split('\n');
  
  // 行间距支持倍数和磅数
  const { lineSpacingTwips, lineRule } = calculateLineSpacing(settings);
  
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

/**
 * 创建水平线
 * @returns {Paragraph} 水平线段落
 */
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
