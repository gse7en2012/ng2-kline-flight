import { Component, OnInit } from '@angular/core';
import { trigger, state, animate, style, transition } from '@angular/core';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.css'],
  animations: [trigger('routerTransition', [
   state('void', style({ position: 'static', width: '100%', height: '100%', left: 0, top: 0, background: '#000' })),
    state('*', style({ position: 'static', width: '100%', height: '100%', left: 0, top: 0, background: '#000' })),
    transition(':enter', [  // before 2.1: transition('void => *', [
      style({ transform: 'translateX(100%)' }),
      animate('0.25s linear', style({ transform: 'translateX(0%)' }))
    ]),
    transition(':leave', [  // before 2.1: transition('* => void', [
      style({ transform: 'translateX(0%)' }),
      animate('0.25s linear', style({ transform: 'translateX(-100%)' }))
    ])
  ])]
})
export class TestComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
