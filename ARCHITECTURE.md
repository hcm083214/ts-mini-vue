# ts-min-vue 项目架构说明

本项目按照 Vue 3 源码结构进行组织，分为以下核心模块：

## 📁 目录结构

```
src/core/
├── reactivity/          # 响应式系统（对应 @vue/reactivity）
│   ├── reactive.ts      # reactive, ref, computed, watchEffect 实现
│   └── index.ts         # 统一导出
│
├── runtime-core/        # 运行时核心（对应 @vue/runtime-core）
│   ├── vnode.ts         # VNode 类型定义和工具函数
│   ├── h.ts             # h 函数、createVNode、toDisplayString
│   ├── component.ts     # 组件挂载、更新、setup 处理
│   ├── renderer.ts      # 渲染器核心（createRenderer）
│   ├── apiCreateApp.ts  # createApp API 实现
│   └── index.ts         # 统一导出
│
├── runtime-dom/         # DOM 运行时（对应 @vue/runtime-dom）
│   ├── patch.ts         # patch 算法（diff 和更新）
│   ├── nodeOps.ts       # DOM 操作封装（mountElement, patchProp 等）
│   └── index.ts         # 统一导出
│
├── compiler/            # 编译器（对应 @vue/compiler-core）
│   ├── tokenizer.ts     # 词法分析器
│   ├── parser.ts        # 语法分析器
│   ├── generator.ts     # 代码生成器
│   └── index.ts         # compile 函数
│
└── index.ts             # 主入口，统一导出所有 API
```

## 🏗️ 模块职责

### 1. reactivity（响应式系统）
- **功能**：提供响应式数据管理能力
- **核心 API**：
  - `reactive()`: 创建响应式对象
  - `ref()`: 创建响应式引用
  - `computed()`: 创建计算属性
  - `watchEffect()`: 创建副作用监听

### 2. runtime-core（运行时核心）
- **功能**：平台无关的运行时逻辑
- **核心模块**：
  - `vnode.ts`: VNode 数据结构定义
  - `h.ts`: 虚拟节点创建函数
  - `component.ts`: 组件生命周期管理
  - `renderer.ts`: 渲染器实现
  - `apiCreateApp.ts`: 应用创建 API

### 3. runtime-dom（DOM 运行时）
- **功能**：DOM 特定的渲染逻辑
- **核心模块**：
  - `patch.ts`: 虚拟 DOM diff 和更新算法
  - `nodeOps.ts`: DOM 操作封装（增删改查）

### 4. compiler（编译器）
- **功能**：模板编译为渲染函数
- **核心流程**：
  1. Tokenizer: 模板字符串 → Token 数组
  2. Parser: Token 数组 → AST
  3. Generator: AST → 渲染函数字符串

## 🔄 模块依赖关系

```
应用层 (main.ts)
    ↓
core/index.ts (统一导出)
    ↓
runtime-core ← → runtime-dom
    ↓
reactivity + compiler
```

**依赖规则**：
- `runtime-dom` 依赖 `runtime-core`
- `runtime-core` 依赖 `reactivity` 和 `compiler`
- 各模块保持单向依赖，避免循环依赖

## 🎯 设计原则

1. **模块化**：每个模块职责单一，易于维护和测试
2. **分层清晰**：核心逻辑与平台特定逻辑分离
3. **参照 Vue 3**：严格遵循 Vue 3 源码的设计思想
4. **类型安全**：使用 TypeScript 提供完整的类型定义

## 📝 使用示例

```typescript
import { createApp, reactive, ref } from './core'

const App = {
  template: `
    <div>
      <h1>{{ title }}</h1>
      <p>{{ count }}</p>
      <button @click="increment">Click</button>
    </div>
  `,
  setup() {
    const title = ref('Hello Mini Vue')
    const count = ref(0)
    
    const increment = () => {
      count.value++
    }
    
    return { title, count, increment }
  }
}

createApp(App).mount('#app')
```

## 🚀 开发指南

### 添加新功能
1. 确定功能所属模块（reactivity / runtime-core / runtime-dom / compiler）
2. 在对应模块下创建文件
3. 在模块的 index.ts 中导出
4. 在主入口 core/index.ts 中重新导出（如需要）

### 修改现有功能
1. 定位到具体模块文件
2. 修改后验证类型检查通过
3. 确保不影响其他模块的导入

## 📚 参考资料

- [Vue 3 源码](https://github.com/vuejs/core)
- [Vue.js 设计与实现 - 霍春阳](https://item.jd.com/13497618.html)
