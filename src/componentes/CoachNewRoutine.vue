<script setup>
import { ref } from 'vue'
import { db } from '../services/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthStore } from '../stores/auth'

const props = defineProps({
  athleteId: {
    type: String,
    required: true,
  },
})

const authStore = useAuthStore()

const title = ref('')
const description = ref('')
const week = ref(1)

const videos = ref([
  { name: '', youtubeUrl: '', notes: '' },
])

const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const addVideo = () => {
  videos.value.push({ name: '', youtubeUrl: '', notes: '' })
}

const removeVideo = (index) => {
  videos.value.splice(index, 1)
}

const saveRoutine = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  isSaving.value = true

  try {
    const routinesRef = collection(db, 'routines')

    await addDoc(routinesRef, {
      athleteId: props.athleteId,
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
    // Limpia el formulario si quieres
  } catch (error) {
    console.error(error)
    errorMessage.value = 'No se pudo guardar la rutina.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="bg-slate-800 text-white p-4 rounded-lg mt-6">
    <h3 class="text-lg font-semibold mb-3">Nueva rutina para esta jugadora</h3>

    <div class="space-y-3">
      <div>
        <label class="block text-sm mb-1">Título</label>
        <input v-model="title" class="w-full px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm" />
      </div>

      <div>
        <label class="block text-sm mb-1">Descripción</label>
        <textarea v-model="description" class="w-full px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm" />
      </div>

      <div>
        <label class="block text-sm mb-1">Semana</label>
        <input type="number" v-model.number="week" min="1" class="w-24 px-3 py-2 rounded bg-slate-900 border border-slate-600 text-sm" />
      </div>

      <div class="mt-4 space-y-4">
        <h4 class="text-sm font-semibold">Videos / ejercicios</h4>

        <div
          v-for="(video, index) in videos"
          :key="index"
          class="border border-slate-700 rounded p-3 space-y-2"
        >
          <div class="flex justify-between items-center">
            <span class="text-xs text-slate-300">Ejercicio #{{ index + 1 }}</span>
            <button
              v-if="videos.length > 1"
              type="button"
              class="text-xs text-red-400"
              @click="removeVideo(index)"
            >
              Eliminar
            </button>
          </div>

          <div>
            <label class="block text-xs mb-1">Nombre</label>
            <input
              v-model="video.name"
              class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs"
            />
          </div>

          <div>
            <label class="block text-xs mb-1">URL de YouTube</label>
            <input
              v-model="video.youtubeUrl"
              class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div>
            <label class="block text-xs mb-1">Notas</label>
            <textarea
              v-model="video.notes"
              class="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs"
            />
          </div>
        </div>

        <button
          type="button"
          class="text-xs text-sky-300"
          @click="addVideo"
        >
          + Agregar otro ejercicio
        </button>
      </div>

      <div v-if="errorMessage" class="text-xs text-red-400">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-xs text-emerald-300">
        {{ successMessage }}
      </div>

      <button
        type="button"
        class="mt-3 px-4 py-2 rounded bg-sky-600 text-sm font-medium disabled:opacity-60"
        :disabled="isSaving"
        @click="saveRoutine"
      >
        {{ isSaving ? 'Guardando...' : 'Guardar rutina' }}
      </button>
    </div>
  </div>
</template>
