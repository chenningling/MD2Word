# MD2Word - Markdown to Word Formatting Assistant

[中文](README.md) | [English](README_EN.md)

MD2Word is a tool that quickly converts Markdown text into properly formatted Word documents. Users can input Markdown-formatted content in the left editor, preview the Word effect in real-time on the right, and export it as a precisely formatted Word document.

## Main Features

### Markdown Editing
- Support for complete Markdown syntax
- Real-time syntax highlighting
- Automatic saving of edited content
- **Image processing features**:
  - Support for pasting images from clipboard
  - Support for uploading local images
  - Automatic image size adjustment for optimal display in Word
  - Support for multiple image formats including JPG, PNG, GIF, BMP, TIFF, WEBP

### Text to Markdown Conversion
- Support for converting plain text to Markdown format using AI
- Integration with multiple AI platforms (DeepSeek, Kimi, Tongyi Qianwen) with one-click redirection
- Automatic construction and copying of prompts to clipboard
- Step-by-step conversion guidance
- Automatic countdown jump to improve operation efficiency

### Word Preview and Export
- Real-time preview of Word formatting effects
- Support for various format elements (headings, paragraphs, lists, tables, code blocks, etc.)
- Support for Mermaid flowchart rendering
- Export to .docx format
- Support for image export, maintaining image quality and layout
- **Preview zoom feature**: Adjustable preview area zoom ratio for easy document detail viewing

### Format Settings
- Multiple preset templates (default style, research paper, legal document, corporate document)
- Support for customizing and saving templates
- Adjustable font, font size, line spacing, alignment, indentation and other detailed formatting parameters
- Page margin settings
- **Chinese font size system**: Support for professional Chinese typesetting font sizes
- **Custom template management**: Save, edit and delete custom templates

### Interface Optimization
- Responsive layout design
- Adjustable width ratio between editor and preview area
- Adjustable width of left toolbar and right settings panel
- Automatic saving of interface layout, restoring previous settings on next open

## Quick Start

### Install Dependencies
```
npm install
```

### Start Development Server
```
npm start
```

## User Guide

### Basic Usage Process
1. Enter Markdown-formatted text in the left editor
2. Preview Word formatting effect in real-time on the right
3. Click the "Format Settings" button in the upper right corner to adjust document format
4. After editing is complete, click the "Export Word Document" button to download the file

### Text to Markdown Usage Method
1. Click "Convert Text to MD" in the left navigation bar
2. Paste the plain text to be converted into the text box
3. Click any AI platform button (DeepSeek, Kimi, or Tongyi Qianwen)
4. The system will automatically copy the prompt and redirect to the corresponding AI platform
5. Paste the prompt into the AI platform and send
6. Copy the AI-generated Markdown content to the MD2Word editor

### Image Insertion Method
1. **Paste images**: Simply copy an image, then paste it into the editor (Ctrl+V)
2. **Upload local images**: Click the image icon in the top left of the editor, select a local image file
3. Supported image formats: JPG, PNG, GIF, BMP, TIFF, WEBP

### Format Settings
- Click the "Format Settings" button in the upper right corner
- Select a preset template or customize the format
- Save custom templates for repeated use
- Adjust font, font size, line spacing and other parameters for headings, body text, quotes and other elements
- Set page margins and other page properties

## Technology Stack
- Frontend Framework: React.js
- UI Library: Ant Design
- Markdown Editor: @uiw/react-codemirror
- Word Document Generation: docx.js
- Local Storage: localStorage
- Style Processing: styled-components
- Markdown Parsing: marked
- Code Highlighting: Prism.js
- Chart Generation: Mermaid
- Image Storage: Alibaba Cloud OSS

## Developer Information
This project is built based on Create React App. For detailed information, please refer to the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started). 