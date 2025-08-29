/**
 * API服务 - 处理与后端API的交互
 */

// API基础路径配置
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // 生产环境使用相对路径
  : 'http://localhost:3001'; // 开发环境指向后端端口

/**
 * 上传图片到服务器
 * @param {File|Blob} file - 文件对象
 * @returns {Promise<string>} 上传成功后的URL
 */
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || '上传失败');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('上传图片失败:', error);
    throw error;
  }
};

/**
 * 检查API服务是否可用
 * @returns {Promise<boolean>} 服务是否可用
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('API健康检查失败:', error);
    return false;
  }
}; 