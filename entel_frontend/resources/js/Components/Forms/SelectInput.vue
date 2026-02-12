<script setup>
import { computed } from 'vue';

const props = defineProps({
    modelValue: [String, Number],
    label: String,
    options: {
        type: Array,
        default: () => [],
        // [{ value: 1, label: 'Option 1' }]
    },
    placeholder: String,
    error: String,
    required: Boolean,
    disabled: Boolean,
});

const emit = defineEmits(['update:modelValue']);

const value = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val),
});
</script>

<template>
    <div class="space-y-2">
        <label v-if="label" class="block text-sm font-outfit font-medium text-white/80">
            {{ label }}
            <span v-if="required" class="text-entel-orange">*</span>
        </label>
        <select
            v-model="value"
            :disabled="disabled"
            :class="[
                'w-full px-4 py-3 bg-white/5 border rounded-xl text-white font-outfit text-sm transition-all duration-200 appearance-none',
                'focus:outline-none focus:ring-2',
                error
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-white/10 focus:border-entel-orange/50 focus:ring-entel-orange/20',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
            ]"
            style="background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27rgba(255,255,255,0.5)%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-repeat: no-repeat; background-position: right 1rem center; background-size: 1em;"
        >
            <option v-if="placeholder" value="" disabled class="bg-gray-900">{{ placeholder }}</option>
            <option
                v-for="opt in options"
                :key="opt.value"
                :value="opt.value"
                class="bg-gray-900"
            >
                {{ opt.label }}
            </option>
        </select>
        <p v-if="error" class="text-sm text-red-400 font-outfit">{{ error }}</p>
    </div>
</template>
