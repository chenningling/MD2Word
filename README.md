# MD2Word - Markdown转Word排版助手

[中文](README.md) | [English](README_EN.md)

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![Node](https://img.shields.io/badge/Node.js-Express-green.svg)

MD2Word是一款功能强大的**Markdown转Word排版助手**，采用模块化架构设计，能够将Markdown文本快速转换为规范排版的Word文档。支持复杂的数学公式、图片处理、AI文本转换等高级功能。

## ✨ 核心亮点

- 🚀 **模块化架构** - v2.0.0重构，性能提升30-50%
- 🧮 **LaTeX公式支持** - 完整的数学公式渲染和导出
- 🤖 **AI集成** - 支持多个AI平台的文本转Markdown功能
- 📱 **响应式设计** - 可调整的界面布局，支持多种屏幕尺寸
- 🎨 **丰富模板** - 预设多种专业排版模板
- 🔧 **高度可定制** - 支持自定义模板和详细排版设置

## 主要功能

### 📝 Markdown编辑
- ✅ 支持完整的Markdown语法
- ✅ 实时语法高亮显示
- ✅ 自动保存编辑内容
- ✅ **图片处理功能**：
  - 支持粘贴剪贴板中的图片
  - 支持上传本地图片
  - 自动调整图片尺寸，优化在Word中的显示效果
  - 支持JPG、PNG、GIF、BMP、TIFF、WEBP等多种图片格式
- ✅ **LaTeX数学公式支持**：
  - 支持行内公式 `$...$` 和块级公式 `$$...$$`
  - 自动转换为Word的OMML格式
  - 支持复杂公式结构（积分、求和、矩阵、分数等）
  - 智能处理换行格式的公式

### 🤖 AI文本转Markdown
- ✅ 支持将普通文本通过AI转换为Markdown格式
- ✅ 集成多个AI平台（DeepSeek、Kimi、通义千问）的一键跳转
- ✅ 自动构建并复制提示词到剪贴板
- ✅ 提供转换步骤引导
- ✅ 支持自动倒计时跳转，提升操作效率

### 📄 Word预览与导出
- ✅ 实时预览Word排版效果
- ✅ 支持多种格式元素（标题、段落、列表、表格、代码块等）
- ✅ 支持Mermaid流程图渲染
- ✅ 导出为标准的.docx格式文件
- ✅ 支持图片导出，保持图片质量和布局
- ✅ **预览缩放功能**：可调整预览区域的缩放比例，方便查看文档细节
- ✅ **5阶段导出流程**：LaTeX处理 → 特殊内容处理 → Word文档创建 → 文档序列化 → 后处理

### 🎨 排版格式设置
- ✅ 提供多种预设模板（默认样式、研究论文、法律文书、公司公文）
- ✅ 支持自定义和保存模板
- ✅ 可调整字体、字号、行间距、对齐方式、缩进等详细排版参数
- ✅ 支持页面边距设置
- ✅ **中文字号系统**：支持初号、小初、一号、小一等中文专业排版字号
- ✅ **自定义模板管理**：可保存、编辑和删除自定义模板

### 🖥️ 界面优化
- ✅ 响应式布局设计
- ✅ 可调整编辑器与预览区域宽度比例
- ✅ 可调整左侧工具栏和右侧设置面板的宽度
- ✅ 界面布局自动保存，下次打开恢复上次设置
- ✅ **Markdown语法学习**：内置语法指南和示例

## 🚀 快速开始

### 📦 安装依赖
```bash
# 克隆项目
git clone <repository-url>
cd md2word

# 安装前端依赖
npm install

# 安装后端API依赖
cd md2word-api
npm install
cd ..
```

### ⚙️ 配置服务

#### 1. 配置OSS服务（图片存储）
本项目使用阿里云OSS存储图片。您需要创建自己的OSS配置文件：

1. 复制`src/services/ossConfig.js.example`为`src/services/ossConfig.js`
2. 在`ossConfig.js`中填入您的阿里云OSS配置信息

#### 2. 启动后端API服务
```bash
# 启动LaTeX公式转换服务
cd md2word-api
npm start
# 服务将在 http://localhost:3001 启动
```

### 🎯 启动开发服务器
```bash
# 启动前端开发服务器
npm start
# 应用将在 http://localhost:3000 启动
```

## 📖 使用指南

### 🎯 基本使用流程
1. **编辑内容**：在左侧编辑器中输入Markdown格式的文本
2. **实时预览**：在右侧实时预览Word排版效果
3. **格式设置**：点击右上角「排版格式设置」按钮调整文档格式
4. **导出文档**：完成编辑后，点击「导出Word文档」按钮下载文件

### 🤖 AI文本转Markdown使用方法
1. 点击左侧导航栏的「文本内容转MD」
2. 在文本框中粘贴需要转换的普通文本
3. 点击任一AI平台按钮（DeepSeek、Kimi或通义千问）
4. 系统会自动复制提示词并跳转到对应AI平台
5. 在AI平台中粘贴提示词并发送
6. 复制AI生成的Markdown内容到MD2Word的编辑器中

### 🖼️ 图片插入方法
1. **粘贴图片**：直接复制图片，然后在编辑器中粘贴（Ctrl+V）
2. **上传本地图片**：点击编辑器左上角的图片图标，选择本地图片文件
3. **支持的格式**：JPG、PNG、GIF、BMP、TIFF、WEBP

### 🧮 LaTeX公式使用方法
1. **行内公式**：使用 `$公式内容$` 格式
2. **块级公式**：使用 `$$公式内容$$` 格式
3. **支持换行**：公式可以跨行书写，系统会自动处理
4. **复杂结构**：支持积分、求和、矩阵、分数等复杂数学结构

### 🎨 排版设置
- 点击右上角「排版格式设置」按钮
- 选择预设模板或自定义格式
- 可以保存自定义模板以便重复使用
- 调整标题、正文、引用等元素的字体、字号、行间距等参数
- 设置页面边距和其他页面属性

## 🛠️ 技术栈

### 前端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| **React.js** | 19.1.0 | 前端框架 |
| **Ant Design** | 5.26.1 | UI组件库 |
| **@uiw/react-codemirror** | 4.23.13 | Markdown编辑器 |
| **docx.js** | 9.5.1 | Word文档生成 |
| **styled-components** | 6.1.19 | 样式处理 |
| **marked** | 15.0.12 | Markdown解析 |
| **Prism.js** | 1.29.0 | 代码高亮 |
| **Mermaid** | 11.7.0 | 流程图生成 |

### 后端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| **Node.js + Express** | - | API服务器 |
| **MathJax** | 2.1.1 | 数学公式处理 |
| **Saxon-JS** | 2.7.0 | XSLT转换 |
| **阿里云OSS** | 6.17.1 | 图片存储 |

### 架构特点
- 🏗️ **模块化设计** - v2.0.0重构，12个独立模块
- ⚡ **性能优化** - 30-50%性能提升
- 🔧 **可维护性** - 清晰的模块依赖关系
- 🛡️ **错误处理** - 完善的异常处理机制

## 🎯 使用场景

- 📚 **学术写作** - 将Markdown格式的研究论文转换为规范Word文档
- 📋 **技术文档** - 快速生成包含代码块、公式的技术文档  
- 📊 **商务报告** - 使用预设模板快速生成格式化报告
- 🎓 **教学材料** - 制作包含数学公式的教学文档
- 📝 **日常办公** - 高效的文档创建和格式化工具

## 🤝 贡献指南

欢迎贡献代码或提出建议！

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持与反馈

如果您在使用过程中遇到问题或有改进建议，欢迎：
- 🐛 [提交 Issue](https://github.com/your-repo/issues)
- 💬 [参与讨论](https://github.com/your-repo/discussions)
- ⭐ [给项目点赞](https://github.com/your-repo)

---

**开发者信息**: 本项目基于 Create React App 构建，详细信息请参考 [Create React App 文档](https://facebook.github.io/create-react-app/docs/getting-started)。
