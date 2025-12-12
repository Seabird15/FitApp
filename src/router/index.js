import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import CoachDashboard from '../views/CoachDashboard.vue'
import AthleteDashboard from '../views/AthleteDashboard.vue'
import CoachAthleteRoutinesView from '@/views/CoachAthleteRoutinesView.vue'
import CoachAthleteProfileView from '@/views/CoachAthleteProfileView.vue'
import AthleteProfileEditView from '@/views/AthleteProfileEditView.vue'
import RegisterView from '@/views/RegisterView.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },
    {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
  {
    path: '/coach',
    name: 'coach-dashboard',
    component: CoachDashboard,
    meta: { requiresAuth: true, role: 'coach' },
  },
    {
    path: '/coach/athletes/:athleteId/routines',
    name: 'coach-athlete-routines',
    component: CoachAthleteRoutinesView,
    meta: { requiresAuth: true, role: 'coach' },
  },
  {
    path: '/coach/athletes/:athleteId/profile',
    name: 'coach-athlete-profile',
    component: CoachAthleteProfileView,
    meta: { requiresAuth: true, role: 'coach' },
  },
  {
    path: '/athlete',
    name: 'athlete-dashboard',
    component: AthleteDashboard,
    meta: { requiresAuth: true, role: 'athlete' },
  },
  {
    path: '/athlete/edit-profile',
    name: 'athlete-edit-profile',
    component: AthleteProfileEditView,
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

  // 0) Si aún estamos cargando la verificación de auth, dejar pasar (la app está inicializándose)
  if (authStore.loading) {
    next()
    return
  }

  // 1) Si la ruta requiere autenticación y NO hay usuario => al login
  if (to.meta.requiresAuth && !authStore.user) {
    return next('/login')
  }

  // 2) Si la ruta tiene rol específico y el perfil no coincide => redirigimos
  if (to.meta.role && authStore.profile?.role !== to.meta.role) {
    // Si está logueada pero con otro rol, la mandamos a su dashboard correcto
    if (authStore.profile?.role === 'coach') {
      return next('/coach')
    }
    if (authStore.profile?.role === 'athlete') {
      return next('/athlete')
    }
    // Si ni siquiera tiene rol, la mandamos a login
    return next('/login')
  }

  // 3) Si intenta ir a /login estando logueada, la mandamos a su panel
  if (to.path === '/login' && authStore.user && authStore.profile?.role) {
    if (authStore.profile.role === 'coach') {
      return next('/coach')
    }
    if (authStore.profile.role === 'athlete') {
      return next('/athlete')
    }
  }

  // 4) En cualquier otro caso, dejamos pasar
  next()
})