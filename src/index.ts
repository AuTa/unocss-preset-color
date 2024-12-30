import type { Colors, Theme } from '@unocss/preset-mini/theme'
import type { Rule } from 'unocss'

import { CONTRAST_VAR, contrastColorResolver } from './contrast-color'
import { splitColors } from './split-colors'

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
        const regBase = `(?<bg>.+)-(?<suffix>${suffix})(?:-(?<sign>\\+|-)?(?<delta>\\d+))?$`
        rules.push(
            [new RegExp(`^text-(?:color-)?${regBase}`), contrastColorResolver(defaultDelta)],
            [new RegExp(`^(?:color|c)-?${regBase}`), contrastColorResolver(defaultDelta)],
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

