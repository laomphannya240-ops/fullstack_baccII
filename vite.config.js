import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

    return {
        plugins: [
            react(),
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.jsx'],
                refresh: true,
                fonts: [
                    bunny('Instrument Sans', {
                        weights: [400, 500, 600],
                    }),
                ],
            }),
            tailwindcss(),
        ],
        server: {
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
            proxy: {
                '/api': {
                    target: backendUrl,
                    changeOrigin: true,
                },
                '/storage': {
                    target: backendUrl,
                    changeOrigin: true,
                },
            },
        },
    };
});
