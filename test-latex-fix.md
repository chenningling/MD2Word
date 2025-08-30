# LaTeX 公式渲染测试

## 测试1：正常格式（可正常导出）
$$\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u$$

## 测试2：带换行格式（问题场景）
$$
\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u
$$

## 测试3：复杂公式带换行
$$
\begin{align}
\frac{\partial^2 u}{\partial t^2} &= c^2 \nabla^2 u \\
&= c^2 \left( \frac{\partial^2 u}{\partial x^2} + \frac{\partial^2 u}{\partial y^2} \right)
\end{align}
$$

## 测试4：行内公式
这是一个行内公式 $E = mc^2$ 的测试。

## 测试5：多个公式
第一个公式：$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$

第二个公式：
$$
\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}
$$
