<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { db } from '../services/firebase'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore'

const authStore = useAuthStore()

const routines = ref([])
const loading = ref(true)
const errorMessage = ref('')

const athleteName = computed(() => authStore.profile?.name || authStore.user?.email || 'Jugadora')

// helper para convertir URL normal de YouTube a URL embebida
const toEmbedUrl = (url) => {
  if (!url) return ''
  try {
    const u = new URL(url)
    const videoId =
      u.searchParams.get('v') ||        // https://www.youtube.com/watch?v=ID
      u.pathname.split('/').pop()       // https://youtu.be/ID
    return `https://www.youtube.com/embed/${videoId}`
  } catch {
    return ''
  }
}

const loadRoutines = async () => {
  if (!authStore.user) {
    errorMessage.value = 'No hay usuario autenticado.'
    loading.value = false
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const routinesRef = collection(db, 'routines')
    const q = query(
      routinesRef,
      where('athleteId', '==', authStore.user.uid),
      orderBy('createdAt', 'desc')
    )

    const snap = await getDocs(q)
    routines.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error cargando rutinas:', error)
    errorMessage.value = 'No se pudieron cargar tus rutinas. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRoutines()
})
</script>

<template>
  <div class="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
    <!-- Elementos decorativos de fondo -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 right-0 w-96 h-96 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 px-6 py-6 border-b border-slate-700/50 backdrop-blur-md">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2">
            Panel de Atleta
          </p>
          <h1 class="gobold text-4xl font-bold text-white">
            ¡Hola, {{ athleteName }}! 💪
          </h1>
          <p class="text-sm text-slate-400 mt-1">
            Tus sesiones personalizadas te esperan
          </p>
        </div>
        <div class="hidden md:block text-right">
          <div class="bg-sky-500/10 border border-sky-500/30 rounded-lg px-4 py-3">
            <p class="text-xs text-slate-400 mb-1">Total de ejercicios</p>
            <p class="text-2xl font-bold text-sky-400">{{ routines.reduce((sum, r) => sum + (r.videos?.length || 0), 0) }}</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="relative z-10 flex-1 p-6">
      <div class="max-w-5xl mx-auto space-y-6">
        
        <!-- Estado de carga -->
        <section v-if="loading" class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="inline-block">
              <svg class="w-12 h-12 text-sky-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p class="text-slate-400 mt-4">Cargando tus rutinas...</p>
          </div>
        </section>

        <!-- Error -->
        <section v-else-if="errorMessage" class="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
          <div class="flex items-start gap-4">
            <svg class="w-6 h-6 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div>
              <h3 class="font-semibold text-red-400">Error al cargar</h3>
              <p class="text-sm text-red-300 mt-1">{{ errorMessage }}</p>
            </div>
          </div>
        </section>

        <!-- Sin rutinas -->
        <section v-else-if="routines.length === 0" class="bg-linear-to-br from-slate-800/50 to-slate-700/30 border border-slate-700/50 rounded-xl p-12 text-center backdrop-blur">
          <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <h3 class="text-xl font-semibold text-slate-300 mb-2">
            Aún no tienes rutinas asignadas
          </h3>
          <p class="text-slate-400 max-w-sm mx-auto">
            Cuando tu coach te asigne una rutina personalizada, aparecerá aquí. ¡Mantente atento!
          </p>
        </section>

        <!-- Rutinas -->
        <section v-else class="space-y-6">
          <div
            v-for="(routine, idx) in routines"
            :key="routine.id"
            class="group bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden hover:border-sky-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-sky-500/10"
          >
            <!-- Header de rutina -->
            <header class="px-6 py-4 border-b border-slate-700/30 bg-linear-to-r from-slate-800/50 to-transparent">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
                    <span class="text-sky-400 font-bold text-sm">{{ idx + 1 }}</span>
                  </div>
                  <div>
                    <h2 class="text-lg font-semibold text-white">
                      {{ routine.title }}
                    </h2>
                    <p class="text-xs text-slate-400 mt-1">
                      <span class="inline-block px-2 py-1 bg-slate-700/50 rounded mr-2">
                        Semana {{ routine.week || '-' }}
                      </span>
                      <span class="inline-flex items-center gap-1">
                        <span class="w-2 h-2 rounded-full" :class="routine.status === 'active' ? 'bg-green-500' : 'bg-slate-500'"></span>
                        {{ routine.status === 'active' ? 'Activa' : 'Inactiva' }}
                      </span>
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-sky-400">
                    {{ routine.videos?.length || 0 }}
                  </p>
                  <p class="text-xs text-slate-400">ejercicios</p>
                </div>
              </div>
            </header>

            <!-- Descripción -->
            <div v-if="routine.description" class="px-6 py-3 border-b border-slate-700/30">
              <p class="text-sm text-slate-300 leading-relaxed">
                {{ routine.description }}
              </p>
            </div>

            <!-- Ejercicios -->
            <div class="p-6">
              <div class="grid gap-4 md:grid-cols-2">
                <div
                  v-for="(video, vidIdx) in routine.videos"
                  :key="video.order"
                  class="bg-slate-900/50 border border-slate-700/30 rounded-lg overflow-hidden hover:border-sky-500/20 transition-all"
                >
                  <!-- Thumbnail del video -->
                  <div v-if="video.youtubeUrl" class="aspect-video bg-slate-950 relative overflow-hidden group/video">
                    <iframe
                      class="w-full h-full"
                      :src="toEmbedUrl(video.youtubeUrl)"
                      frameborder="0"
                      allowfullscreen
                      title="Video del ejercicio"
                    ></iframe>
                  </div>

                  <!-- Información del ejercicio -->
                  <div class="p-4">
                    <div class="flex items-start justify-between gap-2 mb-2">
                      <h3 class="font-semibold text-white flex-1">
                        {{ vidIdx + 1 }}. {{ video.name || 'Ejercicio sin nombre' }}
                      </h3>
                    </div>

                    <p
                      v-if="video.notes"
                      class="text-xs text-slate-400 leading-relaxed whitespace-pre-line"
                    >
                      {{ video.notes }}
                    </p>
                    <p v-else class="text-xs text-slate-500 italic">
                      Sin notas adicionales
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
