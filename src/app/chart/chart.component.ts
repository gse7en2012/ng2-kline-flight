import { Component, OnInit, AfterViewInit, ViewChild, Injectable } from '@angular/core';
// import { routerTransition } from '../router.animations';

import { RouterModule, Routes, Router } from '@angular/router';
import { ChartService } from './chart.service';
import { trigger, state, animate, style, transition } from '@angular/core';
import { UserService } from '../user.service';
import { ShareService } from '../share.service';

@Component({
  moduleId: module.id,
  selector: 'app-chart',
  templateUrl: 'chart.component.html',
  styleUrls: ['chart.component.css'],
  providers: [ChartService],
  animations: [trigger('routerTransition', [
    state('void', style({ background: '#000' })),
    state('*', style({ background: '#000' })),
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

@Injectable()
export class ChartComponent implements OnInit, AfterViewInit {


  private XSCALE: number = 3;  //宽度放大倍数
  private YSCALE: number = 1;  //Yscale
  private SPACE: number = 0.22; //蜡烛之间的间隙
  private ORIGINWIDTH: number = 3; //蜡烛原始宽度
  private COORDWIDTH: number = 36; //坐标数值宽度
  private DATAOFFSET: number = 20; //数据偏移值，前N个舍弃
  private DATASTARTLENGTH: number = 20; //一开始渲染的长度
  private originData: any;
  private stId: any;

  maxTop: number = 0;
  maxValue: number = 0;
  minBottom: number = 99999999999;
  minValue: number = 99999999999;
  cursor: number = 0;
  earn: string = '0%';
  holdEarn: string = '0%';
  start: number = 20;
  end: number = 40;
  screenMoveStep: number = 0;
  currentMaxIndex: number = 0;
  remindTime: number = 10 * 1;
  remindTimeShow: string = '10:00';
  remindLine: number;
  setDownEarn: number = 1;
  tradeInfo: any = {
    isTrading: false,
    current: {},
    done: []
  };

  canvasWidth: number = window.innerWidth - 20;
  canvasHeight: number = window.innerHeight - 8 * 2 - 85 - 50;
  part1Height: number = this.canvasHeight / 3 * 2;
  part2Height: number = this.canvasHeight * 0.3;
  colorRed: string = '#e93d47';
  colorGreen: string = '#03b57f';
  fetchDataDone: boolean = false;
  isGameOver: boolean = false;
  symbolName: string;
  symbolTime: string;
  symbolEarn: string = '0.00%';

  userInfo: any;
  currentPriceInfo: any;

  earnCoins: number = 0;
  earnExp: number = 0;

  isScoreUploaded: boolean = false;

  private isFullScreenToMove: boolean = false;
  private ctx: CanvasRenderingContext2D;
  private colorGreenRgba: string = 'rgba(1,188,133,.3)';
  private colorRedRgba: string = 'rgba(237,61,64,.3)';
  private cache: any = {};
  private colorHash: any = {
    5: '#d15df6',
    10: '#fed500',
    20: '#52a7c6',
    60: '#f1f5f8'
  };
  private distanceMAHash: any = {
    5: 8,
    10: 68,
    20: 138,
    60: 208
  };
  private MAXSCREENLENGTH: number;

  @ViewChild("canvas") myCanvas;


  private initParams() {
    this.maxTop = 0;
    this.maxValue = 0;
    this.minBottom = 99999999999;
    this.minValue = 99999999999;
    this.cursor = 0;
    this.earn = '0%';
    this.holdEarn = '0%';
    this.start = 20;
    this.end = 40;
    this.screenMoveStep = 0;
    this.currentMaxIndex = 0;
    this.remindTime = 10 * 1;
    this.remindTimeShow = '10:00';
    this.setDownEarn = 1;
    this.tradeInfo = {
      isTrading: false,
      current: {},
      done: []
    };
    this.fetchDataDone = false;
    this.isGameOver = false;
    this.symbolEarn = '0.00%';
    this.isFullScreenToMove = false;
    this.isScoreUploaded = false;
    console.log(this.stId)
    //if (this.stId) { clearInterval(this.stId) }
  }

  constructor(private chartService: ChartService, private router: Router, private shareService: ShareService, private userService: UserService) {
    if (this.canvasWidth > 320) {
      this.XSCALE = 4;
    }
    if (this.canvasWidth > 640) {
      this.XSCALE = 5;
    }
    this.MAXSCREENLENGTH = Math.ceil((this.canvasWidth - this.COORDWIDTH) / (this.ORIGINWIDTH + this.SPACE) / this.XSCALE) - 2;
    console.log(this.XSCALE);
    console.log(this.canvasWidth, 'canvasWidth');
    console.log(this.MAXSCREENLENGTH, 'max');

    this.userInfo = Object.assign({ picture: 'assets/images/avatar.png' }, this.shareService.userInfo);

  }

  ngOnInit() { }

  ngAfterViewInit() {
    let canvas = this.myCanvas.nativeElement;
    this.ctx = canvas.getContext("2d");

    this.chartService.getChartData().then((data: any) => {

      this.originData = data.kline;
      this.remindTime = data.duration;
      this.fetchDataDone = true;
      this.remindLine = this.originData.length - this.end;
      this.symbolName = data.stock_name;
      this.symbolEarn = `${((data.kline[data.kline.length - 1][2] / data.kline[this.DATAOFFSET + this.DATASTARTLENGTH - 1][2] - 1) * 100).toFixed(2)}%`;

      this.symbolTime = `${data.kline[this.DATAOFFSET - 1][0]}至${data.kline[data.kline.length - 1][0]}`;
      console.log(this.originData)
      //return this.setCursor(190)
      this.draw();
      this.startCountDown();

    }).catch((e) => {
      alert('加载数据出错！可能是服务器开小差了，请稍后再试！')
    })
  }

  private checkGameEnd() {
    if (this.end == this.originData.length) {
      if (this.tradeInfo.isTrading) {
        let row = {
          buy: this.tradeInfo.current.price,
          start: this.tradeInfo.current.start,
          sell: this.originData[this.end - 1][2],
          end: this.end
        };
        this.setDownEarn = this.setDownEarn * (row.sell / row.buy);
        this.earn = Number((this.setDownEarn - 1) * 100).toFixed(2) + '%';
        this.holdEarn = '0%';
        this.tradeInfo.done.push(row);
        this.tradeInfo.current = {};
        this.tradeInfo.isTrading = false;
      }
      this.isGameOver = true;
      clearInterval(this.stId);
      this.userService.uploadSingleScore(this.earn, this.symbolEarn).then((data) => {
        console.log('upload success!')
        this.earnCoins = data.earn_coin;
        this.earnExp = data.earn_exp;
      }).catch((e) => { console.log('upload error!') });
    }
    if (this.end > this.originData.length) {
      this.isGameOver = true;
      return alert('已到最后一根！');
    }
  }


  private preMarker(data) {

    data.forEach((item) => {
      for (let i: number = 1; i < 5; i++) {
        let b: number = Number(item[i]);
        if (b < this.minBottom) this.minBottom = b;
        if (b > this.maxTop) this.maxTop = b;
      }
      if (Number(item[5]) < this.minValue) this.minValue = Number(item[5]);
      if (Number(item[5]) > this.maxValue) this.maxValue = Number(item[5]);
    });

    Object.keys(this.distanceMAHash).forEach((k: string) => {
      data.forEach((item, index) => {
        //前N个数用于ma图
        if (this.start + index >= Number(k) - 1) {
          let value: number = 0;
          for (let ii: number = 0; ii < Number(k); ii++) {
            try {
              value += Number(this.originData[this.start + index - ii][2]);
            } catch (e) {
              console.log(e);
              console.log(index, this.cursor, ii, this.start + index - ii);
            }
          }
          value = Number((value / Number(k)).toFixed(2));
          if (value < this.minBottom) this.minBottom = value;
          if (value > this.maxTop) this.maxTop = value;
        }
      })
    })


  }
  /**
  * 画坐标和参考线
  */
  private drawCoord() {
    let blockHeight: number = this.part1Height / 4;
    let maxTop: number = this.maxTop, minBottom = this.minBottom;
    let maxValue: number = this.maxValue, minValue = this.minValue;

    this.ctx.fillStyle = '#609cb8';
    this.ctx.font = "14px Helvetica";
    this.ctx.lineWidth = 1;
    let heightList: any = [
      { value: Number(this.maxTop).toFixed(2), y: 14 },
      { value: (maxTop - (maxTop - minBottom) / 4).toFixed(2), y: (Number(blockHeight)).toFixed(2) },
      { value: (maxTop - (maxTop - minBottom) / 2).toFixed(2), y: (blockHeight * 2).toFixed(2) },
      { value: (maxTop - (maxTop - minBottom) / 4 * 3).toFixed(2), y: (blockHeight * 3).toFixed(2) },
      { value: Number(minBottom).toFixed(2), y: this.part1Height }
    ];


    heightList.forEach((item, index) => {
      this.ctx.fillText(item.value, 0, item.y);
      if (index > 0) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = '#609cb8';
        this.ctx.moveTo(this.COORDWIDTH, item.y);
        this.ctx.lineTo(this.canvasWidth, item.y);
        this.ctx.stroke();
      }
    });

    this.ctx.fillText(`${(this.maxValue / 10000).toFixed(2)}`, 0, this.canvasHeight - this.part2Height + 22);
    this.ctx.fillText('万手', 0, this.canvasHeight - 5)

  }


  private getMALine(start, end, type) {
    var result = [];
    var infTimes = 0;
    for (var cc = start; cc < end; cc++) {
      if (cc >= type) {
        var value = 0;
        for (var ii = 0; ii < type; ii++) {
          value += Number(this.originData[cc - ii][2]);
        }
        value = Number((value / type).toFixed(2));
        result.push({
          y: ((this.maxTop - value) * this.part1Height / (this.maxTop - this.minBottom)).toFixed(2),
          x: this.COORDWIDTH + (infTimes * (this.ORIGINWIDTH + this.SPACE) + this.ORIGINWIDTH / 2) * this.XSCALE
        });
      }
      infTimes++;
    }
    this.cache['MA' + type] = result;
    return result;
  }

  private drawMA(start, end, type) {
    var point = this.getMALine(start, end, type);
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.colorHash[type];
    this.ctx.fillStyle = this.colorHash[type];
    for (let i = 0; i < point.length; i++) {
      if (i == 0) {
        this.ctx.moveTo(point[i].x, point[i].y);
      } else {//注意是从1开始
        if (point[i + 1]) {
          this.ctx.lineTo(point[i + 1].x, point[i + 1].y);
        }
        //ctx.bezierCurveTo(ctrlP.pA.x, ctrlP.pA.y, ctrlP.pB.x, ctrlP.pB.y, point[i].x, point[i].y);
      }
    }
    this.ctx.stroke();

    this.ctx.fillRect(this.COORDWIDTH + this.distanceMAHash[type], 2, 12, 12);
    this.ctx.fillText('MA' + type, this.COORDWIDTH + this.distanceMAHash[type] + 12 + 2, 13)

  }


  private moveCursor(f) {
    f = f || 1;
    if (f > 0) this.cursor++;
    if (f < 0) this.cursor--;
  }
  private setCursor(c) {
    this.cursor = c;
    this.draw();
  }

  private resetCanvas() {
    this.maxTop = 0;
    this.minBottom = 99999999999;
    this.maxValue = 0;
    this.minValue = 99999999999;
    this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
  }



  private drawChart(data, index) {
    let maxTop = this.maxTop, minBottom = this.minBottom;
    let maxValue = this.maxValue;
    let openPrice = data[1], closePrice = data[2], highPrice = data[3], lowPrice = data[4], tradeValue = parseInt(data[5]);

    //价格的每份高度
    let percentHeight = this.part1Height / (maxTop - minBottom);
    //成交量的每份高度
    let percentValueHeight = this.part2Height / maxValue;
    //价格蜡烛图的y坐标
    let y = (closePrice > openPrice ? (maxTop - closePrice) : (maxTop - openPrice)) * percentHeight;
    //收盘开盘相同价格赋予0.01高度
    let priceDistance: string = Math.abs(closePrice - openPrice).toFixed(2);

    //蜡烛的高度
    let height = percentHeight * Number(priceDistance);

    //成交量的y坐标
    var valueY = (maxValue - tradeValue) * percentValueHeight + (this.canvasHeight - this.part2Height);
    //成交量的高度
    var valueHeight = this.canvasHeight - valueY;

    this.ctx.fillStyle = this.colorGreen;
    this.ctx.strokeStyle = this.colorGreen;
    this.ctx.lineWidth = 2;
    if (closePrice > openPrice) {
      this.ctx.fillStyle = this.colorRed;
      this.ctx.strokeStyle = this.colorRed;
    }

    let lineStartX = this.COORDWIDTH + (index * (this.ORIGINWIDTH + this.SPACE) + this.ORIGINWIDTH / 2) * this.XSCALE;
    let lineStartY = (maxTop - highPrice) * percentHeight;
    let lineEndY = (maxTop - lowPrice) * percentHeight;
    //画线
    this.ctx.beginPath();
    this.ctx.moveTo(lineStartX, lineStartY);
    this.ctx.lineTo(lineStartX, lineEndY);
    this.ctx.stroke();
    //画蜡烛
    if (closePrice != openPrice) {
      this.ctx.fillRect(this.COORDWIDTH + index * (this.ORIGINWIDTH + this.SPACE) * this.XSCALE, y * this.YSCALE, parseInt('' + this.ORIGINWIDTH * this.XSCALE), parseInt('' + height * this.YSCALE));
    } else {
      //收盘开盘相同价格赋予0.01高度
      this.ctx.moveTo(this.COORDWIDTH + index * (this.ORIGINWIDTH + this.SPACE) * this.XSCALE, y * this.YSCALE);
      this.ctx.lineTo(this.COORDWIDTH + ((index + 1) * (this.ORIGINWIDTH + this.SPACE) - this.SPACE) * this.XSCALE, y * this.YSCALE);
      this.ctx.stroke();
    }
    //画成成交量
    this.ctx.fillRect(this.COORDWIDTH + index * (this.ORIGINWIDTH + this.SPACE) * this.XSCALE, valueY * this.YSCALE, parseInt('' + this.ORIGINWIDTH * this.XSCALE), parseInt('' + valueHeight * this.YSCALE));

    //辅助字段
    //ctx.font      = "10px simHei";
    //ctx.fillStyle = '#fff';
    //ctx.fillText(index, COORDWIDTH + index * (ORIGINWIDTH + SPACE) * XSCALE, part1Height + index * 6)
    //ctx.fillText(data[data.length - 1], COORDWIDTH + index * (ORIGINWIDTH + SPACE) * XSCALE, 10 + index * 4)
  }

  private cleanChartBottomValue() {
    this.ctx.clearRect(0, this.canvasHeight - 2, this.canvasWidth, 2)
  }

  private drawTradeBackground() {
    //console.log(JSON.stringify(this.tradeInfo));

    //正在交易的
    if (this.tradeInfo.isTrading) {


      let startXPoint = (this.tradeInfo.current.start - this.DATAOFFSET - 1);
      let bgWidth = this.end - this.tradeInfo.current.start;

      if (this.screenMoveStep > 0) {
        console.log(this.screenMoveStep, 'movescreen');
        startXPoint = startXPoint - this.screenMoveStep;
        console.log(startXPoint);
      }

      //  console.log(bgWidth, this.end, this.tradeInfo.current.start, this.screenMoveStep, '-=-==-=', startXPoint);

      console.log('trading background', this.originData[this.end - 1][2], this.tradeInfo.current.price, this.end)
      if (Number(this.originData[this.end - 1][2]) < Number(this.tradeInfo.current.price)) {
        this.ctx.fillStyle = this.colorGreenRgba;
      } else {
        this.ctx.fillStyle = this.colorRedRgba;
      }
      console.log('fillstyle', this.ctx.fillStyle);

      let startXDraw = this.COORDWIDTH + ((startXPoint) * (this.ORIGINWIDTH + this.SPACE) + this.ORIGINWIDTH / 2) * this.XSCALE;
      let drawWidth = parseInt('' + (this.ORIGINWIDTH + this.SPACE) * this.XSCALE * bgWidth);
      if (startXPoint < 0) {
        let maxWidth = this.end - this.tradeInfo.current.start > this.MAXSCREENLENGTH ? (this.MAXSCREENLENGTH + 1) : this.end - this.tradeInfo.current.start
        startXDraw = this.COORDWIDTH;
        drawWidth = parseInt('' + (this.ORIGINWIDTH + this.SPACE) * this.XSCALE * (maxWidth)) - this.ORIGINWIDTH / 2 * this.XSCALE
      }
      this.ctx.fillRect(startXDraw, 0, drawWidth, this.canvasHeight);
    }

    this.tradeInfo.done.forEach((record) => {

      let startXPoint = (record.start - this.DATAOFFSET - 1);
      let bgWidth = record.end - record.start;
      if (this.screenMoveStep > 0) {
        console.log(this.screenMoveStep, 'movescreen');
        startXPoint = startXPoint - this.screenMoveStep;
        console.log(startXPoint);
      }
      if (startXPoint < 0) bgWidth = bgWidth + 1;


      if (record.sell < record.buy) {
        this.ctx.fillStyle = this.colorGreenRgba;
      } else {
        this.ctx.fillStyle = this.colorRedRgba;
      }

      let startXDraw = this.COORDWIDTH + ((startXPoint) * (this.ORIGINWIDTH + this.SPACE) + this.ORIGINWIDTH / 2) * this.XSCALE;
      let drawWidth = parseInt('' + (this.ORIGINWIDTH + this.SPACE) * this.XSCALE * bgWidth);
      if (startXPoint < 0) {
        startXDraw = this.COORDWIDTH;
        drawWidth = parseInt('' + (this.ORIGINWIDTH + this.SPACE) * this.XSCALE * (record.end - this.start)) - this.ORIGINWIDTH / 2 * this.XSCALE
      }

      if (record.end > this.start) {
        this.ctx.fillRect(startXDraw, 0, drawWidth, this.canvasHeight)
      }

    })

  }

  public startCountDown() {
    this.stId = setInterval(() => {
      if (this.remindTime > 0) {
        this.remindTime--;

        let convertMMss = [
          parseInt('' + this.remindTime / 60) < 10 ? '0' + parseInt('' + this.remindTime / 60) : parseInt('' + this.remindTime / 60),
          this.remindTime % 60 < 10 ? '0' + this.remindTime % 60 : this.remindTime % 60
        ].join(':');

        return this.remindTimeShow = convertMMss;
      }
      this.isGameOver = true;
      if (!this.isScoreUploaded) {
        this.userService.uploadSingleScore(this.earn, this.symbolEarn).then((data) => {
          //clearInterval(this.stId);
          this.isScoreUploaded = true;
        }).catch((e) => {
          console.log(e);
          console.log('upload error!')
        });
      }
      clearInterval(this.stId);
    }, 1000)
  }

  public draw(): void {

    this.isFullScreenToMove = (this.end - this.start) > (this.MAXSCREENLENGTH);
    this.end = this.DATAOFFSET + this.cursor + this.DATASTARTLENGTH;

    if (this.isFullScreenToMove) {
      this.start = this.end - (this.MAXSCREENLENGTH) - 1;
      this.screenMoveStep++; //屏幕移动的次数
    }
    // if (this.end > this.originData.length) {
    //   console.log(this.end);
    //   this.isGameOver = true;
    //   return alert('已到最后一根！');
    // }

    //for component view
    this.currentPriceInfo = {
      open: Number(this.originData[this.end - 1][1]),
      close: Number(this.originData[this.end - 1][2]),
      high: Number(this.originData[this.end - 1][3]),
      low: Number(this.originData[this.end - 1][4]),
      value: this.originData[this.end - 1][5]
    }
    this.checkGameEnd();

    if (this.tradeInfo.isTrading) {


      this.earn = Number((this.setDownEarn * (this.originData[this.end - 1][2] / this.tradeInfo.current.price) - 1) * 100).toFixed(2) + '%';
      this.holdEarn = Number((this.originData[this.end - 1][2] / this.tradeInfo.current.price - 1) * 100).toFixed(2) + '%';



    }

    this.remindLine = this.originData.length - this.end;


    let stockDataArray = this.originData.slice(this.start, this.end);
    this.resetCanvas();
    this.preMarker(stockDataArray);
    this.drawCoord();
    this.drawTradeBackground();

    stockDataArray.forEach((item, index) => {
      this.drawChart(item, index)
    });

    Object.keys(this.colorHash).forEach((k) => {
      this.drawMA(this.start, this.end, k)
    });



    this.cleanChartBottomValue();
  }

  public passEvt(): void {
    this.currentMaxIndex++;
    this.moveCursor(1);
    this.draw();
  }

  public buyEvt() {

    this.currentMaxIndex++;
    if (this.end > this.originData.length) return alert('已到最后一根！');

    if (this.tradeInfo.isTrading) return;
    this.tradeInfo.isTrading = true;
    this.tradeInfo.current.price = this.originData[this.end - 1][2];
    this.tradeInfo.current.start = this.end;
    this.cursor++;
    this.draw();
  }
  public sellEvt() {
    let row = {
      buy: this.tradeInfo.current.price,
      start: this.tradeInfo.current.start,
      sell: this.originData[this.end - 1][2],
      end: this.end
    };
    this.setDownEarn = this.setDownEarn * (row.sell / row.buy);
    this.holdEarn = '0%';
    this.tradeInfo.done.push(row);
    this.tradeInfo.current = {};
    this.tradeInfo.isTrading = false;
    //this.draw();
    this.cursor++;
    this.currentMaxIndex++;
    this.draw();
  }

  public playAgain() {
    this.initParams();

    this.chartService.getChartData().then((data: any) => {
      this.originData = data.kline;
      this.remindTime = data.duration;
      this.fetchDataDone = true;
      this.remindLine = this.originData.length - this.end;
      this.symbolName = data.stock_name;
      this.symbolEarn = `${((data.kline[data.kline.length - 1][2] / data.kline[this.DATAOFFSET + this.DATASTARTLENGTH - 1][2] - 1) * 100).toFixed(2)}%`;
      this.symbolTime = `${data.kline[this.DATAOFFSET - 1][0]}至${data.kline[data.kline.length - 1][0]}`;

      this.draw();
      this.startCountDown();

    })

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


}
