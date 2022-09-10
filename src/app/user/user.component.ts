import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
})
export class UserComponent {

  @Input() points = 0;
  @Input() username = "";
  @Input() isHost = false;
  @Input() isSelf = false;
  @Input() isCorrectGuess = false;
  @Input() isDrawing = false;
  @Input() isKickable = true;
  @Output() onKick = new EventEmitter();;

  constructor() { }
  public formatUsernameAndPoints(): string {
    return this.username + ' - ' + this.points;
  }

  public userIsKicked(): void {
    this.onKick.emit();
  }

  public iconToDisplay(): string {
    if (this.isDrawing) {
      return 'edit';
    } 
    return this.isHost ? 'account_circle' : 'person';
  }

}
