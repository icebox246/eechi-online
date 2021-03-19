const gameId = new URL(location).searchParams.get("id");
console.log("Game id to join",gameId);

if (!gameId) {
  // panic or something
} else {
  const username = prompt("gimme thy username yarr","guest");
  // otherwise start connecting
  const socket = io(`ws://${location.hostname}:3000`, { query: { gameId: gameId, username: username } });
  socket.connect();

  socket.on("connect", data => {
    console.log("joined", gameId);
  })

  socket.on("disconnect", data => {
    console.log("Got disconnected");
  })

  const playerListE = document.querySelector("#player-list");
  socket.on("playerList", data => {
    console.log("got new player list",data.players)
    playerListE.innerHTML = "";
    for (let player of data.players) {
      const playerLI = document.createElement("li");
      playerLI.innerText = player.username;
      playerListE.appendChild(playerLI);
    }
  })


}