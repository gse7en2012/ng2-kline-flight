import { Component } from '@angular/core';
import { UserService } from './user.service';
import { RouterModule, Routes,Router } from '@angular/router';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  
})
export class AppComponent {
  title = 'app works!';

  constructor(private userService:UserService,private router: Router,){
      let isLogin=this.userService.checkIsLogin();
      if(!isLogin){
       this.router.navigate(['/login']);
      }
  }

}
