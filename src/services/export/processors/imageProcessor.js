import { Paragraph, ImageRun, AlignmentType, TextRun } from 'docx';
import { dataUriToUint8Array, isImageUrl } from '../../../utils/imageUtils';
import axios from 'axios';

/**
 * 图片处理模块
 * 负责图片下载、格式转换、尺寸计算等
 */

/**
 * 处理特殊类型的token（图片和其他特殊内容）
 * @param {Array} tokens - Markdown tokens
 * @returns {Array} 处理后的tokens
 */
export const processSpecialTokens = async (tokens) => {
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
            console.log('[Image Processor] 预处理图片:', imgToken.href);
            const imageData = await downloadImageAsBase64(imgToken.href);
            if (imageData) {
              imageMap.set(imgToken.href, {
                dataUrl: imageData.dataUrl,
                width: imageData.width,
                height: imageData.height
              });
              console.log('[Image Processor] 图片预处理成功:', imgToken.href);
            }
          }
        } catch (error) {
          console.error('[Image Processor] 图片预处理失败:', imgToken.href, error);
        }
      }
    }
  }
  
  console.log(`[Image Processor] 预处理完成，共处理 ${imageMap.size} 张图片`);
  
  // 然后处理所有token
  for (const token of tokens) {
    if (token.type === 'code') {
      // 处理普通代码块，确保它们被正确添加到处理后的tokens中
      console.log('[Image Processor] 处理普通代码块:', token.lang, token.text ? token.text.substring(0, 30) + '...' : '无内容');
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
            console.log('[Image Processor] 使用预处理的图片数据:', imageUrl);
            continue; // 跳过后续处理
          }
          
          // 如果映射表中没有，尝试直接处理
          if (isImageUrl(imageUrl)) {
            console.log('[Image Processor] 处理段落中的单个图片:', imageUrl);
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
              console.log('[Image Processor] 图片处理成功:', imageUrl);
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
                  console.log('[Image Processor] 添加段落内嵌图片:', imageUrl);
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
        console.error('[Image Processor] 处理段落中的图片失败:', error);
        processedTokens.push(token);
      }
    } else {
      // 其他类型的token直接添加
      processedTokens.push(token);
    }
  }
  
  console.log('[Image Processor] 处理后的tokens:', processedTokens.map(t => ({ 
    type: t.type, 
    text: t.text || (t.raw ? t.raw.substring(0, 20) : ''), 
    isImage: t.type === 'image'
  })));
  return processedTokens;
};

/**
 * 下载图片并转换为base64
 * @param {string} url - 图片URL
 * @returns {Promise<Object|null>} 图片数据或null
 */
export const downloadImageAsBase64 = async (url) => {
  try {
    console.log('[Image Processor] 开始下载图片:', url);
    
    // 处理OSS图片URL的CORS问题
    // 如果是阿里云OSS的URL，添加额外的参数来绕过防盗链
    let fetchUrl = url;
    if (url.includes('aliyuncs.com')) {
      // 添加图片处理参数，可能有助于绕过某些限制
      fetchUrl = url.includes('?') ? `${url}&x-oss-process=image/resize,m_lfit,w_800` : `${url}?x-oss-process=image/resize,m_lfit,w_800`;
      console.log('[Image Processor] 修改后的OSS URL:', fetchUrl);
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
    console.log('[Image Processor] 图片类型:', contentType);
    
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
    console.log('[Image Processor] 图片尺寸:', dimensions);
    
    return {
      dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      contentType
    };
  } catch (error) {
    console.error('[Image Processor] 下载图片失败:', error);
    return null;
  }
};

/**
 * 获取图片尺寸
 * @param {string} dataUrl - 图片data URL
 * @returns {Promise<Object>} 图片尺寸
 */
export const getImageDimensions = (dataUrl) => {
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

/**
 * 创建图片元素
 * @param {Object} token - 图片token
 * @returns {Paragraph} Word图片段落
 */
export const createImageElement = (token) => {
  try {
    console.log('[Image Processor] 创建图片元素:', token.text);
    
    // 将dataUrl转换为二进制数据
    const imageData = dataUriToUint8Array(token.dataUrl);
    
    // 计算合适的图片尺寸（以点为单位，1点=1/72英寸）
    const widthInPoints = token.width * 0.75; // 将像素转换为大致的点数
    const heightInPoints = token.height * 0.75;
    
    console.log('[Image Processor] 图片尺寸(points):', widthInPoints, heightInPoints);
    
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
    console.error('[Image Processor] 创建图片元素失败:', error, token);
    // 如果图片创建失败，返回一个包含图片描述的段落
    return new Paragraph({
      children: [
        new TextRun({ text: `[图片: ${token.text || '无法加载'}]`, italics: true })
      ],
      alignment: AlignmentType.CENTER
    });
  }
};

/**
 * 验证图片处理结果
 * @param {Array} originalTokens - 原始tokens
 * @param {Array} processedTokens - 处理后的tokens
 * @returns {Object} 验证结果
 */
export const validateImageProcessing = (originalTokens, processedTokens) => {
  const originalImages = countImagesInTokens(originalTokens);
  const processedImages = processedTokens.filter(t => t.type === 'image').length;
  
  return {
    isValid: originalImages === processedImages,
    originalImageCount: originalImages,
    processedImageCount: processedImages,
    difference: processedImages - originalImages
  };
};

/**
 * 统计tokens中的图片数量
 * @param {Array} tokens - tokens数组
 * @returns {number} 图片数量
 */
const countImagesInTokens = (tokens) => {
  let count = 0;
  
  const countRecursively = (tokenArray) => {
    tokenArray.forEach(token => {
      if (token.type === 'image') {
        count++;
      } else if (token.tokens && Array.isArray(token.tokens)) {
        countRecursively(token.tokens);
      }
    });
  };
  
  countRecursively(tokens);
  return count;
};
