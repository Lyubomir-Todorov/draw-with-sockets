const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const server = http.createServer(app);
const fs = require('fs')
const { customAlphabet } = require('nanoid');
const { generateSlug } = require('random-word-slugs');
const io = require('socket.io')(http, {
  cors: {
    origin: "*",
  }
}).listen(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/src/index.html');
});

let roomData = {};
let words = [];

fs.readFile('words.txt', 'utf8' , (err, data) => {
  if (err) {
    console.error(err)
    return
  }
  //console.log(data)
  words = data.split(',')
})


const getUsersInRoom = async function(room) {
  let users = [];
  const sockets = await io.in(room).fetchSockets();
  sockets.forEach(socket => {
    users.push({
      //userID: socket.id,
      userID: socket.clientID,
      username: socket.username,
    });
  });
  return users;
}

function wordAsBlanks(word) {
  let result = "";
  let wordAsArray = word.split('')
  wordAsArray.forEach(letter => {
    if (letter === ' ') {
      result += '   ';
    } else {
      result += '_ '
    }
  });
  return result;
}

function endOfRound(socket) {

  const results = [];
  io.in(socket.room).fetchSockets().then(users => {

    let totalDrawerScore = 0;
    const newRoster = [];


    users.forEach((s) => {
      newRoster.push(s);
      if (roomData[socket.room].currentDrawer.id !== s.id) {
        totalDrawerScore += roomData[socket.room].scoreThisRound[s.id] ?? 0;
        results.push({id : s.clientID, username: s.username, score: roomData[socket.room].score[s.clientID] ?? 0});
      }
    });

    // Update drawer's score based on the total guesser score / 4
    roomData[socket.room].score[roomData[socket.room].currentDrawer.clientID] += Math.floor(totalDrawerScore/4);

    io.in(socket.room).emit('userScore', {
      message: {
        userID: roomData[socket.room].currentDrawer.clientID,
        score: roomData[socket.room].score[roomData[socket.room].currentDrawer.clientID]
      }
    });

    // Add our drawer to the end of round summary
    results.push({
      id : roomData[socket.room].currentDrawer.clientID,
      username: roomData[socket.room].currentDrawer.username,
      score: roomData[socket.room].score[roomData[socket.room].currentDrawer.clientID] ?? 0
    });

    io.in(socket.room).emit('endOfRoundSummary', {message: results});

    resetRoundData(socket);
    roomData[socket.room].intermissionTimer = setTimeout(() => {
      clearTimeout(roomData[socket.room].intermissionTimer);

      io.in(socket.room).emit('matchStartCountdown');

      roomData[socket.room].rosterIndex ++;

      if (roomData[socket.room].rosterIndex >= roomData[socket.room].roster.length) {
        roomData[socket.room].roster = newRoster;
        roomData[socket.room].rosterIndex = 0;
      }
      startOfRound(socket);

    }, 5000);

  });
}

function startOfRound(socket) {
  // Make the first user in the roster the drawer
  roomData[socket.room].currentDrawer = roomData[socket.room].roster[roomData[socket.room].rosterIndex];

  // Select a random word from our text file and clean it up
  let guessword = words[Math.floor(Math.random() * words.length)];
  guessword = guessword.replace('\n','');
  guessword = guessword.replace('\r','');
  console.log("The chosen word is...", guessword, "!");

  roomData[socket.room].currentWord = (guessword).toLowerCase();

  // Send different data for guessers and drawer:
  // Send the word to the drawer
  // Send who is drawing to the guessers, then the obfuscated word later...

  io.to(roomData[socket.room].currentDrawer.id).emit('wordToDraw', { message: guessword });
  io.in(socket.room).emit('whoIsDrawing', {message: {id: roomData[socket.room].currentDrawer.clientID, username: roomData[socket.room].currentDrawer.username} });

  // Emit only to current drawer that they are allowed to draw, and emit non-obfuscated word
  io.to(roomData[socket.room].currentDrawer.id).emit('isDrawing');

  roomData[socket.room].roundStartTimer = setTimeout(() => {

    clearTimeout(roomData[socket.room].roundStartTimer);

    io.in(socket.room).emit('matchStart');
    roomData[socket.room].roundInProgress = true;

    // Send the word as blanks to everyone but the drawer
    io.to(socket.room).except(roomData[socket.room].currentDrawer.id).emit('wordToGuess', { message: wordAsBlanks(guessword) });
    // Everyone gets match time sent
    io.in(socket.room).emit('matchTime', { message: roomData[socket.room].roundTimeMax });

    //console.log("Roster is:",roomData[socket.room].roster);
    console.log(roomData[socket.room].currentDrawer.id, "is currently drawing!")

    roomData[socket.room].timer = setInterval(() => {
      roomData[socket.room].roundTimeCurrent --;
      if (roomData[socket.room].roundTimeCurrent < 0) {
        roomData[socket.room].roundInProgress = false;
        io.in(socket.room).emit('roundOver', { message: {reason: "timeout", word: roomData[socket.room].currentWord} });
        endOfRound(socket);
        clearInterval(roomData[socket.room].timer);
      }
    }, 1000)

  }, 5000);
}


function resetRoundData(socket) {
  roomData[socket.room].roundInProgress = false;
  roomData[socket.room].guessedCorrectly = [];
  roomData[socket.room].scoreThisRound = [];
  roomData[socket.room].currentWord = "";
  roomData[socket.room].roundTimeCurrent = roomData[socket.room].roundTimeMax;
}

io.on('connection', (socket) => {

  console.log("\n############## START OF NEW SOCKET CONNECTION ##############\n");
  console.log(socket.id,'has connected');

  // Dont reveal actual socket id when sending user info to clients
  // Rather, send another uniquely generated one as an identifier
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const nanoid = customAlphabet(alphabet, 36);
  socket.clientID = nanoid();

  socket.emit("userID", {message: socket.clientID});

  socket.on('join', async (room, username) => {

    const temp = username.trim();
    if (!temp || temp === '') {
      socket.username = generateSlug(2, { format: "kebab" });
    } else {
      socket.username = username;
    }
    console.log(socket.username,'has joined')
    if (room !== '') {

      if (room in roomData) {
        console.log("Room specified! Joining:", room)
        socket.join(room);
        socket.room = room;

        if (roomData[room].roundInProgress) {
          io.to(roomData[room].currentDrawer.id).emit("requestCanvas");

          socket.emit('matchStart');
          socket.emit('matchTime', { message: roomData[socket.room].roundTimeCurrent });

          roomData[room].newUsers.push(socket);
          roomData[socket.room].score[socket.clientID] = 0;
          roomData[socket.room].scoreThisRound[socket.id] = 0;
        }
      } else {
        socket.emit("error", {message: "The following room does not exist!"});
        socket.disconnect();
        return;
      }
    } else {
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const nanoid = customAlphabet(alphabet, 4);
      room = nanoid();
      console.log("Room unspecified! Creating new room with the following ID:", room)
      socket.join(room);
      socket.room = room;

      //Specify initial room data
      roomData[socket.room].host = socket;
      roomData[socket.room].gameStarted = false;
      roomData[socket.room].guessedCorrectly = [];
      roomData[socket.room].score = [];
      roomData[socket.room].scoreThisRound = [];
      roomData[socket.room].newUsers = [];
      roomData[socket.room].roundTimeMax = 90;
      roomData[socket.room].roundTimeCurrent = 0;
    }

    socket.emit('roomID', {message: socket.room});
    socket.emit('gameData', {message: {host : roomData[socket.room].host.clientID, gameStarted: roomData[socket.room].gameStarted} })

    // Notify lobby a new user has joined
    io.in(socket.room).emit('message', {message: {sender: "", content: `${socket.username} has joined!`}});
    io.in(socket.room).emit('userJoined');

    // Update our list of users when a new one joins
    getUsersInRoom(socket.room).then((users) => {
      io.in(socket.room).emit("users", { message:users });
    });
  });

  socket.on('disconnect', async () => {
    console.log(socket.username + ' has disconnected');
    // Sends a disconnect message in chat
    io.in(socket.room).emit('message', {message: {sender: "", content: `${socket.username} has left`}});
    io.in(socket.room).emit('userLeft');

    const newRoster = [];
    for(let i = 0; i < roomData[socket.room].roster.length; i ++) {
      if (roomData[socket.room].roster[i] !== socket) {
        newRoster.push(roomData[socket.room].roster[i]);
      }
    }
    roomData[socket.room].roster = newRoster;

    // Kick all players if host leaves
    if (!roomData[socket.room] || roomData[socket.room].host.id === socket.id) {
      io.to(socket.room).emit("error", {message: "The host has left the match!"});
      io.to(socket.room).emit("forceDisconnect");
    }

    socket.leave(socket.room);

    // Update user list
    getUsersInRoom(socket.room).then((users) => {
      io.in(socket.room).emit("users", { message:users });

      if (users.length >= 1) {
        // End the round early if the drawer has left
        if (roomData[socket.room].roundInProgress && roomData[socket.room].currentDrawer.id === socket.id) {
          roomData[socket.room].roundInProgress = false;
          io.in(socket.room).emit('roundOver', { message: {reason: "drawerLeft", word: roomData[socket.room].currentWord} });
          endOfRound(socket);
          clearInterval(roomData[socket.room].timer);
        }
      }

    });

  });

  socket.on('message', (message) => {
    let validateMsg = message;
    if (validateMsg === undefined || validateMsg.trim() === '') return;
    validateMsg = validateMsg.slice(0,100);

    // Make sure the guessers can only call this command
    // And the round is in progress
    // And the guesser hasn't already gotten it right

    if (!roomData[socket.room].roundInProgress) {
      io.to(socket.room).emit('message', {message: {sender: socket.username, content: validateMsg}});
    } else {
      if (roomData[socket.room].currentDrawer.id !== socket.id &&
        !(socket.id in roomData[socket.room].guessedCorrectly)) {

        // Ignore case of letters and look for content only
        const sanitizedGuess = (message.toString()).toLowerCase();
        if (sanitizedGuess === roomData[socket.room].currentWord) {

          // Update room data, who correctly guessed
          roomData[socket.room].guessedCorrectly[socket.clientID] = true;


          const score = Math.ceil((roomData[socket.room].roundTimeCurrent / roomData[socket.room].roundTimeMax) * 1000);

          // Add to the guessers points based on remaining time
          roomData[socket.room].score[socket.clientID] += score;

          // Points this round only
          roomData[socket.room].scoreThisRound[socket.id] = score;

          console.log(socket.username, 'has guessed correctly!');
          console.log("Users who have guessed correctly:", roomData[socket.room].guessedCorrectly);
          console.log("User's scores:", roomData[socket.room].score);

          // Reveal the word to the guesser now that they got it
          io.to(socket.id).emit('wordToGuess', {message: roomData[socket.room].currentWord});

          // Emit that user has correctly got it
          io.in(socket.room).emit('correctGuess', {message: socket.clientID});

          // Emit an updated user score for all clients
          io.in(socket.room).emit('userScore', {
            message: {
              userID: socket.clientID,
              score: roomData[socket.room].score[socket.clientID]
            }
          });

          // Send a message in the chat-box that user correctly guessed
          io.in(socket.room).emit('message', {
            message: {
              sender: "",
              content: `${socket.username} has correctly guessed!`
            }
          });

          // End the round early if all the guessers got it right
          io.in(socket.room).fetchSockets().then(users => {
            let allGuessersHaveGuessed = true;
            users.forEach((s) => {
              if (s.id !== roomData[socket.room].currentDrawer.id) {
                if (roomData[socket.room].guessedCorrectly[s.clientID] === undefined ||
                  roomData[socket.room].guessedCorrectly[s.clientID] === false) {
                  allGuessersHaveGuessed = false;
                }
              }
            })
            if (allGuessersHaveGuessed) {
              io.in(socket.room).emit('roundOver', {message: {reason: "allCorrect", word: roomData[socket.room].currentWord} });
              clearInterval(roomData[socket.room].timer);
              endOfRound(socket);
            }
          });
        } else {
          io.to(socket.room).emit('message', {message: {sender: socket.username, content: validateMsg}});
        }
      }
    }
  });

  socket.on('draw', (data) => {
    // Make sure the drawer can only call this command
    // And the round is still in progress
    if (roomData[socket.room].roundInProgress &&
      roomData[socket.room].currentDrawer.id === socket.id ) {
      io.to(socket.room).except(socket.id).emit('draw', {message: { x : data.x, y : data.y, type: data.type } });
    }
  })

  socket.on('canvasTool', (data) => {
    // Make sure the drawer can only call this command
    // And the round is still in progress
    if (roomData[socket.room].roundInProgress &&
      roomData[socket.room].currentDrawer.id === socket.id ) {

      io.to(socket.room).except(socket.id).emit('canvasTool', {message: data });

    }
  })

  socket.on('canvasBrushSize', (data) => {
    // Make sure the drawer can only call this command
    // And the round is still in progress
    if (roomData[socket.room].roundInProgress &&
      roomData[socket.room].currentDrawer.id === socket.id ) {

      io.to(socket.room).except(socket.id).emit('canvasBrushSize', {message: data });

    }
  })

  socket.on('canvasColor', (data) => {
    // Make sure the drawer can only call this command
    // And the round is still in progress
    if (roomData[socket.room].roundInProgress &&
      roomData[socket.room].currentDrawer.id === socket.id ) {

      io.to(socket.room).except(socket.id).emit('canvasColor', {message: data });

    }
  })

  socket.on('canvasClear', () => {
    // Make sure the drawer can only call this command
    // And the round is still in progress
    if (roomData[socket.room].roundInProgress &&
      roomData[socket.room].currentDrawer.id === socket.id ) {

      socket.to(socket.room).emit('canvasClear');

    }
  });

  socket.on('replyCanvas', async (data) => {
    roomData[socket.room].newUsers.forEach(s => {
      io.to(s.id).emit('catchupCanvas', { message:data });

      io.to(s.id).emit('whoIsDrawing', { message: {id: roomData[socket.room].currentDrawer.clientID, username: roomData[socket.room].currentDrawer.username} });
      io.to(s.id).emit('wordToGuess', { message: wordAsBlanks(roomData[socket.room].currentWord) });

      Object.entries(roomData[socket.room].guessedCorrectly).forEach(([key]) => {
        io.to(s.id).emit('correctGuess', { message: key });
      });

      Object.entries(roomData[socket.room].score).forEach(([key, value]) => {
        io.to(s.id).emit('userScore', {message: { userID : key, score: value }});
      });

    })

    roomData[socket.room].newUsers = [];
  });

  socket.on('matchStart', async () => {
    // Make sure the host can only call this command
    // Do not emit again if the game is already in progress
    if (roomData[socket.room].host.id === socket.id && roomData[socket.room].gameStarted === false) {
      const numberOfUsers = io.of('/').adapter.rooms.get(socket.room).size;
      if (numberOfUsers >= 2) {
        console.log("Room", socket.room, "has started!");

        io.in(socket.room).emit('matchStartCountdown');
        roomData[socket.room].gameStarted = true;

        io.in(socket.room).fetchSockets().then(users => {

          const roster = [];
          users.forEach(s => {
            roster.push(s)
            roomData[socket.room].score[s.clientID] = 0;
            roomData[socket.room].scoreThisRound[s.id] = 0;
          });

          // Create a new roster of users at the time of match start
          roomData[socket.room].roster = roster;
          roomData[socket.room].rosterIndex = 0;

          roomData[socket.room].roundTimeMax = 90;
          roomData[socket.room].roundTimeCurrent = 90;

          startOfRound(socket);
        });
      }
    }
  });

});

io.of("/").adapter.on("create-room", (room) => {
  console.log(`room ${room} was created`);
  roomData[room] = {};
  //console.log("Room data:", roomData ,"\n");
});

io.of("/").adapter.on("join-room", (room) => {
  console.log(`room ${room} was joined`);
  //console.log("Current room data:", roomData[room] ,"\n");

  // Since we are not storing canvas data server side, when a new user joins
  // The server will emit the request canvas event from the drawer
  // The drawer will then send the canvas back in a new event

});

io.of("/").adapter.on("delete-room", (room) => {
  clearTimeout(roomData[room].intermissionTimer);
  clearTimeout(roomData[room].roundStartTimer);
  clearInterval(roomData[room].timer);
  console.log(`room ${room} was deleted`);

  delete roomData[room];
  //console.log("Room data:", roomData ,"\n");
});

server.listen(3000, () => {
  console.log('listening on port:3000');
});
