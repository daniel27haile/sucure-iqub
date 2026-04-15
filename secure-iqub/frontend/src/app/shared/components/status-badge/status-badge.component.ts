import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="'badge--' + badgeClass">{{ label }}</span>`,
  styles: [`
    .badge { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
    .badge--success { background: #e8f5e9; color: #2e7d32; }
    .badge--warning { background: #fff8e1; color: #f57f17; }
    .badge--danger  { background: #ffebee; color: #c62828; }
    .badge--info    { background: #e3f2fd; color: #1565c0; }
    .badge--purple  { background: #f3e5f5; color: #6a1b9a; }
    .badge--grey    { background: #f5f5f5; color: #616161; }
    .badge--orange  { background: #fff3e0; color: #e65100; }
  `],
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() customLabel = '';

  get label(): string {
    if (this.customLabel) return this.customLabel;
    return this.status.replace(/_/g, ' ');
  }

  get badgeClass(): string {
    const map: Record<string, string> = {
      approved: 'success', active: 'success', on_time: 'success', eligible: 'success',
      valid: 'success', completed: 'success', disbursed: 'success',
      submitted: 'info', open: 'info',
      pending: 'grey', draft: 'grey', unpaid: 'grey',
      yellow_warning: 'warning', collection_complete: 'warning',
      strong_warning: 'orange',
      rejected: 'danger', late: 'danger', won: 'purple',
      suspended: 'danger', invalid: 'danger',
    };
    return map[this.status] || 'grey';
  }
}
