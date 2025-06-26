# MD2Word - Markdown转Word排版助手

MD2Word是一款将Markdown文本快速转换为规范Word文档的工具。用户可以在左侧编辑器中输入Markdown格式的内容，实时在右侧预览Word效果，并可以导出为精确排版的Word文档。

## 主要功能

### Markdown编辑
- 支持完整的Markdown语法
- 实时语法高亮
- 自动保存编辑内容

### 文本转Markdown
- 支持将普通文本通过AI转换为Markdown格式
- 集成多个AI平台（DeepSeek、Kimi、通义千问）的一键跳转
- 自动构建并复制提示词到剪贴板
- 提供转换步骤引导

### Word预览与导出
- 实时预览Word排版效果
- 支持多种格式元素（标题、段落、列表、表格、代码块等）
- 支持Mermaid流程图渲染
- 导出为.docx格式文件

### 排版格式设置
- 提供多种预设模板（默认样式、研究论文、法律文书、公司公文）
- 支持自定义和保存模板
- 可调整字体、字号、行间距、对齐方式、缩进等详细排版参数
- 支持页面边距设置

## 快速开始

### 安装依赖
```
npm install
```

### 启动开发服务器
```
npm start
```

### 构建生产版本
```
npm run build
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

### 排版设置
- 点击右上角「排版格式设置」按钮
- 选择预设模板或自定义格式
- 可以保存自定义模板以便重复使用

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

## 开发者信息
本项目基于Create React App构建，详细信息请参考[Create React App文档](https://facebook.github.io/create-react-app/docs/getting-started)。

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
