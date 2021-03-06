const path = require("path")
const express = require("express");
const {
  MatchMaker
} = require('./matchmaker')
const http = require("http");
const socketio = require("socket.io")
require("dotenv").config();

const matchMaker = new MatchMaker(); // matchmaker object singleton

// initializing all servers
const app = express(); // for serving and api
const server = http.createServer(app); // for handling incoming traffic
const io = socketio(server); // for socket communication

if (process.env.DEBUG) {
// live reload to make dev less hurtful only for DEBUG
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(process.cwd(), 'src/client'));
app.use(connectLivereload());
// end livereload
}

// Express routing
app.use(express.urlencoded({
  extended:true
})); // for api stuff

app.use("/js", express.static(path.join(process.cwd(), "src/client/js"))); //serving client js
app.use("/css", express.static(path.join(process.cwd(), "src/client/css"))); //serving client css

app.get("/", (req, res) => { // handle root
  res.sendFile(path.join(process.cwd(), "src/client/html/landing.html"))
});

app.get("/game", (req, res) => { // handle game
  res.sendFile(path.join(process.cwd(), "src/client/html/game.html"))
})

app.post("/create", (req, res) => { // handle request for creating a game
  const gameId = matchMaker.createGame(req.body);
  res.redirect("/game?id=" + gameId);
})

server.listen(process.env.PORT || 3000); // start server listening

// Socket.io handling

io.on("connection", socket => { //handle connecting with sockets
  const gameId = socket.handshake.query.gameId; //extract gameId
  if (matchMaker.joinGame(gameId, socket)) { // try to join the game
    // console.log("joined successfully", socket.id);
  } else {
    // console.log("failed to join to", gameId);
    socket.disconnect(true);
  }
})
