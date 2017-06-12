import { Component, OnInit } from '@angular/core';
import { UserService } from '../user.service';
import { ShareService } from '../share.service';
import { RouterModule, Routes, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  isPop: boolean = false;
  isLoginPop: boolean = false;
  isRegPop: boolean = false;

  private sendSmsCountDown: number = 0;

  public phone: string;
  public password: string;
  public nickname: string;
  public code: string;

  constructor(private userService: UserService, private shareService: ShareService, private router: Router) {
  }

  ngOnInit() {
  }

  showLoginPop() {
    this.isPop = true;
    this.isLoginPop = true;
    this.isRegPop = false;
  }

  showRegPop() {
    this.isPop = true;
    this.isRegPop = true;
    this.isLoginPop = false;
  }

  hideLoginPop() {
    this.isPop = false;
    this.isLoginPop = false;
    this.isRegPop = false;
  }

  hideRegPop() {
    this.isPop = false;
    this.isRegPop = false;
    this.isLoginPop = false;
  }

  loginAccount() {
    this.userService.loginViaPhone(this.phone, this.password).then((user: any) => {
      this.shareService.userInfo = user;
      this.router.navigate(['/land']);
    }).catch((e: any) => {
      alert(e)
    });
  }

  sendSmsCode() {
    if (!this.phone) return alert('请输入手机');
    if (this.sendSmsCountDown > 0) return;
    this.userService.sendSmsCode(this.phone).then((result: any) => {
      console.log(result);
      alert(`验证码已发送到${this.phone}，请注意查收!`)
      this.sendSmsCountDown = 120;
      let stId = setInterval(() => {
        if (this.sendSmsCountDown > 0) {
          this.sendSmsCountDown--;
        } else {
          clearInterval(stId);
        }
      }, 1000)

    }).catch((e: any) => {
      alert(e);
    })
  }

  regAccount() {
    if (!this.code) return alert('请输入验证码');
    if (!this.phone) return alert('请输入手机');
    if (!this.password) return alert('请输入密码');
    if (!this.nickname) return alert('请输入昵称');

    this.userService.checkSmsCode(this.phone, this.code).then((result: any) => {
      return this.userService.regAccount(this.phone, this.password, this.nickname)
    }).then((regInfo) => {
      alert('注册成功！');
      this.router.navigate(['/land']);
    }).catch((e) => {
      alert(e)
    })

  }


}
