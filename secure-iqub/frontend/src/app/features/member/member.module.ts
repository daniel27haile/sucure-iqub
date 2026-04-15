import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { MemberLayoutComponent } from './layout/member-layout.component';
import { MemberDashboardComponent } from './dashboard/member-dashboard.component';
import { MyPaymentsComponent } from './payments/my-payments.component';
import { MySlotComponent } from './slot/my-slot.component';
import { WinnerHistoryComponent } from './history/winner-history.component';

const routes: Routes = [
  {
    path: '',
    component: MemberLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: MemberDashboardComponent },
      { path: 'payments', component: MyPaymentsComponent },
      { path: 'slot', component: MySlotComponent },
      { path: 'groups/:groupId/winners', component: WinnerHistoryComponent },
    ],
  },
];

@NgModule({
  declarations: [MemberLayoutComponent, MemberDashboardComponent, MyPaymentsComponent, MySlotComponent, WinnerHistoryComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class MemberModule {}
