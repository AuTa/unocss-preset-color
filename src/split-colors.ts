import type { Colors } from '@unocss/preset-mini/theme'

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
export function splitColors(colors: Colors): Colors {
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

// if (import.meta.vitest) {
//     const { test, expect } = import.meta.vitest
//     test('splitColors', () => {
//         const colors = {
//             primary: 'red',
//             'primary-foreground': 'blue',
//             'text-secondary-foreground': 'yellow',
//             'text-secondary': 'green',
//             text: 'red',
//             sidebar: {
//                 primary: 'red',
//                 'primary-foreground': 'blue',
//             },
//         }
//         const result = splitColors(colors)
//         expect(result).toEqual({
//             primary: {
//                 DEFAULT: 'red',
//                 foreground: 'blue',
//             },
//             text: {
//                 DEFAULT: 'red',
//                 secondary: {
//                     DEFAULT: 'green',
//                     foreground: 'yellow',
//                 },
//             },
//             sidebar: {
//                 primary: {
//                     DEFAULT: 'red',
//                     foreground: 'blue',
//                 },
//             },
//         })
//     })
// }
