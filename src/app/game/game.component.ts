import { Component } from '@angular/core';
import { ChatService } from '../chat-service/chat.service';
import { Location } from '@angular/common';

import { Router, ActivatedRoute } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css'],
})
export class GameComponent {
  title = 'Draw with Sockets!';

  // Landing page variables
  inputRoom = '';
  inputUsername = '';

  loading = false;
  action = '';

  lobby = {
    roomCodeIsVisible: false,
    host: '',
    matchStarted: false,
    matchCountdown: false,
    matchStartingCountdown: 0,
    matchTimeMax: 0,
    matchTime: 0,
    roundIndex: 1,
    roundOver: false,
    roundSummary: [],
    roundOverReason: '',
    timer: null,
    word: '',
    currentDrawer: {
      id: '',
      username: '',
    },
    score: [],
    correctGuesses: [],
    userList: [],
    messageList: [],
  };
  client = {
    id: '',
    connected: false,
    drawing: false,
  };

  newMessage = '';
  subscriptions: any[];

  constructor(
    private chatService: ChatService,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {
    this.subscriptions = [];
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public revealRoomCode() {
    this.lobby.roomCodeIsVisible = !this.lobby.roomCodeIsVisible;
  }

  public userHasCorrectlyGuessed(index: any): boolean {
    return (
      this.lobby.correctGuesses && this.lobby.correctGuesses[index['userID']]
    );
  }

  public userIsHost(index: any): boolean {
    return this.lobby.host === index['userID'];
  }

  public clientIsHost(): boolean {
    return this.lobby.host === this.client.id;
  }

  public clientIsDrawing(): boolean {
    return this.client.drawing;
  }

  public matchStarted(): boolean {
    return this.lobby.matchStarted;
  }

  public userIsDrawing(index: any): boolean {
    return this.lobby.currentDrawer.id === index['userID'];
  }

  public userIsMe(index: any): boolean {
    return this.client.id === index['userID'];
  }

  public userCanKick(index: any): boolean {
    return this.client.id === this.lobby.host && !this.userIsMe(index);
  }

  public showUserScore(index: any): number {
    return !this.lobby.score[index['userID']]
      ? 0
      : this.lobby.score[index['userID']];
  }

  public prettyRoomCode(): string {
    return this.inputRoom.split('').join(' ');
  }

  public canStartMatch(): boolean {
    return this.lobby.userList && this.lobby.userList.length > 1;
  }

  public connect() {
    this.action = 'create';
    this.loading = true;
    this.chatService.connect();
    this.chatService.join('', this.inputUsername);
    this.lobby.messageList = [];
  }

  public joinLobby() {
    this.loading = true;
    this.chatService.connect();
    this.action = 'join';
    this.chatService.join(this.inputRoom, this.inputUsername);

    this.lobby.messageList = [];
    this.lobby.roundOver = false;
    this.lobby.matchStarted = false;
  }

  public disconnect() {
    this.chatService.disconnect();
    this.client.connected = false;
    this.action = '';
    this.router.navigate(['']);
  }

  async ngOnInit() {
  
    this.client.id = this.chatService.getId();
    /*
    this.subscriptions.push(
      this.chatService.getData('connect', false).subscribe(() => {})
    );
  */
    this.subscriptions.push(
      this.chatService.getData('validRoom', false).subscribe(() => {
        this.client.connected = true;
        this.loading = false;
        this.action = '';
      })
    );

    this.subscriptions.push(
      this.chatService.getData('invalidRoom', false).subscribe(() => {
        this.loading = false;
        this.action = '';
      })
    );

    this.subscriptions.push(
      this.chatService.getData('disconnect', true, '').subscribe((reason) => {
        this.client.connected = false;
        this.lobby.roomCodeIsVisible = false;
        this.client.drawing = false;
        this.lobby.matchStarted = false;
        this.inputRoom = '';
        this.client.id = '';
        this.lobby.host = '';
        this.loading = false;
        this.action = '';
        clearInterval(this.lobby.timer as any);
        this.router.navigate(['']);

        if (reason != 'io client disconnect') {
          //this.toast.error("Lost connection to the server", "Error");
        }
      })
    );

    this.subscriptions.push(
      this.chatService.getData('userJoined', false).subscribe(() => {
        const audio = new Audio('./assets/connect.wav');
        audio.load();
        audio.play();
      })
    );

    this.subscriptions.push(
      this.chatService.getData('userLeft', false).subscribe(() => {
        const audio = new Audio('./assets/disconnect.wav');
        audio.load();
        audio.play();
      })
    );

    this.subscriptions.push(
      this.chatService.getMessage().subscribe((message: any) => {
        (this.lobby.messageList as string[]).push(message);
      })
    );

    this.subscriptions.push(
      this.chatService.getData('userID').subscribe((message: any) => {
        this.client.id = message;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('roomID').subscribe((message: any) => {
        this.inputRoom = message;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('users').subscribe((message: any) => {
        this.lobby.userList = message;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('gameData').subscribe((message: any) => {
        this.lobby.host = message.host;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('matchStart', false).subscribe(() => {
        this.lobby.matchStarted = true;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('matchStartCountdown', false).subscribe(() => {
        this.lobby.matchCountdown = true;
        this.lobby.matchStartingCountdown = 5;

        this.lobby.roundOver = false;
        this.lobby.word = '';
        this.lobby.correctGuesses = [];
        this.lobby.roundSummary = [];

        const timer = setInterval(() => {
          this.lobby.matchStartingCountdown--;
          if (this.lobby.matchStartingCountdown <= 0) {
            this.lobby.matchCountdown = false;
            clearInterval(timer);
            const audio = new Audio('./assets/round_start.wav');
            audio.load();
            audio.play();
          }
        }, 1000);
      })
    );

    this.subscriptions.push(
      this.chatService.getData('matchTime').subscribe((message: any) => {
        this.lobby.matchTimeMax = message * 100;
        this.lobby.matchTime = message * 100;

        this.countdown();
      })
    );

    this.subscriptions.push(
      this.chatService.getData('isDrawing', false).subscribe(() => {
        this.client.drawing = true;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('wordToDraw').subscribe((message: any) => {
        this.lobby.word = message;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('wordToGuess').subscribe((message: any) => {
        this.lobby.word = message;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('correctGuess').subscribe((message: any) => {
        (this.lobby.correctGuesses[message] as any) = true;
        const audio = new Audio('./assets/correct_guess.wav');
        audio.load();
        audio.play();
      })
    );

    this.subscriptions.push(
      this.chatService.getData('whoIsDrawing').subscribe((message: any) => {
        this.lobby.currentDrawer.id = message.id;
        this.lobby.currentDrawer.username = message.username;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('userScore').subscribe((message: any) => {
        (this.lobby.score[message.userID] as any) = message.score;
      })
    );

    this.subscriptions.push(
      this.chatService.getData('roundOver').subscribe((message: any) => {
        this.lobby.roundOver = true;
        this.client.drawing = false;

        let snd = './assets/round_end_timeout.wav';

        clearInterval(this.lobby.timer as any);
        switch (message.reason) {
          case 'timeout':
            this.lobby.roundOverReason = `Time ran out! the correct word was ${message.word}`;
            break;

          case 'allCorrect':
            this.lobby.roundOverReason = `Everybody correctly guessed ${message.word}`;
            snd = './assets/round_end_all_correct.wav';
            break;

          case 'drawerLeft':
            this.lobby.roundOverReason = `The drawer has left! They were drawing ${message.word}`;
            break;
        }

        const audio = new Audio(snd);
        audio.load();
        audio.play();
      })
    );

    this.subscriptions.push(
      this.chatService.getData('error').subscribe((message: any) => {
        //this.toast.error(message, 'Error');
      })
    );

    this.subscriptions.push(
      this.chatService
        .getData('endOfRoundSummary')
        .subscribe((message: any) => {
          (this.lobby.roundSummary as string[]).push(message);
        })
    );
  }

  sendMessage() {
    if (!this.client.drawing) {
      this.chatService.sendData('message', this.newMessage.slice(0, 100));
      this.newMessage = '';
    }
  }

  startMatch() {
    this.chatService.sendData('matchStart');
  }

  kickUser(clientId: string) {
    this.chatService.sendData('kick', clientId);
  }

  countdown() {
    (this.lobby.timer as any) = setInterval(() => {
      if (this.lobby.matchTime == 500) {
        const audio = new Audio('./assets/countdown.wav');
        audio.load();
        audio.play();
      }
      if (this.lobby.matchTime == 0) {
        clearInterval(this.lobby.timer as any);
        return;
      }
      this.lobby.matchTime--;
    }, 10);
  }
}
