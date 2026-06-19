// runtime-core/index.ts - runtime-core 统一导出
export { Fragment, type VNode, type VNodeProps, type ComponentInstance } from './vnode'
export { h, createVNode, toDisplayString } from './h'
export { 
    type Component, 
    type ComponentContext, 
    type SetupResult,
    mountComponent, 
    updateComponent,
    resolveProps,
    resolveComponent,
    setCurrentInstance,
} from './component'
export { createRenderer } from './renderer'
export { createApp } from './apiCreateApp'
