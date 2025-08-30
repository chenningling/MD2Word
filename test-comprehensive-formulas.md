# 全面公式测试

## 1. 矩阵公式测试

### 1.1 标准矩阵
$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}$$

### 1.2 3x3矩阵
$$\begin{pmatrix}
1 & 2 & 3 \\
4 & 5 & 6 \\
7 & 8 & 9
\end{pmatrix}$$

### 1.3 方括号矩阵
$$\begin{bmatrix}
x & y \\
z & w
\end{bmatrix}$$

### 1.4 行内矩阵
这是一个行内矩阵 $\begin{pmatrix} a & b \\ c & d \end{pmatrix}$ 测试。

## 2. 分数和根式

### 2.1 复杂分数
$$\frac{x^2 + 2x + 1}{x^2 - 1} = \frac{(x+1)^2}{(x-1)(x+1)} = \frac{x+1}{x-1}$$

### 2.2 嵌套分数
$$\frac{1}{1 + \frac{1}{1 + \frac{1}{1 + \frac{1}{x}}}}$$

### 2.3 根式
$$\sqrt{x^2 + y^2} = \sqrt{\frac{a^2 + b^2}{c^2}}$$

### 2.4 高次根
$$\sqrt[3]{x^3 + y^3} = \sqrt[n]{a^n + b^n}$$

## 3. 上下标和求和

### 3.1 复杂上下标
$$x_{i,j}^{(k)} = a_i^{(k)} \cdot b_j^{(k)}$$

### 3.2 求和公式
$$\sum_{i=1}^{n} x_i = x_1 + x_2 + \cdots + x_n$$

### 3.3 积分公式
$$\int_{a}^{b} f(x) \, dx = F(b) - F(a)$$

### 3.4 多重积分
$$\iint_{D} f(x,y) \, dx \, dy = \int_{c}^{d} \int_{a}^{b} f(x,y) \, dx \, dy$$

## 4. 三角函数和对数

### 4.1 三角恒等式
$$\sin^2 x + \cos^2 x = 1$$

### 4.2 复杂三角函数
$$\sin(A + B) = \sin A \cos B + \cos A \sin B$$

### 4.3 对数运算
$$\log_a(xy) = \log_a x + \log_a y$$

### 4.4 自然对数
$$\ln(e^x) = x \quad \text{和} \quad e^{\ln x} = x$$

## 5. 希腊字母和特殊符号

### 5.1 希腊字母
$$\alpha + \beta = \gamma \quad \text{和} \quad \Delta \Phi = \Omega$$

### 5.2 特殊符号
$$x \in \mathbb{R} \quad \text{且} \quad A \subseteq B \cup C$$

### 5.3 箭头和关系
$$f: A \rightarrow B \quad \text{满足} \quad x \mapsto f(x)$$

## 6. 系统方程组

### 6.1 线性方程组
$$\begin{cases}
x + y = 5 \\
2x - y = 1
\end{cases}$$

### 6.2 复杂方程组
$$\begin{align}
ax + by &= c \\
dx + ey &= f \\
gx + hy &= i
\end{align}$$

## 7. 极限和导数

### 7.1 极限定义
$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$

### 7.2 导数公式
$$\frac{d}{dx}[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)$$

### 7.3 偏导数
$$\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h,y) - f(x,y)}{h}$$

## 8. 概率和统计

### 8.1 正态分布
$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

### 8.2 贝叶斯公式
$$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$

### 8.3 期望值
$$E[X] = \sum_{i=1}^{n} x_i \cdot P(X = x_i)$$

## 9. 行内公式测试

在文本中嵌入公式：当 $a \neq 0$ 时，二次方程 $ax^2 + bx + c = 0$ 的解为 $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$。

斐波那契数列的通项公式是 $F_n = \frac{\varphi^n - \psi^n}{\sqrt{5}}$，其中 $\varphi = \frac{1+\sqrt{5}}{2}$ 和 $\psi = \frac{1-\sqrt{5}}{2}$。

## 10. 复杂组合公式

### 10.1 泰勒级数
$$e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots$$

### 10.2 傅里叶变换
$$F(\omega) = \int_{-\infty}^{\infty} f(t) e^{-i\omega t} \, dt$$

### 10.3 拉普拉斯变换
$$\mathcal{L}\{f(t)\} = F(s) = \int_{0}^{\infty} f(t) e^{-st} \, dt$$

---

**测试说明**：
1. 所有矩阵公式应该正确显示为标准的行列格式
2. 分数应该有清晰的分子分母显示
3. 上下标应该正确定位
4. 希腊字母和特殊符号应该正确渲染
5. 行内公式应该与文本正确对齐

如果发现任何显示异常，请查看浏览器控制台的调试日志！
