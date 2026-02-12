<script setup>
import { ref } from 'vue';
import { Head, router, Link } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import DataTable from '@/Components/UI/DataTable.vue';
import Modal from '@/Components/UI/Modal.vue';
import Button from '@/Components/UI/Button.vue';
import Card from '@/Components/UI/Card.vue';
import TextInput from '@/Components/Forms/TextInput.vue';

const props = defineProps({
    matrices: Array,
    canales: Array,
    numerosExternos: Array
});

const loading = ref(false);
const showModal = ref(false);
const form = ref({ nombre: '' });
const errors = ref({});

const columns = [
    { key: 'id_matriz', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
];

const openCreate = () => {
    form.value = { nombre: '' };
    errors.value = {};
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    form.value = { nombre: '' };
    errors.value = {};
};

const save = () => {
    if (!form.value.nombre.trim()) {
        errors.value = { nombre: 'El nombre es requerido' };
        return;
    }

    loading.value = true;

    router.post('/generador-pruebas/matrices', {
        nombre: form.value.nombre,
        matriz_data: []
    }, {
        preserveScroll: true,
        onSuccess: () => { closeModal(); loading.value = false; },
        onError: (err) => { errors.value = err; loading.value = false; },
    });
};

const remove = (item) => {
    if (confirm(`¿Eliminar la matriz "${item.nombre}"?`)) {
        loading.value = true;
        router.delete(`/generador-pruebas/matrices/${item.id_matriz}`, {
            preserveScroll: true,
            onSuccess: () => { loading.value = false; },
            onError: () => { loading.value = false; },
        });
    }
};
</script>

<template>
    <Head title="Matrices" />
    <AppLayout title="Matrices de Prueba">
        <Card>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-outfit font-semibold text-white">Matrices</h3>
                        <p class="text-sm text-white/50">Configura las matrices de pruebas telefónicas</p>
                    </div>
                    <Button @click="openCreate" variant="primary">+ Nueva Matriz</Button>
                </div>
            </template>
            <DataTable :columns="columns" :data="matrices || []" :loading="loading">
                <template #cell-estado="{ value }">
                    <span :class="['px-2.5 py-1 rounded-full text-xs font-medium',
                        value === true || value === 1 ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400']">
                        {{ value === true || value === 1 ? 'Activo' : 'Inactivo' }}
                    </span>
                </template>
                <template #actions="{ row }">
                    <div class="flex items-center gap-1">
                        <Link :href="`/generador-pruebas/matrices/${row.id_matriz}`"
                            class="p-2 rounded-lg text-white/50 hover:text-blue-400 hover:bg-blue-400/10"
                            title="Configurar Conexiones">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                        </Link>
                        <button @click.stop="remove(row)" class="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10" title="Eliminar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </template>
            </DataTable>
        </Card>

        <Modal :show="showModal" title="Nueva Matriz" @close="closeModal">
            <form @submit.prevent="save" class="space-y-4">
                <TextInput
                    v-model="form.nombre"
                    label="Nombre de la Matriz"
                    :error="errors.nombre"
                    placeholder="Ej: Matriz Llamadas Salientes"
                    required
                />
                <p class="text-sm text-white/50">
                    Después de crear la matriz, podrás configurar las conexiones de prueba (canales origen/destino).
                </p>
            </form>
            <template #footer>
                <Button @click="closeModal" variant="ghost">Cancelar</Button>
                <Button @click="save" variant="primary" :loading="loading">
                    Crear Matriz
                </Button>
            </template>
        </Modal>
    </AppLayout>
</template>
