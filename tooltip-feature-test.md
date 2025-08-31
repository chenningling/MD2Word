# Tooltip 功能测试文档

## 测试用例1：无公式文档
这是一个普通的Markdown文档，没有LaTeX公式。
此时导出按钮应该显示：**导出为Word文档(.docx格式)**

## 测试用例2：单个公式
这里有一个行内公式：$E = mc^2$
此时导出按钮应该显示带有绿色提示的公式检测信息。

## 测试用例3：5个及以下公式
1. 第一个公式：$\alpha + \beta = \gamma$
2. 第二个公式：$$\int_{0}^{1} x dx = \frac{1}{2}$$
3. 第三个公式：$\sqrt{a^2 + b^2}$
4. 第四个公式：$$\sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$
5. 第五个公式：$\lim_{x \to 0} \frac{\sin x}{x} = 1$

## 测试用例4：10个及以下公式
除了上面5个公式，再加上：
6. $\frac{d}{dx}e^x = e^x$
7. $$\begin{matrix} a & b \\ c & d \end{matrix}$$
8. $\cos^2 x + \sin^2 x = 1$
9. $$\nabla \times \vec{E} = -\frac{\partial \vec{B}}{\partial t}$$
10. $\log_a b = \frac{\ln b}{\ln a}$

## 测试用例5：大量公式（超过10个）
再加上更多公式：
11. $\pi = 3.14159...$
12. $$e = \lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n$$
13. $\phi = \frac{1 + \sqrt{5}}{2}$
14. $$\zeta(2) = \sum_{n=1}^{\infty} \frac{1}{n^2} = \frac{\pi^2}{6}$$
15. $i^2 = -1$

此时应该显示橙色/红色警告提示。
