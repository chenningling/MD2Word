import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, convertInchesToTwip, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
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
    
    // 检查表格内容
    const tableTokes = tokens.filter(token => token.type === 'table');
    if (tableTokes.length > 0) {
      console.log('表格内容:', JSON.stringify(tableTokes, null, 2));
    }

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
        elements.push(createTable(token, contentSettings.paragraph));
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

  // 处理标题中可能的内联格式
  const textRuns = parseInlineTokens(token.text, {
    ...settings,
    bold: settings.bold // 保持标题的粗体设置
  });
  
  // 确保所有TextRun都设置了黑色
  textRuns.forEach(run => {
    run.color = "000000"; // 设置为黑色
  });

  return new Paragraph({
    children: textRuns,
    heading: getHeadingLevel(level),
    alignment,
    spacing: {
      after: 200,
      line: Math.round(settings.lineHeight * 240)
    }
  });
};

// 创建段落
const createParagraph = (token, settings) => {
  // 转换对齐方式
  const alignment = convertAlignment(settings.align);

  // 确保token.text是字符串
  const textContent = String(token.text || token.raw || '');

  // 处理段落中的内联格式
  const textRuns = parseInlineTokens(textContent, settings);

  return new Paragraph({
    children: textRuns,
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

  // 确保token.text是字符串
  const textContent = String(token.text || '');

  // 处理引用中的内联格式
  const textRuns = parseInlineTokens(textContent, settings);

  return new Paragraph({
    children: textRuns,
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
    
    // 确保item.text是字符串
    const itemText = String(item.text || '');
    
    // 处理列表项中的内联格式
    const textContent = prefix + itemText;
    const textRuns = parseInlineTokens(textContent, settings);
    
    paragraphs.push(
      new Paragraph({
        children: textRuns,
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
const processTokensToTextRuns = (tokens, settings) => {
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
            color: "000000" // 设置为黑色
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
      case 'text':
      default:
        if (token.text) {
          textRuns.push(
            new TextRun({
              text: token.text,
              font: { name: settings.fontFamily },
              size: Math.round(settings.fontSize * 2),
              color: "000000" // 设置为黑色
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
        color: "000000" // 设置为黑色
      })
    );
  }
  
  return textRuns;
};

// 解析内联格式
const parseInlineTokens = (text, settings) => {
  // 确保text是字符串
  const textContent = String(text || '');
  console.log('处理内联格式:', textContent);
  
  // 简化处理方式，直接使用正则表达式查找和替换
  const textRuns = [];
  
  // 处理简单的内联格式
  // 先将文本按照格式标记分割成多个部分
  const segments = [];
  let currentText = textContent;
  let lastIndex = 0;
  
  // 查找所有的粗体和斜体标记
  const regex = /(\*\*.*?\*\*)|(__.*?__)|(\*.*?\*)|(_.*?_)/g;
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
    
    // 判断是粗体还是斜体
    if (matchedText.startsWith('**') || matchedText.startsWith('__')) {
      // 粗体
      const content = matchedText.substring(2, matchedText.length - 2);
      segments.push({
        type: 'bold',
        text: content
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
            color: "000000" // 设置为黑色
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
      case 'normal':
      default:
        if (segment.text.trim()) {
          textRuns.push(
            new TextRun({
              text: segment.text,
              font: { name: settings.fontFamily },
              size: Math.round(settings.fontSize * 2),
              bold: settings.bold,
              color: "000000" // 设置为黑色
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
        bold: settings.bold
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