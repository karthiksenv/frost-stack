export const damping = (rate, dt) => 1 - Math.exp(-rate * dt);
export const easeInOutCubic = t => t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;

export function tween(from, to, elapsed, duration) {
  const t = Math.min(1, Math.max(0, elapsed / duration));
  return from + (to - from) * easeInOutCubic(t);
}
