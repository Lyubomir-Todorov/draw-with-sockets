import { Component } from '@angular/core';
import { ChatService } from '../chat-service/chat.service';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
})
export class MenuComponent {
  title = 'Draw with Sockets!';
  inputRoom = '';
  inputUsername = '';

  loading = false;
  action = '';

  client = {
    id: '',
    connected: false,
    drawing: false,
  };

  newMessage = '';

  constructor(
    private chatService: ChatService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private snackbar: MatSnackBar
  ) {}

  public connect() {
    this.action = 'create';
    this.loading = true;
    this.chatService.connect();
    this.chatService.join('', this.inputUsername);
  }

  public joinLobbyWithHotkey() {
      this.joinLobby();
  }

  public joinLobby() {
    this.loading = true;
    this.chatService.connect();
    this.action = 'join';
    this.chatService.join(this.inputRoom, this.inputUsername);
  }

  async ngOnInit() {
    
    this.route.queryParams.subscribe((params) => {
      if (params['room']) {
        this.inputRoom = params['room'];
        this.joinLobby();
        this.location.replaceState(this.router.url.split('?')[0]);
      }
    });
    
    this.chatService.getData('connect', false).subscribe(() => {});

    this.chatService.getData('validRoom', true).subscribe((message: any) => {
      this.client.connected = true;
      this.loading = false;
      this.action = '';
      this.router.navigate(['room', message]);
    });

    this.chatService.getData('userID').subscribe((message: any) => {
      this.client.id = message;
      this.chatService.setId(message);
    });

    this.chatService.getData('invalidRoom', false).subscribe(() => {
      this.loading = false;
      this.action = '';
    });

    this.chatService.getData('error').subscribe((message: any) => {
      this.snackbar.open(message,'Dismiss', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    });
  }
}
