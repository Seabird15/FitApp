import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import CoachDashboard from '../views/CoachDashboard.vue'
import AthleteDashboard from '../views/AthleteDashboard.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
  {
    path: '/coach',
    name: 'coach-dashboard',
    component: CoachDashboard,
    meta: { requiresAuth: true, role: 'coach' },
  },
  {
    path: '/athlete',
    name: 'athlete-dashboard',
    component: AthleteDashboard,
    meta: { requiresAuth: true, role: 'athlete' },
  },
  {
    path: '/',
    redirect: '/login',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
// Guard global
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Esperar a que termine initAuthListener (si lo usas)
  if (authStore.loading) {
    // puedes dejar un loader más adelante, por ahora:
    return next()
  }

  // Rutas que requieren login
  if (to.meta.requiresAuth && !authStore.user) {
    return next('/login')
  }

  // Rutas con rol específico
  if (to.meta.role && authStore.profile?.role !== to.meta.role) {
    return next('/login')
  }

  next()
})