# 矩阵公式深度调试测试

## 测试目标
精确定位`&amp;`实体编码在哪个环节被引入和处理。

## 测试用例

### 1. 最简矩阵测试
$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}$$

### 2. 行内矩阵测试
这是行内矩阵：$\begin{pmatrix} x & y \end{pmatrix}$

## 调试步骤

1. 输入上面的矩阵公式
2. 打开浏览器开发者工具（F12）
3. 查看控制台中的以下日志：
   - `[Word Preview] ⚠️ 检测到HTML中包含&amp;实体编码` 
   - `[Word Preview] 🔧 紧急修复公式HTML实体`
   - `[Word Preview] 🔧 块级公式HTML实体解码`
   - `[LaTeX Renderer] 🔍 renderFormula调用`
   - `[LaTeX Renderer] ⚠️ 警告：传给MathJax的公式仍包含HTML实体`

## 期望结果
- 应该看到详细的HTML实体解码日志
- 如果仍有问题，会看到警告日志指出问题位置
- 矩阵最终应该正确显示为矩阵形状

## 关键问题排查
- HTML阶段的`&amp;`是否被正确替换为`&`？
- LaTeX提取阶段是否重新引入了HTML实体？
- MathJax渲染时收到的是否是清理后的LaTeX代码？
