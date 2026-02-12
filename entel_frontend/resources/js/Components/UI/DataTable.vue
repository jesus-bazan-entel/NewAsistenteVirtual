<script setup>
import { ref, computed, watch } from 'vue';
import Button from './Button.vue';

const props = defineProps({
    columns: {
        type: Array,
        required: true,
        // [{ key: 'name', label: 'Nombre', sortable: true }]
    },
    data: {
        type: Array,
        default: () => [],
    },
    loading: Boolean,
    searchable: {
        type: Boolean,
        default: true,
    },
    paginated: {
        type: Boolean,
        default: true,
    },
    perPageOptions: {
        type: Array,
        default: () => [10, 25, 50, 100],
    },
});

const emit = defineEmits(['rowClick', 'edit', 'delete']);

// State
const search = ref('');
const sortKey = ref('');
const sortOrder = ref('asc');
const currentPage = ref(1);
const perPage = ref(10);

// Reset page when search changes
watch(search, () => {
    currentPage.value = 1;
});

// Filtered and sorted data
const processedData = computed(() => {
    let result = [...props.data];

    // Search
    if (search.value) {
        const searchLower = search.value.toLowerCase();
        result = result.filter(row => {
            return props.columns.some(col => {
                const value = row[col.key];
                return value && String(value).toLowerCase().includes(searchLower);
            });
        });
    }

    // Sort
    if (sortKey.value) {
        result.sort((a, b) => {
            const aVal = a[sortKey.value];
            const bVal = b[sortKey.value];

            if (aVal < bVal) return sortOrder.value === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortOrder.value === 'asc' ? 1 : -1;
            return 0;
        });
    }

    return result;
});

// Paginated data
const paginatedData = computed(() => {
    if (!props.paginated) return processedData.value;

    const start = (currentPage.value - 1) * perPage.value;
    return processedData.value.slice(start, start + perPage.value);
});

// Total pages
const totalPages = computed(() => {
    return Math.ceil(processedData.value.length / perPage.value);
});

// Sort handler
const handleSort = (key) => {
    if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
        sortKey.value = key;
        sortOrder.value = 'asc';
    }
};

// Page navigation
const goToPage = (page) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};
</script>

<template>
    <div class="space-y-4">
        <!-- Header: Search and Per Page -->
        <div class="flex flex-col sm:flex-row gap-4 justify-between">
            <!-- Search -->
            <div v-if="searchable" class="relative">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    v-model="search"
                    type="text"
                    placeholder="Buscar..."
                    class="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 font-outfit text-sm focus:outline-none focus:border-entel-orange/50 focus:ring-1 focus:ring-entel-orange/50 transition-all"
                >
            </div>

            <!-- Per Page -->
            <div v-if="paginated" class="flex items-center gap-2">
                <span class="text-white/50 text-sm font-outfit">Mostrar</span>
                <select
                    v-model="perPage"
                    class="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-outfit focus:outline-none focus:border-entel-orange/50"
                >
                    <option v-for="opt in perPageOptions" :key="opt" :value="opt">{{ opt }}</option>
                </select>
                <span class="text-white/50 text-sm font-outfit">registros</span>
            </div>
        </div>

        <!-- Table -->
        <div class="glass-card rounded-xl overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead>
                        <tr class="border-b border-white/8">
                            <th
                                v-for="col in columns"
                                :key="col.key"
                                :class="[
                                    'px-6 py-4 text-left text-xs font-outfit font-semibold text-white/70 uppercase tracking-wider',
                                    col.sortable ? 'cursor-pointer hover:text-white transition-colors select-none' : '',
                                ]"
                                @click="col.sortable && handleSort(col.key)"
                            >
                                <div class="flex items-center gap-2">
                                    <span>{{ col.label }}</span>
                                    <span v-if="col.sortable && sortKey === col.key" class="text-entel-orange">
                                        <svg v-if="sortOrder === 'asc'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                                        </svg>
                                        <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </div>
                            </th>
                            <th v-if="$slots.actions" class="px-6 py-4 text-right text-xs font-outfit font-semibold text-white/70 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Loading State -->
                        <tr v-if="loading">
                            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center">
                                <div class="flex flex-col items-center gap-3">
                                    <svg class="w-8 h-8 animate-spin text-entel-orange" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span class="text-white/50 font-outfit">Cargando datos...</span>
                                </div>
                            </td>
                        </tr>

                        <!-- Empty State -->
                        <tr v-else-if="paginatedData.length === 0">
                            <td :colspan="columns.length + ($slots.actions ? 1 : 0)" class="px-6 py-12 text-center">
                                <div class="flex flex-col items-center gap-3">
                                    <svg class="w-12 h-12 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                    <span class="text-white/50 font-outfit">No se encontraron registros</span>
                                </div>
                            </td>
                        </tr>

                        <!-- Data Rows -->
                        <tr
                            v-else
                            v-for="(row, index) in paginatedData"
                            :key="row.id || index"
                            class="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                            @click="emit('rowClick', row)"
                        >
                            <td
                                v-for="col in columns"
                                :key="col.key"
                                class="px-6 py-4 text-sm text-white/80 font-outfit"
                            >
                                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                                    {{ row[col.key] }}
                                </slot>
                            </td>
                            <td v-if="$slots.actions" class="px-6 py-4 text-right">
                                <slot name="actions" :row="row" />
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="paginated && totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p class="text-sm text-white/50 font-outfit">
                Mostrando {{ (currentPage - 1) * perPage + 1 }} a {{ Math.min(currentPage * perPage, processedData.length) }} de {{ processedData.length }} registros
            </p>

            <div class="flex items-center gap-1">
                <button
                    @click="goToPage(currentPage - 1)"
                    :disabled="currentPage === 1"
                    class="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                <template v-for="page in totalPages" :key="page">
                    <button
                        v-if="page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)"
                        @click="goToPage(page)"
                        :class="[
                            'min-w-[40px] h-10 rounded-lg font-outfit text-sm transition-all',
                            page === currentPage
                                ? 'bg-gradient-to-r from-entel-orange to-entel-amber text-white'
                                : 'text-white/50 hover:text-white hover:bg-white/5',
                        ]"
                    >
                        {{ page }}
                    </button>
                    <span
                        v-else-if="page === currentPage - 2 || page === currentPage + 2"
                        class="text-white/30"
                    >
                        ...
                    </span>
                </template>

                <button
                    @click="goToPage(currentPage + 1)"
                    :disabled="currentPage === totalPages"
                    class="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    </div>
</template>
