# MD2Word - Markdown to Word Formatting Assistant

[中文](README.md) | [English](README_EN.md)

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19.1.0-blue.svg)
![Node](https://img.shields.io/badge/Node.js-Express-green.svg)

MD2Word is a powerful **Markdown to Word formatting assistant** with modular architecture design that quickly converts Markdown text into professionally formatted Word documents. It supports advanced features including complex mathematical formulas, image processing, and AI text conversion.

## ✨ Key Highlights

- 🚀 **Modular Architecture** - v2.0.0 refactored with 30-50% performance improvement
- 🧮 **LaTeX Formula Support** - Complete mathematical formula rendering and export
- 🤖 **AI Integration** - Support for multiple AI platforms' text-to-Markdown functionality
- 📱 **Responsive Design** - Adjustable interface layout supporting various screen sizes
- 🎨 **Rich Templates** - Multiple professional formatting templates
- 🔧 **Highly Customizable** - Support for custom templates and detailed formatting settings

## Main Features

### 📝 Markdown Editing
- ✅ Support for complete Markdown syntax
- ✅ Real-time syntax highlighting
- ✅ Automatic saving of edited content
- ✅ **Image processing features**:
  - Support for pasting images from clipboard
  - Support for uploading local images
  - Automatic image size adjustment for optimal display in Word
  - Support for multiple image formats including JPG, PNG, GIF, BMP, TIFF, WEBP
- ✅ **LaTeX Mathematical Formula Support**:
  - Support for inline formulas `$...$` and block formulas `$$...$$`
  - Automatic conversion to Word's OMML format
  - Support for complex formula structures (integrals, summations, matrices, fractions, etc.)
  - Intelligent handling of line-break formatted formulas

### 🤖 AI Text to Markdown Conversion
- ✅ Support for converting plain text to Markdown format using AI
- ✅ Integration with multiple AI platforms (DeepSeek, Kimi, Tongyi Qianwen) with one-click redirection
- ✅ Automatic construction and copying of prompts to clipboard
- ✅ Step-by-step conversion guidance
- ✅ Automatic countdown jump to improve operation efficiency

### 📄 Word Preview and Export
- ✅ Real-time preview of Word formatting effects
- ✅ Support for various format elements (headings, paragraphs, lists, tables, code blocks, etc.)
- ✅ Support for Mermaid flowchart rendering
- ✅ Export to standard .docx format
- ✅ Support for image export, maintaining image quality and layout
- ✅ **Preview zoom feature**: Adjustable preview area zoom ratio for easy document detail viewing
- ✅ **5-stage export process**: LaTeX processing → Special content processing → Word document creation → Document serialization → Post-processing

### 🎨 Format Settings
- ✅ Multiple preset templates (default style, research paper, legal document, corporate document)
- ✅ Support for customizing and saving templates
- ✅ Adjustable font, font size, line spacing, alignment, indentation and other detailed formatting parameters
- ✅ Page margin settings
- ✅ **Chinese font size system**: Support for professional Chinese typesetting font sizes
- ✅ **Custom template management**: Save, edit and delete custom templates

### 🖥️ Interface Optimization
- ✅ Responsive layout design
- ✅ Adjustable width ratio between editor and preview area
- ✅ Adjustable width of left toolbar and right settings panel
- ✅ Automatic saving of interface layout, restoring previous settings on next open
- ✅ **Markdown syntax learning**: Built-in syntax guide and examples

## 🚀 Quick Start

### 📦 Install Dependencies
```bash
# Clone the project
git clone <repository-url>
cd md2word

# Install frontend dependencies
npm install

# Install backend API dependencies
cd md2word-api
npm install
cd ..
```

### ⚙️ Configure Services

#### 1. Configure OSS Service (Image Storage)
This project uses Alibaba Cloud OSS to store images. You need to create your own OSS configuration file:

1. Copy `src/services/ossConfig.js.example` to `src/services/ossConfig.js`
2. Fill in your Alibaba Cloud OSS configuration information in `ossConfig.js`

#### 2. Start Backend API Service
```bash
# Start LaTeX formula conversion service
cd md2word-api
npm start
# Service will start at http://localhost:3001
```

### 🎯 Start Development Server
```bash
# Start frontend development server
npm start
# Application will start at http://localhost:3000
```

## 📖 User Guide

### 🎯 Basic Usage Process
1. **Edit Content**: Enter Markdown-formatted text in the left editor
2. **Real-time Preview**: Preview Word formatting effect in real-time on the right
3. **Format Settings**: Click the "Format Settings" button in the upper right corner to adjust document format
4. **Export Document**: After editing is complete, click the "Export Word Document" button to download the file

### 🤖 AI Text to Markdown Usage Method
1. Click "Convert Text to MD" in the left navigation bar
2. Paste the plain text to be converted into the text box
3. Click any AI platform button (DeepSeek, Kimi, or Tongyi Qianwen)
4. The system will automatically copy the prompt and redirect to the corresponding AI platform
5. Paste the prompt into the AI platform and send
6. Copy the AI-generated Markdown content to the MD2Word editor

### 🖼️ Image Insertion Method
1. **Paste images**: Simply copy an image, then paste it into the editor (Ctrl+V)
2. **Upload local images**: Click the image icon in the top left of the editor, select a local image file
3. **Supported formats**: JPG, PNG, GIF, BMP, TIFF, WEBP

### 🧮 LaTeX Formula Usage Method
1. **Inline formulas**: Use `$formula content$` format
2. **Block formulas**: Use `$$formula content$$` format
3. **Support line breaks**: Formulas can be written across lines, the system will handle them automatically
4. **Complex structures**: Support for integrals, summations, matrices, fractions and other complex mathematical structures

### 🎨 Format Settings
- Click the "Format Settings" button in the upper right corner
- Select a preset template or customize the format
- Save custom templates for repeated use
- Adjust font, font size, line spacing and other parameters for headings, body text, quotes and other elements
- Set page margins and other page properties

## 🛠️ Technology Stack

### Frontend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **React.js** | 19.1.0 | Frontend Framework |
| **Ant Design** | 5.26.1 | UI Component Library |
| **@uiw/react-codemirror** | 4.23.13 | Markdown Editor |
| **docx.js** | 9.5.1 | Word Document Generation |
| **styled-components** | 6.1.19 | Style Processing |
| **marked** | 15.0.12 | Markdown Parsing |
| **Prism.js** | 1.29.0 | Code Highlighting |
| **Mermaid** | 11.7.0 | Flowchart Generation |

### Backend Technologies
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js + Express** | - | API Server |
| **MathJax** | 2.1.1 | Mathematical Formula Processing |
| **Saxon-JS** | 2.7.0 | XSLT Transformation |
| **Alibaba Cloud OSS** | 6.17.1 | Image Storage |

### Architecture Features
- 🏗️ **Modular Design** - v2.0.0 refactored with 12 independent modules
- ⚡ **Performance Optimization** - 30-50% performance improvement
- 🔧 **Maintainability** - Clear module dependency relationships
- 🛡️ **Error Handling** - Comprehensive exception handling mechanisms

## 🎯 Use Cases

- 📚 **Academic Writing** - Convert Markdown format research papers into properly formatted Word documents
- 📋 **Technical Documentation** - Quickly generate technical documents containing code blocks and formulas
- 📊 **Business Reports** - Use preset templates to quickly generate formatted reports
- 🎓 **Educational Materials** - Create teaching documents containing mathematical formulas
- 📝 **Daily Office Work** - Efficient document creation and formatting tool

## 🤝 Contribution Guidelines

Contributions and suggestions are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support & Feedback

If you encounter any issues during use or have improvement suggestions, please feel free to:
- 🐛 [Submit an Issue](https://github.com/your-repo/issues)
- 💬 [Join Discussions](https://github.com/your-repo/discussions)
- ⭐ [Give the Project a Star](https://github.com/your-repo)

---

**Developer Information**: This project is built based on Create React App. For detailed information, please refer to the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started). 