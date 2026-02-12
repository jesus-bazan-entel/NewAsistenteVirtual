<script setup>
import { ref, computed, onMounted } from 'vue';
import { Head, router, Link } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import Button from '@/Components/UI/Button.vue';
import Card from '@/Components/UI/Card.vue';
import TextInput from '@/Components/Forms/TextInput.vue';
import SelectInput from '@/Components/Forms/SelectInput.vue';

const props = defineProps({
    matriz: Object,
    canales: Array,
    numerosExternos: Array
});

const loading = ref(false);
const matrizNombre = ref(props.matriz?.nombre || '');
const conexiones = ref([]);

// Nueva conexión form
const newConexion = ref({
    id_canal_origen: '',
    tipo: 'C', // C = Canal, E = Externo
    id_destino: ''
});

// Cargar conexiones existentes desde la matriz
onMounted(() => {
    if (props.matriz?.conexiones) {
        conexiones.value = props.matriz.conexiones.map(c => ({
            id_canal_origen: c.id_canal_origen,
            tipo: c.tipo,
            id_destino: c.tipo === 'C' ? c.id_canal_destino : c.id_numero_externo_destino,
            // Info para mostrar
            canal_origen: c.canal_origen,
            canal_destino: c.canal_destino,
            numero_externo: c.numero_externo
        }));
    }
});

// Opciones formateadas para los selectores
const canalesOptions = computed(() => {
    return (props.canales || []).map(c => ({
        value: c.id_canal,
        label: `${c.numero} - ${c.tecnologia_operador?.nombre_operador || 'N/A'} / ${c.tecnologia_operador?.nombre_tecnologia || 'N/A'}`
    }));
});

const numerosExternosOptions = computed(() => {
    return (props.numerosExternos || []).map(n => ({
        value: n.id_numero_externo,
        label: `${n.numero} - ${n.nombre}`
    }));
});

const destinoOptions = computed(() => {
    if (newConexion.value.tipo === 'C') {
        return canalesOptions.value;
    } else {
        return numerosExternosOptions.value;
    }
});

// Obtener info de canal por ID
const getCanalInfo = (id) => {
    const canal = (props.canales || []).find(c => c.id_canal === id);
    if (!canal) return 'N/A';
    return `${canal.numero} - ${canal.tecnologia_operador?.nombre_operador || ''} / ${canal.tecnologia_operador?.nombre_tecnologia || ''}`;
};

// Obtener info de número externo por ID
const getNumeroExternoInfo = (id) => {
    const numero = (props.numerosExternos || []).find(n => n.id_numero_externo === id);
    if (!numero) return 'N/A';
    return `${numero.numero} - ${numero.nombre}`;
};

// Agregar conexión
const addConexion = () => {
    if (!newConexion.value.id_canal_origen || !newConexion.value.id_destino) {
        alert('Selecciona canal origen y destino');
        return;
    }

    conexiones.value.push({
        id_canal_origen: parseInt(newConexion.value.id_canal_origen),
        tipo: newConexion.value.tipo,
        id_destino: parseInt(newConexion.value.id_destino)
    });

    // Reset form
    newConexion.value = {
        id_canal_origen: '',
        tipo: 'C',
        id_destino: ''
    };
};

// Eliminar conexión
const removeConexion = (index) => {
    conexiones.value.splice(index, 1);
};

// Guardar matriz
const save = () => {
    loading.value = true;

    const matrizData = conexiones.value.map(c => ({
        id_canal_origen: c.id_canal_origen,
        tipo: c.tipo,
        id_destino: c.id_destino
    }));

    router.put(`/generador-pruebas/matrices/${props.matriz.id_matriz}`, {
        nombre: matrizNombre.value,
        matriz_data: matrizData
    }, {
        preserveScroll: true,
        onSuccess: () => {
            loading.value = false;
        },
        onError: (err) => {
            console.error('Error saving matrix:', err);
            loading.value = false;
            alert('Error al guardar la matriz');
        },
    });
};

// Cambiar tipo de destino
const onTipoChange = () => {
    newConexion.value.id_destino = '';
};
</script>

<template>
    <Head :title="`Matriz: ${matriz?.nombre || 'Detalle'}`" />
    <AppLayout :title="`Configurar Matriz: ${matriz?.nombre || ''}`">
        <!-- Header con navegación -->
        <div class="mb-6 flex items-center justify-between">
            <Link href="/generador-pruebas/matrices"
                class="flex items-center gap-2 text-white/50 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                </svg>
                Volver a Matrices
            </Link>
            <Button @click="save" variant="primary" :loading="loading">
                Guardar Cambios
            </Button>
        </div>

        <!-- Información de la Matriz -->
        <Card class="mb-6">
            <template #header>
                <h3 class="text-lg font-outfit font-semibold text-white">Información de la Matriz</h3>
            </template>
            <div class="p-4">
                <TextInput
                    v-model="matrizNombre"
                    label="Nombre de la Matriz"
                    placeholder="Ej: Matriz Llamadas Salientes"
                />
            </div>
        </Card>

        <!-- Agregar Conexión -->
        <Card class="mb-6">
            <template #header>
                <h3 class="text-lg font-outfit font-semibold text-white">Agregar Conexión de Prueba</h3>
                <p class="text-sm text-white/50 mt-1">Define las llamadas de prueba: canal origen → destino</p>
            </template>
            <div class="p-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <!-- Canal Origen -->
                    <div>
                        <label class="block text-sm font-medium text-white/70 mb-1.5">Canal Origen</label>
                        <select
                            v-model="newConexion.id_canal_origen"
                            class="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                        >
                            <option value="" disabled class="bg-[#1a1a1a] text-white/50">Seleccionar canal...</option>
                            <option v-for="canal in canalesOptions" :key="canal.value" :value="canal.value" class="bg-[#1a1a1a] text-white py-2">
                                {{ canal.label }}
                            </option>
                        </select>
                    </div>

                    <!-- Tipo Destino -->
                    <div>
                        <label class="block text-sm font-medium text-white/70 mb-1.5">Tipo Destino</label>
                        <select
                            v-model="newConexion.tipo"
                            @change="onTipoChange"
                            class="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                        >
                            <option value="C" class="bg-[#1a1a1a] text-white">Canal (interno)</option>
                            <option value="E" class="bg-[#1a1a1a] text-white">Número Externo</option>
                        </select>
                    </div>

                    <!-- Destino -->
                    <div>
                        <label class="block text-sm font-medium text-white/70 mb-1.5">
                            {{ newConexion.tipo === 'C' ? 'Canal Destino' : 'Número Externo' }}
                        </label>
                        <select
                            v-model="newConexion.id_destino"
                            class="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all text-sm"
                        >
                            <option value="" disabled class="bg-[#1a1a1a] text-white/50">Seleccionar destino...</option>
                            <option v-for="opt in destinoOptions" :key="opt.value" :value="opt.value" class="bg-[#1a1a1a] text-white py-2">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>

                    <!-- Botón Agregar -->
                    <div>
                        <Button @click="addConexion" variant="secondary" class="w-full">
                            + Agregar
                        </Button>
                    </div>
                </div>
            </div>
        </Card>

        <!-- Lista de Conexiones -->
        <Card>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-outfit font-semibold text-white">Conexiones Configuradas</h3>
                        <p class="text-sm text-white/50">{{ conexiones.length }} conexiones de prueba</p>
                    </div>
                </div>
            </template>

            <div v-if="conexiones.length === 0" class="p-8 text-center text-white/50">
                <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                <p>No hay conexiones configuradas</p>
                <p class="text-sm mt-1">Agrega conexiones usando el formulario de arriba</p>
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-white/10">
                            <th class="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">#</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Canal Origen</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Tipo</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Destino</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        <tr v-for="(conexion, index) in conexiones" :key="index" class="hover:bg-white/5 transition-colors">
                            <td class="px-4 py-3 text-sm text-white/70">{{ index + 1 }}</td>
                            <td class="px-4 py-3 text-sm text-white">
                                {{ getCanalInfo(conexion.id_canal_origen) }}
                            </td>
                            <td class="px-4 py-3 text-sm">
                                <span :class="[
                                    'px-2 py-1 rounded text-xs font-medium',
                                    conexion.tipo === 'C' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                                ]">
                                    {{ conexion.tipo === 'C' ? 'Canal' : 'Externo' }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-white">
                                {{ conexion.tipo === 'C' ? getCanalInfo(conexion.id_destino) : getNumeroExternoInfo(conexion.id_destino) }}
                            </td>
                            <td class="px-4 py-3 text-right">
                                <button
                                    @click="removeConexion(index)"
                                    class="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                    title="Eliminar"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </Card>
    </AppLayout>
</template>
