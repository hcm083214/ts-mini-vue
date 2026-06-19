// runtime-core/apiCreateApp.ts - createApp API 实现
import { Component } from './component'
import { createVNode } from './h'
import { createRenderer } from './renderer'
import { watchEffect } from '../reactivity/index'

const { render } = createRenderer()

export function createApp(rootComponent: Component) {
    // 参照 Vue 3 源码：全局组件注册表
    const globalComponents: Record<string, Component> = {}
    
    const app = {
        mount(container: HTMLElement | string) {
            const containerElement = typeof container === 'string' 
                ? document.querySelector(container) 
                : container

            if (!containerElement) {
                throw new Error(`Target container is not a DOM element.`)
            }

            // 参照 Vue 3 源码：将全局组件注入到根组件的 components 选项中
            if (!rootComponent.components) {
                rootComponent.components = {}
            }
            Object.assign(rootComponent.components, globalComponents)

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
        },
        // 参照 Vue 3 源码：注册全局组件
        component(name: string, component: Component) {
            globalComponents[name] = component
            return app
        },
        // 参照 Vue 3 源码：全局配置
        config: {
            globalProperties: {}
        }
    }
    return app
}
