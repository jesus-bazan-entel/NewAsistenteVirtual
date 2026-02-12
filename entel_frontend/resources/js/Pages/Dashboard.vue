<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Link, Head } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import Card from '@/Components/UI/Card.vue';
import Button from '@/Components/UI/Button.vue';

const currentTime = ref('');

const updateTime = () => {
    const now = new Date();
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    };
    const timeString = now.toLocaleDateString('es-PE', options);
    currentTime.value = timeString.charAt(0).toUpperCase() + timeString.slice(1);
};

let timeInterval;

onMounted(() => {
    updateTime();
    timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
    clearInterval(timeInterval);
});

const modules = [
    {
        title: 'Configuración General',
        subtitle: 'Usuarios, perfiles y accesos',
        icon: '👥',
        iconColor: 'purple',
        links: [
            { label: 'Gestión de Usuarios', href: '/configuracion-general/usuarios' },
            { label: 'Gestión de Perfiles', href: '/configuracion-general/perfiles' },
        ],
    },
    {
        title: 'Configuraciones',
        subtitle: 'Tecnologías y equipos',
        icon: '⚙️',
        iconColor: 'teal',
        links: [
            { label: 'Tecnologías', href: '/configuracion-avanzada/tecnologias' },
            { label: 'Operadores Telefónicos', href: '/configuracion-avanzada/operadores-telefonicos' },
            { label: 'Equipos', href: '/configuracion-avanzada/equipos' },
            { label: 'Números Externos', href: '/configuracion-avanzada/numeros-externos' },
        ],
    },
    {
        title: 'Generador de Pruebas',
        subtitle: 'Matrices y ejecución',
        icon: '🧪',
        iconColor: 'orange',
        links: [
            { label: 'Matrices', href: '/generador-pruebas/matrices' },
            { label: 'Lanzador de Pruebas', href: '/generador-pruebas/lanzador-pruebas' },
        ],
    },
    {
        title: 'Reportes',
        subtitle: 'Análisis y métricas',
        icon: '📊',
        iconColor: 'blue',
        links: [
            { label: 'Reporte de Prueba', href: '/reportes/reporte-pruebas' },
            { label: 'Reporte DISA', href: '/reportes/reporte-disa' },
        ],
    },
    {
        title: 'DISA',
        subtitle: 'Gestión de accesos',
        icon: '🔑',
        iconColor: 'pink',
        links: [
            { label: 'Registro de Clave', href: '/disa/registro-clave' },
        ],
    },
];
</script>

<template>
    <Head title="Dashboard" />

    <AppLayout>
        <div class="space-y-8">
            <!-- Hero Section -->
            <div class="space-y-2">
                <h1 class="text-4xl font-outfit font-extrabold gradient-text">Centro de Control</h1>
                <p class="text-lg text-white/60 font-outfit font-light">Sistema de monitoreo y pruebas de telecomunicaciones</p>
                <div class="flex items-center gap-2 mt-4">
                    <span class="w-2 h-2 rounded-full bg-entel-orange animate-pulse-glow"></span>
                    <span class="text-entel-orange font-mono text-sm">{{ currentTime }}</span>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="flex flex-wrap gap-4">
                <Link href="/generador-pruebas/lanzador-pruebas">
                    <Button variant="primary" size="lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Lanzar Prueba
                    </Button>
                </Link>
                <Link href="/reportes/reporte-pruebas">
                    <Button variant="secondary" size="lg">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Ver Reportes
                    </Button>
                </Link>
            </div>

            <!-- Module Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card
                    v-for="(mod, index) in modules"
                    :key="mod.title"
                    :title="mod.title"
                    :subtitle="mod.subtitle"
                    :icon="mod.icon"
                    :iconColor="mod.iconColor"
                    :class="'animate-fade-in-up'"
                    :style="{ animationDelay: `${index * 0.1}s` }"
                >
                    <div class="space-y-1 -mx-2">
                        <Link
                            v-for="link in mod.links"
                            :key="link.href"
                            :href="link.href"
                            class="flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 group"
                        >
                            <span class="w-1.5 h-1.5 rounded-full bg-current opacity-50 group-hover:opacity-100 group-hover:bg-entel-orange transition-all"></span>
                            <span class="font-outfit text-sm">{{ link.label }}</span>
                            <svg class="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-50 group-hover:translate-x-0 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    </AppLayout>
</template>
