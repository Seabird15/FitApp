<template>
    <section class="flex flex-col items-center justify-center h-screen">
        <div class="">
            <h1 class="text-3xl font-bold underline">
                Welcome to FitApp
            </h1>
        </div>
        <div>
            <h2 class="text-2xl font-bold text-slate-800 mb-2">
                Iniciar sesión
            </h2>
            <p class="text-sm text-slate-500 mb-6">
                Ingresa con tu cuenta de jugadora o coach.
            </p>

            <!--Formulario-->

            <FormKit type="form" :actions="false" @submit="handleSubmit" form-class="space-y-4">
                <FormKit type="email" name="email" label="Correo electrónico" placeholder="tucorreo@ejemplo.com"
                    validation="required|email" validation-visibility="submit" outer-class="space-y-1"
                    label-class="block text-sm font-medium text-slate-700" inner-class="mt-1"
                    input-class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    message-class="text-xs text-red-600 mt-1" />

                <FormKit type="password" name="password" label="Contraseña" placeholder="********"
                    validation="required|length:6" validation-visibility="submit" outer-class="space-y-1"
                    label-class="block text-sm font-medium text-slate-700" inner-class="mt-1"
                    input-class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    message-class="text-xs text-red-600 mt-1" />

                <div v-if="loginError" class="text-sm text-red-600">
                    {{ loginError }}
                </div>

                <button type="submit"
                    class="w-full mt-4 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
                    :disabled="isSubmitting">
                    <span v-if="!isSubmitting">Ingresar</span>
                    <span v-else>Ingresando...</span>
                </button>
            </FormKit>
            <!--Formulario-->

        </div>
    </section>
</template>


<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isSubmitting = ref(false)
const loginError = ref('')

const handleSubmit = async (formData) => {
  loginError.value = ''
  isSubmitting.value = true

  try {
    console.log('Enviando login con:', formData)

    await authStore.login(formData.email, formData.password)

    console.log('Usuario autenticado:', authStore.user)
    console.log('Perfil:', authStore.profile)

    const role = authStore.profile?.role   // <-- ESTA LÍNEA ES CLAVE

    if (role === 'coach') {
      router.push('/coach')
    } else if (role === 'athlete') {
      router.push('/athlete')
    } else {
      loginError.value = 'Tu usuario no tiene rol asignado en Firestore.'
      return
    }

  } catch (error) {
    console.error('Error en handleSubmit:', error)
    loginError.value = 'No se pudo iniciar sesión. Revisa tu correo y contraseña.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

