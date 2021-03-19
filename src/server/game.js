class Game {
  constructor(matchMaker,id) {
    this.players = {};
    this.matchMaker = matchMaker;
    this.id = id;
  }

  addPlayer(socket) { // adding player to the list
    this.players[socket.id] = new Player(socket);
    socket.on("disconnect", () => {
      this.removePlayer(socket.id);
    })

    socket.emit("personalPlayerId", { playerId: socket.id });

    this.emitPlayerList();
  }

  removePlayer(id) { // removing player by id from the list
    delete this.players[id];
    if (Object.keys(this.players).length === 0) // if the game is empty remove it
      this.matchMaker.removeGame(this.id);
    this.emitPlayerList();
  }

  emitToAll(event, data) { // emits an event to all players
    for (let player of Object.values(this.players)) {
      player.socket.emit(event, data);
    }
  }

  emitPlayerList() { // emits player list to all players
    this.emitToAll("playerList", { players:this.getPlayerList() })
  }

  getPlayerList() { // gets player list as a publishable list
    return Object.values(this.players).map(p => {
      return { username: p.username,playerId:p.id }
    });
  }
}

class Player { // used describe player objects
  constructor(socket) {
    this.socket = socket;
    this.username = socket.handshake.query.username || "betty";
    this.id = socket.id;
  }
}

module.exports = {
  Game
}