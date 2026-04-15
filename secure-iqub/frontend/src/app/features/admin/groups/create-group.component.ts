import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-create-group',
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/admin/groups"><mat-icon>arrow_back</mat-icon></button>
      <h1>Create New Group</h1>
    </div>

    <mat-card class="form-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>group_work</mat-icon>
        <mat-card-title>Group Setup</mat-card-title>
        <mat-card-subtitle>
          A cycle has 12 slots × $2,000/month = $24,000 monthly pool. Each winning slot receives $24,000.
        </mat-card-subtitle>
      </mat-card-header>
      <mat-divider></mat-divider>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="create-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Group Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Haile Family Iqub 2025" />
            <mat-error *ngIf="form.get('name')?.hasError('required')">Name is required</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description (optional)</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Brief description of this group..."></textarea>
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Payment Due Day</mat-label>
              <mat-select formControlName="dueDay">
                <mat-option *ngFor="let d of dueDays" [value]="d">{{ d }}{{ getSuffix(d) }} of month</mat-option>
              </mat-select>
              <mat-hint>Day of month contributions are due</mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Platform Fee %</mat-label>
              <input matInput type="number" formControlName="platformFeePercent" min="0" max="10" />
              <mat-hint>Optional platform deduction before payout</mat-hint>
            </mat-form-field>
          </div>

          <div class="info-box">
            <mat-icon>info</mat-icon>
            <div>
              <strong>Fixed Cycle Rules:</strong>
              <ul>
                <li>Exactly 12 slots required per cycle</li>
                <li>Each slot = $2,000/month (single or shared)</li>
                <li>Monthly pool = $24,000 (12 × $2,000)</li>
                <li>Winning slot payout = $24,000</li>
                <li>All 12 slots win exactly once over 12 months</li>
              </ul>
            </div>
          </div>

          <div class="form-actions">
            <button mat-button type="button" routerLink="/admin/groups">Cancel</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="loading">
              <mat-spinner *ngIf="loading" diameter="18"></mat-spinner>
              <span *ngIf="!loading"><mat-icon>add</mat-icon> Create Group</span>
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0; color: #1a237e; }
    .form-card { max-width: 720px; }
    .create-form { padding: 20px 0; display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-box { display: flex; gap: 12px; background: #e8eaf6; padding: 16px; border-radius: 8px; color: #3949ab; }
    .info-box mat-icon { flex-shrink: 0; margin-top: 2px; }
    .info-box ul { margin: 8px 0 0 0; padding-left: 20px; }
    .info-box li { margin: 4px 0; font-size: 13px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
  `],
})
export class CreateGroupComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  dueDays = Array.from({ length: 28 }, (_, i) => i + 1);

  constructor(private fb: FormBuilder, private api: ApiService, private router: Router, private toast: ToastService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: [''],
      dueDay: [1, Validators.required],
      platformFeePercent: [0, [Validators.min(0), Validators.max(100)]],
    });
  }

  getSuffix(d: number): string {
    if (d === 1) return 'st'; if (d === 2) return 'nd'; if (d === 3) return 'rd'; return 'th';
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.api.createGroup(this.form.value).subscribe({
      next: (res) => {
        this.toast.success('Group created! Now add slots.');
        this.router.navigate(['/admin/groups', res.data._id, 'slots']);
      },
      error: (err) => { this.loading = false; this.toast.error(err.error?.message || 'Failed to create group'); },
    });
  }
}
