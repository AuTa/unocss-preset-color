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

const defaultContrastOptions: ContrastOptions = { suffix: 'foreground', defaultDelta: 60 }

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

/**
 * Adjusts the color contrast of a given CSS object based on a specified delta and sign.
 *
 * This function modifies the `color` property of the provided CSS object by applying
 * a contrast adjustment using the OKLCH color model. It calculates the new color by
 * reducing the lightness (l) according to the contrast variable and the specified delta.
 *
 * @see https://developer.chrome.com/blog/css-relative-color-syntax#contrast_a_color
 * @param css - The CSS object containing the `color` property to be adjusted.
 * @param delta - The contrast difference threshold (0-100), defaults to 60.
 * @param sign - The sign used in the contrast calculation, defaults to an empty string.
 * @returns The modified CSS object with the adjusted color.
 */
function contrastColor(css: CSSObject, delta = 60, sign: '' | '+' | '-' = '') {
    let color = css.color
    if (!color || typeof color !== 'string') return
    color = color.replace(REMOVE_COMMENT_RE, '')
    const oklch = `oklch(from ${color} calc(l - var(${CONTRAST_VAR}) * ${sign}.${delta}) c h)`
    css.color = oklch
    return css
}

/**
 * Returns a resolver function that resolves a CSS object with a contrast adjusted color based on a specified delta and sign.
 *
 * The resolver function takes a regular expression match and a RuleContext object as arguments.
 * It resolves the color from the match using the colorResolver function and then adjusts the color
 * using the contrastColor function with the specified default delta and the sign from the match.
 * If the color cannot be resolved, the resolver returns undefined.
 *
 * @param defaultDelta - The default contrast difference threshold (0-100), defaults to 60.
 * @returns A resolver function that takes a regular expression match and a RuleContext object as arguments.
 */
function contrastColorResolver(defaultDelta?: number) {
    return (match: RegExpMatchArray, ctx: RuleContext) => {
        const color = colorResolver('color', 'text', 'textColor')(match, ctx) as CSSObject
        if (!color) return
        const delta = (match.groups?.delta ?? defaultDelta) as number
        const sign = match.groups?.sign as '' | '+' | '-'
        return contrastColor(color, delta, sign)
    }
}

export const presetColor = (options?: PresetColorOptions) => {
    let colors: Colors = {}
    if (options?.colors) {
        colors = splitColors(options.colors)
    }

    const rules: Rule<Theme>[] = []
    const preflights = []
    if (options?.contrast) {
        const contrast = options.contrast === true ? defaultContrastOptions : options.contrast
        const suffix = contrast.suffix ?? defaultContrastOptions.suffix
        const defaultDelta = contrast.defaultDelta ?? defaultContrastOptions.defaultDelta
        const regBase = `-${suffix}(?:-(?<sign>\\+|-)?(?<delta>\\d+))?$`
        rules.push(
            [new RegExp(`^text-(?:color-)?(.+)${regBase}`), contrastColorResolver(defaultDelta)],
            [new RegExp(`^(?:color|c)-?(.+)${regBase}`), contrastColorResolver(defaultDelta)],
        )
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
