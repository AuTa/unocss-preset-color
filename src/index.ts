import type { Colors, Theme } from '@unocss/preset-mini/theme'
import { colorResolver } from '@unocss/preset-mini/utils'
import type { CSSObject, Rule, RuleContext } from 'unocss'

/**
 * Preset options
 * @property {Colors} [colors] - Colors object.
 * @property {boolean | ContrastOptions} [contrast] - Enable text contrast color.
 * 文字颜色是背景的对比色.
 */
export type PresetColorOptions = {
    colors?: Colors
    /**
     * @default false
     * @see https://developer.chrome.com/blog/css-relative-color-syntax#contrast_a_color
     */
    contrast?: boolean | ContrastOptions
}

/**
 * Options for configuring contrast-based color generation.
 * @property {string} [suffix='foreground'] - Suffix of the `text-accent-${suffix}`.
 * @property {number} [defaultDelta=60] - Suffix of the `text-accent-${suffix}-${defaultDelta}`.
 * The contrast difference threshold between colors (0-100):
 * `oklch(from darkred calc(l + .${defaultDelta}) c h)`.
 */
export type ContrastOptions = {
    suffix?: string
    defaultDelta?: number
}

/**
 * Split color object to nested object.
 *
 * @example
 * const colors = {
 *   'bg-primary': 'red',
 *   'bg-primary-hover': 'blue',
 *   'text-secondary': 'green',
 *   'text-secondary-underline': 'yellow',
 * }
 *
 * const result = splitColors(colors)
 *
 * // result will be:
 * {
 *   bg: {
 *     primary: {
 *       DEFAULT: 'red',
 *       hover: 'blue',
 *     },
 *   },
 *   text: {
 *     secondary: {
 *       DEFAULT: 'green',
 *       underline: 'yellow',
 *     }
 *   },
 * }
 * @param colors - Color object
 * @returns - Splitted color object
 */
function splitColors(colors: Colors): Colors {
    for (const key in colors) {
        if (!Object.hasOwn(colors, key)) continue
        if (key.includes('-')) {
            const variants = key.split('-')
            let preColor = colors
            for (const [i, v] of variants.entries()) {
                if (i < variants.length - 1) {
                    if (typeof preColor[v] === 'undefined') {
                        preColor[v] = {}
                    } else if (typeof preColor[v] === 'string') {
                        preColor[v] = { DEFAULT: preColor[v] }
                    }
                    preColor = preColor[v]
                } else {
                    switch (typeof preColor[v]) {
                        case 'undefined':
                        case 'string': {
                            preColor[v] = colors[key]
                            break
                        }
                        case 'object': {
                            if (typeof colors[key] === 'string') {
                                preColor[v].DEFAULT = colors[key]
                            } else if (typeof colors[key] === 'object') {
                                Object.assign(preColor[v], colors[key])
                            }
                        }
                    }
                }
            }
            delete colors[key]
        } else if (typeof colors[key] === 'object') {
            splitColors(colors[key])
        }
    }
    return colors
}

const REMOVE_COMMENT_RE = /\/\*.*?\*\//g

/**
 * CSS variable name for dark contrast adjustments
 * The variable is used to define the contrast level in dark mode themes
 */
const CONTRAST_VAR = '--contrast-dark'

function contrastColor(match: RegExpMatchArray, css: CSSObject, defaultDelta = 60) {
    let color = css.color
    if (!color || typeof color !== 'string') return
    color = color.replace(REMOVE_COMMENT_RE, '')
    const delta = match.groups?.delta ?? defaultDelta
    const sign = match.groups?.sign ?? ''
    const oklch = `oklch(from ${color} calc(l - var(${CONTRAST_VAR}) * ${sign}.${delta}) c h)`
    css.color = oklch
    return css
}

export const presetColor = (options?: PresetColorOptions) => {
    let colors: Colors = {}
    if (options?.colors) {
        colors = splitColors(options.colors)
    }
    const rules: Rule<Theme>[] = []
    const preflights = []
    if (options?.contrast) {
        const suffix = options.contrast === true ? 'foreground' : (options.contrast.suffix ?? 'foreground')
        const delta = options.contrast !== true ? options.contrast.defaultDelta : undefined
        rules.push([
            new RegExp(`^text-(.*)-${suffix}(?:-(?<sign>\\+|-)?(?<delta>\\d+))?$`),
            (match: RegExpMatchArray, ctx: RuleContext<Theme>) => {
                const color = colorResolver('color', 'text', 'textColor')(match, ctx) as CSSObject
                if (!color) return
                return contrastColor(match, color, delta)
            },
        ])
        preflights.push({
            getCSS: () => `
                :root {
                  ${CONTRAST_VAR}: 1;
                }
                [data-kb-theme="dark"] 
                {
                  ${CONTRAST_VAR}: -1;
                }`,
        })
    }
    return { name: 'preset-color', theme: { colors }, rules, preflights }
}

if (import.meta.vitest) {
    const { test, expect } = import.meta.vitest
    test('splitColors', () => {
        const colors = {
            primary: 'red',
            'primary-foreground': 'blue',
            'text-secondary-foreground': 'yellow',
            'text-secondary': 'green',
            text: 'red',
            sidebar: {
                primary: 'red',
                'primary-foreground': 'blue',
            },
        }
        const result = splitColors(colors)
        expect(result).toEqual({
            primary: {
                DEFAULT: 'red',
                foreground: 'blue',
            },
            text: {
                DEFAULT: 'red',
                secondary: {
                    DEFAULT: 'green',
                    foreground: 'yellow',
                },
            },
            sidebar: {
                primary: {
                    DEFAULT: 'red',
                    foreground: 'blue',
                },
            },
        })
    })
}
