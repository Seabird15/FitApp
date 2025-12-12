<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { db } from '../services/firebase'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import MD5 from 'crypto-js/md5'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const photoUrl = ref('')
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const gravatarUrl = computed(() => {
  if (!authStore.user?.email) return ''
  const hash = MD5(authStore.user.email.toLowerCase()).toString()
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`
})

// Cargar datos del perfil
const loadProfile = async () => {
  if (!authStore.user) return

  loading.value = true
  try {
    const refDoc = doc(db, 'users', authStore.user.uid)
    const snap = await getDoc(refDoc)
    if (snap.exists()) {
      const data = snap.data()
      name.value = data.name || ''
      photoUrl.value = data.photoUrl || ''
    }
  } catch (error) {
    console.error('Error cargando perfil:', error)
    errorMessage.value = 'No se pudo cargar el perfil.'
  } finally {
    loading.value = false
  }
}

// Usar foto de Gravatar
const useGravatar = () => {
  photoUrl.value = gravatarUrl.value
}

// Manejar subida de foto
const handlePhotoUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    photoUrl.value = e.target?.result || ''
  }
  reader.readAsDataURL(file)
}

// Guardar cambios
const saveProfile = async () => {
  if (!name.value.trim()) {
    errorMessage.value = 'El nombre no puede estar vacío.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const refDoc = doc(db, 'users', authStore.user.uid)
    await updateDoc(refDoc, {
      name: name.value.trim(),
      photoUrl: photoUrl.value || gravatarUrl.value,
      updatedAt: serverTimestamp(),
    })

    // Actualizar el store
    authStore.profile.name = name.value.trim()
    authStore.profile.photoUrl = photoUrl.value || gravatarUrl.value

    successMessage.value = 'Perfil actualizado correctamente.'
    setTimeout(() => {
      router.push('/athlete')
    }, 1500)
  } catch (error) {
    console.error('Error guardando perfil:', error)
    errorMessage.value = 'No se pudo guardar el perfil.'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadProfile()
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
      <div class="max-w-3xl mx-auto flex items-center justify-between gap-4">
        <button
          @click="router.back()"
          class="p-2 rounded-lg hover:bg-slate-700/30 transition-colors"
          title="Volver"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div class="flex-1">
          <h1 class="gobold text-2xl md:text-3xl font-bold">Editar Perfil</h1>
          <p class="text-xs md:text-sm text-slate-400 mt-1">Personaliza tu información y foto de perfil</p>
        </div>
      </div>
    </header>

    <!-- Contenido -->
    <main class="relative z-10 flex-1 p-6 max-w-3xl w-full mx-auto">
      <div v-if="loading" class="flex items-center justify-center py-12">
        <svg class="w-12 h-12 text-sky-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>

      <template v-else>
        <!-- Mensajes -->
        <div v-if="errorMessage" class="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 mb-6">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400 mb-6">
          {{ successMessage }}
        </div>

        <div class="space-y-6">
          <!-- Sección de Foto -->
          <section class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-6">
            <h2 class="text-lg font-semibold text-white mb-4">Foto de Perfil</h2>

            <!-- Preview de foto -->
            <div class="flex flex-col items-center gap-4 mb-6">
              <div class="w-32 h-32 rounded-full border-4 border-sky-500/30 overflow-hidden bg-slate-900">
                <img
                  :src="photoUrl || gravatarUrl"
                  alt="Foto de perfil"
                  class="w-full h-full object-cover"
                />
              </div>

              <div class="text-center">
                <p class="text-slate-400 text-sm">{{ authStore.user?.email }}</p>
              </div>
            </div>

            <!-- Opciones de foto -->
            <div class="space-y-3">
              <button
                type="button"
                @click="useGravatar"
                class="w-full py-3 px-4 bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Usar foto de Gmail
              </button>

              <label class="w-full py-3 px-4 bg-purple-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Subir foto personalizada
                <input
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handlePhotoUpload"
                />
              </label>
            </div>
          </section>

          <!-- Sección de Nombre -->
          <section class="bg-slate-800/50 border border-slate-700/40 rounded-xl p-6">
            <h2 class="text-lg font-semibold text-white mb-4">Información Personal</h2>

            <div>
              <label class="block text-sm font-medium text-slate-200 mb-2">Nombre</label>
              <input
                v-model="name"
                type="text"
                placeholder="Tu nombre completo"
                class="w-full px-4 py-3 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </section>

          <!-- Botones de acción -->
          <div class="flex gap-3 justify-end">
            <button
              type="button"
              @click="router.back()"
              class="px-6 py-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white font-semibold transition-all"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="saveProfile"
              :disabled="saving"
              class="px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <span v-if="!saving">Guardar cambios</span>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>
