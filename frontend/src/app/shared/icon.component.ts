import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ICONS } from './icons';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
                   stroke-linejoin="round" [attr.width]="size()" [attr.height]="size()" [innerHTML]="html()"></svg>`,
  host: { class: 'inline-flex shrink-0 leading-[0]' },
})
export class IconComponent {
  name = input.required<string>();
  size = input(20);
  private sanitizer = inject(DomSanitizer);
  // Os SVGs vêm de uma constante do próprio código (icons.ts), por isso é seguro confiar no HTML.
  html = computed(() => this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name()] ?? ''));
}
