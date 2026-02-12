<script setup>
import { computed } from 'vue';

const props = defineProps({
    modelValue: [String, Number],
    label: String,
    type: {
        type: String,
        default: 'text',
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
        <input
            v-model="value"
            :type="type"
            :placeholder="placeholder"
            :disabled="disabled"
            :class="[
                'w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/40 font-outfit text-sm transition-all duration-200',
                'focus:outline-none focus:ring-2',
                error
                    ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-white/10 focus:border-entel-orange/50 focus:ring-entel-orange/20',
                disabled ? 'opacity-50 cursor-not-allowed' : '',
            ]"
        >
        <p v-if="error" class="text-sm text-red-400 font-outfit">{{ error }}</p>
    </div>
</template>
