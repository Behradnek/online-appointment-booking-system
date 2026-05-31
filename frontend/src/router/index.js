import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import UserDashboard from '../views/UserDashboard.vue'
import ProviderDashboard from '../views/ProviderDashboard.vue'
import AdminDashboard from '../views/AdminDashboard.vue'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/login', component: Login, meta: { guest: true } },
  { path: '/register', component: Register, meta: { guest: true } },
  { path: '/dashboard', component: UserDashboard, meta: { roles: ['user'] } },
  { path: '/provider', component: ProviderDashboard, meta: { roles: ['provider'] } },
  { path: '/admin', component: AdminDashboard, meta: { roles: ['admin'] } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

function dashboardFor(role) {
  if (role === 'admin') return '/admin'
  if (role === 'provider') return '/provider'
  return '/dashboard'
}

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || 'null')

  if (to.meta.guest && token && user) return dashboardFor(user.role)
  if (!to.meta.guest && (!token || !user)) return '/login'
  if (to.meta.roles && !to.meta.roles.includes(user?.role)) return dashboardFor(user?.role)
  return true
})

export { dashboardFor }
export default router
