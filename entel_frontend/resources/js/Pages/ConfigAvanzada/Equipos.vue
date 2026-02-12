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

const props = defineProps({ equipos: Array });
const page = usePage();
const loading = ref(false);
const showModal = ref(false);
const editing = ref(null);
const form = ref({ nombre: '', ip: '', tipo: 'gateway', ranuras: '8' });
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
    { key: 'id_equipo', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'ip', label: 'IP', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
];

const openCreate = () => { editing.value = null; form.value = { nombre: '', ip: '', tipo: 'gateway', ranuras: '8' }; errors.value = {}; showModal.value = true; };
const openEdit = (item) => { editing.value = item; form.value = { nombre: item.nombre, ip: item.ip, tipo: item.tipo, ranuras: item.ranuras }; errors.value = {}; showModal.value = true; };
const closeModal = () => { showModal.value = false; editing.value = null; errors.value = {}; };

const save = () => {
    if (!form.value.nombre.trim()) {
        errors.value = { nombre: 'El nombre es requerido' };
        return;
    }
    loading.value = true;
    const url = editing.value ? `/configuracion-avanzada/equipos/${editing.value.id_equipo}` : '/configuracion-avanzada/equipos';
    router[editing.value ? 'put' : 'post'](url, form.value, {
        preserveScroll: true,
        onSuccess: () => {
            closeModal();
            loading.value = false;
            showToast('success', editing.value ? 'Equipo actualizado correctamente' : 'Equipo creado correctamente');
        },
        onError: (err) => {
            errors.value = err;
            loading.value = false;
        },
    });
};

const remove = (item) => {
    if (confirm(`¿Estás seguro de eliminar "${item.nombre}"?\n\nEsta acción no se puede deshacer.`)) {
        loading.value = true;
        router.delete(`/configuracion-avanzada/equipos/${item.id_equipo}`, {
            preserveScroll: true,
            onSuccess: () => {
                loading.value = false;
                showToast('success', 'Equipo eliminado correctamente');
            },
            onError: (err) => {
                loading.value = false;
            },
        });
    }
};
</script>

<template>
    <Head title="Equipos" />
    <AppLayout title="Equipos">
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
                        <h3 class="text-lg font-outfit font-semibold text-white">Equipos</h3>
                        <p class="text-sm text-white/50">Administra los equipos del sistema</p>
                    </div>
                    <Button @click="openCreate" variant="primary">+ Nuevo Equipo</Button>
                </div>
            </template>
            <DataTable :columns="columns" :data="equipos || []" :loading="loading">
                <template #cell-estado="{ value }">
                    <span :class="['px-2.5 py-1 rounded-full text-xs font-medium',
                        value === 'A' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400']">
                        {{ value === 'A' ? 'Activo' : 'Inactivo' }}
                    </span>
                </template>
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
        <Modal :show="showModal" :title="editing ? 'Editar Equipo' : 'Nuevo Equipo'" @close="closeModal">
            <form @submit.prevent="save" class="space-y-4">
                <TextInput v-model="form.nombre" label="Nombre" :error="errors.nombre" placeholder="Ej: GW-Dinstar-GSM-01" required />
                <TextInput v-model="form.ip" label="Dirección IP" :error="errors.ip" placeholder="Ej: 192.168.1.100" />
                <div>
                    <label class="block text-sm font-medium text-white/70 mb-1.5">Tipo</label>
                    <select v-model="form.tipo" class="w-full px-3 py-2.5 bg-[#1a1a1a] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50">
                        <option value="gateway" class="bg-[#1a1a1a] text-white">Gateway GSM/VoIP</option>
                        <option value="pbx" class="bg-[#1a1a1a] text-white">PBX</option>
                        <option value="ata" class="bg-[#1a1a1a] text-white">ATA</option>
                        <option value="sip_trunk" class="bg-[#1a1a1a] text-white">SIP Trunk</option>
                    </select>
                </div>
                <TextInput v-model="form.ranuras" label="Ranuras" :error="errors.ranuras" placeholder="Ej: 1" />
            </form>
            <template #footer>
                <Button @click="closeModal" variant="ghost">Cancelar</Button>
                <Button @click="save" variant="primary" :loading="loading">{{ editing ? 'Actualizar' : 'Crear' }}</Button>
            </template>
        </Modal>
    </AppLayout>
</template>
