// vue-router/routerLink.ts - RouterLink 组件
// 参照 Vue Router 4 源码

import { h, type Component } from '../runtime-core/h'
import { useRouter } from './router'
import type { RouterLinkProps } from './types'
import { watchEffect } from '../reactivity/index'

export const RouterLink = {
  name: 'RouterLink',
  setup(props: RouterLinkProps, { slots }: { slots?: Record<string, any> }) {
    const router = useRouter()
    
    let isActive = false
    let isExactActive = false
    
    function getHref(): string {
      const { to } = props
      
      if (typeof to === 'string') {
        return to
      }
      
      if (to.path) {
        return to.path
      }
      
      if (to.name) {
        function findRouteByName(name: string, routes: any[], parentPath: string = ''): string | null {
          for (const route of routes) {
            const fullPath = parentPath + route.path
            
            if (route.name === name) {
              let path = fullPath
              if (to.params) {
                for (const [key, value] of Object.entries(to.params)) {
                  path = path.replace(`:${key}`, value)
                }
              }
              return path
            }
            
            if (route.children) {
              const childPath = findRouteByName(name, route.children, fullPath)
              if (childPath) {
                return childPath
              }
            }
          }
          return null
        }
        
        const routes = router.getRoutes()
        const path = findRouteByName(to.name, routes)
        
        if (path) {
          return path
        }
      }
      
      return '/'
    }
    
    function handleClick(e: MouseEvent) {
      e.preventDefault()
      
      const to = props.to
      const replace = props.replace || false
      
      if (replace) {
        router.replace(to)
      } else {
        router.push(to)
      }
    }
    
    function updateActiveState() {
      const currentPath = router.currentRoute.value.path
      const href = getHref()
      
      isExactActive = currentPath === href
      isActive = currentPath.startsWith(href) || (href === '/' && currentPath === '/')
    }
    
    watchEffect(() => {
      updateActiveState()
    })
    
    return () => {
      const href = getHref()
      const activeClass = props.activeClass || 'router-link-active'
      const exactActiveClass = props.exactActiveClass || 'router-link-exact-active'
      
      const classes: string[] = ['router-link']
      if (isActive) classes.push(activeClass)
      if (isExactActive) classes.push(exactActiveClass)
      
      return h('a', {
        href,
        class: classes.join(' '),
        onClick: handleClick
      }, slots && slots.default ? slots.default() : '')
    }
  }
}
