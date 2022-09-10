import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

// Components
import { AppComponent } from './app.component';
import { GameComponent } from './game/game.component';
import { MenuComponent } from './menu/menu.component';
import { ChatService } from './chat-service/chat.service';
import { ModalComponent } from './modal/modal.component';

import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';
import { Routes, RouterModule } from '@angular/router';


// Material
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { CanvasComponent } from './canvas/canvas.component';
import { CanvasToolsComponent } from './canvas-tools/canvas-tools.component';
import { MessageComponent } from './message/message.component';
import { PaletteComponent } from './palette/palette.component';
import { UserComponent } from './user/user.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSliderModule } from '@angular/material/slider';

const config: SocketIoConfig = {
  url: environment.serverAddress,
  options: {
    transports: ['websocket'],
    autoConnect: false,
    reconnection: false,
  },
};
const routes: Routes = [
  { path: '', component: MenuComponent },
  { path: 'room/:id', component: GameComponent },
  { path: '**', component: MenuComponent },
];

@NgModule({
  declarations: [
    AppComponent,
    GameComponent,
    MenuComponent,
    CanvasComponent,
    CanvasToolsComponent,
    MessageComponent,
    PaletteComponent,
    UserComponent,
    ModalComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FlexLayoutModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    MatSliderModule,
    
    SocketIoModule.forRoot(config),
    RouterModule.forRoot(routes),
    FormsModule
  ],
  exports: [RouterModule],
  providers: [ChatService],
  bootstrap: [AppComponent]
})
export class AppModule { }
