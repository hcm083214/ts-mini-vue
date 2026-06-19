// core/index.ts - 主入口，统一导出所有 API（参照 Vue 3 的 vue 包）

// 导出响应式系统
export { 
    reactive, 
    ref, 
    computed, 
    watch,
    watchEffect, 
    onMounted, 
    onUnmounted,
    triggerMounted,
    triggerUnmounted
} from './reactivity'

// 导出运行时核心
export { 
    createApp,
    h, 
    createVNode, 
    toDisplayString,
    Fragment,
    resolveComponent,
    type VNode,
    type Component,
    type ComponentInstance
} from './runtime-core'

// 导出编译器
export { compile } from './compiler'

// 导出路由
export { 
    createRouter, 
    useRouter, 
    useRoute,
    RouterView,
    RouterLink,
    installRouter,
    createWebHistory,
    createWebHashHistory,
    type Router,
    type RouteRecord,
    type RouteRecordRaw,
    type RouteLocationNormalized,
    type RouterLinkProps,
    type RouterViewProps
} from './vue-router'