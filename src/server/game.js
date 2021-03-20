const {
  shuffle
} = require("../common/utils");

const COLORS = [
  "red", "green", "blue", "yellow"
]

const COLOR_CARDS_VALS = [
  "1", "2", "3", "4", "5", "6", "7", "8", "9", "skip", "draw2", "reverse"
]


class Game {
  constructor(matchMaker, id, options) {
    this.players = {}; //for storing player objs
    this.playerIds = []; // for storing their ids for turn order purposes
    this.currentPlayerIndex = 0;
    this.matchMaker = matchMaker;
    this.id = id;
    this.totalPlayers = Number.parseInt(options.playerCount) || 2;
    this.startingCardCount = 6;
    this.state = "waiting";
    this.reversed = false;
  }

  startGame() { // starts this game
    console.log("Starting game", this.id);

    let currentCardId = 0;
    this.drawDeck = [];
    this.discardPile = [];

    for (let x = 0; x < 2; x++)
      for (let color of COLORS) {
        for (let val of COLOR_CARDS_VALS) {
          this.drawDeck.push({
            color,
            val,
            id: currentCardId
          });
          currentCardId++;
        }
      }
    
    for (let color of COLORS) {
      this.drawDeck.push({
        color,
        val: "0"
      });
    }

    this.drawDeck = shuffle(this.drawDeck);
    this.playerIds.forEach(pId => {
      const player = this.players[pId];
      for (let i = 0; i < this.startingCardCount; i++) {
        player.cards.push(this.drawDeck.pop());
      }
      player.emitCardUpdate();
    })

    this.discardPile.push(this.drawDeck.pop());

    this.state = "playing";
    this.emitToAll("stateChange", {
      state: this.state
    });
    this.emitTurnUpdate();
  }

  putCard(player, card) {
    if (!this.checkPlayer(player)) return;
    if (player.queuedCard !== null) {
      if (card.id !== player.queuedCard.id) return;
    }
    if (this.testCard(card)) {
      this.discardPile.push(card);
      player.removeCard(card.id);
      player.emitCardUpdate();

      if (card.val === 'skip') {
        this.incrementCurrentPlayerIndex();
      } else if (card.val === 'draw2') {
        this.incrementCurrentPlayerIndex();
        const nextPlayer = players[playerIds[this.currentPlayerIndex]];
        this.drawCard(nextPlayer);
        this.drawCard(nextPlayer);
      } else if (card.val === "reverse") {
        this.reversed = !this.reversed;
      }

      this.goNextRound();
    }
  }

  drawCard(player, voluntary = false) { // for drawing a card from deck
    if (voluntary && !this.checkPlayer(player)) return;
    const card = this.drawDeck.pop();
    if (this.drawDeck.length === 0) this.refreshDrawDeck();
    player.cards.push(card);
    if (voluntary && this.testCard(card)) {
      player.socket.emit("askPut", {
        card: card
      });
      player.queuedCard = card;
    } else {
      player.emitCardUpdate();
    }
  }

  goNextRound() {
    this.incrementCurrentPlayerIndex();
    this.emitTurnUpdate();
  }

  refreshDrawDeck() {
    while (this.discardPile.length > 2) {
      this.drawDeck.push(this.discardPile.shift());
    }
    shuffle(this.drawDeck);
  }

  checkPlayer(player) {
    const playerIndex = this.playerIds.findIndex(pId => pId === player.id);
    return (playerIndex === this.currentPlayerIndex);
  }

  testCard(card) {
    const topCard = this.getTopCard();

    if (topCard.color === card.color || topCard.val === card.val) {
      return true;
    } else {
      return false;
    }
  }

  incrementCurrentPlayerIndex() { // increments current player index
    return this.currentPlayerIndex = (this.currentPlayerIndex + (this.reversed ? -1 : 1) +this.playerIds.length) % this.playerIds.length;
  }

  getTopCard() { // give a card form top of the put deck
    return this.discardPile[this.discardPile.length - 1];
  }

  emitTurnUpdate() { // gets run after every turn
    this.emitToAll("turnUpdate", {
      players: this.getPlayerList(),
      currentPlayerId: this.playerIds[this.currentPlayerIndex],
      topCard: this.getTopCard(),
      drawDeckSize: this.drawDeck.length
    })
  }

  addPlayer(socket) { // adding player to the list
    this.players[socket.id] = new Player(socket, this);
    this.playerIds.push(socket.id);
    socket.on("disconnect", () => {
      this.removePlayer(socket.id);
    })

    this.logPlayerCount();

    socket.emit("initData", {
      playerId: socket.id,
      totalPlayers: this.totalPlayers
    });
    this.emitPlayerList();

    if (Object.keys(this.players).length === this.totalPlayers) {
      this.startGame();
    }
  }

  removePlayer(id) { // removing player by id from the list
    delete this.players[id];
    if (this.playerIds.indexOf(id) < this.currentPlayerIndex) this.currentPlayerIndex--;
    this.playerIds = this.playerIds.filter(i => i !== id);

    this.logPlayerCount();

    if (this.playerIds.length === 0) // if the game is empty remove it
      this.matchMaker.removeGame(this.id);
    this.emitPlayerList();
  }

  logPlayerCount() { // for debuggin
    console.log("current count on", this.id, "is", this.playerIds.length, "of", this.totalPlayers);
  }

  emitToAll(event, data) { // emits an event to all players
    for (let player of Object.values(this.players)) {
      player.socket.emit(event, data);
    }
  }

  emitPlayerList() { // emits player list to all players
    this.emitToAll("playerList", {
      players: this.getPlayerList()
    })
  }

  getPlayerList() { // gets player list as a publishable list
    return Object.values(this.players).map(p => {
      return {
        username: p.username,
        playerId: p.id,
        cardCount: p.cards.length
      }
    });
  }
}

class Player { // used describe player objects
  constructor(socket, game) {
    this.socket = socket;
    this.game = game;
    this.username = socket.handshake.query.username || "betty";
    this.id = socket.id;
    this.cards = [];
    this.queuedCard = null;

    socket.on("putCard", data => this.putCard(data.id));
    socket.on("drawCard", () => this.drawCard());
    socket.on("acceptPut", () => {
      if (this.queuedCard !== null) {
        this.putCard(this.queuedCard.id);
        this.queuedCard = null;
      }
    })
    socket.on("denyPut", () => {
      if (this.queuedCard !== null) {
        this.queuedCard = null;
        this.emitCardUpdate();
        this.game.goNextRound();
      }
    })
  }

  emitCardUpdate() { // send player state of their cards
    this.socket.emit("cardUpdate", {
      cards: this.cards
    });
  }

  findCard(id) {
    return this.cards.find(v => v.id === id);
  }

  putCard(id) {
    const card = this.findCard(id);
    if (card) {
      this.game.putCard(this, card);
    }
  }

  drawCard() {
    this.game.drawCard(this, true);
  }

  removeCard(id) {
    this.cards = this.cards.filter(card => card.id !== id);
  }
}

module.exports = {
  Game
}