import { Component, Input } from '@angular/core';

/**
 * SI monogram logo for Secure Iqub.
 * Renders a shield-shaped badge with "SI" lettering and optional brand text.
 *
 * @example
 * <app-si-logo></app-si-logo>
 * <app-si-logo size="lg" sub="እቁብ"></app-si-logo>
 * <app-si-logo label="Super Admin" variant="gold" [showText]="!collapsed"></app-si-logo>
 */
@Component({
  selector: 'app-si-logo',
  template: `
    <div class="si-logo" [class]="'si-logo--' + size">
      <div class="si-badge" [class.si-badge--gold]="variant === 'gold'">
        <span class="si-letters">SI</span>
      </div>
      <div class="si-text-wrap" *ngIf="showText">
        <span class="si-name">{{ label }}</span>
        <span class="si-sub" *ngIf="sub">{{ sub }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: inline-block; }

    .si-logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }

    /* ── Shield badge ────────────────────────────────────────────────────── */
    .si-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: linear-gradient(145deg, #1565c0 0%, #42a5f5 100%);
      clip-path: polygon(50% 0%, 96% 13%, 96% 60%, 50% 100%, 4% 60%, 4% 13%);
      filter: drop-shadow(0 2px 6px rgba(21, 101, 192, 0.55));
      transition: filter 0.2s;
    }
    .si-badge:hover {
      filter: drop-shadow(0 3px 10px rgba(21, 101, 192, 0.7));
    }

    /* Gold variant for Super Admin */
    .si-badge--gold {
      background: linear-gradient(145deg, #b45309 0%, #fbbf24 50%, #ffd700 100%);
      filter: drop-shadow(0 2px 6px rgba(180, 83, 9, 0.55));
    }
    .si-badge--gold:hover {
      filter: drop-shadow(0 3px 10px rgba(180, 83, 9, 0.75));
    }

    /* ── Letters ─────────────────────────────────────────────────────────── */
    .si-letters {
      color: #fff;
      font-weight: 800;
      font-family: 'Arial', 'Helvetica Neue', Helvetica, sans-serif;
      line-height: 1;
      letter-spacing: 1.5px;
      user-select: none;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
    }

    /* ── Label text ──────────────────────────────────────────────────────── */
    .si-text-wrap {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
      min-width: 0;
    }
    .si-name {
      font-weight: 700;
      color: inherit;
      white-space: nowrap;
    }
    .si-sub {
      opacity: 0.6;
      white-space: nowrap;
    }

    /* ── Size scales ─────────────────────────────────────────────────────── */
    .si-logo--sm  .si-badge { width: 24px; height: 27px; }
    .si-logo--sm  .si-letters { font-size: 9px; letter-spacing: 1px; }
    .si-logo--sm  .si-name { font-size: 14px; }
    .si-logo--sm  .si-sub  { font-size: 10px; }

    .si-logo--md  .si-badge { width: 32px; height: 36px; }
    .si-logo--md  .si-letters { font-size: 12px; }
    .si-logo--md  .si-name { font-size: 16px; }
    .si-logo--md  .si-sub  { font-size: 11px; }

    .si-logo--lg  .si-badge { width: 42px; height: 47px; }
    .si-logo--lg  .si-letters { font-size: 16px; letter-spacing: 2px; }
    .si-logo--lg  .si-name { font-size: 20px; }
    .si-logo--lg  .si-sub  { font-size: 12px; }

    .si-logo--xl  .si-badge { width: 62px; height: 69px; }
    .si-logo--xl  .si-letters { font-size: 23px; letter-spacing: 3px; }
    .si-logo--xl  .si-name { font-size: 26px; }
    .si-logo--xl  .si-sub  { font-size: 13px; }
  `],
})
export class SiLogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() showText = true;
  @Input() label = 'Secure Iqub';
  @Input() sub = '';
  @Input() variant: 'blue' | 'gold' = 'blue';
}
