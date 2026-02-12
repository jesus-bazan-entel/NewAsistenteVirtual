<script setup>
import { ref } from 'vue';
import { useForm, Head } from '@inertiajs/vue3';
import GuestLayout from '@/Components/Layout/GuestLayout.vue';
import TextInput from '@/Components/Forms/TextInput.vue';
import Button from '@/Components/UI/Button.vue';

const form = useForm({
    correo_usuario: '',
    clave_usuario: '',
});

const submit = () => {
    form.post('/validar-usuario', {
        onSuccess: () => {
            // Redirect handled by server
        },
    });
};
</script>

<template>
    <Head title="Iniciar Sesión" />

    <GuestLayout>
        <form @submit.prevent="submit" class="space-y-6">
            <div class="text-center mb-8">
                <h2 class="text-2xl font-outfit font-bold text-white">Iniciar Sesión</h2>
                <p class="text-white/50 font-outfit mt-2">Ingresa tus credenciales para continuar</p>
            </div>

            <TextInput
                v-model="form.correo_usuario"
                label="Usuario / Correo electrónico"
                type="text"
                placeholder="usuario@entel.pe"
                :error="form.errors.correo_usuario"
                required
            />

            <TextInput
                v-model="form.clave_usuario"
                label="Contraseña"
                type="password"
                placeholder="••••••••"
                :error="form.errors.clave_usuario"
                required
            />

            <div v-if="form.errors.message" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p class="text-sm text-red-400 font-outfit">{{ form.errors.message }}</p>
            </div>

            <Button
                type="submit"
                variant="primary"
                size="lg"
                :loading="form.processing"
                :disabled="form.processing"
                class="w-full"
            >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Ingresar
            </Button>
        </form>
    </GuestLayout>
</template>
