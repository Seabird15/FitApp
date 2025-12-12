<template>
  <section class="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
    <!-- Elementos decorativos -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-20 right-20 w-72 h-72 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div class="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
    </div>

    <div class="relative z-10 w-full max-w-md px-6">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="gobold text-2xl font-bold text-white mb-2">Crear cuenta de jugadora</h1>
        <div class="h-1 w-12 bg-linear-to-r from-sky-500 to-blue-500 mx-auto rounded-full"></div>
      </div>

      <!-- Card del formulario -->
      <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
        <h1 class="text-2xl font-bold mb-2 text-center gobold">
          Crear cuenta de jugadora
        </h1>
        <p class="text-sm text-slate-300 mb-6 text-center">
          Regístrate con tu código especial entregado por tu coach.
        </p>

      <FormKit
        type="form"
        :actions="false"
        @submit="handleSubmit"
        form-class="space-y-4"
      >
        <FormKit
          type="text"
          name="name"
          label="Nombre completo"
          placeholder="Tu nombre"
          validation="required|length:3"
          validation-visibility="submit"
          outer-class="space-y-1"
          label-class="block text-sm font-medium text-slate-200"
          inner-class="mt-1"
          input-class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          message-class="text-xs text-red-400 mt-1"
        />

        <FormKit
          type="email"
          name="email"
          label="Correo electrónico"
          placeholder="tucorreo@ejemplo.com"
          validation="required|email"
          validation-visibility="submit"
          outer-class="space-y-1"
          label-class="block text-sm font-medium text-slate-200"
          inner-class="mt-1"
          input-class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          message-class="text-xs text-red-400 mt-1"
        />

        <FormKit
          type="password"
          name="password"
          label="Contraseña"
          placeholder="********"
          validation="required|length:6"
          validation-visibility="submit"
          outer-class="space-y-1"
          label-class="block text-sm font-medium text-slate-200"
          inner-class="mt-1"
          input-class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          message-class="text-xs text-red-400 mt-1"
        />

        <FormKit
          type="password"
          name="passwordConfirm"
          label="Confirmar contraseña"
          placeholder="********"
          validation="required|confirm"
          validation-label="Confirmación de contraseña"
          validation-visibility="submit"
          outer-class="space-y-1"
          label-class="block text-sm font-medium text-slate-200"
          inner-class="mt-1"
          input-class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          message-class="text-xs text-red-400 mt-1"
        />

        <FormKit
          type="text"
          name="code"
          label="Código de acceso"
          placeholder="Ej: PRUEBA-1234"
          validation="required"
          validation-visibility="submit"
          outer-class="space-y-1"
          label-class="block text-sm font-medium text-slate-200"
          inner-class="mt-1"
          input-class="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          message-class="text-xs text-red-400 mt-1"
        />

        <div v-if="errorMessage" class="text-sm text-red-400">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="text-sm text-emerald-300">
          {{ successMessage }}
        </div>

        <button
          type="submit"
          class="w-full mt-4 inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          :disabled="isSubmitting"
        >
          <span v-if="!isSubmitting">Crear cuenta</span>
          <span v-else>Creando cuenta...</span>
        </button>
      </FormKit>

      <p class="mt-4 text-xs text-slate-400 text-center">
        ¿Ya tienes cuenta?
        <RouterLink to="/" class="text-sky-400 hover:text-sky-300 underline">
          Inicia sesión aquí
        </RouterLink>
      </p>
      <!-- Footer -->
        <footer class="mt-6 pt-4 border-t border-slate-700/30">
                            <div class="flex gobold items-center justify-center gap-3">
                                <span class="text-sm text-slate-400">En colaboración con</span>
                                <img src="../assets/VK LOGO COLOR.png" alt="Club Vikingas" class="h-14" />
                            </div>
                        </footer>
    </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const REGISTRATION_CODE = import.meta.env.VITE_REGISTRATION_CODE 

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const handleSubmit = async (formData) => {
  errorMessage.value = ''
  successMessage.value = ''
  isSubmitting.value = true

  try {
    // Validar código (case-insensitive y sin espacios)
    if (formData.code.trim().toUpperCase() !== REGISTRATION_CODE.toUpperCase()) {
      errorMessage.value = 'El código de acceso no es válido. Consulta con tu coach.'
      isSubmitting.value = false
      return
    }

    // Validar contraseñas iguales (además de la validación de FormKit)
    if (formData.password !== formData.passwordConfirm) {
      errorMessage.value = 'Las contraseñas no coinciden.'
      isSubmitting.value = false
      return
    }

    await authStore.registerAthlete(
      formData.name,
      formData.email,
      formData.password
    )

    successMessage.value = 'Cuenta creada correctamente. Redirigiendo a tu panel...'

    // Redirigir al panel de jugadora
    router.push('/athlete')
  } catch (error) {
    console.error('Error en registro:', error)
    errorMessage.value = 'No se pudo crear la cuenta. Revisa el correo o intenta más tarde.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
