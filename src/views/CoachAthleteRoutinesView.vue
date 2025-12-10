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
  addDoc,
  serverTimestamp,
  deleteDoc
  
} from 'firebase/firestore'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const athleteId = route.params.athleteId

// Datos de la jugadora
const athlete = ref(null)
const loadingAthlete = ref(true)

// Lista de rutinas
const routines = ref([])
const loadingRoutines = ref(true)

// Formulario nueva rutina
const title = ref('')
const description = ref('')
const week = ref(1)
const videos = ref([{ name: '', youtubeUrl: '', notes: '' }])

const loadingSave = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const deletingRoutineId = ref(null)

const athleteName = computed(() => athlete.value?.name || 'Jugadora')



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

// Cargar datos de la jugadora desde users/{uid}
const loadAthlete = async () => {
  loadingAthlete.value = true
  try {
    const refDoc = doc(db, 'users', athleteId)
    const snap = await getDoc(refDoc)
    if (snap.exists()) {
      athlete.value = { id: snap.id, ...snap.data() }
    }
  } catch (error) {
    console.error('Error cargando jugadora:', error)
  } finally {
    loadingAthlete.value = false
  }
}

// Cargar rutinas de esta jugadora desde routines
const loadRoutines = async () => {
  loadingRoutines.value = true
  try {
    const routinesRef = collection(db, 'routines')
    const q = query(
      routinesRef,
      where('athleteId', '==', athleteId),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    routines.value = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error cargando rutinas:', error)
  } finally {
    loadingRoutines.value = false
  }
}

const deleteRoutine = async (routineId) => {
  const confirmDelete = window.confirm('¿Seguro que quieres eliminar esta rutina?')
  if (!confirmDelete) return

  try {
    deletingRoutineId.value = routineId

    const routineRef = doc(db, 'routines', routineId)
    await deleteDoc(routineRef)

    // Filtra la rutina eliminada del array local
    routines.value = routines.value.filter(r => r.id !== routineId)
  } catch (error) {
    console.error('Error eliminando rutina:', error)
    alert('No se pudo eliminar la rutina. Intenta nuevamente.')
  } finally {
    deletingRoutineId.value = null
  }
}

const addVideo = () => {
  videos.value.push({ name: '', youtubeUrl: '', notes: '' })
}

const removeVideo = (index) => {
  videos.value.splice(index, 1)
}

const saveRoutine = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  loadingSave.value = true

  try {
    if (!title.value.trim()) {
      errorMessage.value = 'La rutina debe tener un título.'
      loadingSave.value = false
      return
    }

    const hasAtLeastOneVideo = videos.value.some(
      (v) => v.youtubeUrl && v.youtubeUrl.trim() !== ''
    )

    if (!hasAtLeastOneVideo) {
      errorMessage.value = 'Agrega al menos un ejercicio con URL de YouTube.'
      loadingSave.value = false
      return
    }

    const routinesRef = collection(db, 'routines')

    await addDoc(routinesRef, {
      athleteId,
      coachId: authStore.user?.uid || null,
      title: title.value,
      description: description.value,
      week: week.value,
      status: 'active',
      createdAt: serverTimestamp(),
      videos: videos.value.map((v, index) => ({
        ...v,
        order: index + 1,
      })),
    })

    successMessage.value = 'Rutina creada correctamente.'

    // Limpiar formulario
    title.value = ''
    description.value = ''
    week.value = 1
    videos.value = [{ name: '', youtubeUrl: '', notes: '' }]

    // Recargar rutinas para ver la nueva en la lista
    await loadRoutines()
  } catch (error) {
    console.error('Error guardando rutina:', error)
    errorMessage.value = 'No se pudo guardar la rutina. Intenta nuevamente.'
  } finally {
    loadingSave.value = false
  }
}

onMounted(() => {
  if (!athleteId) {
    errorMessage.value = 'Falta el ID de la jugadora en la ruta.'
    return
  }
  loadAthlete()
  loadRoutines()
})
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
    <!-- Elementos decorativos de fondo -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 right-0 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 px-6 py-6 border-b border-slate-700/50 backdrop-blur-md">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
            Gestión de Rutinas
          </p>
          <h1 class="gobold text-3xl font-bold text-white">
            Rutinas de {{ athleteName }}
          </h1>
          <p class="text-sm text-slate-400 mt-1" v-if="athlete">
            {{ athlete.email }} · {{ athlete.teamId || 'Sin equipo' }}
          </p>
        </div>
        <button
          type="button"
          class="p-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
          @click="router.back()"
          title="Volver"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="relative z-10 flex-1 p-6">
      <div class="max-w-6xl mx-auto space-y-6">
        
        <!-- Rutinas asignadas -->
        <section class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
          <!-- Header de sección -->
          <div class="px-6 py-4 border-b border-slate-700/30 bg-linear-to-r from-slate-800/50 to-transparent flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-white">
                Rutinas asignadas
              </h2>
              <p class="text-xs text-slate-400 mt-1">
                Total: <span class="text-amber-400 font-semibold">{{ routines.length }}</span>
              </p>
            </div>
            <button
              type="button"
              class="p-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all"
              @click="loadRoutines"
              :disabled="loadingRoutines"
            >
              <svg class="w-5 h-5" :class="{ 'animate-spin': loadingRoutines }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <!-- Estado de carga -->
          <div v-if="loadingRoutines" class="p-8 text-center">
            <div class="inline-block">
              <svg class="w-12 h-12 text-amber-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p class="text-slate-400 mt-4">Cargando rutinas...</p>
          </div>

          <!-- Sin rutinas -->
          <div v-else-if="routines.length === 0" class="p-12 text-center">
            <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h3 class="text-lg font-semibold text-slate-300 mb-2">
              Sin rutinas asignadas
            </h3>
            <p class="text-slate-400 text-sm">
              Crea la primera rutina para esta jugadora usando el formulario a continuación.
            </p>
          </div>

          <!-- Listado de rutinas -->
          <div v-else class="divide-y divide-slate-700/30 p-6 space-y-6">
            <article
              v-for="routine in routines"
              :key="routine.id"
              class="bg-slate-900/50 border border-slate-700/30 rounded-lg p-6 hover:border-amber-500/20 transition-all"
            >
              <!-- Header de rutina -->
              <header class="flex items-start justify-between mb-4 pb-4 border-b border-slate-700/20">
                <div class="flex-1">
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-semibold text-white">
                      {{ routine.title }}
                    </h3>
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300">
                      Semana {{ routine.week || '-' }}
                    </span>
                  </div>
                  <p class="text-sm text-slate-400">
                    {{ routine.videos?.length || 0 }} ejercicios · 
                    <span class="inline-flex items-center gap-1">
                      <span class="w-2 h-2 rounded-full" :class="routine.status === 'active' ? 'bg-green-500' : 'bg-slate-500'"></span>
                      {{ routine.status === 'active' ? 'Activa' : 'Inactiva' }}
                    </span>
                  </p>
                </div>
                <button
                  type="button"
                  class="p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-all"
                  :disabled="deletingRoutineId === routine.id"
                  @click="deleteRoutine(routine.id)"
                  title="Eliminar rutina"
                >
                  <svg v-if="deletingRoutineId !== routine.id" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <svg v-else class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </header>

              <!-- Descripción -->
              <p v-if="routine.description" class="text-slate-300 text-sm mb-4">
                {{ routine.description }}
              </p>

              <!-- Grid de ejercicios -->
              <div class="grid gap-4 md:grid-cols-2">
                <div
                  v-for="(video, vidIdx) in routine.videos"
                  :key="video.order"
                  class="bg-slate-800/50 border border-slate-700/30 rounded-lg overflow-hidden hover:border-amber-500/20 transition-all"
                >
                  <!-- Thumbnail -->
                  <div v-if="video.youtubeUrl" class="aspect-video bg-slate-950 relative overflow-hidden">
                    <iframe
                      class="w-full h-full"
                      :src="toEmbedUrl(video.youtubeUrl)"
                      frameborder="0"
                      allowfullscreen
                      title="Video del ejercicio"
                    ></iframe>
                  </div>

                  <!-- Info del ejercicio -->
                  <div class="p-4">
                    <h4 class="font-semibold text-white mb-2">
                      {{ vidIdx + 1 }}. {{ video.name || 'Ejercicio sin nombre' }}
                    </h4>
                    <p v-if="video.notes" class="text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                      {{ video.notes }}
                    </p>
                    <p v-else class="text-xs text-slate-500 italic">
                      Sin notas
                    </p>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- Formulario: nueva rutina -->
        <section class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
          <!-- Header de formulario -->
          <div class="px-6 py-4 border-b border-slate-700/30 bg-linear-to-r from-slate-800/50 to-transparent">
            <h2 class="text-xl font-semibold text-white">
              Crear nueva rutina
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Diseña una rutina personalizada con videos de ejercicios
            </p>
          </div>

          <div class="p-6 space-y-5">
            <!-- Título -->
            <div>
              <label class="block text-sm font-semibold text-white mb-2">Título</label>
              <input
                v-model="title"
                class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                placeholder="Ej: Semana 1 - Fuerza tren inferior"
              />
            </div>

            <!-- Descripción -->
            <div>
              <label class="block text-sm font-semibold text-white mb-2">Descripción</label>
              <textarea
                v-model="description"
                rows="3"
                class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                placeholder="Describe los objetivos y enfoque de esta rutina..."
              />
            </div>

            <!-- Semana -->
            <div class="flex items-end gap-4">
              <div class="flex-1">
                <label class="block text-sm font-semibold text-white mb-2">Semana</label>
                <input
                  type="number"
                  min="1"
                  v-model.number="week"
                  class="w-full px-4 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700/50 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <!-- Ejercicios -->
            <div class="space-y-4 pt-2">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-white">
                  Ejercicios
                </h3>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all text-xs font-semibold"
                  @click="addVideo"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar ejercicio
                </button>
              </div>

              <div
                v-for="(video, index) in videos"
                :key="index"
                class="bg-slate-900/50 border border-slate-700/30 rounded-lg p-5 space-y-4"
              >
                <div class="flex items-center justify-between pb-3 border-b border-slate-700/20">
                  <span class="text-sm font-semibold text-amber-400">
                    Ejercicio #{{ index + 1 }}
                  </span>
                  <button
                    v-if="videos.length > 1"
                    type="button"
                    class="text-xs text-red-400 hover:text-red-300 transition-colors"
                    @click="removeVideo(index)"
                  >
                    Eliminar
                  </button>
                </div>

                <!-- Nombre del ejercicio -->
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Nombre del ejercicio</label>
                  <input
                    v-model="video.name"
                    class="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="Ej: Sentadillas búlgaras"
                  />
                </div>

                <!-- URL YouTube -->
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">URL de YouTube</label>
                  <input
                    v-model="video.youtubeUrl"
                    class="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>

                <!-- Notas -->
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Notas e instrucciones</label>
                  <textarea
                    v-model="video.notes"
                    rows="2"
                    class="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
                    placeholder="Series, repeticiones, descansos, focos técnicos..."
                  />
                </div>
              </div>
            </div>

            <!-- Mensajes de estado -->
            <div v-if="errorMessage" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p class="text-sm text-red-400">{{ errorMessage }}</p>
            </div>
            <div v-if="successMessage" class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p class="text-sm text-emerald-400">{{ successMessage }}</p>
            </div>

            <!-- Botón guardar -->
            <button
              type="button"
              class="w-full mt-2 py-3 px-4 bg-linear-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              :disabled="loadingSave"
              @click="saveRoutine"
            >
              <span v-if="!loadingSave" class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Guardar rutina
              </span>
              <span v-else class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Guardando...
              </span>
            </button>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
