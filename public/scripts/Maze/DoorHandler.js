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
    
                if (!minigame.active) {
                    minigame.configure(
                        500,
                        () => {
                            if (this.DoorMessageIndex !== null) {
                                interfaceHandler.RemoveGameText(this.DoorMessageIndex);
                                this.DoorMessageIndex = null;
                            }

                            minigame.stop();

                            if (true || player.hasItem(this.key)) {
                                this.Opened = true;
                                window.Server.raiseEvent(20, { doorIndex: this.DoorIndex });
                                interfaceHandler.AddGameText("A porta foi aberta.", 0.5, 0.2, 1500);
                            } else {
                                interfaceHandler.AddGameText("Esta porta está trancada.", 0.5, 0.2, 1500);
                            }
                        }
                    );
                    minigame.start();
                }
            } else {
                if (this.DoorMessageIndex !== null) {
                    interfaceHandler.RemoveGameText(this.DoorMessageIndex);
                    this.DoorMessageIndex = null;
                }
    
                if (minigame.active) {
                    minigame.stop();
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

                            minigame.stop();
                            //window.Server.raiseEvent(30, { actorNr: window.Server.myActor().actorNr});
                            gameRunning = false;
                            hasExited = true;
                        }
                    );
                    minigame.start();
                }
            } else {
                if (minigame.active) {
                    minigame.stop();
                }

                if (this.DoorMessageExitIndex !== null) {
                    interfaceHandler.RemoveGameText(this.DoorMessageExitIndex);
                    this.DoorMessageExitIndex = null;
                }
            }
        }
    }
    
}