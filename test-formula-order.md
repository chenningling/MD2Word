# LaTeX 公式顺序测试

## 1. 基础数学运算

### 单行公式
简单加法：$a + b = c$

乘法和除法：$x \cdot y = \frac{p}{q}$

### 多行公式
$$a + b = c \\
x \cdot y = \frac{p}{q}$$

## 2. 分数和根式

### 复杂分数
$$\frac{a + b}{c + d} = \frac{\frac{x}{y} + \frac{p}{q}}{\frac{m}{n} - \frac{r}{s}}$$

### 根式
$$\sqrt{x^2 + y^2} = \sqrt[n]{\frac{a}{b}}$$

## 3. 指数和对数

### 指数
$$e^{i\pi} + 1 = 0$$

### 对数
$$\log_a b = \frac{\ln b}{\ln a}$$

## 4. 求和与积分

### 求和
$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$

### 积分
$$\int_0^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$$

### 多重积分
$$\iint_D f(x,y) \, dx \, dy = \iiint_V g(x,y,z) \, dx \, dy \, dz$$

## 5. 微分方程

### 偏微分方程
$$\frac{\partial^2 u}{\partial t^2} = c^2 \nabla^2 u$$

### 常微分方程
$$\frac{dy}{dx} + P(x)y = Q(x)$$

## 6. 矩阵和向量

### 矩阵
$$\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
\begin{pmatrix}
x \\
y
\end{pmatrix} = 
\begin{pmatrix}
ax + by \\
cx + dy
\end{pmatrix}$$

### 行列式
$$\det(A) = \begin{vmatrix}
a & b & c \\
d & e & f \\
g & h & i
\end{vmatrix}$$

## 7. 极限和级数

### 极限
$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$

### 无穷级数
$$\sum_{n=0}^{\infty} \frac{x^n}{n!} = e^x$$

## 8. 三角函数

### 三角恒等式
$$\sin^2 \theta + \cos^2 \theta = 1$$

### 复杂三角表达式
$$\sin(A + B) = \sin A \cos B + \cos A \sin B$$

## 9. 概率统计

### 正态分布
$$f(x) = \frac{1}{\sigma\sqrt{2\pi}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

### 贝叶斯公式
$$P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}$$

## 10. 复数

### 欧拉公式
$$e^{i\theta} = \cos \theta + i \sin \theta$$

### 复数运算
$$z_1 \cdot z_2 = |z_1| |z_2| e^{i(\theta_1 + \theta_2)}$$

## 11. 集合论

### 集合运算
$$A \cap B = \{x : x \in A \text{ and } x \in B\}$$

### 并集
$$A \cup B = \{x : x \in A \text{ or } x \in B\}$$

## 12. 特殊符号

### 希腊字母
$$\alpha, \beta, \gamma, \Delta, \Omega, \lambda, \mu, \nu, \xi, \pi, \rho, \sigma, \tau, \phi, \chi, \psi$$

### 数学符号
$$\infty, \partial, \nabla, \in, \subset, \supset, \cup, \cap, \forall, \exists, \emptyset, \mathbb{R}, \mathbb{C}$$

## 13. 化学公式测试

### 化学反应
$$2H_2 + O_2 \rightarrow 2H_2O$$

### 分子式
$$C_6H_{12}O_6 + 6O_2 \rightarrow 6CO_2 + 6H_2O$$

## 14. 物理公式

### 质能方程
$$E = mc^2$$

### 薛定谔方程
$$i\hbar \frac{\partial \psi}{\partial t} = \hat{H} \psi$$

### 麦克斯韦方程组
$$\begin{align}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\epsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0 \mathbf{J} + \mu_0 \epsilon_0 \frac{\partial \mathbf{E}}{\partial t}
\end{align}$$
