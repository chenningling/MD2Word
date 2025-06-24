import axios from 'axios';

/**
 * 下载图片并转换为Base64格式
 * @param {string} imageUrl - 图片URL
 * @returns {Promise<{base64: string, width: number, height: number}>} - 包含Base64数据和图片尺寸的对象
 */
export const downloadImage = async (imageUrl) => {
  try {
    // 处理相对路径
    const url = imageUrl.startsWith('http') ? imageUrl : `https:${imageUrl}`;
    
    // 下载图片
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });
    
    // 转换为Base64
    const arrayBufferView = new Uint8Array(response.data);
    const blob = new Blob([arrayBufferView], { type: response.headers['content-type'] });
    
    // 使用FileReader将Blob转换为Base64
    const base64 = await blobToBase64(blob);
    
    // 获取图片类型
    const contentType = response.headers['content-type'];
    const dataUri = `data:${contentType};base64,${base64}`;
    
    // 获取图片尺寸
    const dimensions = await getImageDimensions(dataUri);
    
    return {
      base64,
      contentType,
      width: dimensions.width,
      height: dimensions.height,
    };
  } catch (error) {
    console.error('下载图片失败:', error);
    throw new Error(`下载图片失败: ${error.message}`);
  }
};

/**
 * 将Blob转换为Base64
 * @param {Blob} blob - Blob对象
 * @returns {Promise<string>} - Base64字符串
 */
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * 获取图片尺寸
 * @param {string} dataUri - 图片的Data URI
 * @returns {Promise<{width: number, height: number}>} - 图片尺寸
 */
const getImageDimensions = (dataUri) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = (err) => {
      reject(new Error('获取图片尺寸失败'));
    };
    img.src = dataUri;
  });
};

/**
 * 将Data URI转换为Uint8Array
 * @param {string} dataUri - 图片的Data URI
 * @returns {Uint8Array} - 二进制数据
 */
export const dataUriToUint8Array = (dataUri) => {
  const base64 = dataUri.split(',')[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
};

/**
 * 检查URL是否是有效的图片链接
 * @param {string} url - 要检查的URL
 * @returns {boolean} - 是否是图片链接
 */
export const isImageUrl = (url) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const lowerCaseUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerCaseUrl.endsWith(ext));
}; 