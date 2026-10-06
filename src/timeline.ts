export const CHAPTERS = [0, 0.255, 0.52, 0.755, 1] as const;
export const BASE_Z = [1.28, 1.08, 0.77, 0.42, 0.02, -0.28, -0.68, -1.01, -1.29] as const;
export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, value: number) => {
  const t = clamp((value - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const scrollProgress = (scrollY: number, start: number, range: number) => range > 0 ? clamp((scrollY - start) / range) : 0;
export const chapterAt = (p: number) => p < 0.19 ? 0 : p < 0.33 ? 1 : p < 0.68 ? 2 : p < 0.925 ? 3 : 4;
export const chapterOpacity = (p: number, chapter: number) => {
  const bounds = [[-0.15, -0.01, 0.12, 0.19], [0.19, 0.24, 0.27, 0.33], [0.33, 0.40, 0.61, 0.65], [0.65, 0.72, 0.80, 0.91], [0.91, 0.965, 1.1, 1.2]][chapter];
  return smooth(bounds[0], bounds[1], p) * (1 - smooth(bounds[2], bounds[3], p));
};
export function sampleTimeline(progress: number, mobile = false, reduced = false) {
  const p = clamp(progress);
  const open = smooth(0, 0.12, p);
  const reveal = smooth(0.07, 0.2, p);
  const explode = smooth(0.29, 0.47, p) * (1 - smooth(0.79, 0.94, p));
  const iris = smooth(0.59, 0.72, p) * (1 - smooth(0.80, 0.94, p));
  const turn = smooth(0.15, 0.38, p);
  const close = smooth(0.83, 1, p);
  return {
    p, open, reveal, explode, iris, close,
    rotX: mix(-0.18, 0.03, turn) + iris * -0.04,
    rotY: mix(-0.53, -1.12, turn) + close * 0.66,
    rotZ: mix(-0.20, -0.045, turn) + iris * 0.04,
    modelX: mobile ? 0 : mix(2.5, 0, smooth(0.13, 0.4, p)) + close * 2.05,
    modelY: mix(-0.18, 0.18, reveal) + (mobile ? -1.10 : 0),
    scale: mobile ? mix(1.04, 0.77, explode) : mix(1.25, 1.01, explode),
    aperture: mix(0.38, 0.82, iris),
    boxOpacity: reduced ? 0 : 1 - smooth(0.08, 0.21, p),
    boxY: -.18 + (mobile ? -1.10 : 0) - 1.92 * (mobile ? 1.04 / 1.25 : 1),
    lidAngle: -open * 2.04,
    parts: BASE_Z.map((z, index) => ({
      z: z + (4 - index) * (mobile ? 0.82 : 1.12) * explode,
      y: iris * Math.sin(index * 0.7) * 0.10,
      rotation: iris * (index === 4 ? 0.36 : (index - 4) * 0.028),
    })),
  };
}
