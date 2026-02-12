<script setup>
import { ref, computed, watch } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import DataTable from '@/Components/UI/DataTable.vue';
import Button from '@/Components/UI/Button.vue';
import Card from '@/Components/UI/Card.vue';
import Modal from '@/Components/UI/Modal.vue';
import Toast from '@/Components/UI/Toast.vue';
import TextInput from '@/Components/Forms/TextInput.vue';
import SelectInput from '@/Components/Forms/SelectInput.vue';

const page = usePage();
const props = defineProps({ pruebas: Array, matrices: Array });
const loading = ref(false);
const showModal = ref(false);
const errors = ref({});
const toast = ref({ show: false, type: 'success', message: '' });

const form = ref({
    nombre: '',
    id_matriz: '',
    correo: '',
    tiempo_timbrado: '30',
    reintentos: '1',
    tipo_lanzamiento: 'Instantaneo',
    programacion: '',
    fecha_lanzamiento: '',
    hora_lanzamiento: '',
    comentario: '',
});

const columns = [
    { key: 'id_prueba', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'matriz.nombre', label: 'Matriz', sortable: true },
    { key: 'tipo_lanzamiento', label: 'Tipo', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
];

const matrizOptions = computed(() =>
    (props.matrices || []).map(m => ({ value: m.id_matriz, label: m.nombre }))
);

const tipoLanzamientoOptions = [
    { value: 'Instantaneo', label: 'Instantáneo' },
    { value: 'Programado', label: 'Programado' },
];

const programacionOptions = [
    { value: 'U', label: 'Una vez' },
    { value: 'T', label: 'Recurrente' },
];

const esProgramado = computed(() => form.value.tipo_lanzamiento === 'Programado');

const openCreateModal = () => {
    form.value = {
        nombre: '',
        id_matriz: '',
        correo: page.props.auth?.user?.correo || '',
        tiempo_timbrado: '30',
        reintentos: '1',
        tipo_lanzamiento: 'Instantaneo',
        programacion: '',
        fecha_lanzamiento: '',
        hora_lanzamiento: '',
        comentario: '',
    };
    errors.value = {};
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const showToast = (type, message) => {
    toast.value = { show: true, type, message };
};

const savePrueba = () => {
    loading.value = true;
    errors.value = {};

    const data = {
        ...form.value,
        id_usuario: page.props.auth?.user?.id_usuario,
    };

    router.post('/generador-pruebas/lanzador-pruebas', data, {
        preserveScroll: true,
        onSuccess: () => {
            closeModal();
            loading.value = false;
            showToast('success', 'Prueba creada correctamente');
        },
        onError: (err) => {
            errors.value = err;
            loading.value = false;
        },
    });
};

const ejecutarPrueba = (prueba) => {
    if (confirm(`¿Ejecutar la prueba ${prueba.nombre}?`)) {
        router.post(`/generador-pruebas/lanzador-pruebas/${prueba.id_prueba}/ejecutar`, {}, {
            preserveScroll: true,
            onSuccess: () => showToast('success', 'Prueba ejecutada correctamente'),
            onError: () => showToast('error', 'Error al ejecutar la prueba'),
        });
    }
};

const pageErrors = computed(() => page.props.errors || {});
watch(pageErrors, (newErrors) => {
    if (newErrors.message) {
        showToast('error', newErrors.message);
    }
}, { immediate: true });
</script>

<template>
    <Head title="Lanzador de Pruebas" />
    <AppLayout title="Lanzador de Pruebas">
        <Toast :show="toast.show" :type="toast.type" :message="toast.message" @close="toast.show = false" />

        <Card>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-outfit font-semibold text-white">Pruebas</h3>
                        <p class="text-sm text-white/50">Ejecuta y monitorea las pruebas del sistema</p>
                    </div>
                    <Button variant="primary" @click="openCreateModal">+ Nueva Prueba</Button>
                </div>
            </template>
            <DataTable :columns="columns" :data="pruebas || []" :loading="loading">
                <template #cell-estado="{ value }">
                    <span :class="['px-2.5 py-1 rounded-full text-xs font-medium',
                        value === 'FINALIZADO' ? 'bg-green-500/20 text-green-400' :
                        value === 'PENDIENTE' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400']">
                        {{ value }}
                    </span>
                </template>
                <template #actions="{ row }">
                    <div class="flex gap-2 justify-end">
                        <button @click.stop="ejecutarPrueba(row)" class="p-2 rounded-lg text-white/50 hover:text-green-400 hover:bg-green-400/10" title="Ejecutar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </button>
                    </div>
                </template>
            </DataTable>
        </Card>

        <!-- Modal Nueva Prueba -->
        <Modal :show="showModal" title="Nueva Prueba" size="lg" @close="closeModal">
            <form @submit.prevent="savePrueba" class="space-y-4">
                <TextInput
                    v-model="form.nombre"
                    label="Nombre de la prueba"
                    placeholder="Ej: Prueba de conectividad sede Lima"
                    :error="errors.nombre"
                    required
                />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectInput
                        v-model="form.id_matriz"
                        label="Matriz"
                        :options="matrizOptions"
                        placeholder="Seleccionar matriz"
                        :error="errors.id_matriz"
                        required
                    />
                    <TextInput
                        v-model="form.correo"
                        label="Correo de notificación"
                        type="email"
                        placeholder="usuario@entel.pe"
                        :error="errors.correo"
                        required
                    />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextInput
                        v-model="form.tiempo_timbrado"
                        label="Tiempo timbrado (seg)"
                        type="number"
                        placeholder="30"
                        :error="errors.tiempo_timbrado"
                        required
                    />
                    <TextInput
                        v-model="form.reintentos"
                        label="Reintentos"
                        type="number"
                        placeholder="1"
                        :error="errors.reintentos"
                        required
                    />
                    <SelectInput
                        v-model="form.tipo_lanzamiento"
                        label="Tipo de lanzamiento"
                        :options="tipoLanzamientoOptions"
                        :error="errors.tipo_lanzamiento"
                        required
                    />
                </div>

                <template v-if="esProgramado">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <SelectInput
                            v-model="form.programacion"
                            label="Programación"
                            :options="programacionOptions"
                            placeholder="Seleccionar"
                            :error="errors.programacion"
                            required
                        />
                        <TextInput
                            v-model="form.fecha_lanzamiento"
                            label="Fecha de lanzamiento"
                            type="date"
                            :error="errors.fecha_lanzamiento"
                            required
                        />
                        <TextInput
                            v-model="form.hora_lanzamiento"
                            label="Hora de lanzamiento"
                            type="time"
                            :error="errors.hora_lanzamiento"
                            required
                        />
                    </div>
                </template>

                <TextInput
                    v-model="form.comentario"
                    label="Comentario"
                    placeholder="Comentario opcional"
                    :error="errors.comentario"
                />
            </form>

            <template #footer>
                <Button @click="closeModal" variant="ghost">Cancelar</Button>
                <Button @click="savePrueba" variant="primary" :loading="loading">Crear Prueba</Button>
            </template>
        </Modal>
    </AppLayout>
</template>
