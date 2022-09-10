import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { map } from 'rxjs/operators';

@Injectable()
export class ChatService {
  id = '';

  constructor(private socket: Socket) {
    this.socket.on('forceDisconnect', () => {
      socket.disconnect();
    });
  }

  getId(): string {
    return this.id;
  }

  setId(id: string): void {
    this.id = id;
  }

  // Lobby related services

  connect() {
    this.socket.connect();
  }

  disconnect() {
    //this.socket.emit('leave');
    this.socket.disconnect();
  }

  join(room: string, username: string) {
    this.socket.emit('join', room, username);
  }

  getData(event: string, hasPayload = true, accessor = 'message') {
    if (hasPayload) {
      if (accessor == '') {
        return this.socket.fromEvent(event).pipe(map((data) => data));
      }
      return this.socket.fromEvent(event).pipe(map((data : any) => data[accessor]));
    }
    return this.socket.fromEvent(event).pipe(map((data) => data));
  }

  sendData(event: string, payload: any = undefined) {
    if (payload != undefined) {
      this.socket.emit(event, payload);
    } else {
      this.socket.emit(event);
    }
  }

  getMessage() {
    return this.socket
      .fromEvent('message')
      .pipe(map((data: any) => [data.message.sender, data.message.content]));
  }
}