import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { AdminLayoutComponent } from './admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { GroupListComponent } from './groups/group-list.component';
import { GroupDetailComponent } from './groups/group-detail.component';
import { CreateGroupComponent } from './groups/create-group.component';
import { SlotManagementComponent } from './slots/slot-management.component';
import { MonthlyCollectionComponent } from './payments/monthly-collection.component';
import { LuckySpinComponent } from './spin/lucky-spin.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'groups', component: GroupListComponent },
      { path: 'groups/new', component: CreateGroupComponent },
      { path: 'groups/:groupId', component: GroupDetailComponent },
      { path: 'groups/:groupId/slots', component: SlotManagementComponent },
      { path: 'groups/:groupId/collection', component: MonthlyCollectionComponent },
      { path: 'groups/:groupId/spin', component: LuckySpinComponent },
    ],
  },
];

@NgModule({
  declarations: [
    AdminLayoutComponent, AdminDashboardComponent, GroupListComponent,
    GroupDetailComponent, CreateGroupComponent, SlotManagementComponent,
    MonthlyCollectionComponent, LuckySpinComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class AdminModule {}
