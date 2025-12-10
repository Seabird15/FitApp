import { createApp } from 'vue'
import App from './App.vue'

// FormKit
import { plugin, defaultConfig } from '@formkit/vue'

// Router
import { router } from './router'

// Pinia
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'

// Tailwind u otros estilos globales
import './style.css'

const app = createApp(App)

// Pinia
const pinia = createPinia()
app.use(pinia)

// Router
app.use(router)

// FormKit
app.use(plugin, defaultConfig)

// Inicializar listener de autenticación
const authStore = useAuthStore()
authStore.initAuthListener()

app.mount('#app')
