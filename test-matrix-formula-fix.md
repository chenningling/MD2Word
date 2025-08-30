# 矩阵公式渲染修复测试

## 问题描述
矩阵公式在Word预览中显示为 `(a   amp; b c   amp; d)` 而不是正确的矩阵格式。

## 测试用例

### 2.1 简单矩阵

$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}$$

### 2.2 复杂矩阵

$$\begin{bmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{bmatrix}$$

### 2.3 带分数的矩阵

$$\begin{vmatrix}
\frac{1}{2} & \frac{3}{4} \\
\frac{5}{6} & \frac{7}{8}
\end{vmatrix}$$

### 2.4 行内矩阵

这是一个行内矩阵：$\begin{pmatrix} x \\ y \end{pmatrix}$，应该正确显示。

## 修复内容

1. ✅ 在`WordPreview.js`中添加HTML实体解码
2. ✅ 在`LaTeXRenderer.js`中添加HTML实体解码
3. ✅ 创建`decodeHtmlEntities`工具函数

## 预期结果

修复后，所有矩阵公式应该正确渲染为矩阵格式，而不是显示HTML实体编码的文本。
