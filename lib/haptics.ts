/**
 * Haptic Feedback Utility
 * Safely triggers haptic vibration patterns if supported by the browser
 */

export function triggerHaptic(pattern: number | number[], enabled: boolean = true): void {
  // Check if haptics are enabled and if the browser supports vibration
  if (!enabled) return;
  
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
}

// Predefined haptic patterns for common interactions
export const HapticPatterns = {
  LIGHT: 50,
  MEDIUM: 100,
  HEAVY: 200,
  DOUBLE_TAP: [50, 50, 50],
  SUCCESS: [50, 100, 50],
  ERROR: [100, 50, 100, 50, 100],
} as const;
