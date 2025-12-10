<template>
    <div class="min-h-screen bg-slate-900 text-white flex flex-col">
        <header class="px-6 py-4 border-b border-slate-700 flex justify-between items-center">
            <h1 class="text-xl font-semibold">
                Panel Coach
            </h1>
            <div class="flex items-center gap-3">
                <span class="text-sm text-slate-300">
                    {{ authStore.user?.email }}
                </span>
            </div>
        </header>

        <main class="flex-1 p-6">
            <p class="text-slate-200 mb-4">
                Login exitoso. Aquí después vas a ver:
            </p>
            <ul class="list-disc list-inside text-slate-300 text-sm space-y-1">
                <li>Lista de jugadoras.</li>
                <li>Próximas sesiones.</li>
                <li>Accesos a rutinas, asistencia, etc.</li>
            </ul>
        </main>
    </div>
</template>

<script setup>

import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
</script>