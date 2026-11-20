/**
 * Keep Guide's composer above the real iOS keyboard, even when Expo Router's
 * tab bar disappears while typing. Both values use screen coordinates.
 *
 * If the navigator already resized the chat viewport to end above the keyboard,
 * the intersection is zero: do not add a second offset.
 */
export function guideKeyboardInset(viewportBottom: number, keyboardScreenY: number | null): number {
  if (keyboardScreenY === null || !Number.isFinite(viewportBottom) || !Number.isFinite(keyboardScreenY)) return 0;
  return Math.max(0, Math.ceil(viewportBottom - keyboardScreenY));
}
