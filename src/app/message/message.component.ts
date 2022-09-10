import {
  AfterViewChecked,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.sass'],
})
export class MessageComponent implements OnInit, AfterViewChecked {
  @Input() messages: string[];
  @ViewChild('container') private scroll: ElementRef | any;

  constructor() {
    this.messages = [];
  }

  ngOnInit(): void {
  }

  ngAfterViewChecked(): void {

  }

  scrollToBottom(): void {
    try {
      this.scroll.nativeElement.scrollTop =
        this.scroll.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
