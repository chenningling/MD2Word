# MD2Word 项目结构说明

## 📁 项目目录结构

```
md2word/
├── 📁 src/                          # 前端源代码
│   ├── 📁 components/               # React组件
│   │   ├── 📁 FormatSettings/       # 格式设置组件
│   │   ├── 📁 Header/               # 头部导航组件
│   │   ├── 📁 MarkdownEditor/       # Markdown编辑器组件
│   │   ├── 📁 Resizer/              # 拖拽调整组件
│   │   ├── 📁 Sidebar/              # 侧边栏组件
│   │   └── 📁 WordPreview/          # Word预览组件
│   ├── 📁 contexts/                 # React上下文
│   │   └── 📁 DocumentContext/      # 文档上下文管理
│   ├── 📁 services/                 # 服务层
│   │   ├── 📁 export/               # 导出服务（模块化架构）
│   │   │   ├── 📁 core/             # 核心导出逻辑
│   │   │   ├── 📁 processors/       # 内容处理器
│   │   │   ├── 📁 postprocess/      # 后处理器
│   │   │   └── 📁 utils/            # 工具函数
│   │   ├── ossConfig.js.example     # OSS配置示例
│   │   └── ...                      # 其他服务文件
│   ├── 📁 utils/                    # 工具函数
│   ├── App.js                       # 主应用组件
│   ├── index.js                     # 应用入口
│   └── ...                          # 其他源文件
├── 📁 public/                       # 公共资源
│   ├── 📁 images/                   # 图片资源
│   ├── index.html                   # HTML模板
│   └── ...                          # 其他公共文件
├── 📁 md2word-api/                  # 后端API服务
│   ├── 📁 routes/                   # API路由
│   ├── 📁 services/                 # 后端服务
│   ├── config.js                    # 配置文件
│   ├── server.js                    # 服务器入口
│   ├── package.json                 # 后端依赖配置
│   └── MML2OMML.XSL                 # XSLT转换文件
├── 📄 .gitignore                    # Git忽略文件配置
├── 📄 package.json                  # 前端依赖配置
├── 📄 README.md                     # 中文说明文档
├── 📄 README_EN.md                  # 英文说明文档
├── 📄 DEPLOYMENT.md                 # 部署指南
├── 📄 PROJECT_STRUCTURE.md          # 项目结构说明
└── 📄 LICENSE                       # 许可证文件
```

## 🏗️ 架构说明

### 前端架构
- **React.js 19.1.0**: 现代化的前端框架
- **模块化设计**: v2.0.0重构，12个独立模块
- **组件化开发**: 可复用的React组件
- **上下文管理**: 全局状态管理

### 后端架构
- **Node.js + Express**: 轻量级API服务
- **MathJax**: 数学公式处理
- **Saxon-JS**: XSLT转换引擎
- **阿里云OSS**: 图片存储服务

### 核心功能模块

#### 1. 导出服务 (src/services/export/)
```
export/
├── core/
│   └── documentBuilder.js          # Word文档构建器
├── processors/
│   ├── latexProcessor.js           # LaTeX公式处理器
│   ├── imageProcessor.js           # 图片处理器
│   ├── tableProcessor.js           # 表格处理器
│   └── listProcessor.js            # 列表处理器
├── postprocess/
│   ├── ommlReplacer.js             # OMML替换器
│   ├── orderManager.js             # 元素顺序管理器
│   └── xmlPostProcessor.js         # XML后处理器
├── utils/
│   ├── converters.js               # 格式转换器
│   ├── textUtils.js                # 文本处理工具
│   └── xmlUtils.js                 # XML处理工具
└── index.js                        # 导出服务入口
```

#### 2. 组件结构 (src/components/)
- **Header**: 顶部导航栏，包含导出和设置按钮
- **MarkdownEditor**: 基于CodeMirror的Markdown编辑器
- **WordPreview**: Word文档预览组件
- **FormatSettings**: 排版格式设置面板
- **Sidebar**: 左侧工具栏，包含学习指南和AI转换
- **Resizer**: 可拖拽的分割线组件

#### 3. 后端API (md2word-api/)
- **server.js**: Express服务器主文件
- **routes/formula.js**: LaTeX公式转换API路由
- **services/**: LaTeX处理服务
- **MML2OMML.XSL**: MathML到OMML的转换模板

## 🔧 技术特点

### 模块化架构优势
1. **性能提升**: 30-50%的性能改进
2. **可维护性**: 清晰的模块依赖关系
3. **可扩展性**: 易于添加新功能模块
4. **错误处理**: 完善的异常处理机制

### 5阶段导出流程
1. **LaTeX处理**: 提取和转换数学公式
2. **特殊内容处理**: 处理图片、表格等特殊元素
3. **Word文档创建**: 构建Word文档结构
4. **文档序列化**: 生成.docx文件
5. **后处理**: XML优化和OMML替换

## 📦 依赖管理

### 前端依赖 (package.json)
- **React生态系统**: React, React-DOM
- **UI框架**: Ant Design
- **编辑器**: @uiw/react-codemirror
- **文档生成**: docx.js
- **样式处理**: styled-components
- **Markdown处理**: marked, Prism.js
- **图表生成**: Mermaid

### 后端依赖 (md2word-api/package.json)
- **服务器**: Express
- **数学处理**: MathJax, Saxon-JS
- **文件处理**: Multer
- **云存储**: Ali-OSS
- **跨域处理**: CORS

## 🚀 开发流程

### 本地开发
1. 启动前端开发服务器: `npm start`
2. 启动后端API服务: `cd md2word-api && npm start`
3. 配置OSS服务（图片上传功能）

### 生产部署
1. 构建前端: `npm run build`
2. 部署后端API服务
3. 配置Web服务器（Nginx等）
4. 设置环境变量

## 📝 注意事项

1. **OSS配置**: 需要配置阿里云OSS用于图片存储
2. **API服务**: 前端依赖后端API进行LaTeX公式转换
3. **浏览器兼容**: 支持现代浏览器（Chrome, Firefox, Safari, Edge）
4. **文件大小**: 建议单次导出文档不超过10MB

---

这个项目结构设计注重模块化、可维护性和性能优化，适合团队协作开发和长期维护。
