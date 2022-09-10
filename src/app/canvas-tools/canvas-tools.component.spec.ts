import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CanvasToolsComponent } from './canvas-tools.component';

describe('CanvasToolsComponent', () => {
  let component: CanvasToolsComponent;
  let fixture: ComponentFixture<CanvasToolsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CanvasToolsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CanvasToolsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
