import OSS from 'ali-oss';
import { v4 as uuidv4 } from 'uuid';
import ossConfig from './ossConfig';
import { isWordSupportedImageFormat, getWordSupportedImageFormats } from '../utils/imageUtils';

// OSS客户端实例
let ossClient = null;

/**
 * 初始化OSS客户端
 * @returns {Object} OSS客户端实例
 */
export const initOSSClient = () => {
  if (ossClient) return ossClient;

  try {
    console.log('正在初始化OSS客户端，配置:', {
      region: ossConfig.region,
      bucket: ossConfig.bucket,
      // 不打印敏感信息
      accessKeyIdProvided: !!ossConfig.accessKeyId,
      accessKeySecretProvided: !!ossConfig.accessKeySecret
    });
    
    ossClient = new OSS({
      region: ossConfig.region,
      accessKeyId: ossConfig.accessKeyId,
      accessKeySecret: ossConfig.accessKeySecret,
      bucket: ossConfig.bucket,
      secure: true, // 使用HTTPS
      timeout: 60000, // 超时时间60秒
    });
    
    console.log('OSS客户端初始化成功');
    return ossClient;
  } catch (error) {
    console.error('初始化OSS客户端失败:', error);
    return null;
  }
};

/**
 * 上传文件到OSS
 * @param {File|Blob} file - 文件对象
 * @param {string} [customFileName] - 自定义文件名（可选）
 * @returns {Promise<string>} 上传成功后的URL
 */
export const uploadToOSS = async (file, customFileName) => {
  try {
    const client = initOSSClient();
    if (!client) {
      throw new Error('OSS客户端未初始化');
    }

    // 生成唯一文件名
    const fileExt = file.name ? file.name.split('.').pop() : 'png';
    const fileName = customFileName || `${uuidv4()}.${fileExt}`;
    
    // 构建存储路径，按日期组织
    const date = new Date();
    const directory = ossConfig.directory || 'uploads/';
    const path = `${directory}${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}/${fileName}`;
    
    console.log('准备上传文件:', {
      fileName,
      path,
      fileType: file.type,
      fileSize: file.size,
    });
    
    // 上传文件
    try {
      const result = await client.put(path, file, {
        headers: {
          // 设置Content-Type
          'Content-Type': file.type,
          // 设置缓存控制
          'Cache-Control': 'max-age=31536000'
        }
      });
      
      console.log('文件上传成功，结果:', result);
      
      // 返回可访问的URL
      if (result && result.url) {
        return result.url;
      } else {
        throw new Error('上传成功但未返回URL');
      }
    } catch (uploadError) {
      console.error('文件上传过程中出错:', uploadError);
      console.error('错误详情:', uploadError.name, uploadError.message, uploadError.code, uploadError.status, uploadError.requestId);
      throw uploadError;
    }
  } catch (error) {
    console.error('上传文件失败:', error);
    throw error;
  }
};

/**
 * 从剪贴板数据上传图片
 * @param {ClipboardEvent} clipboardEvent - 剪贴板事件
 * @returns {Promise<string|null>} 上传成功后的URL，失败则返回null
 */
export const uploadImageFromClipboard = async (clipboardEvent) => {
  try {
    const items = clipboardEvent.clipboardData.items;
    let imageFile = null;
    let isSvgImage = false;
    
    console.log('检查剪贴板内容，项目数量:', items.length);
    
    // 查找剪贴板中的图片数据
    for (let i = 0; i < items.length; i++) {
      console.log(`剪贴板项目 ${i}:`, items[i].type);
      
      // 检查是否是SVG图片（通常以text/html或text/plain形式存在于剪贴板）
      if (items[i].type === 'text/html' || items[i].type === 'text/plain') {
        let text = '';
        try {
          // 获取文本内容
          const textBlob = items[i].getAsFile() || await new Promise(resolve => {
            items[i].getAsString(string => resolve(string));
          });
          
          if (typeof textBlob === 'string') {
            text = textBlob;
          } else if (textBlob instanceof Blob) {
            text = await textBlob.text();
          }
          
          // 检查是否包含SVG标记
          if (text && (text.includes('<svg') || text.includes('<?xml') && text.includes('<svg'))) {
            console.log('检测到SVG图像内容');
            isSvgImage = true;
            break;
          }
        } catch (e) {
          console.error('解析剪贴板文本失败:', e);
        }
      }
      
      // 检查常规图片格式
      if (items[i].type.indexOf('image/') !== -1) {
        imageFile = items[i].getAsFile();
        console.log('找到图片文件:', imageFile.name, imageFile.size, imageFile.type);
        
        // 特别检查SVG格式
        if (items[i].type === 'image/svg+xml') {
          isSvgImage = true;
          break;
        }
        break;
      }
    }
    
    // 如果检测到SVG图像，直接提示不支持
    if (isSvgImage) {
      console.error('检测到SVG格式图片，不支持导出到Word');
      throw new Error(`SVG格式图片不支持导出到Word文档。请使用以下格式：${getWordSupportedImageFormats()}`);
    }
    
    if (!imageFile) {
      console.log('剪贴板中没有图片');
      return null; // 剪贴板中没有图片
    }
    
    // 验证图片格式是否被Word支持
    if (!isWordSupportedImageFormat(imageFile)) {
      console.error('不支持的图片格式:', imageFile.type);
      throw new Error(`不支持的图片格式。请使用Word支持的格式：${getWordSupportedImageFormats()}`);
    }
    
    // 上传图片到OSS
    const imageUrl = await uploadToOSS(imageFile);
    return imageUrl;
  } catch (error) {
    console.error('从剪贴板上传图片失败:', error);
    throw error; // 向上抛出错误，让调用者处理
  }
};

/**
 * 从本地文件上传图片
 * @param {File} file - 文件对象
 * @returns {Promise<string|null>} 上传成功后的URL，失败则返回null
 */
export const uploadImageFromLocal = async (file) => {
  try {
    if (!file || !file.type.startsWith('image/')) {
      console.error('无效的图片文件:', file ? file.type : '文件为空');
      throw new Error('无效的图片文件');
    }
    
    // 验证图片格式是否被Word支持
    if (!isWordSupportedImageFormat(file)) {
      console.error('不支持的图片格式:', file.type);
      throw new Error(`不支持的图片格式。请使用Word支持的格式：${getWordSupportedImageFormats()}`);
    }
    
    console.log('准备上传本地图片:', file.name, file.size, file.type);
    
    // 上传图片到OSS
    const imageUrl = await uploadToOSS(file);
    return imageUrl;
  } catch (error) {
    console.error('上传本地图片失败:', error);
    throw error; // 向上抛出错误，让调用者处理
  }
};

/**
 * 将图片URL转换为Markdown图片语法
 * @param {string} url - 图片URL
 * @param {string} [alt='图片'] - 图片替代文本
 * @returns {string} Markdown图片语法
 */
export const imageUrlToMarkdown = (url, alt = '图片') => {
  return `![${alt}](${url})`;
};
