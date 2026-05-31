// runtime-core/apiCreateApp.ts - createApp API 实现
import { Component } from './component'
import { createVNode } from './h'
import { createRenderer } from './renderer'
import { watchEffect } from '../reactivity/index'

const { render } = createRenderer()

export function createApp(rootComponent: Component) {
    const app = {
        mount(container: HTMLElement | string) {
            const containerElement = typeof container === 'string' 
                ? document.querySelector(container) 
                : container

            if (!containerElement) {
                throw new Error(`Target container is not a DOM element.`)
            }

            const vnode = createVNode(rootComponent)
            watchEffect(() => {
                render(vnode, containerElement as HTMLElement)
            })
        },
        use(plugin: any) {
            if (typeof plugin === 'function') {
                plugin(app)
            } else if (plugin && typeof plugin.install === 'function') {
                plugin.install(app)
            }
            return app
        }
    }
    return app
}
