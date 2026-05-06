import { VNode } from "./types";
import { patch } from "./patch";
import { RendererOptions, unmounted } from "./mounter";
import { createVNode } from "./h";


// 扩展 HTMLElement 类型以支持 _vnode 属性
declare global {
    interface HTMLElement {
        _vnode?: VNode;
    }
}

export function createRenderer(rendererOptions?: RendererOptions) {
    const render = (vnode: VNode | null, container: HTMLElement) => {
        if (vnode) {
            patch(container._vnode || null, vnode, container)
        } else {
            if (container._vnode) {
                const el = container._vnode.el;
                unmounted(el as HTMLElement);
            }
        }
        container._vnode = vnode as VNode;
    }
    return {
        render,
        createVNode
    }
}
