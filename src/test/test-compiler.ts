// 简单的编译器测试 - 直接在 Node.js 环境中运行
// 注意：这个文件需要在支持 ES modules 的环境中运行

import { compile } from '../core/compiler/index.js'

// 测试 v-for 编译
const template1 = `<div v-for="item in items" :key="item.message">{{ item.message }}</div>`

console.log('=== Test 1: Basic v-for ===')
try {
    const result = compile(template1)
    console.log('Compiled code:')
    console.log(result)
} catch (error) {
    console.error('Compilation error:', error)
}

// 测试带索引的 v-for
const template2 = `
<li v-for="(item, index) in items">
  {{ index }} - {{ item.message }}
</li>
`

console.log('=== Test 2: v-for with index ===')
console.log(compile(template2))
console.log('')

// 测试 main.ts 中的模板
const template3 = `
<div>
  <div v-for="item in items" :key="item.message">
    {{ item.message }}
  </div>
</div>
`

console.log('=== Test 3: v-for in nested structure ===')
console.log(compile(template3))
