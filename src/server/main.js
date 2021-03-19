const path = require("path")
const express = require("express");
const {
  MatchMaker
} = require('./matchmaker')
const http = require("http");
const socketio = require("socket.io")

const matchMaker = new MatchMaker();

// initializing all servers
const app = express();
const server = http.createServer(app);
const io = socketio(server);

// live reload to make dev less hurtful
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(process.cwd(), 'src/client'));
app.use(connectLivereload());
// end livereload

// Express routing
app.use(express.json());

app.use("/js", express.static(path.join(process.cwd(), "src/client/js")));

app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "src/client/html/landing.html"))
});

app.get("/game", (req, res) => {
  res.sendFile(path.join(process.cwd(), "src/client/html/game.html"))
})

app.get("/create", (req, res) => {
  const gameId = matchMaker.createGame();
  res.redirect("/game?id=" + gameId);
})

server.listen(process.env.PORT || 3000);

// Socket.io handling

io.on("connection", socket => {
  const gameId = socket.handshake.query.gameId;
  if (matchMaker.joinGame(gameId, socket)) {
    console.log("joined successfully", socket.id);
  } else {
    console.log("failed to join to", gameId);
    socket.disconnect(true);
  }
})
