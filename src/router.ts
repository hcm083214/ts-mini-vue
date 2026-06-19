import { createRouter,createWebHistory, useRouter, useRoute } from './core'
import TestCom from './test/TestCom'

const routes = [
  { path: '/', component: TestCom },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router