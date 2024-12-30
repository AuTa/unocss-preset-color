import { defineConfig } from '@rslib/core'

export default defineConfig({
    lib: [
        {
            format: 'esm',
            syntax: 'esnext',
            dts: true,
            // bundle: false,
            source: {
                entry: {
                    index: './src/index.ts',
                },
            },
            output: {
              sourceMap: true,
            }
        },
    ],
})
