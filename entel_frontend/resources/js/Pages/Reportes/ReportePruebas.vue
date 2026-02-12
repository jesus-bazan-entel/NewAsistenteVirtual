<script setup>
import { ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import AppLayout from '@/Components/Layout/AppLayout.vue';
import DataTable from '@/Components/UI/DataTable.vue';
import Card from '@/Components/UI/Card.vue';

const props = defineProps({ ejecuciones: Array });
const loading = ref(false);

const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'prueba_nombre', label: 'Prueba', sortable: true },
    { key: 'fecha_inicio', label: 'Fecha Inicio', sortable: true },
    { key: 'fecha_fin', label: 'Fecha Fin', sortable: true },
    { key: 'estado', label: 'Estado', sortable: true },
    { key: 'total_escenarios', label: 'Escenarios', sortable: true },
];
</script>

<template>
    <Head title="Reporte de Pruebas" />
    <AppLayout title="Reporte de Pruebas">
        <Card>
            <template #header>
                <div>
                    <h3 class="text-lg font-outfit font-semibold text-white">Historial de Ejecuciones</h3>
                    <p class="text-sm text-white/50">Consulta el historial de pruebas ejecutadas</p>
                </div>
            </template>
            <DataTable :columns="columns" :data="ejecuciones || []" :loading="loading">
                <template #cell-estado="{ value }">
                    <span :class="['px-2.5 py-1 rounded-full text-xs font-medium',
                        value === 'FINALIZADO' ? 'bg-green-500/20 text-green-400' :
                        value === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400']">
                        {{ value }}
                    </span>
                </template>
            </DataTable>
        </Card>
    </AppLayout>
</template>
