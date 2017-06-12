import { Component, OnInit } from '@angular/core';
import { CookieService } from 'angular2-cookie/core';
import { RouterModule, Routes, Router } from '@angular/router';
import * as io from "socket.io-client";

@Component({
  selector: 'app-socket',
  templateUrl: './socket.component.html',
  styleUrls: ['./socket.component.css']
})
export class SocketComponent implements OnInit {

  private socket;
  public skc;

  private isGameOver: boolean = false;

  public earn: string = '0%';
  public holdEarn: string = '0%';
  public userInfo: any;
  public socketKlineData: any;

  public pkTips: string = 'PK提示';
  public roomStatus: string = '房间状态';
  public waitingTimeOut: boolean = false;
  public waitingGameStart: boolean = false;
  public fetchDataDone: boolean = false;
  public playerList: any;
  public playerListStr: string;
  public playListGameEnd: any;


  constructor(private _cookieService: CookieService, private router: Router) {

    this.socket = io.connect("http://www.dokerteam.com");

    //this.socket = io.connect("http://ng2.g7.com");

    this.login();

    this.userInfo = JSON.parse(this._cookieService.get('kline_flight_user'));


    this.socket.on('gameReady', this.getGameReadyData.bind(this));
    this.socket.on('loginResult', this.getGameLoginData.bind(this));
    this.socket.on('loginTimeout', this.getGameTimeOut.bind(this));
    this.socket.on('playerUpdate', this.getGamePlayerUpdate.bind(this));
    this.socket.on('gameEnd', this.getGameEnd.bind(this));
  }


  private login() {
    const token = this._cookieService.get('kline_flight_token');
    this.socket.emit('login', {
      user: {
        token: token
      }
    })
  }

  private getGameLoginData(data) {
    this.pkTips = data.guide_tips;
    this.roomStatus = data.room_status;
    this.waitingGameStart = true;
    this.waitingTimeOut = false;
    this.fetchDataDone = false;
    if (data.error) {
      this.waitingTimeOut = true;
      this.fetchDataDone = false;
      this.waitingGameStart = false;
    }
  }

  private getGameReadyData(data) {
    this.waitingGameStart = false;
    this.fetchDataDone = true;
    this.socketKlineData = data;

    data.players.forEach((item) => {
      item.earn_roi = '0%';
    })

    this.playerList = data.players.filter((item) => {
      return item.uid != this.userInfo.uid
    })

  }

  private getGameTimeOut(data) {
    this.waitingTimeOut = true;
    this.fetchDataDone = false;
    this.waitingGameStart = false;
  }


  private getGamePlayerUpdate(data) {

    if (data.player.uid == this.userInfo.uid) {

    } else {
      this.playerList.forEach((player) => {
        if (player.uid == data.player.uid) {
          player.earn_roi = Number(data.player.earn_roi).toFixed(2) + '%'
        }
      })
    }
  }

  private getGameEnd(data) {
    this.isGameOver = true;
    data.players.forEach((p) => {
      p.earn_roi = p.earn_roi.toFixed(2) + '%';
    })
    this.playListGameEnd = data.players;
  }

  public returnLandPage() {
    if (this.isGameOver) {
      this.router.navigate(['/land']);
    } else {
      let sure = confirm('是否确定退出当前游戏？');
      if (sure) {
        this.router.navigate(['/land']);
      }
    }
  }

  public parentKlineGamePassEvt(arrIndex) {
    this.socket.emit('pass', {
      index: arrIndex
    })
  }

  public parentKlineGameBuyEvt(data) {
    this.socket.emit('trade', data)
  }

  public parentKlineGameSellEvt(data) {
    this.socket.emit('trade', data)
  }

  public parentKlineGameAgainEvt() {
    window.location.reload();
  }

  ngOnInit() {
  }

}
