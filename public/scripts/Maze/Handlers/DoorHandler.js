class DoorHandler {
    constructor(wallDoor, doorIndex) {
        this.wallDoor = wallDoor;
        this.key = null;

        this.Opened = false;
        this.isOpening = false;
        this.DoorMessageIndex = null;
        this.DoorMessageExitIndex = null;

        this.DoorIndex = doorIndex
    }
    
    assignKey(keys) {
        let randomIndex = Math.floor(Math.random() * keys.length);
        this.key = keys[randomIndex];
        keys.splice(randomIndex, 1);
    }

    render(x, y, size) {
        let distance = dist(player.pos.x, player.pos.y, x, y);
        const inRange = distance < 40 && player.Type == "Player";
    
        if (!this.Opened) {
            let doorTexture = Textures["DoorTexture"];
            
            if (this.wallDoor === 0) {
                image(doorTexture, x, y, size, size / 10);
            } else if (this.wallDoor === 1) {
                image(doorTexture, x + size - size / 10, y, size / 10, size);
            } else if (this.wallDoor === 2) {
                image(doorTexture, x, y + size - size / 10, size, size / 10);
            } else if (this.wallDoor === 3) {
                image(doorTexture, x, y, size / 10, size);
            }
    
            if (inRange) {
                if (this.DoorMessageIndex === null) {
                    this.DoorMessageIndex = interfaceHandler.AddGameText(
                        "[Segure espaço para abrir a porta]",
                        0.5,
                        0.7
                    );
                }
    
                minigame.configure(
                    debug.debugMode ? 0 : 10000,
                    () => {
                        if (player.hasItem(this.key)) {
                            this.Opened = true;
                            interfaceHandler.AddGameText("A porta foi aberta.", .5, .2, 2500);

                            window.Server.raiseEvent(20,{doorIndex: this.DoorIndex})

                            if (this.DoorMessageIndex !== null) {
                                interfaceHandler.RemoveGameText(this.DoorMessageIndex);
                                this.DoorMessageIndex = null;
                            }
                        } else {
                            interfaceHandler.AddGameText("Esta porta está trancada.", .5, .2, 2500);
                        }
                    }
                );
                minigame.canHoldSpace = true;
            } else {
                if (this.DoorMessageIndex !== null) {
                    interfaceHandler.RemoveGameText(this.DoorMessageIndex);
                    this.DoorMessageIndex = null;
                    minigame.canHoldSpace = false;
                }
            }
        } else {
            if (inRange) {
                if (this.DoorMessageExitIndex === null) {
                    this.DoorMessageExitIndex = interfaceHandler.AddGameText(
                        "Clique espaço para entrar na porta",
                        0.5,
                        0.7
                    );
                }
    
                if (!minigame.active) {
                    minigame.configure(
                        0,
                        () => {
                            if (this.DoorMessageExitIndex !== null) {
                                interfaceHandler.RemoveGameText(this.DoorMessageExitIndex);
                                this.DoorMessageExitIndex = null;
                            }
                            gameRunning = false;
                            hasExited = true;
                            player.setHasEscaped();
                            player.replicaServer();
                        }
                    );
    
                    minigame.canHoldSpace = true;
                }
            } else {
                if (this.DoorMessageExitIndex !== null) {
                    interfaceHandler.RemoveGameText(this.DoorMessageExitIndex);
                    this.DoorMessageExitIndex = null;
                    minigame.canHoldSpace = false;
                }

                if (this.DoorMessageIndex !== null) {
                    interfaceHandler.RemoveGameText(this.DoorMessageIndex);
                    this.DoorMessageIndex = null;
                }
            }
        }
    }
    
}