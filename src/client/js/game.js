const gameId = new URL(location).searchParams.get("id");
console.log("Game id to join", gameId);

if (!gameId) {
  // panic or something
  alert("game id was not provided!");
} else {
  const playerListE = document.querySelector("#player-list");
  const playerCountE = document.querySelector("#player-count");
  const gameIdE = document.querySelector("#game-id");
  const myCardsE = document.querySelector("#my-cards");
  const otherPlayersE = document.querySelector("#other-players");
  const topCardE = document.querySelector("#top-card");
  const drawDeckSizeE = document.querySelector("#draw-deck-size");
  const drawDeckE = document.querySelector("#draw-deck");

  let myPlayerId;
  let totalPlayers;
  let myCards = [];

  const stateE = {};
  stateE.connecting = document.querySelector("#connecting-page");
  stateE.error = document.querySelector("#error-page");
  stateE.waiting = document.querySelector("#waiting-page");
  stateE.playing = document.querySelector("#playing-page");

  //getting the user name
  let username = null;
  username = prompt("gimme thy username yarr", "guest" + Math.trunc(Math.random()*100));
  if (username === null) username = "guest";
  // otherwise start connecting
  const socket = io(`ws://${location.hostname}:3000`, {
    query: {
      gameId: gameId,
      username: username
    }
  });
  socket.connect();


  socket.on("connect", data => {
    console.log("joined", gameId);
    gameIdE.innerText = gameId;
    changeState("waiting");
  })

  socket.on("disconnect", data => {
    console.log("Got disconnected");
    changeState("error");
  })

  socket.on("error", data => {
    changeState("error");
  })

  socket.on("playerList", data => {
    console.log("got new player list", data.players)
    displayPlayerList(data.players);
  })

  socket.on("initData", data => {
    myPlayerId = data.playerId;
    totalPlayers = data.totalPlayers;
  })

  socket.on("stateChange", data => {
    console.log("Got requested to change state to", data.state);
    changeState(data.state);
  })

  socket.on("cardUpdate", data => {
    myCards = data.cards;
    console.log("new card update", myCards);
    displayMyCards();
  })

  socket.on("turnUpdate", data => {
    console.log("got new turn update", data);
    displayOtherPlayers(data);
    topCardE.innerHTML = "";
    topCardE.appendChild(generateCardE(data.topCard));
    drawDeckSizeE.innerText = data.drawDeckSize;
  })

  const putQuestionE = document.querySelector("#put-question");
  const putQuestionAcceptE = document.querySelector("#put-question-accept");
  const putQuestionDenyE = document.querySelector("#put-question-deny");
  const putQuestionCardE = document.querySelector("#put-question-card");

  putQuestionAcceptE.onclick = () => {
    socket.emit("acceptPut")
    putQuestionE.style.display = "none";
  }
  putQuestionDenyE.onclick = () => {
    socket.emit("denyPut")
    putQuestionE.style.display = "none";
  }

  socket.on("askPut", data => {
    putQuestionE.style.display = "inherit";
    putQuestionCardE.innerHTML = "";
    putQuestionCardE.appendChild(generateCardE(data.card));
  })

  drawDeckE.onclick = () => {
    socket.emit("drawCard");
  }

  function changeState(state) {
    for (let sE of Object.values(stateE)) {
      sE.style.display = "none";
    }
    stateE[state].style.display = "inherit";
  }

  function displayPlayerList(players) {
    playerListE.innerHTML = "";
    for (let player of players) {
      const playerLI = document.createElement("li");
      if (player.playerId === myPlayerId)
        playerLI.innerHTML = `<i>${player.username}</i>`
      else
        playerLI.innerText = player.username;
      playerListE.appendChild(playerLI);
    }
    playerCountE.innerText = players.length + "/" + totalPlayers;
  }


  function displayMyCards() {
    myCardsE.innerHTML = "";
    for (let card of myCards) {
      myCardsE.appendChild(generateCardE(card,true));
    }
  }

  function generateCardE(card,player=false) {
    const cardDIV = document.createElement("div");
    cardDIV.classList.add("card");

    const nameSPAN = document.createElement("span"); // placeholder
    nameSPAN.innerText = card.val;
    nameSPAN.style.color = card.color;
    cardDIV.appendChild(nameSPAN)

    if(player)
      cardDIV.onclick = () => {// use that card
        socket.emit("putCard", { id: card.id });
      }; 
    return cardDIV;
  }

  function displayOtherPlayers(data) {
    otherPlayersE.innerHTML = "";
    for (let player of data.players) {
      if (player.playerId !== myPlayerId) {
        otherPlayersE.appendChild(
          generatePlayerE(player, player.playerId === data.currentPlayerId)
        );
      }
    }
  }

  function generatePlayerE(player, current) {
    const playerDIV = document.createElement("div");
    playerDIV.classList.add("player");
    if (current) playerDIV.classList.add("current");

    const userNameSPAN = document.createElement("span")
    userNameSPAN.innerText = player.username;
    userNameSPAN.classList.add("username");
    playerDIV.appendChild(userNameSPAN);

    const cardCountSPAN = document.createElement("span");
    cardCountSPAN.innerText = player.cardCount;
    cardCountSPAN.classList.add('card-count');
    playerDIV.appendChild(cardCountSPAN);

    return playerDIV;
  }
}