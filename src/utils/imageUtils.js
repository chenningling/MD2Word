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
    
    // 处理OSS图片URL的CORS问题
    let fetchUrl = url;
    if (url.includes('aliyuncs.com')) {
      // 添加图片处理参数，可能有助于绕过某些限制
      fetchUrl = url.includes('?') ? `${url}&x-oss-process=image/resize,m_lfit,w_800` : `${url}?x-oss-process=image/resize,m_lfit,w_800`;
      console.log('修改后的OSS URL:', fetchUrl);
    }
    
    // 下载图片
    const response = await axios.get(fetchUrl, {
      responseType: 'arraybuffer',
      // 添加请求头以模拟浏览器行为
      headers: {
        'Referer': window.location.origin,
        'User-Agent': navigator.userAgent
      }
    });
    
    // 转换为Base64
    const arrayBufferView = new Uint8Array(response.data);
    let binary = '';
    for (let i = 0; i < arrayBufferView.length; i++) {
      binary += String.fromCharCode(arrayBufferView[i]);
    }
    const base64 = btoa(binary);
    
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
      // 限制图片最大宽度为800px，保持原始比例
      const maxWidth = 800;
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = Math.round(height * ratio);
      }
      
      resolve({
        width,
        height,
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
  if (!url || typeof url !== 'string') return false;
  
  // 检查是否是OSS链接
  if (url.includes('aliyuncs.com')) {
    return true;
  }
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
  const lowerCaseUrl = url.toLowerCase();
  
  return imageExtensions.some(ext => lowerCaseUrl.endsWith(ext));
};

/**
 * 检查图片格式是否被Word支持
 * @param {File|Blob} file - 图片文件
 * @returns {boolean} - 是否是Word支持的格式
 */
export const isWordSupportedImageFormat = (file) => {
  if (!file) return false;
  
  // Word支持的图片格式MIME类型
  const supportedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/bmp',
    'image/tiff',
    'image/webp'
  ];
  
  // 检查MIME类型
  if (supportedMimeTypes.includes(file.type)) {
    return true;
  }
  
  // 如果MIME类型检查不通过，也检查文件扩展名
  if (file.name) {
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif', '.webp'];
    const lowerCaseName = file.name.toLowerCase();
    return supportedExtensions.some(ext => lowerCaseName.endsWith(ext));
  }
  
  return false;
};

/**
 * 获取Word支持的图片格式列表（用于显示）
 * @returns {string} - 格式列表字符串
 */
export const getWordSupportedImageFormats = () => {
  return 'JPG, JPEG, PNG, GIF, BMP, TIFF, WEBP';
}; 