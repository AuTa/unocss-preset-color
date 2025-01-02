import type { CSSObject, RuleContext } from 'unocss'

/**
 * Returns a modified CSS object with the color property replaced by a series of
 * fallback properties with the name `color$fallbackX` where X is the index of the
 * color in the provided colors array.
 *
 * `postcss` will delete duplicated `color` property.
 *
 * @param css - The CSS object containing the `color` property to be replaced.
 * @param colors - The array of colors to be used as fallbacks.
 * @param ctx - The RuleContext object used to construct the CSS.
 * @returns The modified CSS object with the color property replaced by the fallback
 * properties.
 */
export function fallbackColor(css: CSSObject, colors: string[], { constructCSS }: RuleContext): string {
    if (css.color) {
        css.color = undefined
    }
    colors.reverse().forEach((color, i) => {
        css[`color$fallback${i}`] = color
    })
    const customCss = constructCSS(css)
    return customCss.replaceAll(/color\$fallback\d+:/g, 'color:')
}
