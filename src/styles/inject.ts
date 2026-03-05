"use client";
// Auto-injected by tsup.config.ts — do not import __BILLINGOS_CSS__ directly.
// This constant is replaced at build time with the processed Tailwind CSS string.
declare const __BILLINGOS_CSS__: string
;(function () {
  if (typeof document === 'undefined') return
  var id = 'billingos-styles'
  if (document.getElementById(id)) return
  var s = document.createElement('style')
  s.id = id
  s.textContent = __BILLINGOS_CSS__
  document.head.appendChild(s)
})()
