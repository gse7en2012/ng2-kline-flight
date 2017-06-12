import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule, JsonpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { CookieService } from 'angular2-cookie/services/cookies.service';

import { ShareService } from './share.service';
import { UserService } from './user.service';

import { AppComponent } from './app.component';
import { ChartComponent } from './chart/chart.component';
import { LandPageComponent } from './land-page/land-page.component';
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth-guard';
import { TestComponent } from './test/test.component';
import { SocketComponent } from './socket/socket.component';
import { SocketChartComponent } from './socket-chart/socket-chart.component';

const appRoutes: Routes = [
  { path: '', redirectTo: '/land', pathMatch: 'full' },
  { path: 'land', component: LandPageComponent, canActivate: [AuthGuard] },
  { path: 'single', component: ChartComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'test', component: TestComponent },
  { path: 'socket', component: SocketComponent , canActivate: [AuthGuard]}
]

export class MyHammerConfig extends HammerGestureConfig {
  overrides = <any>{
    'swipe': { velocity: 0.4, threshold: 20 } // override default settings
  }
}

@NgModule({
  declarations: [
    AppComponent,
    ChartComponent,
    LandPageComponent,
    LoginComponent,
    TestComponent,
    SocketComponent,
    SocketChartComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    JsonpModule,
    RouterModule.forRoot(appRoutes),
  ],
  providers: [
    ShareService,
    UserService,
    CookieService,
    AuthGuard,
    { provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
