# MD2Word - Markdown转Word排版助手

[中文](README.md) | [English](README_EN.md)

MD2Word是一款将Markdown文本快速转换为规范Word文档的工具。用户可以在左侧编辑器中输入Markdown格式的内容，实时在右侧预览Word效果，并可以导出为精确排版的Word文档。

## 主要功能

### Markdown编辑
- 支持完整的Markdown语法
- 实时语法高亮
- 自动保存编辑内容
- **图片处理功能**：
  - 支持粘贴剪贴板中的图片
  - 支持上传本地图片
  - 自动调整图片尺寸，优化在Word中的显示效果
  - 支持JPG、PNG、GIF、BMP、TIFF、WEBP等多种图片格式

### 文本转Markdown
- 支持将普通文本通过AI转换为Markdown格式
- 集成多个AI平台（DeepSeek、Kimi、通义千问）的一键跳转
- 自动构建并复制提示词到剪贴板
- 提供转换步骤引导
- 支持自动倒计时跳转，提升操作效率

### Word预览与导出
- 实时预览Word排版效果
- 支持多种格式元素（标题、段落、列表、表格、代码块等）
- 支持Mermaid流程图渲染
- 导出为.docx格式文件
- 支持图片导出，保持图片质量和布局
- **预览缩放功能**：可调整预览区域的缩放比例，方便查看文档细节

### 排版格式设置
- 提供多种预设模板（默认样式、研究论文、法律文书、公司公文）
- 支持自定义和保存模板
- 可调整字体、字号、行间距、对齐方式、缩进等详细排版参数
- 支持页面边距设置
- **中文字号系统**：支持初号、小初、一号、小一等中文专业排版字号
- **自定义模板管理**：可保存、编辑和删除自定义模板

### 界面优化
- 响应式布局设计
- 可调整编辑器与预览区域宽度比例
- 可调整左侧工具栏和右侧设置面板的宽度
- 界面布局自动保存，下次打开恢复上次设置

## 快速开始

### 安装依赖
```
npm install
```

### 配置OSS服务
本项目使用阿里云OSS存储图片。您需要创建自己的OSS配置文件：

1. 复制`src/services/ossConfig.js.example`为`src/services/ossConfig.js`
2. 在`ossConfig.js`中填入您的阿里云OSS配置信息

### 启动开发服务器
```
npm start
```

## 使用指南

### 基本使用流程
1. 在左侧编辑器中输入Markdown格式的文本
2. 在右侧实时预览Word排版效果
3. 点击右上角「排版格式设置」按钮调整文档格式
4. 完成编辑后，点击「导出Word文档」按钮下载文件

### 文本转Markdown使用方法
1. 点击左侧导航栏的「文本内容转MD」
2. 在文本框中粘贴需要转换的普通文本
3. 点击任一AI平台按钮（DeepSeek、Kimi或通义千问）
4. 系统会自动复制提示词并跳转到对应AI平台
5. 在AI平台中粘贴提示词并发送
6. 复制AI生成的Markdown内容到MD2Word的编辑器中

### 图片插入方法
1. **粘贴图片**：直接复制图片，然后在编辑器中粘贴（Ctrl+V）
2. **上传本地图片**：点击编辑器左上角的图片图标，选择本地图片文件
3. 支持的图片格式：JPG、PNG、GIF、BMP、TIFF、WEBP

### 排版设置
- 点击右上角「排版格式设置」按钮
- 选择预设模板或自定义格式
- 可以保存自定义模板以便重复使用
- 调整标题、正文、引用等元素的字体、字号、行间距等参数
- 设置页面边距和其他页面属性

## 技术栈
- 前端框架：React.js
- UI库：Ant Design
- Markdown编辑器：@uiw/react-codemirror
- Word文档生成：docx.js
- 本地存储：localStorage
- 样式处理：styled-components
- Markdown解析：marked
- 代码高亮：Prism.js
- 图表生成：Mermaid
- 图片存储：阿里云OSS

## 贡献指南
欢迎贡献代码或提出建议！请先fork本仓库，然后提交pull request。

## 开发者信息
本项目基于Create React App构建，详细信息请参考[Create React App文档](https://facebook.github.io/create-react-app/docs/getting-started)。
