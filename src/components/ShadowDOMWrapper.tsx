import * as React from 'react'
import { Scope, css } from 'react-shadow-scope'

interface ShadowDOMWrapperProps {
  children: React.ReactNode
  /**
   * CSS to inject into the shadow DOM
   */
  styles?: string
  /**
   * Additional class name for the shadow root container
   */
  className?: string
}

/**
 * Wraps children in a Shadow DOM boundary to isolate styles completely.
 * This prevents style conflicts between the SDK and the host application.
 */
export function ShadowDOMWrapper({
  children,
  styles,
  className
}: ShadowDOMWrapperProps) {
  // Create stylesheets using the css tagged template
  const sdkStylesheet = React.useMemo(() => {
    // In production, this would be the bundled CSS from the SDK
    // For now, we'll inject Tailwind and our custom styles
    const baseStyles = css`
      /* Reset styles inside shadow DOM */
      * {
        box-sizing: border-box;
      }

      /* Import font */
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      /* Base styles for shadow DOM content */
      .shadow-root-content {
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        color: #111827;
        line-height: 1.5;
      }

      ${styles || ''}
    `

    return baseStyles
  }, [styles])

  return (
    <Scope
      stylesheets={[sdkStylesheet]}
      className={className}
    >
      <div className="shadow-root-content">
        {children}
      </div>
    </Scope>
  )
}

/**
 * Hook to inject styles into the nearest Shadow DOM boundary
 */
export function useInjectStyles(styles: string) {
  React.useEffect(() => {
    // This would inject styles into the shadow root
    // Implementation depends on the Scope API
    console.log('[ShadowDOM] Injecting styles:', styles.substring(0, 50) + '...')
  }, [styles])
}

/**
 * Provider for Shadow DOM context with theme support
 */
interface ShadowThemeProviderProps {
  children: React.ReactNode
  theme?: {
    primaryColor?: string
    borderRadius?: string
    fontFamily?: string
    // Add more theme variables as needed
  }
}

export function ShadowThemeProvider({
  children,
  theme = {}
}: ShadowThemeProviderProps) {
  // Generate CSS variables from theme
  const themeStyles = React.useMemo(() => {
    const vars: string[] = []

    if (theme.primaryColor) {
      vars.push(`--billingos-primary: ${theme.primaryColor};`)
    }
    if (theme.borderRadius) {
      vars.push(`--billingos-radius: ${theme.borderRadius};`)
    }
    if (theme.fontFamily) {
      vars.push(`--billingos-font: ${theme.fontFamily};`)
    }

    return vars.length > 0
      ? `:host { ${vars.join(' ')} }`
      : ''
  }, [theme])

  return (
    <ShadowDOMWrapper styles={themeStyles}>
      {children}
    </ShadowDOMWrapper>
  )
}