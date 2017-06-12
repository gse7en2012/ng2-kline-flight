import { Injectable } from '@angular/core';
import { UserService } from './user.service';

@Injectable()
export class ShareService {

  public userInfo:any

  constructor(private userService:UserService) { 

    this.userInfo=this.userService.getUserInfo();
  

  }

}
