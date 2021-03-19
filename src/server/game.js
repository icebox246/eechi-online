class Game {
  constructor() {
    this.players = {};
  }

  addPlayer(socket) {
    this.players[socket.id] = new Player(socket);
    socket.on("disconnect", () => {
      this.removePlayer(socket.id);
    })
    this.emitPlayerList();
  }

  removePlayer(id) {
    delete this.players[id];
    this.emitPlayerList();
  }

  emitToAll(event, data) {
    for (let player of Object.values(this.players)) {
      player.socket.emit(event, data);
    }
  }

  emitPlayerList() {
    this.emitToAll("playerList", { players:this.getPlayerList() })
  }

  getPlayerList() {
    return Object.values(this.players).map(p => {
      return { username: p.username }
    });
  }
}

class Player {
  constructor(socket) {
    this.socket = socket;
    this.username = socket.handshake.query.username || "betty";
  }
}

module.exports = {
  Game
}