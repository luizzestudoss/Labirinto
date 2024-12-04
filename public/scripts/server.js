export let photonClient = null;

export function createRoom(roomName) {
    if (roomName && photonClient) {
        photonClient.createRoom(roomName);
        console.log("Tentando criar a sala:", roomName);
    } else {
        console.error("Erro: Nome da sala ou cliente Photon não definidos.");
    }
    
}

export function joinRoom(roomName) {
    if (roomName && photonClient) {
        photonClient.joinRoom(roomName);
        photonClient.onJoinRoom = () => {
            console.log("Joined sucessfully: ", roomName);
        };
    
        photonClient.onError = (errorCode, errorMessage) => {
            console.error("Error:", errorCode, errorMessage);
        };
    }
}

export class PhotonGameClient extends Photon.LoadBalancing.LoadBalancingClient {
    constructor() {
        super(Photon.ConnectionProtocol.Wss, "e3472fec-e863-4780-818f-499934016bb2", "1.0");
        this.isConnected = false;
        this.OnJoin = null
        this.players = {}
        this.currentPlayer = {}
        this.roomCreator = null;
        this.isServer = true;
        this.poisonedPlayers = {};
        this.ChestIndex = 0

        this.setListeners()

        photonClient = this;
    }

    setListeners() {
        this.onEvent = this.onEvent.bind(this);
        this.onActorJoin = this.onActorJoin.bind(this);
        this.onActorLeave = this.onActorLeave.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.onDisconnect = this.onDisconnect.bind(this);
        this.onJoinRoom = this.onJoinRoom.bind(this);
        this.onError = this.onError.bind(this);
    }

    setOnJoin(callback) {
        this.OnJoin = callback
    }

    onConnect() {
        this.isConnected = true;
        console.log("está conectado!")
    }

    onDisconnect() {
        this.isConnected = false;
    }

    onJoinRoom() {
        const initialPlayerData = {
            name: `Player${this.myActor().actorNr}`,
            pos: {
                x: 0,
                y: 0,
            },
        };

        if (!this.roomCreator) {
            this.roomCreator = this.myActor().actorNr;
            
            const randomSeed = Math.floor(Math.random() * 1000000);
            this.myRoom().setCustomProperties({ seed: randomSeed });
        }
        
    
        this.myActor().setCustomProperties({ player: initialPlayerData });
    
        this.currentPlayer = initialPlayerData;
    
        for (const actorId in this.myRoomActors()) {
            const actor = this.myRoomActors()[actorId];
            const playerData = actor.getCustomProperty("player") || {
                name: `Player${actor.actorNr}`,
                pos: { x: 0, y: 0 },
            };
            this.players[actorId] = playerData;
        }
    
        this.players[this.myActor().actorNr] = initialPlayerData;
    
        this.raiseEvent(1, { roomCreator: this.roomCreator });
    }

    getSeed() {
        return this.myRoom().getCustomProperty("seed");
    }

    getPlayers() {
        return this.players
    }

    onActorPropertiesChange(actor) {
        const updatedPlayer = actor.getCustomProperty("player");
        if (updatedPlayer) {
            if (!updatedPlayer.pos) {
                updatedPlayer.pos = { x: 0, y: 0 };
            }
            this.players[actor.actorNr] = updatedPlayer;
        }
    }

    onLeaveRoom() {
        console.log("Jogador saiu da sala.");
    }
    

    onEvent(code, content) {
        if (code === 1) {
            this.roomCreator = content.roomCreator;
    
            this.players = {};
            for (const actorId in this.myRoomActors()) {
                const actor = this.myRoomActors()[actorId];
                const playerData = actor.getCustomProperty("player") || {};
        
                this.players[actorId] = playerData;
            }
        } else if (code === 2) {
            const actorId = content.actorId;
            const isPoisoned = content.isPoisoned;

            const actor = this.myRoomActors()[actorId];
            if (actor) {
                const playerData = actor.getCustomProperty("player") || {};
                playerData.isPoisoned = isPoisoned;
    
                actor.setCustomProperty("player", playerData);
                this.players[actorId] = playerData;
    
                if (isPoisoned) {
                    this.poisonedPlayers = this.poisonedPlayers || {};
                    this.poisonedPlayers[actorId] = true;
                } else if (this.poisonedPlayers) {
                    delete this.poisonedPlayers[actorId];
                }
            } else {
                console.error(`Ator ${actorId} não encontrado!`);
            }
        } else if (code == 10) {
            this.ChestIndex += 1
            console.log(`Novo ChestIndex: ${this.ChestIndex}`);

            maze.hasChest = false;
            maze.generateChest();
        }
    }
    
    

    onError(errorCode, errorMsg) {
        console.error(`Photon Error: ${errorCode} - ${errorMsg}`);
    }

    isRoomCreator() {
        return this.myActor().actorNr === this.roomCreator;
    }

    isServer() {
        return this.isServer
    }

    getRoomProperty(key) {
        if (this.myRoom()) {
            return this.myRoom().getCustomProperty(key);
        }
        return null;
    }
    
    GenerateSpider(type) {
        const playerList = Object.keys(this.myRoomActors());
    
        if (type === "Random") {
            const randomMonsterId = playerList[Math.floor(Math.random() * playerList.length)];
            this.myRoom().setCustomProperties({ monsterActorNr: randomMonsterId });
        } else if (type === "Owner") {
            const ownerActorNr = this.myActor().actorNr;
            this.myRoom().setCustomProperties({ monsterActorNr: ownerActorNr });
        }
    }

    getPoisonedPlayers() {
        return Object.keys(this.poisonedPlayers);
    }
}
