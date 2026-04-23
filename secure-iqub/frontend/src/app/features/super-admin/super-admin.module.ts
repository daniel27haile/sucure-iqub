import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SuperAdminLayoutComponent } from './layout/super-admin-layout.component';
import { SuperAdminDashboardComponent } from './dashboard/super-admin-dashboard.component';
import { AdminManagementComponent } from './admins/admin-management.component';
import { AdminDetailComponent } from './admin-detail/admin-detail.component';
import { AllGroupsComponent } from './groups/all-groups.component';
import { PlatformSettingsComponent } from './settings/platform-settings.component';
import { AuditLogsComponent } from './audit/audit-logs.component';
import { AdminRequestsComponent } from './admin-requests/admin-requests.component';

const routes: Routes = [
  {
    path: '',
    component: SuperAdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: SuperAdminDashboardComponent },
      { path: 'admins', component: AdminManagementComponent },
      { path: 'admins/:adminId', component: AdminDetailComponent },
      { path: 'admin-requests', component: AdminRequestsComponent },
      { path: 'groups', component: AllGroupsComponent },
      { path: 'settings', component: PlatformSettingsComponent },
      { path: 'audit-logs', component: AuditLogsComponent },
    ],
  },
];

@NgModule({
  declarations: [
    SuperAdminLayoutComponent, SuperAdminDashboardComponent,
    AdminManagementComponent, AdminDetailComponent,
    AllGroupsComponent,
    PlatformSettingsComponent, AuditLogsComponent,
    AdminRequestsComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class SuperAdminModule {}
