<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { db } from '../services/firebase'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const athleteId = route.params.athleteId

// Datos de la atleta
const athlete = ref(null)
const loadingAthlete = ref(true)

// Logs de sesiones
const workoutLogs = ref([])
const loadingLogs = ref(true)

// Notas
const notes = ref('')
const editingNotes = ref(false)
const savingNotes = ref(false)

const athleteName = computed(() => athlete.value?.name || 'Atleta')
const athleteEmail = computed(() => athlete.value?.email || '')

// Cargar datos de la atleta
const loadAthlete = async () => {
  loadingAthlete.value = true
  try {
    const refDoc = doc(db, 'users', athleteId)
    const snap = await getDoc(refDoc)
    if (snap.exists()) {
      athlete.value = { id: snap.id, ...snap.data() }
      notes.value = snap.data()?.coachNotes || ''
    }
  } catch (error) {
    console.error('Error cargando atleta:', error)
  } finally {
    loadingAthlete.value = false
  }
}

// Cargar logs de sesiones completadas
const loadWorkoutLogs = async () => {
  loadingLogs.value = true
  try {
    const logsRef = collection(db, 'workoutLogs')
    const q = query(
      logsRef,
      where('athleteId', '==', athleteId),
      orderBy('completedAt', 'desc')
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

// Estadísticas
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
    average7Days: last7Days > 0 ? (last7Days / 7).toFixed(1) : 0,
  }
})

// Agrupar logs por semana para gráfico
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

// Guardar notas
const saveNotes = async () => {
  if (!athlete.value) return
  savingNotes.value = true

  try {
    const refDoc = doc(db, 'users', athleteId)
    await updateDoc(refDoc, {
      coachNotes: notes.value,
      notesUpdatedAt: serverTimestamp(),
    })
    editingNotes.value = false
  } catch (error) {
    console.error('Error guardando notas:', error)
  } finally {
    savingNotes.value = false
  }
}

// Formatear fecha de log
const formatLogDate = (log) => {
  if (!log.completedAt) return ''
  const d =
    typeof log.completedAt.toDate === 'function'
      ? log.completedAt.toDate()
      : new Date(log.completedAt)
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Obtener avatar de la atleta
const getAvatarUrl = () => {
  if (athlete.value?.photoUrl) {
    return athlete.value.photoUrl
  }
  // Si no hay foto, usar Gravatar
  if (!athlete.value?.email) return ''
  return `https://www.gravatar.com/avatar/${athlete.value.email}?s=200&d=identicon`
}

onMounted(async () => {
  await loadAthlete()
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

    <!-- Header -->
    <header class="relative z-10 px-6 py-6 border-b border-slate-700/30 backdrop-blur-sm">
      <div class="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-4">
          <button
            @click="router.back()"
            class="p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
            title="Volver"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <!-- (logo removed) -->
        </div>

        <div class="flex items-center gap-4 flex-1">
          <!-- Foto de la atleta -->
          <div class="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-3 border-sky-500/30 bg-slate-900 shrink-0">
            <img
              :src="getAvatarUrl()"
              :alt="athleteName"
              class="w-full h-full object-cover"
            />
          </div>

          <div class="flex-1">
            <p class="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">Perfil de Atleta</p>
            <h1 class="gobold text-2xl md:text-3xl font-bold">{{ athleteName }}</h1>
          </div>
        </div>

        <div class="hidden md:block text-right">
          <p class="text-xs text-slate-400 mb-1">Correo</p>
          <p class="text-sm font-semibold text-slate-200 truncate">{{ athleteEmail }}</p>
        </div>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="relative z-10 flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
      <!-- Loading -->
      <div v-if="loadingAthlete" class="flex items-center justify-center py-12">
        <svg class="w-12 h-12 text-sky-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>

      <template v-else>
        <!-- Tarjetas de estadísticas -->
        <section class="grid gap-4 grid-cols-2 md:grid-cols-4">
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
            <p class="text-xs text-slate-400 mb-2">Promedio por semana</p>
            <p class="text-3xl font-bold text-pink-400">{{ stats.average7Days }}</p>
          </div>
        </section>

        <!-- Gráfico de adherencia -->
        <section class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Sesiones por semana</h2>
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

        <!-- Notas del Coach -->
        <section class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-white">Notas del Coach</h2>
            <button
              v-if="!editingNotes"
              @click="editingNotes = true"
              class="px-3 py-1 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 transition-all text-sm font-semibold"
            >
              Editar
            </button>
          </div>

          <div v-if="editingNotes" class="space-y-3">
            <textarea
              v-model="notes"
              placeholder="Escribe observaciones sobre el rendimiento, actitud, progreso, etc."
              class="w-full p-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50 text-sm resize-none"
              rows="5"
            ></textarea>
            <div class="flex gap-2 justify-end">
              <button
                @click="editingNotes = false"
                class="px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                @click="saveNotes"
                :disabled="savingNotes"
                class="px-4 py-2 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 transition-all text-sm font-semibold disabled:opacity-50"
              >
                {{ savingNotes ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>

          <div v-else class="p-4 bg-slate-900/30 rounded-lg">
            <p v-if="notes" class="text-slate-300 whitespace-pre-line text-sm">{{ notes }}</p>
            <p v-else class="text-slate-500 italic text-sm">Sin notas aún. Haz click en "Editar" para agregar observaciones.</p>
          </div>
        </section>

        <!-- Historial de sesiones -->
        <section class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-6">
          <h2 class="text-lg font-semibold text-white mb-4">Historial de sesiones</h2>

          <div v-if="loadingLogs" class="flex items-center justify-center py-8">
            <svg class="w-8 h-8 text-sky-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <div v-else-if="workoutLogs.length === 0" class="text-center py-8">
            <p class="text-slate-400">No hay sesiones registradas aún.</p>
          </div>

          <div v-else class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="log in workoutLogs"
              :key="log.id"
              class="p-3 bg-slate-900/30 rounded-lg border border-slate-700/20 hover:border-slate-600/40 transition-colors"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <p class="font-semibold text-white text-sm">{{ log.sessionLabel || 'Sesión' }}</p>
                  <p class="text-xs text-slate-400 mt-1">
                    {{ log.routineTitle || 'Rutina sin título' }}
                  </p>
                </div>
                <p class="text-xs text-slate-500 whitespace-nowrap">
                  {{ formatLogDate(log) }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Botones de acción -->
        <section class="flex gap-3 justify-center">
          <RouterLink
            :to="`/coach/athletes/${athleteId}/routines`"
            class="px-6 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all font-semibold"
          >
            Ver Rutinas
          </RouterLink>
          <button
            @click="router.push('/coach')"
            class="px-6 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-all font-semibold"
          >
            Volver al Panel
          </button>
        </section>
      </template>
    </main>

    <!-- Footer -->
     <footer class="mt-6 pt-4 border-t border-slate-700/30">
                            <div class="flex gobold items-center justify-center gap-3">
                                <span class="text-sm text-slate-400">En colaboración con</span>
                                <img src="../assets/VK LOGO COLOR.png" alt="Club Vikingas" class="h-14" />
                            </div>
                        </footer>

  </div>
</template>
