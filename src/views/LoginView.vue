<template>
    <section
        class="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        <!-- Elemento decorativo de fondo -->
        <div class="absolute inset-0 overflow-hidden">
            <div
                class="absolute top-20 right-20 w-72 h-72 bg-sky-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob">
            </div>
            <div
                class="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000">
            </div>
        </div>

        <!-- Contenedor principal -->
        <div class="relative z-10 w-full max-w-md px-6">
            <!-- Logo y Header -->
            <div class="text-center mb-8">
                <img src="https://firebasestorage.googleapis.com/v0/b/fitapp-4fa5d.firebasestorage.app/o/LogoPng.png?alt=media&token=27e45a99-6ac0-48cc-ab11-536e9e88b88c"
                    alt="">
                <div class="h-1 w-12 bg-linear-to-r from-sky-500 to-blue-500 mx-auto rounded-full"></div>
            </div>

            <!-- Card del formulario -->
            <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
                <!-- Títulos -->
                <div class="mb-8">
                    <h2 class="text-2xl font-bold text-white mb-2 gobold">Iniciar sesión</h2>
                    <p class="text-slate-400 text-sm">Ingresa con tu cuenta de jugadora o coach.</p>
                </div>

                <!-- Formulario -->
                <FormKit type="form" :actions="false" @submit="handleSubmit" form-class="space-y-5">
                    <FormKit type="email" name="email" label="Correo electrónico" placeholder="tucorreo@ejemplo.com"
                        validation="required|email" validation-visibility="submit" outer-class="space-y-2"
                        label-class="block text-sm font-semibold text-slate-200" inner-class="mt-2"
                        input-class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        message-class="text-xs text-red-400 mt-1" />

                    <FormKit type="password" name="password" label="Contraseña" placeholder="••••••••"
                        validation="required|length:6" validation-visibility="submit" outer-class="space-y-2"
                        label-class="block text-sm font-semibold text-slate-200" inner-class="mt-2"
                        input-class="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                        message-class="text-xs text-red-400 mt-1" />

                    <!-- Mensaje de error -->
                    <div v-if="loginError" class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p class="text-sm text-red-400">{{ loginError }}</p>
                    </div>

                    <!-- Botón de envío -->
                    <button type="submit"
                        class="w-full gobold mt-6 py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                        :disabled="isSubmitting">
                        <span v-if="!isSubmitting" class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Ingresar
                        </span>
                        <span v-else class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Ingresando...
                        </span>
                    </button>
                </FormKit>
                <p class="mt-4 text-xs text-slate-400 text-center">
                    ¿Eres nueva jugadora?
                    <RouterLink to="/register" class="text-sky-400 hover:text-sky-300 underline">
                        Crea tu cuenta con código de acceso
                    </RouterLink>
                </p>
            </div>

            <!-- Footer -->
            <p class="text-center text-slate-400 text-xs mt-6">Versión 1.0 • VKFitApp 2025</p>
        </div>
    </section>
</template>


<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import { IconHome } from '@tabler/icons-vue';


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
