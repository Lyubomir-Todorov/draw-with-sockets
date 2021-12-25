import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppComponent } from './app.component';

import { ChatService } from "./chat-service/chat.service";

import { MessageComponent } from './message/message.component';
import { CanvasComponent } from './canvas/canvas.component';
import { PaletteComponent } from './palette/palette.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { SocketIoModule, SocketIoConfig } from "ngx-socket-io";

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ToastrModule } from "ngx-toastr";

const config: SocketIoConfig = { url: "https://draw-with-sockets.herokuapp.com/", options: {transports: ['websocket'], autoConnect: false, reconnection: false} };

@NgModule({
  declarations: [
    AppComponent,
    MessageComponent,
    CanvasComponent,
    PaletteComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    FontAwesomeModule,
    SocketIoModule.forRoot(config),
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
  ],
  providers: [ ChatService ],
  bootstrap: [ AppComponent ]
})


export class AppModule { }
