import { Easing, interpolate, spring } from 'remotion';
import { FPS, FRAMES_PER_BEAT } from '../shared/timing.js';

export const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const pop = (frame: number, start: number, damping = 11, stiffness = 180) =>
  spring({ frame: frame - start, fps: FPS, config: { damping, stiffness, mass: 0.6 } });

export const fadeOut = (frame: number, end: number, len = 6) =>
  interpolate(frame, [end - len, end], [1, 0], clamp);

export const slideOut = (frame: number, end: number, len = 6) =>
  interpolate(frame, [end - len, end], [0, -40], { ...clamp, easing: Easing.in(Easing.cubic) });

// نبضة على كل ضربة: 1 فلحظة الضربة → 0
export const beatPulse = (frame: number, every = 1) => {
  const p = (frame % (FRAMES_PER_BEAT * every)) / FRAMES_PER_BEAT;
  return Math.exp(-p * 5);
};

// اهتزاز كاميرا قصير بعد لحظة معينة
export const shake = (frame: number, start: number, len = 8, amp = 14) => {
  const t = frame - start;
  if (t < 0 || t > len) return { x: 0, y: 0 };
  const k = 1 - t / len;
  return { x: Math.sin(t * 2.7) * amp * k, y: Math.cos(t * 3.3) * amp * k };
};
