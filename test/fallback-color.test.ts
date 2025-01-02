import { describe, expect, it } from 'vitest'
import type { CSSObject } from 'unocss'

import { fallbackColor } from '../src/fallback-color'
describe('fallbackColor', () => {
    // biome-ignore lint/suspicious/noExplicitAny: mockCtx is a mock object
    const mockCtx: any = {
        constructCSS: (css: CSSObject) => {
            const entries = Object.entries(css)
            const value = entries
                .filter(([_, value]) => !!value)
                .map(([key, value]) => `${key}:${value};`)
                .join('')
            return `.test{${value}}`
        },
    }

    it('should replace color property with fallbacks', () => {
        const css = { color: 'red' }
        const colors = ['blue', 'green', 'red']
        const result = fallbackColor(css, colors, mockCtx)
        expect(result).toBe('.test{color:red;color:green;color:blue;}')
    })

    it('should handle empty colors array', () => {
        const css = { color: 'red' }
        const result = fallbackColor(css, [], mockCtx)
        expect(result).toBe('.test{}')
    })

    it('should preserve other CSS properties', () => {
        const css = { color: 'red', backgroundColor: 'blue' }
        const colors = ['green', 'red']
        const result = fallbackColor(css, colors, mockCtx)
        expect(result).toBe('.test{backgroundColor:blue;color:red;color:green;}')
    })

    it('should handle css without color property', () => {
        const css = { backgroundColor: 'blue' }
        const colors = ['green', 'red']
        const result = fallbackColor(css, colors, mockCtx)
        expect(result).toBe('.test{backgroundColor:blue;color:red;color:green;}')
    })
})
