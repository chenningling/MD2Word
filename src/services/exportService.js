import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';
import { marked } from 'marked';

// 将Markdown转换为Word文档
export const exportToWord = async (markdown, formatSettings) => {
  try {
    console.log('开始导出Word文档...');
    console.log('格式设置:', formatSettings);

    // 解析Markdown为HTML
    const tokens = marked.lexer(markdown);
    console.log('解析的Markdown tokens:', tokens);

    // 创建Word文档
    const doc = createWordDocument(tokens, formatSettings);

    // 导出文档
    const buffer = await Packer.toBlob(doc);
    saveAs(buffer, 'markdown-document.docx');
    console.log('Word文档导出成功!');
  } catch (error) {
    console.error('导出Word文档时发生错误:', error);
    alert('导出失败，请查看控制台获取详细信息。');
  }
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

  // 创建文档
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: margins,
            size: {
              orientation: 'portrait'
            }
          }
        },
        children: parseTokensToDocxElements(tokens, content)
      }
    ]
  });

  return doc;
};

// 将Markdown tokens转换为docx元素
const parseTokensToDocxElements = (tokens, contentSettings) => {
  const elements = [];

  for (const token of tokens) {
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
      case 'list':
        elements.push(...createList(token, contentSettings.paragraph));
        break;
      case 'table':
        // 表格处理比较复杂，暂时简化处理
        elements.push(createParagraph({ text: '表格内容 (暂不支持完整表格渲染)' }, contentSettings.paragraph));
        break;
      case 'space':
        elements.push(new Paragraph({}));
        break;
      default:
        console.log('未处理的token类型:', token.type);
        break;
    }
  }

  return elements;
};

// 创建标题
const createHeading = (token, contentSettings) => {
  const level = token.depth;
  let settings;

  // 根据标题级别选择对应的设置
  switch (level) {
    case 1:
      settings = contentSettings.heading1;
      break;
    case 2:
      settings = contentSettings.heading2;
      break;
    case 3:
    default:
      settings = contentSettings.heading3;
      break;
  }

  // 转换对齐方式
  const alignment = convertAlignment(settings.align);

  return new Paragraph({
    text: token.text,
    heading: getHeadingLevel(level),
    alignment,
    spacing: {
      after: 200,
      line: Math.round(settings.lineHeight * 240)
    },
    font: {
      name: settings.fontFamily
    },
    size: Math.round(settings.fontSize * 2), // docx中字号是磅值的两倍
    bold: settings.bold
  });
};

// 创建段落
const createParagraph = (token, settings) => {
  // 转换对齐方式
  const alignment = convertAlignment(settings.align);

  return new Paragraph({
    children: [
      new TextRun({
        text: token.text || token.raw,
        font: {
          name: settings.fontFamily
        },
        size: Math.round(settings.fontSize * 2),
        bold: settings.bold
      })
    ],
    alignment,
    spacing: {
      after: 200,
      line: Math.round(settings.lineHeight * 240)
    }
  });
};

// 创建引用块
const createBlockquote = (token, settings) => {
  // 转换对齐方式
  const alignment = convertAlignment(settings.align);

  return new Paragraph({
    children: [
      new TextRun({
        text: token.text,
        font: {
          name: settings.fontFamily
        },
        size: Math.round(settings.fontSize * 2),
        bold: settings.bold,
        italics: true
      })
    ],
    alignment,
    spacing: {
      after: 200,
      line: Math.round(settings.lineHeight * 240)
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
const createList = (token, settings) => {
  const paragraphs = [];
  
  token.items.forEach((item, index) => {
    const prefix = token.ordered ? `${index + 1}. ` : '• ';
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: prefix + item.text,
            font: {
              name: settings.fontFamily
            },
            size: Math.round(settings.fontSize * 2),
            bold: settings.bold
          })
        ],
        spacing: {
          after: 100,
          line: Math.round(settings.lineHeight * 240)
        },
        indent: {
          left: convertInchesToTwip(0.25)
        }
      })
    );
  });
  
  return paragraphs;
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
    default:
      return HeadingLevel.HEADING_6;
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