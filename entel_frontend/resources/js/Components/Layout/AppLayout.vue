<script setup>
import { ref, computed } from 'vue';
import { Link, usePage } from '@inertiajs/vue3';

const props = defineProps({
    title: String,
});

const page = usePage();
const user = computed(() => page.props.auth?.user);
const sidebarOpen = ref(true);

const menuItems = computed(() => page.props.auth?.user?.accesos || []);

const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value;
};
</script>

<template>
    <div class="min-h-screen bg-entel-dark">
        <!-- Mesh Background -->
        <div class="fixed inset-0 mesh-bg pointer-events-none"></div>

        <!-- Sidebar -->
        <aside
            :class="[
                'fixed top-0 left-0 z-40 h-screen transition-transform duration-300',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full',
                'w-64 bg-gradient-to-b from-[#0f0f14] to-[#1a1a24] border-r border-white/5'
            ]"
        >
            <!-- Logo -->
            <div class="h-16 flex items-center px-6 border-b border-white/8">
                <img src="/dist/img/entel-logo.png" alt="Entel" class="w-8 h-8 rounded-full mr-3">
                <span class="text-white font-outfit font-semibold text-lg">Entel</span>
            </div>

            <!-- User Panel -->
            <div class="p-4 border-b border-white/8">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-entel-orange to-entel-amber flex items-center justify-center text-white font-semibold">
                        {{ user?.nombres?.charAt(0) || 'U' }}
                    </div>
                    <div>
                        <p class="text-white font-outfit font-medium text-sm">{{ user?.nombres }} {{ user?.apellidos }}</p>
                        <p class="text-white/50 text-xs">{{ user?.correo }}</p>
                    </div>
                </div>
            </div>

            <!-- Navigation -->
            <nav class="p-4 space-y-1 overflow-y-auto h-[calc(100vh-180px)]">
                <!-- Principal -->
                <Link
                    href="/principal"
                    class="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/5 transition-all duration-200 font-outfit"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Principal</span>
                </Link>

                <!-- Dynamic Menu Items -->
                <template v-for="modulo in menuItems" :key="modulo.id">
                    <div class="pt-4">
                        <p class="px-4 text-xs text-white/40 uppercase tracking-wider font-outfit font-medium mb-2">
                            {{ modulo.nombre }}
                        </p>
                        <div class="space-y-1">
                            <Link
                                v-for="submodulo in modulo.submodulos"
                                :key="submodulo.id"
                                :href="`/${modulo.ruta}/${submodulo.ruta}`"
                                class="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 font-outfit text-sm"
                            >
                                <span class="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                                <span>{{ submodulo.nombre }}</span>
                            </Link>
                        </div>
                    </div>
                </template>
            </nav>
        </aside>

        <!-- Main Content -->
        <div :class="['transition-all duration-300', sidebarOpen ? 'ml-64' : 'ml-0']">
            <!-- Top Navbar -->
            <header class="sticky top-0 z-30 h-16 bg-gradient-to-r from-[#0f0f14] to-[#1a1a24] border-b border-white/8 backdrop-blur-lg">
                <div class="flex items-center justify-between h-full px-6">
                    <button
                        @click="toggleSidebar"
                        class="text-white/70 hover:text-white transition-colors"
                    >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <Link
                        href="/cerrar-sesion"
                        class="flex items-center gap-2 text-white/70 hover:text-entel-orange transition-colors font-outfit text-sm"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Cerrar sesión
                    </Link>
                </div>
            </header>

            <!-- Page Content -->
            <main class="p-6 relative z-10">
                <!-- Page Title -->
                <div v-if="title" class="mb-6">
                    <h1 class="text-2xl font-outfit font-bold text-white">{{ title }}</h1>
                </div>

                <slot />
            </main>

            <!-- Footer -->
            <footer class="border-t border-white/8 py-4 px-6 bg-[#0f0f14]">
                <div class="flex items-center justify-between text-sm text-white/40 font-outfit">
                    <span>Copyright &copy; 2024 <a href="http://bestsol.pe" class="text-entel-orange hover:underline">BESTSOL</a>. Todos los derechos reservados</span>
                    <span>Version 4.0.0</span>
                </div>
            </footer>
        </div>
    </div>
</template>
