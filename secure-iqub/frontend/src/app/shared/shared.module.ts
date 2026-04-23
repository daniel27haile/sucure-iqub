import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { StatCardComponent } from './components/stat-card/stat-card.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { LiveClockComponent } from './components/live-clock/live-clock.component';
import { SiLogoComponent } from './components/si-logo/si-logo.component';

const MATERIAL = [
  MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule,
  MatSelectModule, MatTableModule, MatPaginatorModule, MatSortModule,
  MatIconModule, MatProgressSpinnerModule, MatChipsModule, MatTooltipModule,
  MatDialogModule, MatMenuModule, MatBadgeModule, MatDividerModule, MatProgressBarModule,
];

const COMPONENTS = [
  StatCardComponent, StatusBadgeComponent, LoadingSpinnerComponent, ConfirmDialogComponent,
  LiveClockComponent, SiLogoComponent,
];

@NgModule({
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, ...MATERIAL],
  declarations: [...COMPONENTS],
  exports: [
    CommonModule, RouterModule, ReactiveFormsModule, FormsModule,
    ...MATERIAL, ...COMPONENTS,
  ],
})
export class SharedModule {}
