import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params, } from '@angular/router';
import { trigger, state, animate, style, transition } from '@angular/core';
import { UserService } from '../user.service';

import 'rxjs/add/operator/switchMap';


@Component({
  selector: 'app-land-page',
  templateUrl: './land-page.component.html',
  styleUrls: ['./land-page.component.css'],
  animations: [trigger('routerTransition', [
    state('void', style({ position: 'fixed', width: '100%', height: '100%', left: 0, top: 0, background: '#000' })),
    state('*', style({ position: 'fixed', width: '100%', height: '100%', left: 0, top: 0, background: '#000' })),
    transition(':enter', [  // before 2.1: transition('void => *', [
      style({ transform: 'translateX(100%)' }),
      animate('0.25s linear', style({ transform: 'translateX(0%)' }))
    ]),
    transition(':leave', [  // before 2.1: transition('* => void', [
      style({ transform: 'translateX(0%)' }),
      animate('0.25s linear', style({ transform: 'translateX(-100%)' }))
    ])
  ])],
  host: { '[@routerTransition]': '' }
})
export class LandPageComponent implements OnInit {

  isShowDownloadBanner: boolean = false;
  isShowProfile: boolean = false;
  isProfileLoad: boolean = false;
  isShowHelp: boolean = false;
  userInfo: any;

  constructor(private userService: UserService, private route: ActivatedRoute, private router: Router ) { }

  ngOnInit() {
    this.route.params.forEach((params: Params) => {
        this.isShowDownloadBanner=!!params['download'];
    });

  }

  getUserProfile() {
    this.isShowProfile = true;
    this.isProfileLoad = false;
    let uid = this.userService.getUserInfo()['uid'];
    this.userService.fetchUserProfile(uid).then((data) => {
      console.log(data);
      this.isProfileLoad = true;
      this.userInfo = data;
      this.userInfo.lvlWidth = this.userInfo.exp_current / this.userInfo.exp_up_need * 100;
    })
  }

  showProfile() {
    this.isShowProfile = true;
    this.isShowHelp = false;
  }
  showHelp() {
    this.isShowHelp = true;
    this.isShowProfile = false;
  }

  closeProfile() {
    this.isShowProfile = false;
    this.isShowHelp = false;
  }

  closeHelp() {
    this.isShowProfile = false;
    this.isShowHelp = false;
  }
  gotoSingleGame(){
    this.router.navigate(['/single']);
  }
  gotoSocketGame(){
    this.router.navigate(['/socket']);
  }
}
