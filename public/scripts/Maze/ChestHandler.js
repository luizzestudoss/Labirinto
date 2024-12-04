function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

class Chest {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = 25;
    this.isOpened = false;
    this.contents = null;

    this.frameWidth = 64;
    this.frameHeight = 64;

    this.ChestMessageIndex = null;
  }

  generateContents() {
    let randomChance = random();
    if (randomChance < 1) {
      let randomKey = random();
      return randomKey < 0.5 ? 'Chave 1' : 'Chave 2';
    } else {
      return false;
    }
  }

  openChest() {
    if (!this.isOpened) {
      this.isOpened = true;
      this.contents = this.generateContents();

      if (this.contents) {
        player.addItem(this.contents);
      }

      interfaceHandler.AddGameText(`Itens do baú: ${this.contents}`, 0.5, 0.2, 1500);

    } else {
      interfaceHandler.AddGameText("Este baú já está aberto.`",.5,.2,1500)
    }
  }
  
  DisableEffects() {
    interfaceHandler.RemoveGameText(this.ChestMessageIndex);
    minigame.stop()

    this.ChestMessageIndex = null;
  }

  show() {
    const x = this.x * maze.cellSize + maze.cellSize / 2;
    const y = this.y * maze.cellSize + maze.cellSize / 2;

    const displayWidth = this.frameWidth * 0.5;
    const displayHeight = this.frameHeight * 0.5;

    const spriteState = this.isOpened ? 1 : 0;
    const sx = spriteState * this.frameWidth;
    const sy = 0;

    image(
        Sprites['Chest'], 
        x - displayWidth / 2, 
        y - displayHeight / 2 - maze.cellSize / 5, 
        displayWidth,
        displayHeight,
        sx,
        sy,
        this.frameWidth,
        this.frameHeight
    );

    const distance = dist(player.pos.x, player.pos.y, x, y);

    if (distance < 50) {
        if (this.ChestMessageIndex === null) {
            this.ChestMessageIndex = interfaceHandler.AddGameText(
                "[Segure espaço para abrir o baú]",
                .5,
                .7
            );
            
            minigame.configure(3000, () => {
              this.openChest()
              this.DisableEffects()
            });
        }
    } else {
      if (this.ChestMessageIndex !== null) {
          this.DisableEffects()
        }
      }
  }
}