/**
 * Web-mode fidelity polish.
 *
 * React Native Web translates RN components to DOM. The default rendering
 * is acceptable but visibly off vs. a real iOS device: wrong font, wrong
 * smoothing, hard tap highlights, browser scrollbars, soft shadows. This
 * module injects a small global stylesheet on web only that closes most
 * of that gap.
 *
 * Native (iOS/Android): this module is a no-op — `Platform.OS !== 'web'`
 * short-circuits before any DOM access.
 */

import { useEffect } from 'react';
import { Platform } from 'react-native';

const STYLE_ID = 'approom-web-fidelity';

/**
 * Side-effect-safe installer. Idempotent — calling twice does nothing.
 * Safe at module top level: no React hooks, no async work.
 */
export function installWebFidelityStyles(): void {
  if (Platform.OS !== 'web') return;
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const inject = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = WEB_FIDELITY_CSS;
    document.head.appendChild(style);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject, { once: true });
  } else {
    inject();
  }
}

const WEB_FIDELITY_CSS = `
/* ── Typography ────────────────────────────────────────────────── */
html, body, #root, #__next, [data-reactroot] {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'SF Pro Display',
    'SF Pro Text',
    'Inter_400Regular',
    'Inter',
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial,
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  font-feature-settings: 'kern' 1, 'liga' 1, 'calt' 1, 'ss01' 1;
  letter-spacing: -0.005em;
  -webkit-text-size-adjust: 100%;
}

/* ── Tap behavior ──────────────────────────────────────────────── */
html, body {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  overscroll-behavior: none;
  user-select: none;
  -webkit-user-select: none;
}

/* Inputs/textareas should keep selection */
input, textarea, [contenteditable] {
  user-select: text;
  -webkit-user-select: text;
}

/* ── Scroll physics ────────────────────────────────────────────── */
* {
  -webkit-overflow-scrolling: touch;
}

/* Hide scrollbars — iOS hides them until scrolling */
::-webkit-scrollbar {
  display: none;
}
* {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* ── Selection color (iOS blue) ────────────────────────────────── */
::selection {
  background: rgba(0, 122, 255, 0.25);
  color: inherit;
}

/* ── Image rendering — crisp on retina iframe scaling ──────────── */
img {
  image-rendering: -webkit-optimize-contrast;
  -webkit-user-drag: none;
}

/* ── Shadow rendering — promote to GPU layer for softer falloff ── */
[style*="box-shadow"],
[style*="boxShadow"] {
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

/* ── BlurView fallback — make the CSS approximation iOS-faithful ─ */
/* React Native Web's BlurView fallback renders as a plain View with
   a rgba background. We upgrade any element that opts into
   backdrop-filter so it actually blurs the layer beneath, matching
   how UIBlurEffect looks on iOS. */
[style*="backdrop-filter"],
[style*="backdropFilter"],
[data-rn-blur="true"] {
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  backdrop-filter: blur(20px) saturate(180%);
}

/* ── Buttons / Pressables — remove default browser styling ─────── */
button, [role="button"] {
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  border: 0;
  outline: 0;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  cursor: pointer;
}
button:focus, [role="button"]:focus {
  outline: 0;
}

/* ── Disable iOS double-tap-to-zoom on the preview ─────────────── */
body { touch-action: pan-x pan-y; }

/* ── Status bar safety on web preview iframes ──────────────────── */
/* Our iframe wrapper applies its own fake status bar overlay, so let
   apps draw edge-to-edge underneath without their own top padding. */
html, body {
  margin: 0;
  padding: 0;
  background: transparent;
}
`;

/**
 * Hook — call this once from the root layout. Injects the stylesheet on
 * web and removes it on unmount. No-op on native.
 */
export function useWebFidelityStyles(): void {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = WEB_FIDELITY_CSS;
    document.head.appendChild(style);

    return () => {
      const el = document.getElementById(STYLE_ID);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    };
  }, []);
}

// Top-level side effect: install styles as soon as this module is imported.
// This means any transitive import (e.g. through `@/lib/theme`) will activate
// the fidelity pass without the AI needing to remember to call the hook.
installWebFidelityStyles();
