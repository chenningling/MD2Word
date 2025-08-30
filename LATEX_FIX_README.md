# LaTeX 公式渲染问题修复说明

## 问题描述

在MD2Word项目中，当用户在Markdown编辑器中输入带换行的LaTeX公式时，会出现以下问题：

**正常格式（可正常导出）：**
```markdown
$$\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u$$
```

**带换行格式（问题场景）：**
```markdown
$$
\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u
$$
```

带换行格式会导致公式在预览中显示为 `<br>公式<br>` 而不是正确的数学公式。

## 问题根源

1. **Markdown解析阶段**：当用户输入带换行的公式时，Markdown解析器将换行符转换为了`<br>`标签
2. **LaTeX渲染阶段**：在HTML层面进行LaTeX公式匹配时，正则表达式仍然期望匹配原始的`$$...$$`格式，但实际HTML中已经包含了`<br>`标签
3. **正则表达式问题**：原有的正则表达式 `/\$\$\s*\n?([\s\S]*?)\n?\s*\$\$/g` 中的 `\n?` 是可选的换行符，但无法处理HTML标签

## 修复方案

### 1. 改进正则表达式

**修复前：**
```javascript
BLOCK: /\$\$\s*\n?([\s\S]*?)\n?\s*\$\$/g
```

**修复后：**
```javascript
BLOCK: /\$\$\s*([\s\S]*?)\s*\$\$/g
```

### 2. 添加HTML标签清理逻辑

在LaTeX公式渲染过程中，添加了HTML标签清理步骤：

```javascript
// 清理HTML标签，提取纯LaTeX代码
// 移除<br>标签并替换为换行符，保持公式的原始格式
latexCode = latexCode.replace(/<br\s*\/?>/gi, '\n');
// 移除其他可能的HTML标签
latexCode = latexCode.replace(/<[^>]*>/g, '');
// 清理多余的空白字符
latexCode = latexCode.replace(/\n\s*\n/g, '\n').trim();
```

### 3. 修复位置

修复了两个关键位置的LaTeX渲染逻辑：

1. **第一处**：`src/components/WordPreview/WordPreview.js` 第570-630行
2. **第二处**：`src/components/WordPreview/WordPreview.js` 第700-750行

## 修复效果

修复后，无论用户输入哪种格式的LaTeX公式，都能正确渲染：

- ✅ 单行公式：`$$\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u$$`
- ✅ 多行公式：
  ```markdown
  $$
  \frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u
  $$
  ```
- ✅ 复杂公式：
  ```markdown
  $$
  \begin{align}
  \frac{\partial^2 u}{\partial t^2} &= c^2 \nabla^2 u \\
  &= c^2 \left( \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} \right)
  \end{align}
  $$

## 测试方法

1. 启动项目：`npm start`
2. 在编辑器中输入测试内容（参考 `test-latex-fix.md` 文件）
3. 观察预览区域中公式的渲染效果
4. 验证带换行的公式是否正常显示

## 技术细节

- **正则表达式改进**：使用更宽松的匹配模式，允许公式内容中包含HTML标签
- **HTML标签清理**：智能识别和清理HTML标签，保持LaTeX代码的原始格式
- **换行符处理**：将`<br>`标签转换为换行符，确保多行公式的正确显示
- **错误处理**：增强错误处理逻辑，提供详细的调试信息

## 兼容性

修复后的代码保持了向后兼容性：
- 原有的单行公式格式仍然正常工作
- 新增的多行公式格式支持
- 不影响其他Markdown元素的渲染
- 保持与MathJax的兼容性
