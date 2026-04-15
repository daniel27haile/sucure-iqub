import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-winner-history',
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/member/dashboard"><mat-icon>arrow_back</mat-icon></button>
      <h1>Winner History</h1>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <div class="history-list" *ngIf="!loading">
      <div class="empty" *ngIf="history.length === 0">No spins yet.</div>
      <mat-card *ngFor="let h of history" class="history-card">
        <mat-card-content>
          <div class="history-row">
            <div class="month-badge">Month {{ h.monthNumber }}</div>
            <div class="winner-info">
              <div class="winner-slot">🏆 {{ h.winnerSlotLabel }}</div>
              <div class="winner-members">
                <span *ngFor="let m of h.winnerMembers" class="member-payout">
                  {{ m.name }}: <strong>$ {{ m.payoutAmount | number }}</strong>
                </span>
              </div>
            </div>
            <div class="payout-total">$ {{ h.totalPayoutAmount | number }}</div>
            <div class="spin-date">{{ h.createdAt | date:'mediumDate' }}</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; }
    .history-list { display: flex; flex-direction: column; gap: 12px; }
    .history-card { }
    .history-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .month-badge { background: #1a237e; color: white; border-radius: 12px; padding: 4px 14px; font-size: 13px; font-weight: 600; flex-shrink: 0; }
    .winner-info { flex: 1; }
    .winner-slot { font-size: 15px; font-weight: 600; }
    .winner-members { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 4px; }
    .member-payout { font-size: 13px; color: #555; }
    .payout-total { font-size: 20px; font-weight: 700; color: #2e7d32; flex-shrink: 0; }
    .spin-date { font-size: 12px; color: #888; flex-shrink: 0; }
    .empty { text-align: center; padding: 40px; color: #888; }
  `],
})
export class WinnerHistoryComponent implements OnInit {
  history: any[] = [];
  loading = true;
  groupId = '';

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.api.getWinnerHistory(this.groupId).subscribe({
      next: (res) => { this.history = res.data || []; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
