# MD2Word 部署指南

## 🚀 部署概述

MD2Word 是一个前后端分离的应用，包含：
- **前端**: React.js 应用
- **后端**: Node.js + Express API 服务（用于LaTeX公式转换）

## 📋 部署前准备

### 1. 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- 阿里云OSS账号（用于图片存储）

### 2. 配置OSS服务
1. 复制 `src/services/ossConfig.js.example` 为 `src/services/ossConfig.js`
2. 在 `ossConfig.js` 中填入您的阿里云OSS配置信息

## 🔧 本地开发部署

### 前端开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm start
# 应用将在 http://localhost:3000 启动
```

### 后端API服务
```bash
# 进入后端目录
cd md2word-api

# 安装依赖
npm install

# 启动API服务
npm start
# 服务将在 http://localhost:3001 启动
```

## 🌐 生产环境部署

### 前端部署
```bash
# 构建生产版本
npm run build

# 构建文件将生成在 build/ 目录中
# 可以将 build/ 目录部署到任何静态文件服务器
```

### 后端部署
```bash
# 进入后端目录
cd md2word-api

# 安装生产依赖
npm install --production

# 启动服务（建议使用PM2等进程管理工具）
npm start
```

### 使用PM2部署后端（推荐）
```bash
# 安装PM2
npm install -g pm2

# 启动服务
cd md2word-api
pm2 start server.js --name md2word-api

# 设置开机自启
pm2 startup
pm2 save
```

## 🔧 环境变量配置

### 前端环境变量
创建 `.env` 文件：
```env
# API服务地址
REACT_APP_API_URL=http://localhost:3001

# 其他配置...
```

### 后端环境变量
创建 `md2word-api/.env` 文件：
```env
# 服务端口
PORT=3001

# OSS配置（可选，也可以在代码中配置）
OSS_REGION=your-region
OSS_ACCESS_KEY_ID=your-access-key-id
OSS_ACCESS_KEY_SECRET=your-access-key-secret
OSS_BUCKET=your-bucket-name
```

## 🌍 服务器部署示例

### Nginx配置
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/md2word/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端API代理
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker部署（可选）
创建 `Dockerfile`：
```dockerfile
# 前端Dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔍 故障排除

### 常见问题

1. **LaTeX公式无法转换**
   - 检查后端API服务是否正常运行
   - 确认端口3001没有被占用
   - 查看后端服务日志

2. **图片上传失败**
   - 检查OSS配置是否正确
   - 确认OSS bucket权限设置
   - 检查网络连接

3. **前端无法连接后端**
   - 检查API_URL配置
   - 确认CORS设置
   - 检查防火墙设置

### 日志查看
```bash
# 查看PM2日志
pm2 logs md2word-api

# 查看Nginx日志
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 📞 技术支持

如果在部署过程中遇到问题，请：
- 检查控制台错误信息
- 查看服务器日志
- 参考README.md中的使用指南
- 提交Issue获取技术支持

---

**注意**: 请确保在生产环境中使用HTTPS，并定期更新依赖包以获得安全更新。
