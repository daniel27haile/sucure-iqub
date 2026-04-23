import { Component, Input, OnInit, OnDestroy } from '@angular/core';

/**
 * LiveClockComponent
 * Displays a live-updating date and time using the user's local timezone.
 *
 * Usage:
 *   <app-live-clock></app-live-clock>
 *   <app-live-clock [compact]="true"></app-live-clock>
 */
@Component({
  selector: 'app-live-clock',
  template: `
    <div class="live-clock" [class.live-clock--compact]="compact">
      <div class="clock-date">{{ dateString }}</div>
      <div class="clock-time">{{ timeString }}</div>
    </div>
  `,
  styles: [`
    .live-clock { display: flex; flex-direction: column; align-items: flex-end; }
    .clock-date { font-size: 12px; color: #666; white-space: nowrap; }
    .clock-time {
      font-size: 20px; font-weight: 700; color: #1a237e;
      font-variant-numeric: tabular-nums; letter-spacing: 1px;
      white-space: nowrap;
    }
    /* compact variant: smaller, for use in cards */
    .live-clock--compact .clock-date { font-size: 11px; }
    .live-clock--compact .clock-time { font-size: 15px; }
  `],
})
export class LiveClockComponent implements OnInit, OnDestroy {
  /** When true, renders smaller text suitable for cards or sidebars */
  @Input() compact = false;

  dateString = '';
  timeString = '';

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private tick(): void {
    const now = new Date();
    this.dateString = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    this.timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }
}
