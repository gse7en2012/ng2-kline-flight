import { Injectable } from '@angular/core';
import { Http, Response, Jsonp, URLSearchParams, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Md5 } from "ts-md5/dist/md5";
import { CookieService } from 'angular2-cookie/core';
import { UUID } from 'angular2-uuid';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';


@Injectable()
export class UserService {

    private salt: string = 'ZAB_weicai';
    private baseUrl: string = '/api/v1';
    private saltV2: string = 'XLZLM';
    private appVersion: string = 'website_v1.0.0';
    private clientType: string = 'h5';
    private channelName: string = 'dokerteam';
    private uuid: string;

    constructor(private _cookieService: CookieService, private http: Http) {
        let uuid = _cookieService.get('kline_flight_uuid');
        if (!uuid) {
            uuid = UUID.UUID();
            this._cookieService.put('kline_flight_uuid', uuid, { expires: new Date(Number(new Date()) + 1000 * 60 * 60 * 24 * 60/*60 days uuid*/) });
        }
        this.uuid = uuid;
    }


    private buildToken(uid: number) {
        if (!uid) return 'no_user_info';
        let time = Number(new Date());
        let token = Md5.hashStr(`${this.salt}${uid}${time}`);
        return `${token}|${uid}|${time}`;
    }

    private buildCustomHeader(optsAddArr: any, headerOptsAdd?: any) {
        let tmpArr = [];
        let time = Number(new Date());
        let headerOpts = {
            'CAppVersion': this.appVersion,
            'ClientType': this.clientType,
            'CChannelName': this.channelName,
            'CSecret': time
        };
        // [phone"]  

        if (optsAddArr) {
            Object.keys(optsAddArr).forEach((item) => { tmpArr.push(item) });
            tmpArr = tmpArr.sort();
        }

        let oResult = this.saltV2 + this.appVersion + this.clientType + this.channelName + time;

        if (tmpArr.length > 0) {
            tmpArr.forEach((item) => {
                oResult += optsAddArr[item]
            })
        }

        const answer = Md5.hashStr(oResult);
        headerOpts['CAnswer'] = answer;

        if (headerOptsAdd) {
            Object.assign(headerOpts, headerOptsAdd);
        }

        let headers = new Headers(headerOpts);
        let options = new RequestOptions({ headers: headers });
        return options;
    }

    private buildReqToken() {

    }


    checkIsLogin() {
        return !!this._cookieService.get('kline_flight_token');
    }

    getUserInfo() {
        return this._cookieService.getObject('kline_flight_user');
    }

    getSingleGameData() {
        const headerOptions = this.buildCustomHeader({}, {
            AccessToken: this.buildToken(this.getUserInfo()['uid'])
        })

        return this.http.get('/api/v1/single/start', headerOptions).toPromise().then((data) => {
            let result = data.json();
            console.log(result)
            return result.result;
        }).catch((e) => Promise.reject(e.json().msg));
    }




    loginViaPhone(phone: string, pass: string): Promise<any> {

        //{"result":{"user":{"uid":1,"nickname":"霸气七","picture":"http://7xntcs.com1.z0.glb.clouddn.com/Fkd-PL2xH_Fr7cwGwBwkUf-axIL5","is_bind_phone":1,"vip_lvl":1,"medal_gold":0,"medal_silver":0,"medal_copper":0,"lvl":5,"lvl_name":"投资顾问","exp_up_need":4800,"exp_current":315,"coin":29725},"token":"944ebe2457262555f6d8b95bc7d65422|1|1487437390543","qn_token":"JSuBdW_aq0emnG6Csmv9CJIBDrLyrNpZVi5F-G5B:gRLkM1J0N6TyMWUj_NhI5Z0Ws5Y=:eyJtaW1lTGltaXQiOiJpbWFnZS9qcGVnO2ltYWdlL3BuZyIsInNjb3BlIjoia2xpbmUtZmxpZ2h0IiwiZGVhZGxpbmUiOjE1MTg0Mjg1NzF9","qn_urlpre":"http://7xntcs.com1.z0.glb.clouddn.com/","launch_url":null,"is_app_release":1}}
        let fetchParams = {
            phone: phone,
            pwd: Md5.hashStr(`${pass}kf`),
            type: 1,
            udid: this.uuid
        };

        const headerOptions = this.buildCustomHeader({
            phone: phone,
            pwd: fetchParams.pwd,
            udid: this.uuid
        })


        return this.http.post(`${this.baseUrl}/account/login`, fetchParams, headerOptions).toPromise().then((data) => {
            let result = data.json();
            let cookieOpts = { expires: new Date(Number(new Date()) + 1000 * 60 * 60 * 24 * 5) };
            this._cookieService.putObject('kline_flight_user', result.result.user, cookieOpts);
            this._cookieService.put('kline_flight_token', result.result.token, cookieOpts);
            return result.result.user;
        }).catch((e) => {
            return Promise.reject(e.json().msg);
        });
    }

    sendSmsCode(phone: string): Promise<any> {

        let requestTime = Number(new Date());

        const headerOptions = this.buildCustomHeader({
            phone: phone,
            gseven: requestTime
        })


        return this.http.post(`${this.baseUrl}/account/sms/send`, { phone: phone, gseven: requestTime }, headerOptions).toPromise().then((data) => {
            let result = data.json();
            if (result.result.status !== 200) {
                return Promise.reject(result.result.msg)
            }
            return result.result;
        }).catch((e) => {
            return Promise.reject(e);
        });
    }

    checkSmsCode(phone: string, code: string): Promise<any> {

        let requestTime = Number(new Date());

        const headerOptions = this.buildCustomHeader({
            phone: phone,
            gseven: requestTime
        })

        return this.http.post(`${this.baseUrl}/account/sms/check`, { phone: phone, code: code, gseven: requestTime }, headerOptions).toPromise().then((data) => {
            let result = data.json();
            if (result.result.status !== 200) {
                return Promise.reject(result.result.msg)
            }
            return result.result;
        }).catch((e) => {
            return Promise.reject(e);
        });
    }

    regAccount(phone: string, pass: string, nickname: string) {
        // ["udid", "phone", "pwd"]
        let fetchParams = {
            phone: phone,
            pwd: Md5.hashStr(`${pass}kf`),
            nickname: nickname,
            udid: this.uuid
        };
        const headerOptions = this.buildCustomHeader({
            phone: phone,
            pwd: fetchParams.pwd,
            udid: this.uuid
        })

        return this.http.post(`${this.baseUrl}/account/reg`, fetchParams, headerOptions).toPromise().then((data) => {
            let result = data.json();
            let cookieOpts = { expires: new Date(Number(new Date()) + 1000 * 60 * 60 * 24 * 5) };
            this._cookieService.putObject('kline_flight_user', result.result.user, cookieOpts);
            this._cookieService.put('kline_flight_token', result.result.token, cookieOpts);
            return result.result.user;
        }).catch((e) => Promise.reject(e.json().msg));

    }

    fetchUserProfile(uid: number) {
        ///users/:uid/info


        const headerOptions = this.buildCustomHeader({}, {
            AccessToken: this.buildToken(uid)
        })



        return this.http.get(`${this.baseUrl}/users/${uid}/info`, headerOptions).toPromise().then((data) => {
            let result = data.json();
            let cookieOpts = { expires: new Date(Number(new Date()) + 1000 * 60 * 60 * 24 * 5) };
            this._cookieService.putObject('kline_flight_user', result.result.user, cookieOpts);
            return result.result.user;
        }).catch((e) => Promise.reject(e.json().msg));

    }

    uploadSingleScore(earn_roi: string, during_up_per: string) {



        earn_roi = earn_roi.replace(/\%/g, '');
        during_up_per = during_up_per.replace(/\%/g, '');

        const headerOptions = this.buildCustomHeader({
            earn_roi: earn_roi, during_up_per: during_up_per
        }, {
            AccessToken: this.buildToken(this.getUserInfo()['uid'])
        })



        return this.http.post(`${this.baseUrl}/single/upload`, { earn_roi: earn_roi, during_up_per: during_up_per,from:'web' }, headerOptions).toPromise().then((data) => {
            let result = data.json();
            return result.result;
        }).catch((e) => {
            return Promise.reject(e);
        });
    }


}
