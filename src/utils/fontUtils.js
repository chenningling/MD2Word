// 字体工具：集中管理字体映射、可选字体列表与辅助函数

// 与 Word 预览一致的字体映射：将常用中文字体映射到 Web 字体或系统字体
export const FONT_MAPPING = {
  '宋体': 'SimSun, "Source Serif Pro", serif',
  '微软雅黑': 'Microsoft YaHei, "Source Sans Pro", sans-serif',
  '黑体': 'SimHei, "Source Sans Pro", sans-serif',
  '仿宋': 'FangSong, "Source Serif Pro", serif',
  '仿宋 GB2312': 'FangSong_GB2312, FangSong, STFangsong, "Source Serif Pro", serif',
  '楷体': 'KaiTi, "Source Serif Pro", serif',
  '小标宋体': 'STZhongsong, SimSun, "Source Serif Pro", serif',
  '华文宋体': 'STSong, "Source Serif Pro", serif',
  '华文楷体': 'STKaiti, "Source Serif Pro", serif',
  '华文黑体': 'STHeiti, "Source Sans Pro", sans-serif',
  '方正书宋': 'FZShuSong, "Source Serif Pro", serif',
  '方正黑体': 'FZHei, "Source Sans Pro", sans-serif',
  'Arial': 'Arial, "Source Sans Pro", sans-serif',
  'Times New Roman': '"Times New Roman", "Source Serif Pro", serif',
  'Calibri': 'Calibri, "Source Sans Pro", sans-serif',
  'Cambria': 'Cambria, "Source Serif Pro", serif',
  'Georgia': 'Georgia, "Source Serif Pro", serif',
  'Helvetica': 'Helvetica, "Source Sans Pro", sans-serif',
  'Courier New': '"Courier New", "Source Code Pro", monospace'
};

// 获取映射后的字体名（用于内联样式）
export const getMappedFont = (fontFamily) => {
  return FONT_MAPPING[fontFamily] || `${fontFamily}, sans-serif`;
};

// 提供 UI 使用的字体下拉选项
export const FONT_OPTIONS = [
  { value: '宋体', label: '宋体' },
  { value: '微软雅黑', label: '微软雅黑' },
  { value: '黑体', label: '黑体' },
  { value: '仿宋', label: '仿宋' },
  { value: '仿宋 GB2312', label: '仿宋 GB2312' },
  { value: '楷体', label: '楷体' },
  { value: '小标宋体', label: '小标宋体' },
  { value: '华文宋体', label: '华文宋体' },
  { value: '华文楷体', label: '华文楷体' },
  { value: '华文黑体', label: '华文黑体' },
  { value: '方正书宋', label: '方正书宋' },
  { value: '方正黑体', label: '方正黑体' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Calibri', label: 'Calibri' },
  { value: 'Cambria', label: 'Cambria' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Courier New', label: 'Courier New' }
];

// Sidebar/Select 里的预览用：根据字体名返回内联样式 fontFamily
export const getPreviewFontFamily = (fontName) => {
  return FONT_MAPPING[fontName] || `${fontName}, sans-serif`;
};


