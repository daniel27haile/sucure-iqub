import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-slot-management',
  template: `
    <div class="page-header">
      <button mat-icon-button [routerLink]="['/admin/groups', groupId]"><mat-icon>arrow_back</mat-icon></button>
      <div>
        <h1>Slot Management</h1>
        <p class="subtitle">{{ groupName }} — Configure 12 full slots at $2,000/month each</p>
      </div>
    </div>

    <!-- Progress -->
    <mat-card class="progress-card">
      <mat-card-content>
        <div class="progress-header">
          <span class="progress-title">Slot Setup Progress</span>
          <span class="progress-count">{{ validSlots }}/12 slots valid</span>
        </div>
        <mat-progress-bar mode="determinate" [value]="(validSlots / 12) * 100" [color]="validSlots === 12 ? 'primary' : 'accent'"></mat-progress-bar>
        <div class="progress-total">
          Total monthly contributions configured: $ {{ totalAssigned | number }} / $24,000
        </div>
      </mat-card-content>
    </mat-card>

    <app-loading-spinner *ngIf="loading"></app-loading-spinner>

    <ng-container *ngIf="!loading">
      <div class="slots-grid">
        <!-- Existing slots -->
        <mat-card *ngFor="let slot of slots" class="slot-card" [class]="'slot-card--' + slot.status">
          <mat-card-header>
            <div mat-card-avatar class="slot-number">{{ slot.slotNumber }}</div>
            <mat-card-title>{{ slot.label }}</mat-card-title>
            <mat-card-subtitle>
              $ {{ slot.assignedMonthlyAmount | number }} / $2,000
              <app-status-badge [status]="slot.status" style="margin-left: 8px"></app-status-badge>
            </mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            <!-- Members in slot -->
            <div class="slot-members" *ngIf="slot.members?.length > 0">
              <div class="member-row" *ngFor="let m of slot.members" [class.member-row--leader]="slot.leader === m.member._id">
                <div class="member-info">
                  <div class="member-avatar">{{ m.member.firstName[0] }}{{ m.member.lastName[0] }}</div>
                  <div>
                    <div class="member-name">
                      {{ m.member.firstName }} {{ m.member.lastName }}
                      <span class="leader-chip" *ngIf="slot.leader === m.member._id">
                        <mat-icon>star</mat-icon> Leader
                      </span>
                    </div>
                    <div class="member-email">{{ m.member.email }}</div>
                  </div>
                </div>
                <div class="member-amount">
                  <strong>$ {{ m.monthlyAmount | number }}</strong>
                  <span class="share-pct">({{ m.sharePercent }}%)</span>
                  <button mat-icon-button color="warn" (click)="removeMember(slot, m)" matTooltip="Remove" *ngIf="!slot.isLocked">
                    <mat-icon>close</mat-icon>
                  </button>
                </div>
              </div>
            </div>

            <!-- Leader assignment (shown when 2+ members share this slot) -->
            <div class="leader-section" *ngIf="slot.members?.length >= 2">
              <div class="leader-section-title">
                <mat-icon>star</mat-icon>
                <span>Slot Leader <span class="leader-hint">— designates who coordinates the $2,000 goal</span></span>
              </div>
              <div class="leader-select-row">
                <mat-form-field appearance="outline" class="leader-select">
                  <mat-label>Select Leader</mat-label>
                  <mat-select [(ngModel)]="leaderSelections[slot._id]">
                    <mat-option *ngFor="let m of slot.members" [value]="m.member._id">
                      {{ m.member.firstName }} {{ m.member.lastName }}
                      <span *ngIf="slot.leader === m.member._id"> ★ current</span>
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <button mat-raised-button class="leader-btn"
                  [disabled]="!leaderSelections[slot._id] || settingLeader[slot._id]"
                  (click)="setLeader(slot)">
                  <mat-icon>star</mat-icon>
                  {{ settingLeader[slot._id] ? 'Saving...' : 'Set Leader' }}
                </button>
              </div>
            </div>

            <!-- Add member form -->
            <div class="add-member-form" *ngIf="!slot.isLocked && slot.assignedMonthlyAmount < 2000">
              <form [formGroup]="getAddForm(slot._id)" (ngSubmit)="addMember(slot)">
                <mat-form-field appearance="outline" class="member-select">
                  <mat-label>Add Member</mat-label>
                  <mat-select formControlName="memberId">
                    <mat-option *ngFor="let m of availableMembers" [value]="m._id">
                      {{ m.firstName }} {{ m.lastName }} ({{ m.email }})
                    </mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="amount-field">
                  <mat-label>Monthly Amount</mat-label>
                  <input matInput type="number" formControlName="monthlyAmount" [max]="2000 - slot.assignedMonthlyAmount" />
                  <mat-hint>Max $ {{ 2000 - slot.assignedMonthlyAmount }}</mat-hint>
                </mat-form-field>
                <button mat-raised-button color="primary" type="submit" [disabled]="getAddForm(slot._id).invalid">
                  Add
                </button>
              </form>
            </div>

            <div class="slot-funded-badge" *ngIf="slot.assignedMonthlyAmount === 2000">
              <mat-icon>check_circle</mat-icon> Slot fully funded at $2,000/month
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Add new slot card (if < 12) -->
        <mat-card class="slot-card slot-card--new" *ngIf="slots.length < 12 && !groupLocked" (click)="openAddSlotForm()">
          <mat-card-content class="add-slot-content">
            <mat-icon>add_circle_outline</mat-icon>
            <span>Add Slot {{ slots.length + 1 }}</span>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Add slot form -->
      <mat-card class="add-slot-card" *ngIf="showAddSlotForm">
        <mat-card-header>
          <mat-card-title>Add Slot {{ slots.length + 1 }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="addSlotForm" (ngSubmit)="submitAddSlot()" class="add-slot-form">
            <mat-form-field appearance="outline">
              <mat-label>Slot Label (optional)</mat-label>
              <input matInput formControlName="label" placeholder="e.g. Slot 3 — John" />
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Split Strategy</mat-label>
              <mat-select formControlName="payoutSplitStrategy">
                <mat-option value="proportional">Proportional (default)</mat-option>
                <mat-option value="custom">Custom split</mat-option>
              </mat-select>
            </mat-form-field>
            <div class="form-actions">
              <button mat-button type="button" (click)="showAddSlotForm = false">Cancel</button>
              <button mat-raised-button color="primary" type="submit">Create Slot</button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </ng-container>
  `,
  styles: [`
    .page-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 2px; color: #1a237e; }
    .subtitle { margin: 0; color: #666; font-size: 13px; }
    .progress-card { margin-bottom: 24px; }
    .progress-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
    .progress-title { font-weight: 600; }
    .progress-count { color: #1565c0; font-weight: 600; }
    .progress-total { font-size: 12px; color: #888; margin-top: 8px; }

    /* Slots grid */
    .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-bottom: 24px; }
    .slot-card { transition: box-shadow .2s; }
    .slot-card--valid { border-top: 3px solid #4caf50; }
    .slot-card--eligible { border-top: 3px solid #4caf50; }
    .slot-card--won { border-top: 3px solid #9c27b0; opacity: .8; }
    .slot-card--pending { border-top: 3px solid #bbb; }
    .slot-card--invalid { border-top: 3px solid #f44336; }
    .slot-card--new { cursor: pointer; border: 2px dashed #bbb; display: flex; align-items: center; justify-content: center; min-height: 100px; }
    .slot-card--new:hover { border-color: #1565c0; }
    .add-slot-content { display: flex; flex-direction: column; align-items: center; gap: 8px; color: #999; font-size: 14px; }
    .add-slot-content mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .slot-number { width: 36px; height: 36px; border-radius: 50%; background: #1a237e; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }

    /* Members in slot */
    .slot-members { display: flex; flex-direction: column; gap: 10px; margin: 12px 0; }
    .member-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .member-info { display: flex; align-items: center; gap: 10px; min-width: 0; }
    .member-avatar { width: 32px; height: 32px; border-radius: 50%; background: #e8eaf6; color: #3949ab; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
    .member-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .member-email { font-size: 11px; color: #888; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .member-amount { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .share-pct { font-size: 11px; color: #888; }

    /* Add member form */
    .add-member-form form { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; margin-top: 12px; }
    .member-select { flex: 1; min-width: 160px; }
    .amount-field { width: 110px; }
    .slot-funded-badge { display: flex; align-items: center; gap: 6px; color: #2e7d32; font-size: 13px; font-weight: 600; margin-top: 8px; }
    /* Leader row highlight */
    .member-row--leader { background: #fffde7; border-radius: 8px; padding: 4px 6px; margin: -4px -6px; }
    .leader-chip { display: inline-flex; align-items: center; gap: 2px; background: #fff9c4;
      color: #f57f17; font-size: 11px; font-weight: 700; padding: 1px 6px; border-radius: 10px;
      margin-left: 6px; vertical-align: middle; }
    .leader-chip mat-icon { font-size: 12px; width: 12px; height: 12px; }

    /* Leader section */
    .leader-section { margin: 10px 0 4px; padding: 12px; background: #f9f4ff;
      border: 1px solid #e1bee7; border-radius: 10px; }
    .leader-section-title { display: flex; align-items: center; gap: 6px; font-size: 12px;
      font-weight: 700; color: #7b1fa2; margin-bottom: 10px; }
    .leader-section-title mat-icon { font-size: 16px; width: 16px; height: 16px; color: #ffd700; }
    .leader-hint { font-weight: 400; color: #9c64a6; font-size: 11px; }
    .leader-select-row { display: flex; gap: 8px; align-items: flex-start; flex-wrap: wrap; }
    .leader-select { flex: 1; min-width: 160px; }
    .leader-btn { background: linear-gradient(135deg, #6a1b9a, #8e24aa) !important;
      color: white !important; height: 40px; font-size: 13px !important;
      border-radius: 8px !important; white-space: nowrap; align-self: center; margin-top: 4px; }

    .add-slot-card { margin-bottom: 24px; }
    .add-slot-form { display: flex; flex-direction: column; gap: 12px; }
    .form-actions { display: flex; gap: 12px; flex-wrap: wrap; }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      h1 { font-size: 19px; }
      .slots-grid { grid-template-columns: 1fr; gap: 14px; }
      .member-select { min-width: 100%; }
      .amount-field { width: 100%; }
      .add-member-form form { flex-direction: column; }
      .leader-select-row { flex-direction: column; }
      .leader-select { min-width: 100%; }
      .leader-btn { width: 100%; margin-top: 0; }
    }

    @media (max-width: 480px) {
      h1 { font-size: 17px; }
      .member-email { display: none; }
    }
  `],
})
export class SlotManagementComponent implements OnInit {
  groupId = '';
  groupName = '';
  slots: any[] = [];
  availableMembers: any[] = [];
  loading = true;
  groupLocked = false;
  showAddSlotForm = false;
  addSlotForm!: FormGroup;
  addMemberForms: Record<string, FormGroup> = {};
  leaderSelections: Record<string, string> = {};
  settingLeader: Record<string, boolean> = {};

  constructor(
    private route: ActivatedRoute, private api: ApiService,
    private toast: ToastService, private fb: FormBuilder, private dialog: MatDialog
  ) {}

  get validSlots(): number { return this.slots.filter((s) => ['valid', 'eligible'].includes(s.status)).length; }
  get totalAssigned(): number { return this.slots.reduce((s, sl) => s + sl.assignedMonthlyAmount, 0); }

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('groupId')!;
    this.addSlotForm = this.fb.group({
      label: [''],
      payoutSplitStrategy: ['proportional'],
    });
    this.loadData();
  }

  loadData(): void {
    this.api.getGroupDetails(this.groupId).subscribe({
      next: (res) => {
        this.groupName = res.data.group.name;
        this.slots = res.data.slots;
        this.groupLocked = res.data.group.status !== 'draft';
        this.slots.forEach((s) => {
          this.initAddForm(s._id);
          // Pre-populate leader selection with current leader if set
          if (s.leader) this.leaderSelections[s._id] = s.leader;
        });
        this.loading = false;
        this.loadMembers();
      },
      error: () => { this.loading = false; },
    });
  }

  loadMembers(): void {
    this.api.getAllMembers().subscribe({
      next: (res) => { this.availableMembers = res.data || []; },
    });
  }

  initAddForm(slotId: string): void {
    this.addMemberForms[slotId] = this.fb.group({
      memberId: ['', Validators.required],
      monthlyAmount: [null, [Validators.required, Validators.min(1)]],
    });
  }

  getAddForm(slotId: string): FormGroup {
    if (!this.addMemberForms[slotId]) this.initAddForm(slotId);
    return this.addMemberForms[slotId];
  }

  openAddSlotForm(): void { this.showAddSlotForm = true; }

  submitAddSlot(): void {
    const nextNum = this.slots.length + 1;
    const data = { ...this.addSlotForm.value, slotNumber: nextNum };
    if (!data.label) data.label = `Slot ${nextNum}`;
    this.api.createSlot(this.groupId, data).subscribe({
      next: () => { this.toast.success(`Slot ${nextNum} created`); this.showAddSlotForm = false; this.loadData(); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed'); },
    });
  }

  addMember(slot: any): void {
    const form = this.getAddForm(slot._id);
    if (form.invalid) return;
    this.api.assignMemberToSlot(this.groupId, slot._id, form.value).subscribe({
      next: () => { this.toast.success('Member added to slot'); form.reset(); this.loadData(); },
      error: (err) => { this.toast.error(err.error?.message || 'Failed to add member'); },
    });
  }

  setLeader(slot: any): void {
    const memberId = this.leaderSelections[slot._id];
    if (!memberId) return;
    this.settingLeader[slot._id] = true;
    this.api.setSlotLeader(this.groupId, slot._id, memberId).subscribe({
      next: (res) => {
        this.settingLeader[slot._id] = false;
        this.toast.success(`Leader set: ${res.data.leaderName}`);
        this.loadData();
      },
      error: (err) => {
        this.settingLeader[slot._id] = false;
        this.toast.error(err.error?.message || 'Failed to set leader');
      },
    });
  }

  removeMember(slot: any, contribution: any): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Remove Member', message: `Remove ${contribution.member.firstName} from Slot ${slot.slotNumber}?`, danger: true },
    });
    dialogRef.afterClosed().subscribe((ok) => {
      if (ok) {
        this.api.removeMemberFromSlot(this.groupId, slot._id, contribution.member._id).subscribe({
          next: () => { this.toast.success('Member removed'); this.loadData(); },
          error: (err) => { this.toast.error(err.error?.message || 'Failed'); },
        });
      }
    });
  }
}
