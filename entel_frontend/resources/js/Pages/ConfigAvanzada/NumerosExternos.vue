<script setup>
import { ref, computed, watch } from 'vue';
import { Head, router, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import DataTable from '@/Components/UI/DataTable.vue';
import Modal from '@/Components/UI/Modal.vue';
import Button from '@/Components/UI/Button.vue';
import Card from '@/Components/UI/Card.vue';
import TextInput from '@/Components/Forms/TextInput.vue';
import Toast from '@/Components/UI/Toast.vue';

const props = defineProps({ numeros: Array });
const page = usePage();
const loading = ref(false);
const showModal = ref(false);
const editing = ref(null);
const form = ref({ numero: '', nombre: '', comentario: '' });
const errors = ref({});

// Toast state
const toast = ref({
    show: false,
    type: 'error',
    message: ''
});

// Obtener errores del servidor y mostrar toast
const pageErrors = computed(() => page.props.errors || {});

watch(pageErrors, (newErrors) => {
    if (newErrors.message) {
        showToast('error', newErrors.message);
    }
}, { immediate: true });

const showToast = (type, message) => {
    toast.value = { show: true, type, message };
};

const hideToast = () => {
    toast.value.show = false;
};

const columns = [
    { key: 'id_numero_externo', label: 'ID', sortable: true },
    { key: 'numero', label: 'Número', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'comentario', label: 'Comentario', sortable: true },
];

const openCreate = () => { editing.value = null; form.value = { numero: '', nombre: '', comentario: '' }; errors.value = {}; showModal.value = true; };
const openEdit = (item) => { editing.value = item; form.value = { numero: item.numero, nombre: item.nombre, comentario: item.comentario || '' }; errors.value = {}; showModal.value = true; };
const closeModal = () => { showModal.value = false; editing.value = null; errors.value = {}; };

const save = () => {
    if (!form.value.numero.trim()) {
        errors.value = { numero: 'El número es requerido' };
        return;
    }
    loading.value = true;
    const url = editing.value ? `/configuracion-avanzada/numeros-externos/${editing.value.id_numero_externo}` : '/configuracion-avanzada/numeros-externos';
    router[editing.value ? 'put' : 'post'](url, form.value, {
        preserveScroll: true,
        onSuccess: () => {
            closeModal();
            loading.value = false;
            showToast('success', editing.value ? 'Número actualizado correctamente' : 'Número creado correctamente');
        },
        onError: (err) => {
            errors.value = err;
            loading.value = false;
        },
    });
};

const remove = (item) => {
    if (confirm(`¿Estás seguro de eliminar "${item.numero}"?\n\nEsta acción no se puede deshacer.`)) {
        loading.value = true;
        router.delete(`/configuracion-avanzada/numeros-externos/${item.id_numero_externo}`, {
            preserveScroll: true,
            onSuccess: () => {
                loading.value = false;
                showToast('success', 'Número eliminado correctamente');
            },
            onError: (err) => {
                loading.value = false;
            },
        });
    }
};
</script>

<template>
    <Head title="Números Externos" />
    <AppLayout title="Números Externos">
        <!-- Toast Notification -->
        <Toast
            :show="toast.show"
            :type="toast.type"
            :message="toast.message"
            @close="hideToast"
        />

        <Card>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-outfit font-semibold text-white">Números Externos</h3>
                        <p class="text-sm text-white/50">Administra los números externos para pruebas</p>
                    </div>
                    <Button @click="openCreate" variant="primary">+ Nuevo Número</Button>
                </div>
            </template>
            <DataTable :columns="columns" :data="numeros || []" :loading="loading">
                <template #actions="{ row }">
                    <div class="flex gap-1 justify-end">
                        <button @click.stop="openEdit(row)" class="p-2 rounded-lg text-white/50 hover:text-orange-400 hover:bg-orange-400/10 transition-all" title="Editar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button @click.stop="remove(row)" class="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all" title="Eliminar">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    </div>
                </template>
            </DataTable>
        </Card>
        <Modal :show="showModal" :title="editing ? 'Editar Número' : 'Nuevo Número'" @close="closeModal">
            <form @submit.prevent="save" class="space-y-4">
                <TextInput v-model="form.numero" label="Número" :error="errors.numero" placeholder="Ej: +51987654321" required />
                <TextInput v-model="form.nombre" label="Nombre" :error="errors.nombre" placeholder="Ej: Claro Móvil 1" />
                <TextInput v-model="form.comentario" label="Comentario" :error="errors.comentario" placeholder="Ej: Número de prueba" />
            </form>
            <template #footer>
                <Button @click="closeModal" variant="ghost">Cancelar</Button>
                <Button @click="save" variant="primary" :loading="loading">{{ editing ? 'Actualizar' : 'Crear' }}</Button>
            </template>
        </Modal>
    </AppLayout>
</template>
