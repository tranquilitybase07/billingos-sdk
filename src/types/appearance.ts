export interface AppearanceVariables {
  colorPrimary?: string
  colorBackground?: string
  colorText?: string
  borderRadius?: string
  fontFamily?: string
}

export interface AppearanceConfig {
  theme?: 'light' | 'dark' | 'auto'
  variables?: AppearanceVariables
}

/** Only allow valid hex: #RGB, #RRGGBB, #RRGGBBAA (with or without #) */
function sanitizeHexColor(value?: string): string | undefined {
  if (!value) return undefined
  return /^#?[0-9a-fA-F]{3,8}$/.test(value) ? value : undefined
}

/** Only allow safe CSS length values: digits + px/rem/em */
function sanitizeCSSLength(value?: string): string | undefined {
  if (!value) return undefined
  return /^[\d.]+(px|rem|em)$/.test(value) ? value : undefined
}

/** Strip dangerous chars from font family (no semicolons, braces, url(), etc.) */
function sanitizeFontFamily(value?: string): string | undefined {
  if (!value) return undefined
  return /^[a-zA-Z0-9\s,\-'"]+$/.test(value) ? value : undefined
}

export function sanitizeAppearance(appearance?: AppearanceConfig): AppearanceConfig | undefined {
  if (!appearance) return undefined
  const v = appearance.variables
  return {
    theme: (['light', 'dark', 'auto'] as const).includes(appearance.theme as 'light' | 'dark' | 'auto')
      ? appearance.theme
      : undefined,
    variables: v
      ? {
          colorPrimary: sanitizeHexColor(v.colorPrimary),
          colorBackground: sanitizeHexColor(v.colorBackground),
          colorText: sanitizeHexColor(v.colorText),
          borderRadius: sanitizeCSSLength(v.borderRadius),
          fontFamily: sanitizeFontFamily(v.fontFamily),
        }
      : undefined,
  }
}

/** Build CSS custom properties object from appearance variables (only set properties that are provided) */
export function buildCSSVariables(variables?: AppearanceVariables): Record<string, string> {
  if (!variables) return {}
  const vars: Record<string, string> = {}
  if (variables.colorPrimary) vars['--bos-primary'] = variables.colorPrimary.startsWith('#') ? variables.colorPrimary : `#${variables.colorPrimary}`
  if (variables.colorBackground) vars['--bos-bg'] = variables.colorBackground.startsWith('#') ? variables.colorBackground : `#${variables.colorBackground}`
  if (variables.colorText) vars['--bos-text'] = variables.colorText.startsWith('#') ? variables.colorText : `#${variables.colorText}`
  if (variables.borderRadius) vars['--bos-radius'] = variables.borderRadius
  if (variables.fontFamily) vars['--bos-font'] = variables.fontFamily
  return vars
}

/** Serialize appearance variables to URL search params for iframe URLs */
export function serializeAppearanceToParams(appearance?: AppearanceConfig): URLSearchParams {
  const params = new URLSearchParams()
  if (!appearance) return params
  if (appearance.theme) params.set('theme', appearance.theme)
  const v = appearance.variables
  if (!v) return params
  if (v.colorPrimary) params.set('primary', v.colorPrimary.replace('#', ''))
  if (v.colorBackground) params.set('bg', v.colorBackground.replace('#', ''))
  if (v.colorText) params.set('text', v.colorText.replace('#', ''))
  if (v.borderRadius) params.set('radius', v.borderRadius)
  if (v.fontFamily) params.set('font', v.fontFamily)
  return params
}
