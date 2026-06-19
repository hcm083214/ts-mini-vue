import { createRouter,createWebHistory, useRouter, useRoute } from './core'
import TestCom from './test/TestCom'
import WatchTestCom from './test/WatchTestCom'

const routes = [
  { path: '/', component: TestCom },
  { path: '/watch', component: WatchTestCom },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router