"use client";
// Auto-injected by tsup.config.ts — do not import __BILLINGOS_CSS__ directly.
// This constant is replaced at build time with the processed Tailwind CSS string.
declare const __BILLINGOS_CSS__: string

let injected = false

export function injectStyles() {
  if (injected || typeof document === 'undefined') return
  injected = true
  const id = 'billingos-styles'
  if (document.getElementById(id)) return
  const s = document.createElement('style')
  s.id = id
  s.textContent = __BILLINGOS_CSS__
  document.head.appendChild(s)
}
