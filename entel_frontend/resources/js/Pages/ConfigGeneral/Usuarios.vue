<script setup>
import { ref, onMounted } from 'vue';
import { Head, router } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import DataTable from '@/Components/UI/DataTable.vue';
import Modal from '@/Components/UI/Modal.vue';
import Button from '@/Components/UI/Button.vue';
import Card from '@/Components/UI/Card.vue';
import TextInput from '@/Components/Forms/TextInput.vue';
import SelectInput from '@/Components/Forms/SelectInput.vue';

const props = defineProps({
    usuarios: Array,
    perfiles: Array,
    sedes: Array,
});

const loading = ref(false);
const showModal = ref(false);
const editingUser = ref(null);

const form = ref({
    nombres: '',
    apellidos: '',
    correo: '',
    clave: '',
    id_perfil: '',
    id_sede: '',
    acceso: 'A',
});

const errors = ref({});

const columns = [
    { key: 'id_usuario', label: 'ID', sortable: true },
    { key: 'nombres', label: 'Nombres', sortable: true },
    { key: 'apellidos', label: 'Apellidos', sortable: true },
    { key: 'correo', label: 'Correo', sortable: true },
    { key: 'perfil_nombre', label: 'Perfil', sortable: true },
    { key: 'acceso', label: 'Estado', sortable: true },
];

const openCreateModal = () => {
    editingUser.value = null;
    form.value = {
        nombres: '',
        apellidos: '',
        correo: '',
        clave: '',
        id_perfil: '',
        id_sede: '',
        acceso: 'A',
    };
    errors.value = {};
    showModal.value = true;
};

const openEditModal = (user) => {
    editingUser.value = user;
    form.value = {
        nombres: user.nombres,
        apellidos: user.apellidos,
        correo: user.correo,
        clave: '',
        id_perfil: user.id_perfil,
        id_sede: user.id_sede,
        acceso: user.acceso,
    };
    errors.value = {};
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    editingUser.value = null;
};

const saveUser = async () => {
    loading.value = true;
    errors.value = {};

    try {
        if (editingUser.value) {
            await router.put(`/configuracion-general/usuarios/${editingUser.value.id_usuario}`, form.value, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
                onError: (err) => errors.value = err,
            });
        } else {
            await router.post('/configuracion-general/usuarios', form.value, {
                preserveScroll: true,
                onSuccess: () => closeModal(),
                onError: (err) => errors.value = err,
            });
        }
    } finally {
        loading.value = false;
    }
};

const deleteUser = async (user) => {
    if (confirm(`¿Está seguro de eliminar al usuario ${user.nombres} ${user.apellidos}?`)) {
        await router.delete(`/configuracion-general/usuarios/${user.id_usuario}`, {
            preserveScroll: true,
        });
    }
};

const perfilOptions = (props.perfiles || []).map(p => ({
    value: p.id_perfil,
    label: p.nombre,
}));

const sedeOptions = (props.sedes || []).map(s => ({
    value: s.id_sede,
    label: s.nombre,
}));

const accesoOptions = [
    { value: 'A', label: 'Activo' },
    { value: 'D', label: 'Desactivado' },
];
</script>

<template>
    <Head title="Gestión de Usuarios" />

    <AppLayout title="Gestión de Usuarios">
        <Card>
            <template #header>
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-outfit font-semibold text-white">Usuarios</h3>
                        <p class="text-sm text-white/50 font-outfit mt-1">Administra los usuarios del sistema</p>
                    </div>
                    <Button @click="openCreateModal" variant="primary">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Nuevo Usuario
                    </Button>
                </div>
            </template>

            <DataTable
                :columns="columns"
                :data="usuarios || []"
                :loading="loading"
            >
                <template #cell-acceso="{ value }">
                    <span :class="[
                        'px-2.5 py-1 rounded-full text-xs font-outfit font-medium',
                        value === 'A'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                    ]">
                        {{ value === 'A' ? 'Activo' : 'Inactivo' }}
                    </span>
                </template>

                <template #actions="{ row }">
                    <div class="flex items-center justify-end gap-2">
                        <button
                            @click.stop="openEditModal(row)"
                            class="p-2 rounded-lg text-white/50 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                            title="Editar"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button
                            @click.stop="deleteUser(row)"
                            class="p-2 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                            title="Eliminar"
                        >
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </template>
            </DataTable>
        </Card>

        <!-- Create/Edit Modal -->
        <Modal :show="showModal" :title="editingUser ? 'Editar Usuario' : 'Nuevo Usuario'" @close="closeModal">
            <form @submit.prevent="saveUser" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput
                        v-model="form.nombres"
                        label="Nombres"
                        placeholder="Juan"
                        :error="errors.nombres"
                        required
                    />
                    <TextInput
                        v-model="form.apellidos"
                        label="Apellidos"
                        placeholder="Pérez"
                        :error="errors.apellidos"
                        required
                    />
                </div>

                <TextInput
                    v-model="form.correo"
                    label="Correo electrónico"
                    type="email"
                    placeholder="juan.perez@entel.pe"
                    :error="errors.correo"
                    required
                />

                <TextInput
                    v-model="form.clave"
                    label="Contraseña"
                    type="password"
                    :placeholder="editingUser ? 'Dejar vacío para mantener actual' : '••••••••'"
                    :error="errors.clave"
                    :required="!editingUser"
                />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectInput
                        v-model="form.id_perfil"
                        label="Perfil"
                        :options="perfilOptions"
                        placeholder="Seleccionar perfil"
                        :error="errors.id_perfil"
                        required
                    />
                    <SelectInput
                        v-model="form.id_sede"
                        label="Sede"
                        :options="sedeOptions"
                        placeholder="Seleccionar sede"
                        :error="errors.id_sede"
                    />
                </div>

                <SelectInput
                    v-model="form.acceso"
                    label="Estado"
                    :options="accesoOptions"
                    :error="errors.acceso"
                    required
                />
            </form>

            <template #footer>
                <Button @click="closeModal" variant="ghost">Cancelar</Button>
                <Button @click="saveUser" variant="primary" :loading="loading">
                    {{ editingUser ? 'Actualizar' : 'Crear' }}
                </Button>
            </template>
        </Modal>
    </AppLayout>
</template>
