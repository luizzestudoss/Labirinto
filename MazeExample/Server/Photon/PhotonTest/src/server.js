export let currentPlayer = null;
export let players = {};
let photonClient = null;

export class PhotonGameClient extends Photon.LoadBalancing.LoadBalancingClient {
    constructor() {
        super(Photon.ConnectionProtocol.Wss,  "e3472fec-e863-4780-818f-499934016bb2", "1.0");

        this.isConnected = false;
        this.OnJoin = null;

        photonClient = this
    }

    onConnect() {
        this.isConnected = true;
        console.log("FUNCIONOU!!")
    }

    onDisconnect() {
        this.isConnected = false;
    }

    onJoinRoom() {
        const initialPlayerData = {
            name: `Player${this.myActor().actorNr}`,
            x: Math.random() * 400,
            y: Math.random() * 400,
        };

        this.myActor().setCustomProperty("player", initialPlayerData);

        currentPlayer = initialPlayerData;
        players = {};

        for (const actorId in this.myRoomActors()) {
            const actor = this.myRoomActors()[actorId];
            const playerData = actor.getCustomProperty("player") || {};
            players[actorId] = { name: playerData.name, x: playerData.x, y: playerData.y };
        }

        players[this.myActor().actorNr] = initialPlayerData;
        this.raiseEvent(1, currentPlayer);
    }

    onActorPropertiesChange(actor) {
        const updatedPlayer = actor.getCustomProperty("player");
        if (updatedPlayer) {
            players[actor.actorNr] = updatedPlayer;
        }
    }

    onEvent(code, content) {
        if (code === 1) {
            players = {};
            for (const actorId in this.myRoomActors()) {
                const actor = this.myRoomActors()[actorId];
                const playerData = actor.customProperties?.player || { name: `Player${actorId}`, x: 0, y: 0 };
                players[actorId] = playerData;
            }
        }
    }
}

export function createRoom() {
    const roomName = `${Math.floor(1000 + Math.random() * 9000)}`;
    if (photonClient) {
        console.log("entrando na sala")
        photonClient.createRoom(roomName);
    }
}

export function joinRoom() {
    const roomName = prompt("Digite o nome da sala:");
    if (roomName && photonClient) {
        photonClient.joinRoom(roomName);
    }
}

export function updatePlayerPosition() {
    if (currentPlayer && photonClient && photonClient.myActor()) {
        photonClient.myActor().setCustomProperty("player", currentPlayer);
        photonClient.raiseEvent(1, currentPlayer);
    }
}

export function initializePhotonClient() {
    if (!photonClient) {
        photonClient = new PhotonGameClient();
        photonClient.connectToRegionMaster("sa");
    }
}
