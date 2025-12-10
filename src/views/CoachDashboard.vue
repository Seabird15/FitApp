<template>
  <div class="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col">
    <!-- Elementos decorativos de fondo -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
      <div class="absolute bottom-0 left-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
    </div>

    <!-- Header -->
    <header class="relative z-10 px-6 py-6 border-b border-slate-700/50 backdrop-blur-md">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">
            Panel de Coach
          </p>
          <h1 class="gobold text-4xl font-bold text-white">
            Gestión de Jugadoras 🏆
          </h1>
          <p class="text-sm text-slate-400 mt-1">
            Administra tus jugadoras y asigna rutinas personalizadas
          </p>
        </div>
        <div class="hidden md:block text-right">
          <p class="text-xs text-slate-400 mb-2">Tu cuenta</p>
          <p class="text-sm font-semibold text-white truncate max-w-xs">
            {{ authStore.user?.email }}
          </p>
        </div>
      </div>
    </header>

    <!-- Contenido principal -->
    <main class="relative z-10 flex-1 p-6">
      <div class="max-w-6xl mx-auto space-y-6">
        
        <!-- Tarjeta informativa -->
        <section class="bg-linear-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 backdrop-blur">
          <p class="text-slate-200 mb-2 font-semibold">
            ✨ Bienvenida al panel de coach
          </p>
          <p class="text-slate-400 text-sm leading-relaxed">
            Aquí puedes visualizar todas tus jugadoras, asignar rutinas personalizadas y monitorear su progreso en tiempo real.
          </p>
        </section>

        <!-- Lista de jugadoras -->
        <section class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl overflow-hidden">
          <!-- Header de sección -->
          <div class="px-6 py-4 border-b border-slate-700/30 bg-linear-to-r from-slate-800/50 to-transparent flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-white">
                Jugadoras activas
              </h2>
              <p class="text-xs text-slate-400 mt-1">
                Total: <span class="text-purple-400 font-semibold">{{ athletes.length }}</span>
              </p>
            </div>
            <button
              type="button"
              class="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all"
              @click="loadAthletes"
              :disabled="loading"
            >
              <svg class="w-5 h-5" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          <!-- Estados de carga/error -->
          <div v-if="loading" class="p-8 text-center">
            <div class="inline-block">
              <svg class="w-12 h-12 text-purple-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p class="text-slate-400 mt-4">Cargando jugadoras...</p>
          </div>

          <div v-else-if="errorMessage" class="p-6 bg-red-500/10 border-t border-red-500/30 m-6 rounded-lg">
            <div class="flex items-start gap-4">
              <svg class="w-6 h-6 text-red-400 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <div>
                <h3 class="font-semibold text-red-400">Error al cargar</h3>
                <p class="text-sm text-red-300 mt-1">{{ errorMessage }}</p>
              </div>
            </div>
          </div>

          <div v-else-if="athletes.length === 0" class="p-12 text-center">
            <svg class="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM6 20a9 9 0 0118 0v-2a9 9 0 00-18 0v2z" />
            </svg>
            <h3 class="text-lg font-semibold text-slate-300 mb-2">
              No hay jugadoras registradas
            </h3>
            <p class="text-slate-400 max-w-md mx-auto text-sm mb-4">
              Crea usuarias en Firebase Authentication y sus perfiles en Firestore con <code class="bg-slate-900/50 px-2 py-1 rounded text-purple-400">role: "athlete"</code>
            </p>
          </div>

          <!-- Tabla de jugadoras -->
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-700/30 bg-slate-900/30">
                  <th class="text-left py-4 px-6 font-semibold text-slate-300">Nombre</th>
                  <th class="text-left py-4 px-6 font-semibold text-slate-300">Correo</th>
                  <th class="text-left py-4 px-6 font-semibold text-slate-300">Equipo</th>
                  <th class="text-right py-4 px-6 font-semibold text-slate-300">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-700/20">
                <tr
                  v-for="athlete in athletes"
                  :key="athlete.id"
                  class="hover:bg-slate-700/20 transition-colors group"
                >
                  <!-- Nombre -->
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                        <span class="text-purple-400 font-semibold text-sm">
                          {{ athlete.name?.charAt(0).toUpperCase() || '?' }}
                        </span>
                      </div>
                      <span class="font-medium text-white">
                        {{ athlete.name || 'Sin nombre' }}
                      </span>
                    </div>
                  </td>
                  
                  <!-- Correo -->
                  <td class="py-4 px-6 text-slate-400">
                    {{ athlete.email || 'Sin correo' }}
                  </td>
                  
                  <!-- Equipo -->
                  <td class="py-4 px-6">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-700/50">
                      {{ athlete.teamId || 'Sin equipo' }}
                    </span>
                  </td>
                  
                  <!-- Acciones -->
                  <td class="py-4 px-6 text-right">
                    <RouterLink
                      :to="`/coach/athletes/${athlete.id}/routines`"
                      class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition-all text-xs font-semibold group-hover:border-purple-500/50"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Rutinas
                    </RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { db } from '../services/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'

const authStore = useAuthStore()

const athletes = ref([])
const loading = ref(true)
const errorMessage = ref('')

const loadAthletes = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('role', '==', 'athlete'))

    const snap = await getDocs(q)
    athletes.value = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Error cargando jugadoras:', error)
    errorMessage.value = 'No se pudieron cargar las jugadoras.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAthletes()
})
</script>
