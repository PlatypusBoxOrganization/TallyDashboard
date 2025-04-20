import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        'process.env': process.env,
    },
    plugins: [react()],
    resolve: {
        alias: {
            '@tailwindConfig': path.resolve(__dirname, 'tailwind.config.js'),
        },
    },
    optimizeDeps: {
        include: ['@tailwindConfig'],
    },
    build: {
        outDir: 'dist', // Output directory for build files
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
    base: '/', // Serve from the root during local development
});
