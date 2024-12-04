class DoorHandler {
    constructor(wallDoor) {
        this.wallDoor = wallDoor;
        this.key = null;

        this.Opened = false;
        this.isOpening = false;
        this.DoorMessageIndex = null;
    }
    
    assignKey(keys) {
        let randomIndex = Math.floor(Math.random() * keys.length);
        this.key = keys[randomIndex];
        keys.splice(randomIndex, 1);
    }

    render(x,y,size) {
        if (this.Opened) {
          return
        }

        let doorTexture = Textures["DoorTexture"];

        if (this.wallDoor === 0) {
          image(doorTexture, x, y, size, size / 10);
        }
        if (this.wallDoor === 1) {
          image(doorTexture, x + size - size / 10, y, size / 10, size);
        }
        if (this.wallDoor === 2) {
          image(doorTexture, x, y + size - size / 10, size, size / 10);
        }
        if (this.wallDoor === 3) {
          image(doorTexture, x, y, size / 10, size);
        }
  
        let distance = dist(player.pos.x, player.pos.y, x, y);
        if (distance < 40) {
          if (this.DoorMessageIndex === null) {
              this.DoorMessageIndex = interfaceHandler.AddGameText(
                  "[Segure espaço para abrir a porta]",
                  .5,
                  .7
              );
      
              if (!minigame.active) {
                  minigame.configure(
                      10000,
                      () => {
                          if (this.DoorMessageIndex !== null) {
                              interfaceHandler.RemoveGameText(this.DoorMessageIndex);
                              this.DoorMessageIndex = null;
                          }
      
                          if (player.hasItem(this.key)) {
                              this.Opened = true;
                              interfaceHandler.AddGameText("A porta foi aberta.", .5, .2, 1500);
                          } else {
                              interfaceHandler.AddGameText("Esta porta está trancada.", .5, .2, 1500);
                          }
                      }
                  );
                  minigame.start();
              }
          }
      } else {
          if (this.DoorMessageIndex !== null) {
              interfaceHandler.RemoveGameText(this.DoorMessageIndex);
              this.DoorMessageIndex = null;
              this.isOpening = false;
      
              if (minigame.active) {
                  minigame.stop();
              }
          }
      }
      
    }
}