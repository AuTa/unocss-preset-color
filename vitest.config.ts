import { defineConfig } from 'vitest/config'

export default defineConfig({
    // Configure Vitest (https://vitest.dev/config/)
    test: { includeSource: ['src/**/*.{js,ts,jsx,tsx}'] },
})
