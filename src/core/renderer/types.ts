// 组件上下文类型
export interface ComponentContext {
    emit: (event: string, ...args: any[]) => void
}

// Setup 函数返回类型 - 使用更具体的类型
export type SetupResult = Record<string, any> | ((...args: any[]) => any)

// 组件类型 - 使用泛型提升类型安全性
export interface Component<P = Record<string, any>> {
    setup?: (props: P, context: ComponentContext) => SetupResult
    render?: () => VNode
    template?: string  // 支持模板字符串
    props?: string[]
    emits?: string[]
}

// 虚拟 DOM 节点属性类型
export type VNodeProps = Record<string, any>

// 组件实例
export interface ComponentInstance {
    vnode: VNode
    props: VNodeProps
    setupState: SetupResult
    render: () => VNode | null
    isMounted: boolean
    subTree: VNode | null
}

// 虚拟 DOM 节点类型
export interface VNode {
    type: string | Function | Component  // 支持字符串标签、组件函数或组件对象
    props?: VNodeProps
    children?: VNode[] | string
    el: HTMLElement   // 支持 SVG 元素
    key?: string | number
    tag?: string  // 原始标签名，用于 SVG 判断
    component?: ComponentInstance
}