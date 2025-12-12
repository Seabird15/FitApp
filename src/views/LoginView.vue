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
            <!-- Header -->
            <div class="text-center mb-8">
 <img src="https://firebasestorage.googleapis.com/v0/b/fitapp-4fa5d.firebasestorage.app/o/LogoPng.png?alt=media&token=27e45a99-6ac0-48cc-ab11-536e9e88b88c" alt="">
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
                        class="w-full gobold mt-6 py-3 px-4 bg-linear-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-lg hover:from-sky-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
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

                <!-- Separador -->
                <div class="flex items-center gap-4 my-6">
                    <div class="flex-1 h-px bg-slate-700"></div>
                    <span class="text-xs text-slate-400">O continúa con</span>
                    <div class="flex-1 h-px bg-slate-700"></div>
                </div>

                <!-- Botón Google -->
                <button
                    type="button"
                    @click="handleGoogleLogin"
                    :disabled="isSubmitting"
                    class="w-full py-3 px-4 bg-white/10 hover:bg-white/20 border border-slate-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span v-if="!isSubmitting">Google</span>
                    <span v-else class="flex items-center gap-2">
                        <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Conectando...
                    </span>
                </button>

                <p class="mt-4 text-xs text-slate-400 text-center">
                    ¿Eres nueva jugadora?
                    <RouterLink to="/register" class="text-sky-400 hover:text-sky-300 underline">
                        Crea tu cuenta con código de acceso
                    </RouterLink>
                </p>
            </div>

                        <!-- Footer -->
                      <footer class="mt-6 pt-4 border-t border-slate-700/30">
                            <div class="flex gobold items-center justify-center gap-3">
                                <span class="text-sm text-slate-400">En colaboración con</span>
                                <img src="../assets/VK LOGO COLOR.png" alt="Club Vikingas" class="h-14" />
                            </div>
                        </footer>
        </div>

        <!-- Modal Código Google -->
        <div v-if="showCodeModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div class="bg-slate-800 rounded-xl p-6 max-w-sm mx-4">
                <h3 class="text-xl font-bold text-white mb-2">Código de acceso requerido</h3>
                <p class="text-slate-300 text-sm mb-4">
                    Para completar tu registro con Google, ingresa el código especial que te proporcionó tu coach.
                </p>

                <input
                    v-model="googleCode"
                    type="text"
                    placeholder="Ej: PRUEBA-1234"
                    class="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 mb-4"
                    @keydown.enter="handleGoogleCode"
                />

                <div v-if="loginError" class="text-sm text-red-400 mb-4">
                    {{ loginError }}
                </div>

                <div class="flex gap-3">
                    <button
                        @click="cancelGoogleLogin"
                        :disabled="validatingCode"
                        class="flex-1 py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        @click="handleGoogleCode"
                        :disabled="validatingCode"
                        class="flex-1 py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <span v-if="!validatingCode">Verificar</span>
                        <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>


<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { signOut } from 'firebase/auth'
import { auth } from '../services/firebase'

const router = useRouter()
const authStore = useAuthStore()

const REGISTRATION_CODE = import.meta.env.VITE_REGISTRATION_CODE

const isSubmitting = ref(false)
const loginError = ref('')

// Modal para código en Google
const showCodeModal = ref(false)
const googleCode = ref('')
const googleUser = ref(null)
const validatingCode = ref(false)

const handleSubmit = async (formData) => {
    loginError.value = ''
    isSubmitting.value = true

    try {
        console.log('Enviando login con:', formData)

        await authStore.login(formData.email, formData.password)

        console.log('Usuario autenticado:', authStore.user)
        console.log('Perfil:', authStore.profile)

        const role = authStore.profile?.role

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

// Login con Google
const handleGoogleLogin = async () => {
    loginError.value = ''
    isSubmitting.value = true

    try {
        await authStore.loginWithGoogle()

        // Si es un usuario nuevo (sin rol), pedir código
        if (!authStore.profile?.role || authStore.profile?.role === 'athlete') {
            // Mostrar modal para pedir el código
            googleUser.value = authStore.user
            showCodeModal.value = true
            isSubmitting.value = false
            return
        }

        // Usuario existente con rol
        const role = authStore.profile?.role

        if (role === 'coach') {
            router.push('/coach')
        } else if (role === 'athlete') {
            router.push('/athlete')
        }

    } catch (error) {
        console.error('Error en Google login:', error)
        loginError.value = 'No se pudo iniciar sesión con Google.'
        isSubmitting.value = false
    }
}

// Validar código de Google
const handleGoogleCode = async () => {
    if (!googleCode.value.trim()) {
        loginError.value = 'Por favor ingresa el código de acceso.'
        return
    }

    validatingCode.value = true
    loginError.value = ''

    try {
        // Validar código (case-insensitive y sin espacios)
        if (googleCode.value.trim().toUpperCase() !== REGISTRATION_CODE.toUpperCase()) {
            loginError.value = 'El código de acceso no es válido. Consulta con tu coach.'
            validatingCode.value = false
            return
        }

        // Código válido, proceder
        showCodeModal.value = false
        googleCode.value = ''

        const role = authStore.profile?.role

        if (role === 'coach') {
            router.push('/coach')
        } else if (role === 'athlete') {
            router.push('/athlete')
        } else {
            loginError.value = 'Tu usuario no tiene rol asignado en Firestore.'
        }

    } finally {
        validatingCode.value = false
    }
}

// Cancelar Google login
const cancelGoogleLogin = async () => {
    showCodeModal.value = false
    googleCode.value = ''
    googleUser.value = null
    await signOut(auth)
    authStore.user = null
    authStore.profile = null
}
</script>
