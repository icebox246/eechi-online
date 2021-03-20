const { nanoid } = require("nanoid");
const { Game } = require("./game");

class MatchMaker {
  constructor() {
    this.games = {}; // stores all running games
  }

  createGame(options) {
    // for creating game match returns gameId of the created one
    const gameId = nanoid(); //generate id for the game
    this.games[gameId] = new Game(this,gameId,options);
    console.log("Created new game", gameId);
    return gameId;
  }

  removeGame(gameId) { // for removing empty games
    console.log("Removed game", gameId);
    delete this.games[gameId];
  }

  joinGame(gameId,socket) { // for trying to join a game
    if (this.games[gameId] && this.games[gameId].state === "waiting") {
      this.games[gameId].addPlayer(socket);
      return true;
    }
    return false;
  }

}


module.exports= {
  MatchMaker
} 
