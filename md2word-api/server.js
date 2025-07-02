const express = require('express');
const multer = require('multer');
const OSS = require('ali-oss');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const app = express();
const upload = multer({ dest: 'uploads/' });
const port = config.port || 3001;

// 配置CORS，允许来自您网站的请求
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

app.use(express.json());

// OSS客户端配置（安全存储在服务器端）
const ossClient = new OSS({
  region: config.region,
  bucket: config.bucket,
  accessKeyId: config.accessKeyId,
  accessKeySecret: config.accessKeySecret,
  secure: true
});

// 文件上传API
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有文件上传' });
    }

    // 读取上传的文件
    const fileContent = fs.readFileSync(req.file.path);
    
    // 生成简洁的文件名
    const timestamp = Date.now();
    const fileExt = req.file.originalname.split('.').pop().toLowerCase();
    
    // 生成一个简短的随机字符串（6位）
    const randomString = Math.random().toString(36).substring(2, 8);
    
    // 组合成新的文件名: timestamp-randomString.ext
    const fileName = `${timestamp}-${randomString}.${fileExt}`;
    
    // 构建存储路径，按日期组织但简化结构
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const directory = 'uploads/';
    const filePath = `${directory}${year}/${month}/${fileName}`;
    
    // 上传到OSS
    const result = await ossClient.put(filePath, fileContent);
    
    // 删除临时文件
    fs.unlinkSync(req.file.path);
    
    // 返回文件URL
    res.json({ 
      url: result.url,
      name: fileName,
      size: req.file.size
    });
  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 健康检查API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`服务运行在端口 ${port}`);
  console.log(`OSS配置: 区域=${config.region}, Bucket=${config.bucket}`);
  console.log(`CORS允许来源: ${config.corsOrigin}`);
}); 