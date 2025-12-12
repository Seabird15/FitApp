<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { db } from '../services/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore'

const router = useRouter()
const authStore = useAuthStore()

const routines = ref([])
const loadingRoutines = ref(true)
const errorMessage = ref('')
const successMessage = ref('')

// Logs de sesiones completadas
const workoutLogs = ref([])
const loadingLogs = ref(true)
const completingRoutineId = ref(null)

// Datos de perfil de la atleta
const athleteProfile = ref(null)
const weeklyGoal = ref(3)
const editingGoal = ref(false)
const savingGoal = ref(false)

const athleteName = computed(
  () => authStore.profile?.name || authStore.user?.email || 'Jugadora'
)

// helper para convertir URL normal de YouTube a embed
const toEmbedUrl = (url) => {
  if (!url) return ''
  try {
    const u = new URL(url)
    const videoId =
      u.searchParams.get('v') || // https://www.youtube.com/watch?v=ID
      u.pathname.split('/').pop() // https://youtu.be/ID
    return `https://www.youtube.com/embed/${videoId}`
  } catch {
    return ''
  }
}

// ---- Cargar datos del perfil de la atleta ----
const loadAthleteProfile = async () => {
  if (!authStore.user) return

  try {
    const refDoc = doc(db, 'users', authStore.user.uid)
    const snap = await getDoc(refDoc)
    if (snap.exists()) {
      athleteProfile.value = snap.data()
      weeklyGoal.value = snap.data()?.weeklyGoal || 3
    }
  } catch (error) {
    console.error('Error cargando perfil:', error)
  }
}

// ---- Guardar meta semanal ----
const saveWeeklyGoal = async () => {
  if (!authStore.user) return
  savingGoal.value = true

  try {
    const refDoc = doc(db, 'users', authStore.user.uid)
    await updateDoc(refDoc, {
      weeklyGoal: weeklyGoal.value,
    })
    editingGoal.value = false
  } catch (error) {
    console.error('Error guardando meta:', error)
  } finally {
    savingGoal.value = false
  }
}

// ---- Cargar rutinas asignadas a esta atleta ----
const loadRoutines = async () => {
  if (!authStore.user) return

  loadingRoutines.value = true
  errorMessage.value = ''

  try {
    const routinesRef = collection(db, 'routines')
    const q = query(
      routinesRef,
      where('athleteId', '==', authStore.user.uid),
      orderBy('createdAt', 'desc')
    )

    const snap = await getDocs(q)
    routines.value = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error cargando rutinas:', error)
    errorMessage.value = 'No se pudieron cargar tus rutinas. Intenta nuevamente.'
  } finally {
    loadingRoutines.value = false
  }
}

// ---- Cargar logs de sesiones completadas ----
const loadWorkoutLogs = async () => {
  if (!authStore.user) return

  loadingLogs.value = true

  try {
    const logsRef = collection(db, 'workoutLogs')
    const q = query(
      logsRef,
      where('athleteId', '==', authStore.user.uid)
    )

    const snap = await getDocs(q)
    workoutLogs.value = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error cargando logs:', error)
  } finally {
    loadingLogs.value = false
  }
}

// ---- Estadísticas detalladas ----
const stats = computed(() => {
  const now = new Date()
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(now.getDate() - 7)

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(now.getDate() - 30)

  const last7Days = workoutLogs.value.filter((log) => {
    if (!log.completedAt) return false
    const d =
      typeof log.completedAt.toDate === 'function'
        ? log.completedAt.toDate()
        : new Date(log.completedAt)
    return d >= sevenDaysAgo
  }).length

  const last30Days = workoutLogs.value.filter((log) => {
    if (!log.completedAt) return false
    const d =
      typeof log.completedAt.toDate === 'function'
        ? log.completedAt.toDate()
        : new Date(log.completedAt)
    return d >= thirtyDaysAgo
  }).length

  return {
    total: workoutLogs.value.length,
    last7Days,
    last30Days,
  }
})

// ---- Sesiones completadas en los últimos 7 días ----
const sessionsThisWeek = computed(() => stats.value.last7Days)

// ---- Gráfico de sesiones por semana ----
const sessionsByWeek = computed(() => {
  const weeks = {}
  const now = new Date()

  // Inicializar últimas 8 semanas
  for (let i = 7; i >= 0; i--) {
    const d = new Date()
    d.setDate(now.getDate() - i * 7)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().split('T')[0]
    weeks[key] = 0
  }

  workoutLogs.value.forEach((log) => {
    if (!log.completedAt) return
    const d =
      typeof log.completedAt.toDate === 'function'
        ? log.completedAt.toDate()
        : new Date(log.completedAt)

    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().split('T')[0]

    if (weeks.hasOwnProperty(key)) {
      weeks[key] += 1
    }
  })

  return Object.entries(weeks).map(([week, count]) => ({
    week: new Date(week).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    count,
  }))
})

// ---- Sistema de Badges/Logros ----
const badges = computed(() => {
  const earned = []

  // 🔥 En racha - 7 días sin faltar
  const daysWithSessions = new Set()
  workoutLogs.value.forEach((log) => {
    if (log.completedAt) {
      const d =
        typeof log.completedAt.toDate === 'function'
          ? log.completedAt.toDate()
          : new Date(log.completedAt)
      daysWithSessions.add(d.toISOString().split('T')[0])
    }
  })

  let consecutiveDays = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(new Date().getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    if (daysWithSessions.has(dateStr)) {
      consecutiveDays++
    } else {
      break
    }
  }

  if (consecutiveDays >= 7) {
    earned.push({
      id: 'streak',
      emoji: '🔥',
      name: 'En Racha',
      description: '7 días sin faltar',
      unlocked: true,
    })
  } else {
    earned.push({
      id: 'streak',
      emoji: '🔥',
      name: 'En Racha',
      description: `${consecutiveDays}/7 días`,
      unlocked: false,
    })
  }

  // 💪 Super atleta - 30+ sesiones en 30 días
  if (stats.value.last30Days >= 30) {
    earned.push({
      id: 'super-athlete',
      emoji: '💪',
      name: 'Super Atleta',
      description: '30+ sesiones en 30 días',
      unlocked: true,
    })
  } else {
    earned.push({
      id: 'super-athlete',
      emoji: '💪',
      name: 'Super Atleta',
      description: `${stats.value.last30Days}/30 sesiones`,
      unlocked: false,
    })
  }

  // ⭐ 100% Adherencia - Todas las rutinas completadas
  if (routines.value.length > 0) {
    const completedRoutineIds = new Set(
      workoutLogs.value.map((log) => log.routineId)
    )
    const allCompleted = routines.value.every((routine) =>
      completedRoutineIds.has(routine.id)
    )

    earned.push({
      id: 'full-adherence',
      emoji: '⭐',
      name: 'Adherencia Perfecta',
      description: 'Todas las rutinas completadas',
      unlocked: allCompleted,
    })
  }

  return earned
})

// ---- Acción: marcar rutina como completada ----
const completeRoutine = async (routine) => {
  if (!authStore.user) return

  errorMessage.value = ''
  successMessage.value = ''
  completingRoutineId.value = routine.id

  try {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0] // YYYY-MM-DD
    const defaultLabel = `Sesión de hoy (${todayStr})`

    const input = window.prompt(
      '¿Qué tipo de sesión es? (ej: mañana, tarde, extra, partido, etc.)',
      defaultLabel
    )

    if (input === null) {
      completingRoutineId.value = null
      return
    }

    const sessionLabel = input.trim() || defaultLabel

    const logsRef = collection(db, 'workoutLogs')

    await addDoc(logsRef, {
      athleteId: authStore.user.uid,
      routineId: routine.id,
      routineTitle: routine.title || '',
      sessionLabel,
      completedDate: todayStr,
      completedAt: serverTimestamp(),
    })

    successMessage.value = 'Sesión marcada como completada. ¡Bien hecho!'
    await loadWorkoutLogs()
  } catch (error) {
    console.error('Error marcando rutina como completada:', error)
    errorMessage.value =
      'No se pudo registrar la sesión como completada. Intenta nuevamente.'
  } finally {
    completingRoutineId.value = null
  }
}

// Devuelve los últimos N logs de una rutina
const getRoutineLogs = (routineId, limit = 3) => {
  const logs = workoutLogs.value
    .filter((log) => log.routineId === routineId)
    .sort((a, b) => {
      const aDate =
        typeof a.completedAt?.toDate === 'function'
          ? a.completedAt.toDate()
          : new Date(a.completedAt || 0)
      const bDate =
        typeof b.completedAt?.toDate === 'function'
          ? b.completedAt.toDate()
          : new Date(b.completedAt || 0)
      return bDate - aDate
    })

  return logs.slice(0, limit)
}

const formatLog = (log) => {
  let dateStr = ''
  if (log.completedAt) {
    const d =
      typeof log.completedAt.toDate === 'function'
        ? log.completedAt.toDate()
        : new Date(log.completedAt)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    dateStr = `${day}-${month}-${year}`
  }

  const label = log.sessionLabel || 'Sesión'
  return dateStr ? `${label} · ${dateStr}` : label
}

// Logout
const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

// Función para obtener avatar de Gravatar
const getAvatarUrl = () => {
  if (athleteProfile.value?.photoUrl) {
    return athleteProfile.value.photoUrl
  }
  // Si no hay foto, usar Gravatar
  if (!authStore.user?.email) return ''
  // Gravatar usa hash MD5 pero haremos una aproximación simple
  return `https://www.gravatar.com/avatar/${authStore.user.email}?s=200&d=identicon`
}

onMounted(async () => {
  if (!authStore.user) {
    errorMessage.value = 'No hay usuario autenticado.'
    return
  }

  await loadAthleteProfile()
  await loadRoutines()
  await loadWorkoutLogs()
})
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
    <!-- Fondo decorativo -->
    <div class="fixed inset-0 pointer-events-none overflow-hidden">
      <div class="absolute -top-16 -right-8 w-96 h-96 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div class="absolute -bottom-16 -left-8 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-8"></div>
    </div>

    <header class="relative z-10 px-6 py-6 border-b border-slate-700/30 backdrop-blur-sm">
      <div class="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div class="flex items-start gap-4 flex-1">
          <!-- Foto de perfil -->
          <RouterLink
            to="/athlete/edit-profile"
            class="shrink-0 group"
            title="Editar perfil"
          >
            <div class="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-3 border-sky-500/30 group-hover:border-sky-500 transition-colors bg-slate-900">
              <img
                :src="getAvatarUrl()"
                alt="Foto de perfil"
                class="w-full h-full object-cover"
              />
            </div>
          </RouterLink>

          <div class="flex-1">
            <p class="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">Panel de Jugadora</p>
            <h1 class="gobold text-2xl md:text-3xl font-bold">Hola, {{ athleteName }} 💪</h1>
            <p class="text-xs md:text-sm text-slate-400 mt-1">Tus rutinas personalizadas y registro de sesiones.</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="bg-slate-800/40 border border-slate-700/40 rounded-lg px-4 py-3">
            <p class="text-xs text-slate-300">Sesiones (últimos 7 días)</p>
            <p class="text-2xl font-bold text-emerald-400">{{ loadingLogs ? '—' : sessionsThisWeek }}</p>
          </div>
          <button
            type="button"
            @click="handleLogout"
            class="px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all font-semibold text-sm"
            title="Cerrar sesión"
          >
            <span class="hidden md:inline">Logout</span>
            <svg class="w-5 h-5 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido -->
    <main class="relative z-10 flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
      <!-- Mensajes -->
      <section v-if="errorMessage" class="p-3 rounded bg-red-500/10 border border-red-500/30 text-sm">
        {{ errorMessage }}
      </section>
      <section v-if="successMessage" class="p-3 rounded bg-emerald-500/10 border border-emerald-500/30 text-sm">
        {{ successMessage }}
      </section>

      <!-- Tarjetas de estadísticas -->
      <section v-if="!loadingLogs" class="grid gap-4 grid-cols-2 md:grid-cols-4">
        <div class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4">
          <p class="text-xs text-slate-400 mb-2">Total de sesiones</p>
          <p class="text-3xl font-bold text-emerald-400">{{ stats.total }}</p>
        </div>
        <div class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4">
          <p class="text-xs text-slate-400 mb-2">Últimos 7 días</p>
          <p class="text-3xl font-bold text-sky-400">{{ stats.last7Days }}</p>
        </div>
        <div class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4">
          <p class="text-xs text-slate-400 mb-2">Últimos 30 días</p>
          <p class="text-3xl font-bold text-purple-400">{{ stats.last30Days }}</p>
        </div>
        <div class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-4">
          <p class="text-xs text-slate-400 mb-2">Meta semanal</p>
          <div class="flex items-center justify-between">
            <p class="text-3xl font-bold text-pink-400">{{ weeklyGoal }}</p>
            <button
              v-if="!editingGoal"
              @click="editingGoal = true"
              class="text-xs text-slate-400 hover:text-slate-300 transition-colors"
              title="Editar meta"
            >
              ✎
            </button>
          </div>
          <div v-if="editingGoal" class="flex gap-2 mt-2">
            <input
              v-model.number="weeklyGoal"
              type="number"
              min="1"
              max="7"
              class="w-12 p-1 bg-slate-900/50 border border-slate-600/50 rounded text-white text-sm text-center focus:outline-none focus:border-pink-500/50"
            />
            <button
              @click="saveWeeklyGoal"
              :disabled="savingGoal"
              class="text-xs px-2 py-1 bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded hover:bg-pink-500/30 transition-all disabled:opacity-50"
            >
              ✓
            </button>
          </div>
        </div>
      </section>

      <!-- Gráfico de adherencia -->
      <section v-if="!loadingLogs" class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Tu progreso (últimas 8 semanas)</h2>
        <div class="flex items-end justify-between gap-2 h-48">
          <div
            v-for="(week, idx) in sessionsByWeek"
            :key="idx"
            class="flex-1 flex flex-col items-center gap-2"
          >
            <div
              class="w-full bg-linear-to-t from-sky-500 to-sky-400 rounded-t transition-all hover:opacity-80"
              :style="{ height: `${week.count * 25}px` }"
              :title="`${week.count} sesiones`"
            ></div>
            <p class="text-xs text-slate-400 text-center whitespace-nowrap">{{ week.week }}</p>
          </div>
        </div>
      </section>

      <!-- Badges/Logros -->
      <section v-if="!loadingLogs" class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-6">
        <h2 class="text-lg font-semibold text-white mb-4">Tus Logros 🏅</h2>
        <div class="grid gap-3 md:grid-cols-3">
          <div
            v-for="badge in badges"
            :key="badge.id"
            class="p-4 rounded-lg transition-all"
            :class="badge.unlocked ? 'bg-linear-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30' : 'bg-slate-900/30 border border-slate-700/30 opacity-50'"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-3xl">{{ badge.emoji }}</span>
              <div>
                <p class="font-semibold text-white">{{ badge.name }}</p>
                <p class="text-xs" :class="badge.unlocked ? 'text-amber-400' : 'text-slate-400'">
                  {{ badge.description }}
                </p>
              </div>
            </div>
            <div v-if="!badge.unlocked" class="w-full bg-slate-700/30 rounded-full h-1.5">
              <div
                class="bg-linear-to-r from-sky-500 to-blue-500 h-1.5 rounded-full transition-all"
                :style="{ width: badge.description.includes('/') ? (parseInt(badge.description) / parseInt(badge.description.split('/')[1]) * 100) + '%' : '0%' }"
              ></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Feedback del Coach -->
      <section v-if="athleteProfile?.coachNotes" class="bg-linear-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
        <div class="flex items-start gap-3">
          <div class="text-2xl">💬</div>
          <div>
            <h2 class="text-lg font-semibold text-white mb-2">Feedback del Coach</h2>
            <p class="text-slate-300 whitespace-pre-line text-sm">{{ athleteProfile.coachNotes }}</p>
          </div>
        </div>
      </section>

      <!-- Estado carga -->
      <section v-if="loadingRoutines" class="flex items-center justify-center py-12">
        <svg class="w-12 h-12 text-sky-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </section>

      <!-- Sin rutinas -->
      <section v-else-if="routines.length === 0" class="bg-slate-800/40 border border-slate-700/40 rounded-xl p-8 text-center">
        <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <h3 class="text-xl font-semibold text-slate-200 mb-2">Aún no tienes rutinas asignadas</h3>
        <p class="text-slate-400">Cuando tu coach te asigne una rutina, aparecerá aquí.</p>
      </section>

      <!-- Listado de rutinas -->
      <section v-else class="grid gap-6">
        <div v-for="(routine, idx) in routines" :key="routine.id" class="group bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/40 overflow-hidden hover:shadow-xl transition-shadow">
          <div class="p-4 md:p-5 flex flex-col gap-4">
            <div class="flex items-start gap-3 md:gap-4">
              <div class="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-sky-500/20 border border-sky-500/30 shrink-0 flex items-center justify-center">
                <span class="text-sky-300 font-bold text-sm md:text-base">{{ idx + 1 }}</span>
              </div>
              <div class="flex-1">
                <h2 class="text-base md:text-lg font-semibold text-white">{{ routine.title }}</h2>
                <p class="text-xs text-slate-400 mt-1">
                  <span class="inline-block px-2 py-1 bg-slate-700/50 rounded mr-2">Semana {{ routine.week || '-' }}</span>
                  <span class="inline-flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full" :class="routine.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'"></span>
                    <span class="text-xs">{{ routine.status === 'active' ? 'Activa' : 'Inactiva' }}</span>
                  </span>
                </p>
              </div>
              <button
                type="button"
                class="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-xs font-semibold hover:bg-emerald-500 disabled:opacity-60 whitespace-nowrap"
                :disabled="completingRoutineId === routine.id"
                @click="completeRoutine(routine)"
              >
                <svg v-if="completingRoutineId !== routine.id" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span class="hidden md:inline">{{ completingRoutineId === routine.id ? 'Guardando...' : 'Marcar completada' }}</span>
                <span class="md:hidden">{{ completingRoutineId === routine.id ? '...' : 'OK' }}</span>
              </button>
            </div>

            <p v-if="routine.description" class="text-xs md:text-sm text-slate-300">{{ routine.description }}</p>
          </div>

          <!-- Grid de ejercicios -->
          <div class="p-4 border-t border-slate-700/30">
            <div class="grid gap-4 md:grid-cols-2">
              <div v-for="(video, vidIdx) in routine.videos" :key="video.order ?? vidIdx" class="bg-slate-900/40 border border-slate-700/30 rounded-lg overflow-hidden">
                <div v-if="video.youtubeUrl" class="aspect-video bg-black">
                  <iframe class="w-full h-full" :src="toEmbedUrl(video.youtubeUrl)" frameborder="0" allowfullscreen title="video"></iframe>
                </div>
                <div class="p-4">
                  <h3 class="font-semibold text-white mb-1">{{ vidIdx + 1 }}. {{ video.name || 'Ejercicio' }}</h3>
                  <p v-if="video.notes" class="text-xs text-slate-300 whitespace-pre-line">{{ video.notes }}</p>
                  <p v-else class="text-xs text-slate-500 italic">Sin notas adicionales</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Logs -->
          <div class="p-4 border-t border-slate-700/30 bg-slate-800/30">
            <p class="text-xs text-slate-400 mb-2">Últimas sesiones:</p>
            <ul class="text-xs text-slate-300 space-y-1">
              <li v-for="log in getRoutineLogs(routine.id)" :key="log.id">• {{ formatLog(log) }}</li>
              <li v-if="!getRoutineLogs(routine.id).length" class="text-xs text-slate-500 italic">Aún no has registrado sesiones para esta rutina.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>

    <!-- Footer -->
    <footer class="py-6 border-t border-slate-700/30">
      <div class="max-w-5xl mx-auto flex items-center justify-center gap-3">
        <span class="text-sm text-slate-400">En colaboración con</span>
        <img src="@/assets/VK LOGO BLANCO.jpg" alt="Club Vikingas" class="h-6" />
      </div>
    </footer>
  </div>
</template>
