import { Injectable } from '@angular/core';
import { Http, Response, Jsonp, URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { KlineChartData } from './chart.data';
import { UserService } from '../user.service';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';



@Injectable()
export class ChartService {

  private fetchUrl = '/api/v1/single/start';
  private timeIndex = 0;

  private extractData(res) {
    let body = res.json();
    return body;
  }

  private handleError(error: Response | any) {
    console.log(`${error.status} - ${error.statusText || ''} ${error}`)
  }


  constructor(private jsonp: Jsonp,private http:Http,private userService:UserService) { }



  getChartData(): Promise<KlineChartData> {

    // let params = new URLSearchParams();
    // params.set('callback', `__ng_jsonp__.__req${this.timeIndex}.finished`);
    // this.timeIndex = this.timeIndex + 1;

    // return this.jsonp.get(this.fetchUrl, { search: params })
    //   .toPromise()
    //   .then(this.extractData)
    //   .catch(this.handleError);

   return this.userService.getSingleGameData().then((data)=>{
     return data;
   })

    // return this.http.get(this.fetchUrl)
    //   .toPromise()
    //   .then(this.extractData)
    //   .catch(this.handleError);

  }

}
