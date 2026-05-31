// runtime-core/renderer.ts - 渲染器核心
import { VNode } from './vnode'
import { patch } from '../runtime-dom/patch'

// 扩展 HTMLElement 类型以支持 _vnode 属性
declare global {
    interface HTMLElement {
        _vnode?: VNode
    }
}

export function createRenderer() {
    const render = (vnode: VNode | null, container: HTMLElement) => {
        if (vnode) {
            patch(container._vnode || null, vnode, container)
        } else {
            if (container._vnode) {
                const el = container._vnode.el
                if (el) {
                    const parent = el.parentNode
                    if (parent) {
                        parent.removeChild(el)
                    }
                }
            }
        }
        container._vnode = vnode as VNode
    }
    
    return {
        render
    }
}
