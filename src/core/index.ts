import { compile } from './compiler/index'

// 编译器
export { compile } from './compiler/index'

// 渲染器
export { createApp } from './renderer/index'
export { h, createVNode, toDisplayString } from './renderer/h'
export { createRenderer } from './renderer/render'

// 响应式系统
export { reactive, ref, computed, watchEffect } from './reactivity/reactive'

// 运行时编译器（可选）
export function createRuntimeCompiler(template: string) {
    const code = compile(template);
    // 注意：这里需要注入 Vue 的全局变量（h, toDisplayString 等）
    return new Function('h', 'toDisplayString', code + '\nreturn render');
}
