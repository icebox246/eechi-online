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

  let wildColor = "purple";


  const stateE = {};
  stateE.connecting = document.querySelector("#connecting-page");
  stateE.error = document.querySelector("#error-page");
  stateE.waiting = document.querySelector("#waiting-page");
  stateE.playing = document.querySelector("#playing-page");
  stateE.finished = document.querySelector("#finished-page");

  changeState("connecting");

  //getting the user name
  let username = null;
  username = prompt("gimme thy username yarr", "guest" + Math.trunc(Math.random() * 100));
  if (username === null) username = "guest";
  // otherwise start connecting
  const socket = io(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`, {
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
    wildColor = data.wildColor;
    topCardE.innerHTML = "";
    topCardE.appendChild(generateCardE(data.topCard));
    drawDeckSizeE.innerText = data.drawDeckSize;
    if (data.currentPlayerId === myPlayerId) {
      myCardsE.classList.add("my-turn")
    } else {
      myCardsE.classList.remove("my-turn")
    }
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

  const wildQuestionE = document.querySelector("#wild-question");
  const COLORS = ["red", "green", "blue", "yellow"]

  socket.on("askWild", data => {
    wildQuestionE.classList.remove("hidden");
  })

  for (let color of COLORS) {
    document.querySelector("#wild-" + color).onclick = () => {
      socket.emit("answerWild", {
        color
      });
    wildQuestionE.classList.add("hidden");
    }
  }

  const winnerNameE = document.querySelector("#winner-name");
  socket.on("winner", data => {
    winnerNameE.innerText = data.player.username;
  })


  drawDeckE.onclick = () => {
    socket.emit("drawCard");
  }

  function changeState(state) {
    for (let sE of Object.values(stateE)) {
      sE.classList.add("hidden");
    }
    stateE[state].classList.remove("hidden");
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
      myCardsE.appendChild(generateCardE(card, true));
    }
  }

  function generateCardE(card, player = false) {
    const cardE = document.createElement("div");
    cardE.classList.add("card-container");
    const cardDIV = document.createElement("div");
    cardDIV.classList.add("card");

    const nameSPAN = document.createElement("span"); // placeholder
    nameSPAN.innerText = card.val;
    if (card.color === "special")
      nameSPAN.style.color = (player ? "purple" : wildColor);
    else
      nameSPAN.style.color = card.color;
    cardDIV.appendChild(nameSPAN)

    if (player)
      cardDIV.onclick = () => { // use that card
        socket.emit("putCard", {
          id: card.id
        });
      };

    cardE.appendChild(cardDIV);
    return cardE;
  }

  function displayOtherPlayers(data) {
    otherPlayersE.innerHTML = "";
    let foundMe = false;
    //draw people after me
    for (let player of data.players) {
      if (player.playerId === myPlayerId) {
        foundMe = true;
        continue;
      }
      if (foundMe) {
        otherPlayersE.appendChild(
          generatePlayerE(player, player.playerId === data.currentPlayerId)
        );
      }
    }
    //draw people before me
    for (let player of data.players) {
      if (player.playerId === myPlayerId) {
        break
      }
        otherPlayersE.appendChild(
          generatePlayerE(player, player.playerId === data.currentPlayerId)
        );
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

    const cardPreviewDIV = document.createElement("div");
    cardPreviewDIV.classList.add("card-preview");
    for (let x = 0; x < player.cardCount; x++) {
      const cardDiv = document.createElement("div");
      const cardDiv2 = document.createElement("div");
      cardDiv2.classList.add("mini-card");
      cardDiv.appendChild(cardDiv2);
      cardPreviewDIV.appendChild(cardDiv);
    }
    playerDIV.appendChild(cardPreviewDIV);

    return playerDIV;
  }
}