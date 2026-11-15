import { Injectable, effect, signal } from '@angular/core';

export interface A11yState { scale: number; contrast: boolean; reduceMotion: boolean; }

const KEY = 'grapedesk.a11y';
export const SCALES = [1, 1.125, 1.25, 1.5];

@Injectable({ providedIn: 'root' })
export class A11yService {
  readonly state = signal<A11yState>(this.load());

  constructor() {
    effect(() => {
      const s = this.state();
      const root = document.documentElement;
      root.style.fontSize = `${s.scale * 100}%`;
      root.classList.toggle('hc', s.contrast);
      root.classList.toggle('reduce-motion', s.reduceMotion);
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignora */ }
    });
  }

  private load(): A11yState {
    const base: A11yState = { scale: 1, contrast: false, reduceMotion: false };
    try { return { ...base, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { return base; }
  }

  bigger() { this.step(1); }
  smaller() { this.step(-1); }
  private step(d: number) {
    const i = Math.max(0, Math.min(SCALES.length - 1, SCALES.indexOf(this.state().scale) + d));
    this.state.update((s) => ({ ...s, scale: SCALES[i] }));
  }
  toggleContrast() { this.state.update((s) => ({ ...s, contrast: !s.contrast })); }
  toggleMotion() { this.state.update((s) => ({ ...s, reduceMotion: !s.reduceMotion })); }
  reset() { this.state.set({ scale: 1, contrast: false, reduceMotion: false }); }
}
