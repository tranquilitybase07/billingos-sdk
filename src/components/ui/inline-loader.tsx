"use client";
import * as React from 'react'
import { cn } from '@/utils/cn'

export interface InlineLoaderProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Single-word stages rotated one at a time. Defaults to checkout sequence. */
  words?: string[]
  /** Milliseconds each word stays visible before the next slides in. */
  stepDuration?: number
  /** Optional spinner size in pixels. Defaults to 14. */
  spinnerSize?: number
}

const DEFAULT_WORDS = ['Connecting', 'Validating', 'Loading']

export function InlineLoader({
  words = DEFAULT_WORDS,
  stepDuration = 1500,
  spinnerSize = 14,
  className,
  ...props
}: InlineLoaderProps) {
  const [step, setStep] = React.useState(0)

  React.useEffect(() => {
    if (words.length <= 1) return
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i < words.length; i++) {
      timers.push(setTimeout(() => setStep(i), stepDuration * i))
    }
    return () => timers.forEach(clearTimeout)
  }, [words.length, stepDuration])

  const lineHeight = 1.25
  return (
    <span
      className={cn('inline-flex items-center gap-2 leading-none', className)}
      {...props}
    >
      <span
        className="inline-block rounded-full border-2 border-current/30 border-t-current animate-spin"
        style={{ width: spinnerSize, height: spinnerSize }}
        aria-hidden
      />
      <span
        className="inline-block overflow-hidden"
        style={{ height: `${lineHeight}em` }}
      >
        <span
          className="block transition-transform duration-500"
          style={{
            transform: `translateY(-${step * lineHeight}em)`,
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {words.map((word) => (
            <span
              key={word}
              className="block"
              style={{ height: `${lineHeight}em`, lineHeight: `${lineHeight}em` }}
            >
              {word}
            </span>
          ))}
        </span>
      </span>
    </span>
  )
}
