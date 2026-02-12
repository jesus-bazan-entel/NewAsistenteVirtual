<script setup>
import { ref } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import DataTable from '@/Components/UI/DataTable.vue';
import Modal from '@/Components/UI/Modal.vue';
import Button from '@/Components/UI/Button.vue';
import Card from '@/Components/UI/Card.vue';
import TextInput from '@/Components/Forms/TextInput.vue';

const props = defineProps({ registros: Array });
const loading = ref(false);
const showModal = ref(false);
const form = ref({ nombre: '', clave: '', comentario: '' });
const errors = ref({});

const columns = [
    { key: 'id_registro_clave', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'clave', label: 'Clave', sortable: true },
    { key: 'comentario', label: 'Comentario', sortable: true },
];

const openCreate = () => { form.value = { nombre: '', clave: '', comentario: '' }; showModal.value = true; };
const closeModal = () => { showModal.value = false; };

const save = () => {
    loading.value = true;
    router.post('/disa/registro-clave', form.value, {
        preserveScroll: true,
        onSuccess: () => { closeModal(); loading.value = false; },
        onError: (err) => { errors.value = err; loading.value = false; },
    });
};

const remove = (item) => { if (confirm(`¿Eliminar registro "${item.nombre}"?`)) router.delete(`/disa/registro-clave/${item.id_registro_clave}`); };
</script>

<template>
    <Head title="Registro de Clave DISA" />
    <AppLayout title="Registro de Clave">
        <Card>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-outfit font-semibold text-white">Registro de Claves</h3>
                        <p class="text-sm text-white/50">Administra las claves DISA del sistema</p>
                    </div>
                    <Button @click="openCreate" variant="primary">+ Nueva Clave</Button>
                </div>
            </template>
            <DataTable :columns="columns" :data="registros || []" :loading="loading">
                <template #actions="{ row }">
                    <button @click.stop="remove(row)" class="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                </template>
            </DataTable>
        </Card>
        <Modal :show="showModal" title="Nueva Clave DISA" @close="closeModal">
            <form @submit.prevent="save" class="space-y-4">
                <TextInput v-model="form.nombre" label="Nombre" :error="errors.nombre" placeholder="Ej: Clave Principal" required />
                <TextInput v-model="form.clave" label="Clave" :error="errors.clave" placeholder="Ej: 1234" required />
                <TextInput v-model="form.comentario" label="Comentario" :error="errors.comentario" placeholder="Ej: Uso interno" />
            </form>
            <template #footer>
                <Button @click="closeModal" variant="ghost">Cancelar</Button>
                <Button @click="save" variant="primary" :loading="loading">Crear</Button>
            </template>
        </Modal>
    </AppLayout>
</template>
