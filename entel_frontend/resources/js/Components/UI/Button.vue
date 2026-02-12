<script setup>
defineProps({
    type: {
        type: String,
        default: 'button',
    },
    variant: {
        type: String,
        default: 'primary', // primary, secondary, danger, ghost
    },
    size: {
        type: String,
        default: 'md', // sm, md, lg
    },
    disabled: Boolean,
    loading: Boolean,
});

const variantClasses = {
    primary: 'bg-gradient-to-r from-entel-orange to-entel-amber text-white shadow-lg shadow-entel-orange/30 hover:shadow-entel-orange/50',
    secondary: 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5',
};

const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
};
</script>

<template>
    <button
        :type="type"
        :disabled="disabled || loading"
        :class="[
            'font-outfit font-medium inline-flex items-center justify-center gap-2 transition-all duration-200',
            variantClasses[variant],
            sizeClasses[size],
            (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5',
        ]"
    >
        <!-- Loading Spinner -->
        <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <slot />
    </button>
</template>
