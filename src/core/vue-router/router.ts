// vue-router/router.ts - 路由核心实现
// 参照 Vue Router 4 源码

import type { Router, RouterOptions, RouteLocationNormalized, RouteRecord, RouterHistory } from './types'
import { createRouterMatcher } from './matcher'
import { ref } from '../reactivity/reactive'
import { RouterView } from './routerView'
import { RouterLink } from './routerLink'

export function createRouter(options: RouterOptions): Router & { install: (app: any) => void } {
  const { routes, history } = options
  
  const matcher = createRouterMatcher(routes)
  
  const currentRoute = ref<RouteLocationNormalized>({
    path: '/',
    name: undefined,
    params: {},
    query: {},
    hash: '',
    fullPath: '/',
    matched: [],
    meta: {}
  })
  
  let listeners: Array<() => void> = []
  
  function onRouteChange(cb: () => void) {
    listeners.push(cb)
    return () => {
      listeners = listeners.filter(l => l !== cb)
    }
  }
  
  function notifyListeners() {
    listeners.forEach(cb => cb())
  }
  
  function normalizePath(path: string): string {
    return path.replace(/\/+$/, '') || '/'
  }
  
  function navigate(toPath: string, replace: boolean = false) {
    const normalizedPath = normalizePath(toPath)
    
    const matchedRoute = matcher.match(normalizedPath)
    
    if (matchedRoute) {
      currentRoute.value = matchedRoute
      
      if (history.type === 'hash') {
        if (replace) {
          window.location.replace(`#${normalizedPath}`)
        } else {
          window.location.hash = normalizedPath
        }
      } else {
        if (replace) {
          window.history.replaceState({}, '', normalizedPath)
        } else {
          window.history.pushState({}, '', normalizedPath)
        }
      }
      
      notifyListeners()
    }
  }
  
  function push(to: string | { path?: string; name?: string; params?: Record<string, string> }) {
    let path: string
    
    if (typeof to === 'string') {
      path = to
    } else if (to.path) {
      path = to.path
    } else if (to.name) {
      path = resolveNamedRoute(to.name, to.params || {})
    } else {
      path = '/'
    }
    
    navigate(path, false)
  }
  
  function replace(to: string | { path?: string; name?: string; params?: Record<string, string> }) {
    let path: string
    
    if (typeof to === 'string') {
      path = to
    } else if (to.path) {
      path = to.path
    } else if (to.name) {
      path = resolveNamedRoute(to.name, to.params || {})
    } else {
      path = '/'
    }
    
    navigate(path, true)
  }
  
  function go(n: number) {
    window.history.go(n)
  }
  
  function back() {
    window.history.back()
  }
  
  function forward() {
    window.history.forward()
  }
  
  function resolveNamedRoute(name: string, params: Record<string, string>, routes?: RouteRecord[], parentPath: string = ''): string {
    const currentRoutes = routes || matcher.getRoutes()
    
    for (const route of currentRoutes) {
      const fullPath = parentPath + route.path
      
      if (route.name === name) {
        let path = fullPath
        for (const [key, value] of Object.entries(params)) {
          path = path.replace(`:${key}`, value)
        }
        return path
      }
      
      if (route.children) {
        const childPath = resolveNamedRoute(name, params, route.children, fullPath)
        if (childPath) {
          return childPath
        }
      }
    }
    
    return '/'
  }
  
  function addRoute(route: RouteRecord) {
    matcher.addRoute(route)
  }
  
  function getRoutes(): RouteRecord[] {
    return matcher.getRoutes()
  }
  
  if (history === 'hash') {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1)
      const matchedRoute = matcher.match(hash)
      if (matchedRoute) {
        currentRoute.value = matchedRoute
        notifyListeners()
      }
    })
    
    const initialHash = window.location.hash.slice(1) || '/'
    const initialRoute = matcher.match(initialHash)
    if (initialRoute) {
      currentRoute.value = initialRoute
    }
  } else {
    window.addEventListener('popstate', () => {
      const path = window.location.pathname
      const matchedRoute = matcher.match(path)
      if (matchedRoute) {
        currentRoute.value = matchedRoute
        notifyListeners()
      }
    })
    
    const initialPath = window.location.pathname
    const initialRoute = matcher.match(initialPath)
    if (initialRoute) {
      currentRoute.value = initialRoute
    }
  }
  
  function install(app: any) {
    // 参照 Vue Router 4 源码：安装路由到应用
    (window as any).__ROUTER__ = router
    
    // 注册全局组件
    app.component('RouterView', RouterView)
    app.component('RouterLink', RouterLink)
  }
  
  const router: Router & { install: (app: any) => void } = {
    currentRoute: currentRoute as unknown as RouteLocationNormalized,
    push,
    replace,
    go,
    back,
    forward,
    addRoute,
    getRoutes,
    install
  }
  
  return router
}

export function useRouter() {
  return (window as any).__ROUTER__ as Router
}

export function useRoute() {
  return useRouter().currentRoute.value
}
