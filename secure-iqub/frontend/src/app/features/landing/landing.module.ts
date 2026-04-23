import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { LandingPageComponent } from './landing-page/landing-page.component';

const routes: Routes = [
  { path: '', component: LandingPageComponent },
];

@NgModule({
  declarations: [LandingPageComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class LandingModule {}
