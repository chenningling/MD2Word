# NARY结构修复测试

专门测试求和符号和积分符号中的空元素修复

## 拉格朗日插值（重点测试）
$$
L(x) = \sum_{j=0}^{n} y_j \prod_{\substack{k=0 \\ k \neq j}}^{n} \frac{x - x_k}{x_j - x_k}
$$
