import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  template: `
    <mat-card class="stat-card" [class]="'stat-card--' + color">
      <mat-card-content>
        <div class="stat-card__icon">
          <mat-icon>{{ icon }}</mat-icon>
        </div>
        <div class="stat-card__body">
          <div class="stat-card__value">{{ value }}</div>
          <div class="stat-card__label">{{ label }}</div>
          <div class="stat-card__sub" *ngIf="sub">{{ sub }}</div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .stat-card { height: 100%; cursor: default; transition: transform .2s; }
    .stat-card:hover { transform: translateY(-2px); }
    mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px !important; }
    .stat-card__icon mat-icon { font-size: 40px; width: 40px; height: 40px; opacity: .85; }
    .stat-card__value { font-size: 28px; font-weight: 700; line-height: 1; }
    .stat-card__label { font-size: 13px; color: rgba(0,0,0,.6); margin-top: 4px; }
    .stat-card__sub { font-size: 12px; color: rgba(0,0,0,.4); margin-top: 2px; }
    .stat-card--green .stat-card__icon mat-icon { color: #4caf50; }
    .stat-card--blue .stat-card__icon mat-icon { color: #2196f3; }
    .stat-card--orange .stat-card__icon mat-icon { color: #ff9800; }
    .stat-card--red .stat-card__icon mat-icon { color: #f44336; }
    .stat-card--purple .stat-card__icon mat-icon { color: #9c27b0; }
    .stat-card--teal .stat-card__icon mat-icon { color: #009688; }
  `],
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() sub = '';
  @Input() icon = 'info';
  @Input() color: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'teal' = 'blue';
}
