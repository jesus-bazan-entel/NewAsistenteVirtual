<script setup>
import { ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import DataTable from '@/Components/UI/DataTable.vue';
import Card from '@/Components/UI/Card.vue';

const props = defineProps({ registros: Array });
const loading = ref(false);

const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'clave', label: 'Clave', sortable: true },
    { key: 'fecha_registro', label: 'Fecha', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
];
</script>

<template>
    <Head title="Reporte DISA" />
    <AppLayout title="Reporte DISA">
        <Card>
            <template #header>
                <div>
                    <h3 class="text-lg font-outfit font-semibold text-white">Reporte DISA</h3>
                    <p class="text-sm text-white/50">Consulta los registros DISA del sistema</p>
                </div>
            </template>
            <DataTable :columns="columns" :data="registros || []" :loading="loading" />
        </Card>
    </AppLayout>
</template>
