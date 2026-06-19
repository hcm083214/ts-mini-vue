// vue-router/matcher.ts - 路由匹配逻辑
// 参照 Vue Router 4 源码实现简化版

import type { RouteRecord, RouteLocationNormalized } from './types'

export function createRouterMatcher(routes: RouteRecord[]): {
  match: (path: string) => RouteLocationNormalized | null
  addRoute: (route: RouteRecord) => void
  getRoutes: () => RouteRecord[]
} {
  function match(path: string): RouteLocationNormalized | null {
    const normalizedPath = path.replace(/\/+$/, '') || '/'
    
    for (const route of routes) {
      const matchResult = matchRoute(route, normalizedPath, [], {})
      if (matchResult) {
        return matchResult
      }
    }
    
    return null
  }
  
  function matchRoute(route: RouteRecord, path: string, matched: RouteRecord[], params: Record<string, string>): RouteLocationNormalized | null {
    const routeSegments = route.path.split('/').filter(Boolean)
    const pathSegments = path.split('/').filter(Boolean)
    
    const matchedSegments = matched.length === 0 ? 0 : matched[matched.length - 1].path.split('/').filter(Boolean).length
    const availableSegments = pathSegments.slice(matchedSegments)
    
    if (routeSegments.length > availableSegments.length) {
      return null
    }
    
    const currentParams: Record<string, string> = { ...params }
    const currentPath = '/' + availableSegments.slice(0, routeSegments.length).join('/')
    
    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i]
      const pathSegment = availableSegments[i]
      
      if (routeSegment.startsWith(':')) {
        const paramName = routeSegment.slice(1)
        currentParams[paramName] = pathSegment
      } else if (routeSegment !== pathSegment) {
        return null
      }
    }
    
    const newMatched = [...matched, route]
    
    if (route.children) {
      for (const child of route.children) {
        const childMatch = matchRoute(child, path, newMatched, currentParams)
        if (childMatch) {
          return childMatch
        }
      }
    }
    
    if (routeSegments.length === availableSegments.length) {
      return {
        path: route.path,
        name: route.name,
        params: currentParams,
        query: {},
        hash: '',
        fullPath: path,
        matched: newMatched,
        meta: route.meta || {}
      }
    }
    
    return null
  }
  
  function addRoute(route: RouteRecord) {
    routes.push(route)
  }
  
  function getRoutes() {
    return routes
  }
  
  return { match, addRoute, getRoutes }
}
