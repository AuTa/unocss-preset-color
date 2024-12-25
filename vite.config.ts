/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    build: {
        lib: {
            entry: './src/index.ts',
            name: 'unocss-preset-color',
            fileName: 'index',
            formats: ['es', 'cjs'],
        },
        rollupOptions: {
            external: ['unocss'],
        },
    },
    plugins: [
        dts({
            insertTypesEntry: true,
        }),
    ],
    test: {
        includeSource: ['src/**/*.{js,ts,jsx,tsx}'],
    },
    define: {
        'import.meta.vitest': undefined,
    },
})
