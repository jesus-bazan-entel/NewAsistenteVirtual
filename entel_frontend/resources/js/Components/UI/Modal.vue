<script setup>
import { watch } from 'vue';
import Button from './Button.vue';

const props = defineProps({
    show: Boolean,
    title: String,
    size: {
        type: String,
        default: 'md', // sm, md, lg, xl
    },
    closeable: {
        type: Boolean,
        default: true,
    },
});

const emit = defineEmits(['close']);

const close = () => {
    if (props.closeable) {
        emit('close');
    }
};

// Handle escape key
watch(() => props.show, (show) => {
    if (show) {
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleEscape);
    } else {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEscape);
    }
});

const handleEscape = (e) => {
    if (e.key === 'Escape') {
        close();
    }
};

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
};
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-200"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
        >
            <div
                v-if="show"
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
                <!-- Backdrop -->
                <div
                    class="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    @click="close"
                ></div>

                <!-- Modal Content -->
                <Transition
                    enter-active-class="transition-all duration-200"
                    leave-active-class="transition-all duration-200"
                    enter-from-class="opacity-0 scale-95 translate-y-4"
                    leave-to-class="opacity-0 scale-95 translate-y-4"
                >
                    <div
                        v-if="show"
                        :class="[
                            'relative w-full glass-card rounded-2xl overflow-hidden',
                            sizeClasses[size],
                        ]"
                    >
                        <!-- Header -->
                        <div class="flex items-center justify-between p-6 border-b border-white/8">
                            <h2 class="text-xl font-outfit font-semibold text-white">
                                {{ title }}
                            </h2>
                            <button
                                v-if="closeable"
                                @click="close"
                                class="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <!-- Body -->
                        <div class="p-6 max-h-[70vh] overflow-y-auto">
                            <slot />
                        </div>

                        <!-- Footer -->
                        <div v-if="$slots.footer" class="p-6 border-t border-white/8 bg-white/[0.02] flex justify-end gap-3">
                            <slot name="footer" />
                        </div>
                    </div>
                </Transition>
            </div>
        </Transition>
    </Teleport>
</template>
