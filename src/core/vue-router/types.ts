// vue-router/types.ts - 路由类型定义
// 参照 Vue Router 4 源码

export interface RouteRecord {
  path: string
  name?: string
  component: any
  children?: RouteRecord[]
  props?: boolean | Record<string, any> | ((route: RouteLocationNormalized) => Record<string, any>)
  meta?: Record<string, any>
}

export interface RouteLocationNormalized {
  path: string
  name: string | undefined
  params: Record<string, string>
  query: Record<string, string>
  hash: string
  fullPath: string
  matched: RouteRecord[]
  meta: Record<string, any>
}

export interface RouterHistory {
  type: 'hash' | 'history'
}

export interface RouterOptions {
  history: RouterHistory
  routes: RouteRecord[]
}

export interface Router {
  currentRoute: { value: RouteLocationNormalized }
  push(to: string | { path?: string; name?: string; params?: Record<string, string>; query?: Record<string, string> }): void
  replace(to: string | { path?: string; name?: string; params?: Record<string, string>; query?: Record<string, string> }): void
  go(n: number): void
  back(): void
  forward(): void
  addRoute(route: RouteRecord): void
  getRoutes(): RouteRecord[]
}

export interface RouterLinkProps {
  to: string | { path?: string; name?: string; params?: Record<string, string>; query?: Record<string, string> }
  replace?: boolean
  activeClass?: string
  exactActiveClass?: string
}

export interface RouterViewProps {
  name?: string
}

export type RouteRecordRaw = RouteRecord
