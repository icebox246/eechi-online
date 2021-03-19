const gameId = new URL(location).searchParams.get("id");
console.log("Game id to join", gameId);

if (!gameId) {
  // panic or something
  alert("game id was not provided!");
} else {
  const playerListE = document.querySelector("#player-list");
  const gameIdE = document.querySelector("#game-id");
  let myPlayerId;
  //getting the user name
  let username = null;
  username = prompt("gimme thy username yarr", "guest");
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
  })

  socket.on("disconnect", data => {
    console.log("Got disconnected");
  })

  socket.on("playerList", data => {
    console.log("got new player list", data.players)
    playerListE.innerHTML = "";
    for (let player of data.players) {
      const playerLI = document.createElement("li");
      if (player.playerId === myPlayerId)
        playerLI.innerHTML = `<i>${player.username}</i>`
      else
        playerLI.innerText = player.username;
      playerListE.appendChild(playerLI);
    }
  })

  socket.on("personalPlayerId", data => {
    myPlayerId = data.playerId;
  })
}