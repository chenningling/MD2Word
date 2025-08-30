import { convertInchesToTwip, HeadingLevel, AlignmentType } from 'docx';

/**
 * 格式转换工具模块
 * 提供各种格式转换功能
 */

/**
 * 计算首行缩进的辅助函数
 * @param {Object} settings - 段落设置
 * @returns {number} 首行缩进的twip值
 */
export const calculateFirstLineIndent = (settings) => {
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

/**
 * 获取标题级别
 * @param {number} level - 标题级别 (1-6)
 * @returns {HeadingLevel} Word标题级别
 */
export const getHeadingLevel = (level) => {
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

/**
 * 转换对齐方式
 * @param {string} align - 对齐方式字符串
 * @returns {AlignmentType} Word对齐类型
 */
export const convertAlignment = (align) => {
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

/**
 * 计算行间距
 * @param {Object} settings - 段落设置
 * @returns {Object} 行间距设置 {lineSpacingTwips, lineRule}
 */
export const calculateLineSpacing = (settings) => {
  let lineSpacingTwips, lineRule;
  if (settings.lineHeightUnit === 'pt') {
    lineSpacingTwips = Math.round(settings.lineHeight * 20);
    lineRule = 'exact';
  } else {
    lineSpacingTwips = Math.round(settings.lineHeight * 240);
    lineRule = 'auto';
  }
  return { lineSpacingTwips, lineRule };
};

/**
 * 计算页面边距（将厘米转换为twip）
 * @param {Object} pageMargin - 页面边距设置
 * @returns {Object} 边距twip值
 */
export const calculatePageMargins = (pageMargin) => {
  return {
    top: convertInchesToTwip(pageMargin.top / 2.54),
    right: convertInchesToTwip(pageMargin.right / 2.54),
    bottom: convertInchesToTwip(pageMargin.bottom / 2.54),
    left: convertInchesToTwip(pageMargin.left / 2.54)
  };
};

/**
 * 获取页面大小设置
 * @param {string} pageSize - 页面大小 (A4, A3, 8K, 16K)
 * @returns {Object} 页面大小设置
 */
export const getPageSize = (pageSize) => {
  switch (pageSize) {
    case 'A4':
      return {
        width: 11906, // 210mm = 8.27in = 11906 twips
        height: 16838, // 297mm = 11.69in = 16838 twips
        orientation: 'portrait'
      };
    case 'A3':
      return {
        width: 16838, // 297mm = 11.69in = 16838 twips
        height: 23811, // 420mm = 16.54in = 23811 twips
        orientation: 'portrait'
      };
    case '8K':
      return {
        width: 14748, // 260mm = 10.24in = 14748 twips
        height: 20866, // 368mm = 14.49in = 20866 twips
        orientation: 'portrait'
      };
    case '16K':
      return {
        width: 10433, // 184mm = 7.24in = 10433 twips
        height: 14748, // 260mm = 10.24in = 14748 twips
        orientation: 'portrait'
      };
    default:
      return {
        width: 11906, // A4 default
        height: 16838,
        orientation: 'portrait'
      };
  }
};
