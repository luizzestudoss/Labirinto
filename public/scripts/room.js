window.Server = null;

import { PhotonGameClient, createRoom, joinRoom } from './server.js';

function RoomCreatorUI() {
    const creatorMenuElement = document.getElementById("creator-container");

    setTimeout(() => {
        if (window.Server.isRoomCreator()) {
            creatorMenuElement.style.display = "block";

            const monsterMode = document.getElementById("monster-mode");
            const botSettings = document.getElementById("bot-settings");

            monsterMode.addEventListener("change", () => {
                if (monsterMode.value === "bot") {
                    botSettings.style.display = "block";
                } else {
                    botSettings.style.display = "none";
                }
            });

            const seedElement = document.getElementById("seed-display");
            const initialSeed = window.Server.getSeed();

            if (seedElement) {
                seedElement.textContent = `Seed: ${initialSeed}`;
            }

            const startGameButton = document.getElementById("start-game");

            startGameButton.addEventListener("click", () => {
                const gameMode = document.getElementById("game-mode").value;
                const mapWidth = parseInt(document.getElementById("map-width").value, 10);
                const mapHeight = parseInt(document.getElementById("map-height").value, 10);
                const monsterModeValue = document.getElementById("monster-mode").value;
                const seedInput = document.getElementById("seed-input");
                const debugMode = document.getElementById("debug-mode").checked;
                const seedValue = seedInput.value.trim();


                let botCount = 0;
                if (monsterModeValue === "bot") {
                    botCount = parseInt(document.getElementById("bot-count").value, 10) || 0;
                } else if (monsterModeValue == "randomPlayer") {
                    window.Server.GenerateSpider("Random")
                } else if (monsterModeValue == "roomOwner") {
                    window.Server.GenerateSpider("Owner")
                }
                let seed = initialSeed;

                if (seedValue !== "") {
                    const parsedSeed = parseInt(seedValue, 10);
                    if (isNaN(parsedSeed)) {
                        alert("Por favor, insira um valor válido para a seed.");
                        return;
                    }
                    seed = parsedSeed;
                }

                const roomData = {
                    mapDimensions: { width: mapWidth, height: mapHeight },
                    gameMode,
                    monsterMode: monsterModeValue,
                    botCount,
                    seed,
                    isStarted: true,
                    debugMode: debugMode
                };

                window.Server.myRoom().setCustomProperties(roomData);

                if (seedElement) {
                    seedElement.textContent = `Seed: ${seed}`;
                }
            });
        } else {
            creatorMenuElement.style.display = "none";
        }
    }, 100);
}

function redirectToMultiplayerPage() {
    window.location.href = "multiplayer.html";
}

window.onload = () => {
    const roomName = sessionStorage.getItem("roomName");
    const State = sessionStorage.getItem("State");
    const roomTitle = document.getElementById("room-title");

    if (roomName) {
        roomTitle.textContent = `Código da sala: ${roomName}`;
        
        window.Server = new PhotonGameClient();
        window.Server.connectToRegionMaster("sa");

        window.Server.onStateChange = (state) => {
            if (state === Photon.LoadBalancing.LoadBalancingClient.State.ConnectedToMaster) {
                if (State === "Join") {
                    joinRoom(roomName);
                } else if (State === "Create") {
                    createRoom(roomName);
                }
            } else if (state === Photon.LoadBalancing.LoadBalancingClient.State.Joined) {
                renderPlayerList(window.Server.myRoomActors());
                RoomCreatorUI()
            }
        };

        window.Server.onOperationResponse = (errorCode, errorMessage) => {
            if (errorCode === Photon.LoadBalancing.Constants.ErrorCode.GameDoesNotExist) {
                alert("A sala não foi encontrada, verifique o código.");
                redirectToMultiplayerPage();
            }
        };

        window.Server.onError = (errorCode, errorMessage) => {
            alert(errorMessage)
            redirectToMultiplayerPage()
        };

        window.Server.onActorPropertiesChange = () => {
            renderPlayerList(window.Server.myRoomActors());
        };

        window.Server.onActorJoin = () => {
            const actor = window.Server.myActor();
        
            if (!actor.getCustomProperty("name")) {
                const defaultName = `Jogador ${actor.actorNr}`;
                actor.setCustomProperties({ name: defaultName });
            }
    

            renderPlayerList(window.Server.myRoomActors());
        };
        

        window.Server.onActorLeave = () => {
            renderPlayerList(window.Server.myRoomActors());
        };

    } else {
        redirectToMultiplayerPage()
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const updateNameButton = document.getElementById("update-name");
    
    updateNameButton.addEventListener("click", () => {
        const playerNameInput = document.getElementById("player-name");
        const newName = playerNameInput.value.trim();

        if (newName) {
            updatePlayerName(newName);
        } else {
            alert("Por favor, insira um nome válido.");
        }
    });
});

async function updatePlayerName(newName) {
    try {
        if (!window.Server || !window.Server.myActor()) {
            throw new Error("Cliente não conectado ou ator não disponível.");
        }
        window.Server.myActor().setCustomProperties({ name: newName });
        renderPlayerList(window.Server.myRoomActors());
    } catch (error) {
        alert("Erro ao atualizar o nome.");
        console.error(error);
    }
}

function renderPlayerList(actors) {
    if (!window.Server.getRoomProperty("isStarted")) {
        const playersListElement = document.getElementById("players");
        playersListElement.innerHTML = '';
    
        const playerArray = Object.values(actors)
            .map(actor => actor.getCustomProperty("name") || `Jogador ${actor.actorNr}`)
            .sort();
    
        playerArray.forEach(playerName => {
            const playerItem = document.createElement("li");
            playerItem.textContent = playerName;
            playersListElement.appendChild(playerItem);
        });
    }
}