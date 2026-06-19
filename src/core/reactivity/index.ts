// reactivity/index.ts - 响应式系统统一导出
export { 
    reactive, 
    ref, 
    isRef,
    computed, 
    watch,
    watchEffect, 
    onMounted, 
    onUnmounted, 
    triggerMounted, 
    triggerUnmounted,
    ReactiveEffect,
    type ReactiveEffect as ReactiveEffectType
} from './reactive'
