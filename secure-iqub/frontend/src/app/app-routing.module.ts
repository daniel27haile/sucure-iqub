import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { GuestGuard } from './core/guards/guest.guard';

const routes: Routes = [
  { path: '', redirectTo: '/landing', pathMatch: 'full' },

  {
    path: 'landing',
    loadChildren: () => import('./features/landing/landing.module').then((m) => m.LandingModule),
  },

  {
    path: 'auth',
    canActivate: [GuestGuard],
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },

  {
    path: 'admin',
    canActivate: [AuthGuard],
    data: { roles: ['admin', 'super_admin'] },
    loadChildren: () => import('./features/admin/admin.module').then((m) => m.AdminModule),
  },

  {
    path: 'super-admin',
    canActivate: [AuthGuard],
    data: { roles: ['super_admin'] },
    loadChildren: () => import('./features/super-admin/super-admin.module').then((m) => m.SuperAdminModule),
  },

  {
    path: 'member',
    canActivate: [AuthGuard],
    data: { roles: ['member', 'admin', 'super_admin'] },
    loadChildren: () => import('./features/member/member.module').then((m) => m.MemberModule),
  },

  { path: '**', redirectTo: '/auth/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
