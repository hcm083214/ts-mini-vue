import { createRenderer } from "./render";
import { Component } from "./types";
import { Fragment } from "./h";

const { render, createVNode } = createRenderer();

export function createApp(rootComponent: Component) {
    const app = {
        mount(container: HTMLElement | string) {
            const containerElement = typeof container === 'string' 
                ? document.querySelector(container) 
                : container;

            if (!containerElement) {
                throw new Error(`Target container is not a DOM element.`);
            }

            const vnode = createVNode(rootComponent);
            console.log("🚀 ~ createApp ~ vnode:", vnode)
            render(vnode, containerElement as HTMLElement);
        },
        use(plugin: any) {
            if (typeof plugin === 'function') {
                plugin(app);
            } else if (plugin && typeof plugin.install === 'function') {
                plugin.install(app);
            }
            return app;
        }
    }
    return app;
}

// 导出 Fragment
export { Fragment }
