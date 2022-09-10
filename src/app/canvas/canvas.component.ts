import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { ChatService } from '../chat-service/chat.service';

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.sass'],
})
export class CanvasComponent implements AfterViewInit {
  @ViewChild('canvas') canvas: ElementRef<HTMLCanvasElement> | null | undefined;
  @ViewChild('brushEl') brushElement:
    | ElementRef<HTMLSpanElement>
    | null
    | undefined;
  @HostListener('window:resize', ['$event'])
  resize() {
    //this.canvas!.nativeElement.width = Math.min(window.outerWidth, 800);
    //this.canvas!.nativeElement.height = this.canvas!.nativeElement.width * this.heightRatio;
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (this.isDrawing) {
      switch (event.code) {
        case 'KeyB':
          this.currentTool = 'brush';
          break;

        case 'KeyE':
          this.currentTool = 'eraser';
          break;
      }

      this.chatService.sendData('canvasTool', this.currentTool);
    }
  }
  heightRatio = 0.75;
  context: CanvasRenderingContext2D | null | undefined;
  start = { x: 0, y: 0 };
  draw = { x: 0, y: 0 };
  mousePress = false;
  brush = { size: 8, min: 1, max: 32 };
  currentTool = 'brush';
  isDrawing = false;
  palette = [
    '#ffffff',
    '#aeaeae',
    '#000000',
    '#ff0000',
    '#85490a',
    '#ff9300',
    '#ffe600',
    '#13d225',
    '#096613',
    '#299af6',
    '#0f00ff',
    '#fd345b',
    '#8b0be7',
  ];

  subscriptions: any[];

  constructor(private chatService: ChatService) {
    this.subscriptions = [];
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  async ngAfterViewInit() {
    this.context = this.canvas!.nativeElement.getContext('2d');
    //this.canvas!.nativeElement.width = Math.min(window.outerWidth, 800);
    this.canvas!.nativeElement.width = 800;
    this.canvas!.nativeElement.height =
      this.canvas!.nativeElement.width * this.heightRatio;

    this.context!.lineWidth = 4;
    this.context!.strokeStyle = this.palette[2];

    this.subscriptions.push(
      this.chatService.getData('draw').subscribe((message: any) => {
        if (!this.isDrawing) {
          if (message.type == 'mousedown' || message.type == 'touchstart') {
            this.startDrawing(message.x, message.y);
          } else if (
            message.type == 'mousemove' ||
            message.type == 'touchmove'
          ) {
            this.drawingCanvas(message.x, message.y);
          }
        }
      })
    );

    this.subscriptions.push(
      this.chatService.getData('canvasBrushSize').subscribe((message: any) => {
        this.brush.size = message;
        this.brush.size = Math.min(
          Math.max(this.brush.size, this.brush.min),
          this.brush.max
        );
      })
    );

    this.subscriptions.push(
      this.chatService.getData('canvasColor').subscribe((message: any) => {
        this.context!.strokeStyle = message;
        this.currentTool = 'brush';
      })
    );

    this.subscriptions.push(
      this.chatService.getData('canvasTool').subscribe((message: any) => {
        this.currentTool = message;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('canvasClear', false).subscribe(() => {
        this.clearCanvas();
      })
    );

    this.subscriptions.push(
      this.chatService.getData('isDrawing', false).subscribe(() => {
        this.isDrawing = true;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('requestCanvas', false).subscribe(() => {
        this.chatService.sendData(
          'replyCanvas',
          this.canvas!.nativeElement.toDataURL()
        );
      })
    );

    this.subscriptions.push(
      this.chatService.getData('catchupCanvas').subscribe((message: any) => {
        const img = new Image();
        img.src = message;
        img.addEventListener('load', () => {
          this.context?.drawImage(img, 0, 0);
        });
      })
    );

    this.chatService.getData('catchupData').subscribe((message: any) => {});

    this.subscriptions.push(
      this.chatService.getData('matchStartCountdown', false).subscribe(() => {
        this.isDrawing = false;

        this.brush.size = 8;
        this.brush.size = Math.min(
          Math.max(this.brush.size, this.brush.min),
          this.brush.max
        );

        this.context!.strokeStyle = this.palette[2];
      })
    );

    this.subscriptions.push(
      this.chatService.getData('matchStart', false).subscribe(() => {
        this.clearCanvas();
      })
    );
  }

  mouseClick(event: any) {
    if (!this.isDrawing) return;
    let rect = this.context!.canvas.getBoundingClientRect();
    this.mousePress = true;

    if (event.type == 'mousedown') {
      this.start.x =
        ((event.clientX - rect.left) / (rect.right - rect.left)) *
        this.canvas!.nativeElement.width;
      this.start.y =
        ((event.clientY - rect.top) / (rect.bottom - rect.top)) *
        this.canvas!.nativeElement.height;
    } else {
      event.preventDefault();
      event.stopPropagation();
      if (event.touches[0] != undefined) {
        this.start.x =
          ((event.touches[0].clientX - rect.left) / (rect.right - rect.left)) *
          this.canvas!.nativeElement.width;
        this.start.y =
          ((event.touches[0].clientY - rect.top) / (rect.bottom - rect.top)) *
          this.canvas!.nativeElement.height;
      }
    }

    this.chatService.sendData('draw', {
      x: this.start.x,
      y: this.start.y,
      type: event.type,
    });
    this.startDrawing(this.start.x, this.start.y);
  }

  mouseRelease() {
    if (!this.isDrawing) return;
    this.mousePress = false;
  }

  mouseMove(event: any) {
    if (!this.isDrawing) return;

    let rect = this.context!.canvas.getBoundingClientRect();
    if (this.mousePress) {
      if (event.type == 'mousemove') {
        this.draw.x =
          ((event.clientX - rect.left) / (rect.right - rect.left)) *
          this.canvas!.nativeElement.width;
        this.draw.y =
          ((event.clientY - rect.top) / (rect.bottom - rect.top)) *
          this.canvas!.nativeElement.height;
      } else {
        event.preventDefault();
        event.stopPropagation();
        if (event.touches[0] != undefined) {
          this.draw.x =
            ((event.touches[0].clientX - rect.left) /
              (rect.right - rect.left)) *
            this.canvas!.nativeElement.width;
          this.draw.y =
            ((event.touches[0].clientY - rect.top) / (rect.bottom - rect.top)) *
            this.canvas!.nativeElement.height;
        }
      }
      this.chatService.sendData('draw', {
        x: this.draw.x,
        y: this.draw.y,
        type: event.type,
      });
      this.drawingCanvas(this.draw.x, this.draw.y);
    }
  }

  onCanvasResetPress() {
    this.clearCanvas();
    this.chatService.sendData('canvasClear');
  }

  clearCanvas() {
    this.context!.clearRect(
      0,
      0,
      this.canvas!.nativeElement.width,
      this.canvas!.nativeElement.height
    );
  }

  changeBrushSize(event: any) {
    if (!this.isDrawing) return;
    event.preventDefault();
    if (event.deltaY == -100) {
      this.brush.size += 1;
    } else if (event.deltaY == 100) {
      this.brush.size -= 1;
    }

    this.brush.size = Math.min(
      Math.max(this.brush.size, this.brush.min),
      this.brush.max
    );
    this.broadcastBrushSize();
    this.updateBrush();
  }

  broadcastBrushSize() {
    this.chatService.sendData('canvasBrushSize', this.brush.size);
  }

  updateBrush() {
    /*
    this.brushElement!.nativeElement.style.getPropertyValue('--brushSize');
    getComputedStyle(this.brushElement!.nativeElement).getPropertyValue(
      '--brushSize'
    );
    this.brushElement!.nativeElement.style.setProperty(
      '--brushSize',
      this.brush.size + 'px'
    );
    */
  }

  changeBrushColour(color: string) {
    this.context!.strokeStyle = color;
    this.currentTool = 'brush';
    this.chatService.sendData('canvasColor', color);
  }

  getBrushColor(): string {
    return this.context?.strokeStyle?.toString() ?? this.palette[2];
  }

  changeTool(tool: string) {
    this.currentTool = tool;
    this.chatService.sendData('canvasTool', tool);
  }

  startDrawing(x: number, y: number) {
    if (this.currentTool == 'brush') {
      this.context!.globalCompositeOperation = 'source-over';
    } else if (this.currentTool == 'eraser') {
      this.context!.globalCompositeOperation = 'destination-out';
    }

    //Initialize brush properties
    this.context!.lineWidth = this.brush.size;
    //this.context!.strokeStyle = '#000000';
    this.context!.lineCap = 'round';
    this.context!.lineJoin = 'round';
    this.context!.beginPath();

    this.context!.moveTo(x, y);
  }

  drawingCanvas(x: number, y: number) {
    if (this.currentTool == 'brush') {
      this.context!.globalCompositeOperation = 'source-over';
    } else if (this.currentTool == 'eraser') {
      this.context!.globalCompositeOperation = 'destination-out';
    }

    this.context!.lineTo(x, y);
    this.context!.stroke();
  }
}
