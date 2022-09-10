import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-canvas-tools',
  templateUrl: './canvas-tools.component.html',
  styleUrls: ['./canvas-tools.component.sass']
})
export class CanvasToolsComponent implements OnInit {

  public brush = {size: 8, min: 1, max: 32};
  isDrawing = false;
  currentTool: any;
  changeBrushColour(a : any) {};
  changeTool(a : any) {};
  onCanvasReset() {};
  onCanvasPress() {};
  onCanvasResetPress() {};
  updateBrush() {};
  broadcastBrushSize() {};

  constructor() { }

  ngOnInit(): void {
  }

}
