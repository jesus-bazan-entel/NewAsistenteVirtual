<script setup>
defineProps({
    title: String,
    subtitle: String,
    icon: String,
    iconColor: {
        type: String,
        default: 'orange', // orange, teal, blue, purple, pink
    },
    noPadding: Boolean,
});

const iconColorClasses = {
    orange: 'from-entel-orange to-entel-amber shadow-entel-orange/30',
    teal: 'from-teal-500 to-teal-600 shadow-teal-500/30',
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/30',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/30',
    pink: 'from-pink-500 to-pink-600 shadow-pink-500/30',
};
</script>

<template>
    <div class="glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:border-entel-orange/30 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 group">
        <!-- Gradient Top Border on Hover -->
        <div class="h-0.5 bg-gradient-to-r from-entel-orange to-entel-amber opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <!-- Header -->
        <div v-if="title || $slots.header" class="p-6 pb-0">
            <slot name="header">
                <div class="flex items-start gap-4">
                    <!-- Icon -->
                    <div
                        v-if="icon"
                        :class="[
                            'w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl bg-gradient-to-br shadow-lg',
                            iconColorClasses[iconColor],
                        ]"
                    >
                        <component :is="icon" v-if="typeof icon === 'object'" />
                        <span v-else v-html="icon"></span>
                    </div>

                    <div>
                        <h3 class="text-lg font-outfit font-semibold text-white">{{ title }}</h3>
                        <p v-if="subtitle" class="text-sm text-white/50 font-outfit mt-1">{{ subtitle }}</p>
                    </div>
                </div>
            </slot>
        </div>

        <!-- Content -->
        <div :class="noPadding ? '' : 'p-6'">
            <slot />
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
            <slot name="footer" />
        </div>
    </div>
</template>
