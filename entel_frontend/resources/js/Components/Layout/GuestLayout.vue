<script setup>
defineProps({
    title: String,
});
</script>

<template>
    <div class="min-h-screen bg-entel-dark flex items-center justify-center relative overflow-hidden">
        <!-- Mesh Background -->
        <div class="absolute inset-0">
            <div class="absolute top-0 left-0 w-full h-full">
                <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-entel-orange/20 rounded-full blur-[120px] animate-pulse"></div>
                <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-entel-amber/15 rounded-full blur-[120px] animate-pulse" style="animation-delay: 1s;"></div>
            </div>
        </div>

        <!-- Content -->
        <div class="relative z-10 w-full max-w-md mx-4">
            <!-- Logo -->
            <div class="text-center mb-8">
                <img src="/dist/img/entel-logo.png" alt="Entel" class="w-16 h-16 mx-auto mb-4 rounded-2xl shadow-lg shadow-entel-orange/20">
                <h1 class="text-3xl font-outfit font-bold gradient-text">Entel</h1>
                <p class="text-white/50 font-outfit mt-2">Sistema de Monitoreo</p>
            </div>

            <!-- Card -->
            <div class="glass-card rounded-2xl p-8">
                <slot />
            </div>

            <!-- Footer -->
            <p class="text-center text-white/30 text-sm font-outfit mt-8">
                &copy; 2024 BESTSOL. Todos los derechos reservados.
            </p>
        </div>
    </div>
</template>
