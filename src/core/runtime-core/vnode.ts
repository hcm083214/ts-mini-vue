// runtime-core/vnode.ts - VNode 类型定义和工具函数
import { Component } from './component'
import { ReactiveEffect } from '../reactivity/reactive'

// Fragment 类型标识符
export const Fragment = Symbol('Fragment')

// 虚拟 DOM 节点属性类型
export type VNodeProps = Record<string, any>

// 组件实例
export interface ComponentInstance {
    vnode: VNode
    props: VNodeProps
    setupState: Record<string, any>
    render: (() => VNode | null) | null
    isMounted: boolean
    subTree: VNode | null
    update: ReactiveEffect | null  // 组件的更新 effect
    container?: HTMLElement  // 保存挂载的容器引用
}

// 虚拟 DOM 节点类型
export interface VNode {
    type: string | Function | Component | symbol  // 支持字符串标签、组件函数、组件对象或 Fragment
    props?: VNodeProps
    children?: VNode[] | string
    el: HTMLElement   // 支持 SVG 元素
    key?: string | number
    tag?: string  // 原始标签名，用于 SVG 判断
    component?: ComponentInstance
}

/**
 * 判断是否为 VNode
 */
export function isVNode(val: any): val is VNode {
    return val && val.type !== undefined
}
