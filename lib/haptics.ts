// Haptisches Feedback (Vibration) auf unterstützten Geräten – auf dem Desktop ein No-op.

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* manche Browser verbieten Vibration ohne Nutzer-Geste */
    }
  }
}

export const haptics = {
  tap: () => vibrate(8),
  select: () => vibrate(14),
  drop: () => vibrate(24),
  turn: () => vibrate([12, 70, 18]),
  capture: () => vibrate([30, 40, 60]),
  win: () => vibrate([40, 60, 40, 60, 120]),
};
