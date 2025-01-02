import type { RuleContext, CSSObject } from 'unocss'
import { colorResolver } from '@unocss/preset-mini/utils'

import { fallbackColor } from './fallback-color'

const REMOVE_COMMENT_RE = /\/\*.*?\*\//g

/**
 * CSS variable name for dark contrast adjustments
 * The variable is used to define the contrast level in dark mode themes
 */
export const CONTRAST_VAR = '--contrast-dark'

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
export function contrastColorResolver(defaultDelta?: number) {
    return (match: RegExpMatchArray, ctx: RuleContext) => {
        const bgColorCss = colorResolver('color', 'text', 'textColor')(match, ctx) as CSSObject
        if (!bgColorCss) return
        const delta = (match.groups?.delta ?? defaultDelta) as number
        const sign = match.groups?.sign as '' | '+' | '-'
        const contrasts = contrastColor(bgColorCss, delta, sign)
        if (!contrasts) return

        const fallback = `${match.groups?.bg}-${match.groups?.suffix}`
        match[1] = fallback
        const fallbackCss = colorResolver('color', 'text', 'textColor')(match, ctx) as CSSObject
        if (fallbackCss?.color) {
            contrasts.push(fallbackCss.color as string)
        }
        return fallbackColor(bgColorCss, contrasts, ctx)
    }
}

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
    // oklch's l is from 0 to 1.
    const oklch = `oklch(from ${color} calc(l - var(${CONTRAST_VAR}) * ${sign}.${delta}) c h)`
    // lch's l is from 0 to 100
    const lch = `lch(from ${color} calc(l - var(${CONTRAST_VAR}) * ${sign}${delta}) c h)`
    return [oklch, lch]
}
