import { PhotonGameClient, currentPlayer, players, updatePlayerPosition, createRoom, joinRoom } from './server.js';

let canvas;
const speed = 5;

function setup() {
    canvas = createCanvas(500, 500);
    canvas.parent('game-container');
    noStroke();

    const photonClient = new PhotonGameClient();
    photonClient.connectToRegionMaster("sa");
}

function draw() {
    background(200);

    if (currentPlayer) {
        if (keyIsDown(87)) currentPlayer.y = max(0, currentPlayer.y - speed);
        if (keyIsDown(83)) currentPlayer.y = min(height - 50, currentPlayer.y + speed);
        if (keyIsDown(65)) currentPlayer.x = max(0, currentPlayer.x - speed);
        if (keyIsDown(68)) currentPlayer.x = min(width - 50, currentPlayer.x + speed);

        updatePlayerPosition();
    }

    for (const actorId in players) {
        let playerData = players[actorId];

        if (playerData && typeof playerData.x === "number" && typeof playerData.y === "number") {
            fill(playerData.name === currentPlayer?.name ? 'blue' : 'lightblue');
            rect(playerData.x, playerData.y, 50, 50);
            fill(0);
            textSize(12);
            textAlign(CENTER, CENTER);
            text(playerData.name || `Actor ${actorId}`, playerData.x + 25, playerData.y + 25);
        }
    }
}

window.setup = setup;
window.draw = draw;

window.createRoom = createRoom;
window.joinRoom = joinRoom;