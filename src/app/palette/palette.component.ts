import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-palette',
  templateUrl: './palette.component.html',
  styleUrls: ['./palette.component.css']
})
export class PaletteComponent implements OnInit {

  @Input('color') color = "#000000";

  constructor() { }

  ngOnInit(): void {
  }

}
