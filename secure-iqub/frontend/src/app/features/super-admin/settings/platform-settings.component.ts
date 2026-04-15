import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-platform-settings',
  template: `
    <div class="page-header">
      <h1>Platform Settings</h1>
      <p>Configure global rules that apply to all groups</p>
    </div>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <mat-card class="settings-card" *ngIf="!loading">
      <mat-card-header>
        <mat-icon mat-card-avatar>tune</mat-icon>
        <mat-card-title>Global Configuration</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="save()" class="settings-form">

          <h3>Penalty Rules</h3>
          <mat-form-field appearance="outline">
            <mat-label>Late Penalty Per Day ($)</mat-label>
            <input matInput type="number" formControlName="penaltyPerDay" min="0" />
            <mat-hint>Applied per calendar day after due date</mat-hint>
          </mat-form-field>

          <mat-divider></mat-divider>
          <h3>Platform Fee</h3>
          <mat-form-field appearance="outline">
            <mat-label>Platform Fee (%)</mat-label>
            <input matInput type="number" formControlName="platformFeePercent" min="0" max="100" />
            <mat-hint>Deducted from payout before distribution (0 = no fee)</mat-hint>
          </mat-form-field>

          <mat-divider></mat-divider>
          <h3>On-Time Award</h3>
          <div class="toggle-row">
            <span>Enable On-Time Award</span>
            <mat-select formControlName="awardBadgeEnabled" class="toggle-select">
              <mat-option [value]="true">Enabled</mat-option>
              <mat-option [value]="false">Disabled</mat-option>
            </mat-select>
          </div>
          <div class="info-box">
            <mat-icon>info</mat-icon>
            <span>When enabled, the total penalty fees collected from late-paying members are distributed equally among all on-time members at the end of the cycle as their reward.</span>
          </div>

          <mat-divider></mat-divider>
          <h3>Spin Eligibility</h3>
          <mat-form-field appearance="outline">
            <mat-label>Spin Eligibility Rule</mat-label>
            <mat-select formControlName="spinEligibilityRule">
              <mat-option value="all_approved">All member payments must be APPROVED</mat-option>
              <mat-option value="slot_funded">Slot total must equal $2,000 (lenient)</mat-option>
            </mat-select>
          </mat-form-field>

          <div class="form-actions">
            <button mat-raised-button color="primary" type="submit" [disabled]="saving">
              <mat-spinner *ngIf="saving" diameter="18"></mat-spinner>
              <span *ngIf="!saving"><mat-icon>save</mat-icon> Save Settings</span>
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header { margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
    p { color: #666; margin: 0; }
    .settings-card { max-width: 600px; }
    .settings-form { display: flex; flex-direction: column; gap: 16px; padding: 16px 0; }
    h3 { font-size: 15px; font-weight: 600; margin: 8px 0 0; color: #1a237e; }
    mat-form-field { max-width: 360px; }
    .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; max-width: 360px; }
    .toggle-select { width: 140px; }
    .info-box { display: flex; align-items: flex-start; gap: 8px; background: #e8eaf6; padding: 12px; border-radius: 8px; color: #3949ab; font-size: 13px; max-width: 480px; }
    .form-actions { margin-top: 8px; }
  `],
})
export class PlatformSettingsComponent implements OnInit {
  form!: FormGroup;
  loading = true;
  saving = false;

  constructor(private fb: FormBuilder, private api: ApiService, private toast: ToastService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      penaltyPerDay: [20, [Validators.required, Validators.min(0)]],
      platformFeePercent: [0, [Validators.min(0), Validators.max(100)]],
      awardBadgeEnabled: [true],
      spinEligibilityRule: ['all_approved'],
    });

    this.api.getPlatformSettings().subscribe({
      next: (res) => { if (res.data) this.form.patchValue(res.data); this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  save(): void {
    if (this.form.invalid) return;
    this.saving = true;
    this.api.updatePlatformSettings(this.form.value).subscribe({
      next: () => { this.saving = false; this.toast.success('Platform settings saved'); },
      error: (err) => { this.saving = false; this.toast.error(err.error?.message || 'Save failed'); },
    });
  }
}
