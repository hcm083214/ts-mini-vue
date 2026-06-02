# 编译器属性值特殊字符处理修复

## 问题描述

当模板中包含比较运算符（如 `>=`、`<=`、`>`、`<`）的动态属性绑定时，tokenizer 会错误地截断属性值。

**示例：**
```html
<button @click="increment" :disabled="count >= 2">Click Me</button>
```

**错误表现：**
- 被解析为：`<button count="undefined">= 2">Click Me</button>`
- 属性值 `count >= 2` 在 `>` 处被截断

## 根本原因

原 tokenizer 使用正则表达式 `/^<([a-zA-Z][\w-]*)([\s\S]*?)(\/?)>/` 匹配标签，其中 `[\s\S]*?` 是非贪婪匹配，会在遇到第一个 `>` 时就停止，导致包含在属性值中的 `>` 被误认为是标签结束符。

## 解决方案

参照 Vue 3 源码及《Vue.js 设计与实现》的实现策略，改用**逐字符解析**方式：

1. 先用正则提取标签名
2. 从标签名后开始逐字符扫描
3. 跟踪引号状态（是否在引号内、使用的是什么引号）
4. 只有在**不在引号内**时遇到 `>` 才认为是真正的标签结束

### 核心代码

```typescript
let inQuote = false;
let quoteChar = '';
let isSelfClosing = false;

while (pos < template.length) {
  const char = template[pos];
  
  if (inQuote) {
    // 在引号内，只有遇到相同的引号才退出
    if (char === quoteChar) {
      inQuote = false;
    }
  } else {
    // 不在引号内
    if (char === '"' || char === "'") {
      inQuote = true;
      quoteChar = char;
    } else if (char === '>') {
      // 找到结束标签
      break;
    } else if (char === '/' && template[pos + 1] === '>') {
      // 自闭合标签 />
      isSelfClosing = true;
      pos++;
      break;
    }
  }
  
  pos++;
}
```

## 测试验证

### 测试用例

1. ✅ `:disabled="count >= 2"` - 大于等于运算符
2. ✅ `:class="isActive ? 'active' : 'inactive'"` - 三元表达式
3. ✅ `v-if="count > 0"` - 大于运算符
4. ✅ `:title="message.length > 10 ? message.slice(0, 10) : message"` - 复杂表达式

### 测试结果

编译输出：
```javascript
h("button", {"onClick": increment, "disabled": count >= 2}, "Click Me")
```

运行时行为：
- `count=0` → `disabled=false` ✅
- `count=2` → `disabled=true` ✅
- `count=3` → `disabled=true` ✅

## 修改文件

- `src/core/compiler/tokenizer.ts` - 重构标签解析逻辑

## 参考

- Vue 3 源码：`@vue/compiler-core/src/tokenize.ts`
- 《Vue.js 设计与实现》第 15 章：编译器实现原理
