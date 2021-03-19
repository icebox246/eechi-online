const { nanoid } = require("nanoid");
const { Game } = require("./game");

class MatchMaker {
  constructor() {
    this.games = {}; // stores all running games
  }

  createGame() {
    // for creating game match
    const gameId = nanoid();
    this.games[gameId] = new Game();
    console.log("Created new game", gameId);
    return gameId;
  }

  joinGame(gameId,socket) {
    if (this.games[gameId]) {
      this.games[gameId].addPlayer(socket);
      return true;
    }
    return false;
  }

}


module.exports= {
  MatchMaker
} 
