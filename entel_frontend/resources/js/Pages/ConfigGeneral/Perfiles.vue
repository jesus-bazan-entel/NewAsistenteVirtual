<script setup>
import { ref } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import DataTable from '@/Components/UI/DataTable.vue';
import Modal from '@/Components/UI/Modal.vue';
import Button from '@/Components/UI/Button.vue';
import Card from '@/Components/UI/Card.vue';
import TextInput from '@/Components/Forms/TextInput.vue';

const props = defineProps({
    perfiles: Array,
});

const loading = ref(false);
const showModal = ref(false);
const editingPerfil = ref(null);

const form = ref({
    nombre: '',
    descripcion: '',
});

const errors = ref({});

const columns = [
    { key: 'id_perfil', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'descripcion', label: 'Descripción', sortable: true },
];

const openCreateModal = () => {
    editingPerfil.value = null;
    form.value = { nombre: '', descripcion: '' };
    errors.value = {};
    showModal.value = true;
};

const openEditModal = (perfil) => {
    editingPerfil.value = perfil;
    form.value = {
        nombre: perfil.nombre,
        descripcion: perfil.descripcion,
    };
    errors.value = {};
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    editingPerfil.value = null;
};

const savePerfil = async () => {
    loading.value = true;
    const url = editingPerfil.value
        ? `/configuracion-general/perfiles/${editingPerfil.value.id_perfil}`
        : '/configuracion-general/perfiles';
    const method = editingPerfil.value ? 'put' : 'post';

    router[method](url, form.value, {
        preserveScroll: true,
        onSuccess: () => {
            closeModal();
            loading.value = false;
        },
        onError: (err) => {
            errors.value = err;
            loading.value = false;
        },
    });
};

const deletePerfil = (perfil) => {
    if (confirm(`¿Está seguro de eliminar el perfil ${perfil.nombre}?`)) {
        router.delete(`/configuracion-general/perfiles/${perfil.id_perfil}`, {
            preserveScroll: true,
        });
    }
};
</script>

<template>
    <Head title="Gestión de Perfiles" />

    <AppLayout title="Gestión de Perfiles">
        <Card>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-outfit font-semibold text-white">Perfiles</h3>
                        <p class="text-sm text-white/50 font-outfit mt-1">Administra los perfiles de usuario</p>
                    </div>
                    <Button @click="openCreateModal" variant="primary">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nuevo Perfil
                    </Button>
                </div>
            </template>

            <DataTable :columns="columns" :data="perfiles || []" :loading="loading">
                <template #actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button @click.stop="openEditModal(row)" class="p-2 rounded-lg text-white/50 hover:text-blue-400 hover:bg-blue-400/10 transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button @click.stop="deletePerfil(row)" class="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </template>
            </DataTable>
        </Card>

        <Modal :show="showModal" :title="editingPerfil ? 'Editar Perfil' : 'Nuevo Perfil'" @close="closeModal">
            <form @submit.prevent="savePerfil" class="space-y-4">
                <TextInput v-model="form.nombre" label="Nombre" placeholder="Administrador" :error="errors.nombre" required />
                <TextInput v-model="form.descripcion" label="Descripción" placeholder="Acceso completo al sistema" :error="errors.descripcion" />
            </form>
            <template #footer>
                <Button @click="closeModal" variant="ghost">Cancelar</Button>
                <Button @click="savePerfil" variant="primary" :loading="loading">{{ editingPerfil ? 'Actualizar' : 'Crear' }}</Button>
            </template>
        </Modal>
    </AppLayout>
</template>
