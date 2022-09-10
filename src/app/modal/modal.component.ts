import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.sass']
})
export class ModalComponent implements OnInit {

  @Input() word: string;
  @Input() title: string;
  @Input() subtitle: string;
  @Input() countdown: string | number;
  @Input() isDrawing: boolean;
  @Input() isRoundSummary: boolean;
  @Input() summary: [];

  constructor() {
    this.word = '';
    this.title = '';
    this.subtitle = '';
    this.countdown = 0;
    this.isDrawing = false;
    this.isRoundSummary = false;
    this.summary = [];
   }

  ngOnInit(): void {
  }

}
