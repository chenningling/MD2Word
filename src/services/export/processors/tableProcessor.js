import { Table, TableRow, TableCell, Paragraph, TextRun, WidthType, BorderStyle } from 'docx';
import { processTokensToTextRuns, parseInlineTokens } from '../utils/textUtils';
import { convertAlignment } from '../utils/converters';

/**
 * 表格处理模块
 * 负责表格的创建和格式化
 */

/**
 * 创建表格
 * @param {Object} token - 表格token
 * @param {Object} settings - 段落设置
 * @param {Object} latinSettings - 西文字体设置
 * @returns {Table} Word表格
 */
export const createTable = (token, settings, latinSettings) => {
  console.log('[Table Processor] 创建表格:', token);
  
  // 表格行
  const rows = [];
  
  // 添加表头
  if (token.header && token.header.length > 0) {
    console.log('[Table Processor] 表格表头:', token.header);
    
    const headerCells = token.header.map((headerCell, index) => {
      // 提取表头文本内容
      const cellContent = typeof headerCell === 'string' 
        ? headerCell 
        : (headerCell.text || '');
      
      console.log(`[Table Processor] 表头单元格 ${index}:`, cellContent);
      
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
    console.log('[Table Processor] 表格行数:', token.rows.length);
    
    token.rows.forEach((row, rowIndex) => {
      console.log(`[Table Processor] 表格行 ${rowIndex}:`, row);
      
      const cells = row.map((cell, cellIndex) => {
        // 提取单元格文本内容
        const cellContent = typeof cell === 'string' 
          ? cell 
          : (cell.text || '');
        
        console.log(`[Table Processor] 单元格 [${rowIndex},${cellIndex}]:`, cellContent);
        
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

/**
 * 验证表格结构
 * @param {Object} token - 表格token
 * @returns {Object} 验证结果
 */
export const validateTableStructure = (token) => {
  const issues = [];
  
  // 检查表头
  if (!token.header || token.header.length === 0) {
    issues.push('表格缺少表头');
  }
  
  // 检查行数据
  if (!token.rows || token.rows.length === 0) {
    issues.push('表格缺少数据行');
  }
  
  // 检查列数一致性
  if (token.header && token.rows) {
    const headerColumnCount = token.header.length;
    const inconsistentRows = token.rows.filter((row, index) => {
      const rowColumnCount = row.length;
      if (rowColumnCount !== headerColumnCount) {
        issues.push(`第${index + 1}行列数(${rowColumnCount})与表头列数(${headerColumnCount})不匹配`);
        return true;
      }
      return false;
    });
    
    if (inconsistentRows.length > 0) {
      issues.push(`${inconsistentRows.length}行存在列数不匹配问题`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    headerColumnCount: token.header?.length || 0,
    dataRowCount: token.rows?.length || 0
  };
};

/**
 * 优化表格性能
 * @param {Object} token - 表格token
 * @returns {Object} 优化后的表格token
 */
export const optimizeTableToken = (token) => {
  // 克隆token避免修改原始数据
  const optimizedToken = JSON.parse(JSON.stringify(token));
  
  // 清理空白单元格
  if (optimizedToken.rows) {
    optimizedToken.rows = optimizedToken.rows.map(row => 
      row.map(cell => {
        if (typeof cell === 'string') {
          return cell.trim();
        } else if (cell && cell.text) {
          return { ...cell, text: cell.text.trim() };
        }
        return cell;
      })
    );
  }
  
  // 清理表头
  if (optimizedToken.header) {
    optimizedToken.header = optimizedToken.header.map(headerCell => {
      if (typeof headerCell === 'string') {
        return headerCell.trim();
      } else if (headerCell && headerCell.text) {
        return { ...headerCell, text: headerCell.text.trim() };
      }
      return headerCell;
    });
  }
  
  return optimizedToken;
};

/**
 * 计算表格复杂度
 * @param {Object} token - 表格token
 * @returns {Object} 复杂度信息
 */
export const calculateTableComplexity = (token) => {
  const headerCount = token.header?.length || 0;
  const rowCount = token.rows?.length || 0;
  const totalCells = headerCount + (rowCount * headerCount);
  
  // 检查是否有格式化内容
  let hasFormattedContent = false;
  let hasImages = false;
  let hasLinks = false;
  
  if (token.rows) {
    for (const row of token.rows) {
      for (const cell of row) {
        if (cell && cell.tokens) {
          hasFormattedContent = true;
          
          // 检查特殊内容类型
          const hasImageTokens = cell.tokens.some(t => t.type === 'image');
          const hasLinkTokens = cell.tokens.some(t => t.type === 'link');
          
          if (hasImageTokens) hasImages = true;
          if (hasLinkTokens) hasLinks = true;
        }
      }
    }
  }
  
  // 计算复杂度评分
  let complexityScore = 0;
  if (totalCells > 50) complexityScore += 2;
  else if (totalCells > 20) complexityScore += 1;
  
  if (hasFormattedContent) complexityScore += 1;
  if (hasImages) complexityScore += 2;
  if (hasLinks) complexityScore += 1;
  
  const complexityLevel = complexityScore >= 4 ? 'high' : 
                         complexityScore >= 2 ? 'medium' : 'low';
  
  return {
    headerCount,
    rowCount,
    totalCells,
    hasFormattedContent,
    hasImages,
    hasLinks,
    complexityScore,
    complexityLevel
  };
};
