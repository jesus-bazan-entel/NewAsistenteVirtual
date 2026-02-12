<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
    show: { type: Boolean, default: false },
    type: { type: String, default: 'error' }, // 'success', 'error', 'warning', 'info'
    message: { type: String, default: '' },
    duration: { type: Number, default: 5000 },
    dismissible: { type: Boolean, default: true }
});

const emit = defineEmits(['close']);

const isVisible = ref(false);
let timeoutId = null;

const icons = {
    success: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
    error: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    warning: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
    info: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`
};

const styles = {
    success: 'bg-gradient-to-r from-green-500/20 to-green-600/10 border-green-500/50 text-green-400',
    error: 'bg-gradient-to-r from-red-500/20 to-red-600/10 border-red-500/50 text-red-400',
    warning: 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/50 text-yellow-400',
    info: 'bg-gradient-to-r from-blue-500/20 to-blue-600/10 border-blue-500/50 text-blue-400'
};

const close = () => {
    isVisible.value = false;
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
    setTimeout(() => emit('close'), 300);
};

watch(() => props.show, (newVal) => {
    if (newVal) {
        isVisible.value = true;
        if (props.duration > 0) {
            timeoutId = setTimeout(close, props.duration);
        }
    } else {
        isVisible.value = false;
    }
}, { immediate: true });
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-all duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-[-20px]"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-[-20px]"
        >
            <div v-if="isVisible" class="fixed top-4 right-4 z-[9999] max-w-md">
                <div :class="[
                    'flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm shadow-2xl',
                    styles[type]
                ]">
                    <!-- Icon -->
                    <div class="flex-shrink-0 mt-0.5" v-html="icons[type]"></div>

                    <!-- Content -->
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium leading-relaxed">{{ message }}</p>
                    </div>

                    <!-- Close button -->
                    <button
                        v-if="dismissible"
                        @click="close"
                        class="flex-shrink-0 p-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        <svg class="w-4 h-4 opacity-70 hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
