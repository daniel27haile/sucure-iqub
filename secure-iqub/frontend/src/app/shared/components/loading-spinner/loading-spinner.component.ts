import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="spinner-wrap" [class.spinner-wrap--overlay]="overlay">
      <mat-spinner [diameter]="diameter"></mat-spinner>
      <p *ngIf="message" class="spinner-msg">{{ message }}</p>
    </div>
  `,
  styles: [`
    .spinner-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 12px; }
    .spinner-wrap--overlay { position: fixed; inset: 0; background: rgba(255,255,255,.7); z-index: 9999; }
    .spinner-msg { color: #666; font-size: 14px; }
  `],
})
export class LoadingSpinnerComponent {
  @Input() diameter = 48;
  @Input() message = '';
  @Input() overlay = false;
}
