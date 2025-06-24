import mermaid from 'mermaid';
import { toPng } from 'html-to-image';

// 初始化Mermaid配置
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'Arial, sans-serif',
  fontSize: 14,
  logLevel: 'error',
});

/**
 * 将Mermaid代码转换为PNG图片
 * @param {string} mermaidCode - Mermaid语法代码
 * @returns {Promise<{dataUrl: string, width: number, height: number}>} - 包含图片数据和尺寸的对象
 */
export const renderMermaidToPng = async (mermaidCode) => {
  try {
    // 验证Mermaid代码
    try {
      await mermaid.parse(mermaidCode);
    } catch (parseError) {
      console.error('Mermaid代码解析失败:', parseError);
      throw new Error(`Mermaid代码格式错误: ${parseError.message}`);
    }

    // 创建临时容器
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = 'auto';
    container.style.height = 'auto';
    container.style.background = 'white';
    container.style.padding = '20px';
    document.body.appendChild(container);

    // 生成随机ID
    const id = `mermaid-${Math.random().toString(36).substring(2, 10)}`;
    container.id = id;

    try {
      // 渲染Mermaid图表
      const { svg } = await mermaid.render(id, mermaidCode);
      container.innerHTML = svg;
      
      // 获取SVG元素
      const svgElement = container.querySelector('svg');
      if (!svgElement) {
        throw new Error('无法找到渲染后的SVG元素');
      }
      
      // 确保SVG有明确的宽高
      if (!svgElement.hasAttribute('width') || !svgElement.hasAttribute('height')) {
        try {
          const bbox = svgElement.getBBox();
          svgElement.setAttribute('width', `${Math.max(bbox.width + 40, 200)}px`);
          svgElement.setAttribute('height', `${Math.max(bbox.height + 40, 100)}px`);
        } catch (bboxError) {
          // 如果无法获取 bbox，设置默认尺寸
          svgElement.setAttribute('width', '500px');
          svgElement.setAttribute('height', '300px');
        }
      }
      
      // 转换为PNG，添加超时处理
      const dataUrlPromise = toPng(container, { 
        backgroundColor: 'white',
        pixelRatio: 2,
        quality: 0.9,
        cacheBust: true
      });
      
      // 添加超时处理
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('图表渲染超时')), 10000);
      });
      
      const dataUrl = await Promise.race([dataUrlPromise, timeoutPromise]);
      
      // 获取尺寸
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('图片加载失败'));
        img.src = dataUrl;
        
        // 图片加载超时
        setTimeout(() => {
          if (!img.complete) {
            reject(new Error('图片加载超时'));
          }
        }, 5000);
      });
      
      return {
        dataUrl,
        width: img.width,
        height: img.height,
      };
    } finally {
      // 清理临时元素
      if (container.parentNode) {
        try {
          document.body.removeChild(container);
        } catch (error) {
          console.error('清理临时元素失败:', error);
        }
      }
    }
  } catch (error) {
    console.error('渲染Mermaid图表失败:', error);
    throw new Error(`渲染Mermaid图表失败: ${error.message}`);
  }
};

/**
 * 检查代码块是否是Mermaid流程图
 * @param {string} codeType - 代码块类型
 * @returns {boolean} - 是否是Mermaid流程图
 */
export const isMermaidCode = (codeType) => {
  return codeType && (codeType.toLowerCase() === 'mermaid');
};

/**
 * 从Data URL中提取Base64数据
 * @param {string} dataUrl - Data URL
 * @returns {string} - Base64数据
 */
export const extractBase64FromDataUrl = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('无效的Data URL');
  }
  const parts = dataUrl.split(',');
  if (parts.length < 2) {
    throw new Error('Data URL格式错误');
  }
  return parts[1];
}; 