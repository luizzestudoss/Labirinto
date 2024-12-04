class DebugHandler {
  constructor(debug) {
    this.debug = debug;
    this.gui = null;
    this.text = "Debug"
    this.initGUI();
  }

  initGUI() {
    this.gui = new dat.GUI();
  
    const debugFolder = this.gui.addFolder('Debug Settings');
    debugFolder.add(this.debug, 'colission').name('Collision');
    debugFolder.add(this.debug, 'showHitbox').name('Show Hitbox');
    debugFolder.add(this.debug, 'drawFog').name('Draw Fog');
  
    const playerFolder = this.gui.addFolder('Player Settings');
    playerFolder.add(this.debug, 'zoom', 0, 15).name('Zoom').onChange(this.updateZoom.bind(this));
    playerFolder.add(this.debug, 'speed', 0, 50).name('Speed').onChange(this.updateSpeed.bind(this));
  
    const spiderFolder = this.gui.addFolder('Spider Settings');
    spiderFolder.add(this.debug, 'spidersAmount', 0, 10000).name('Spiders Amount');
    spiderFolder.add(this, 'spawnSpiders').name('Spawn Spiders');

    this.monitorPanelState();
  }
  

  spawnSpiders() {
    for (let i = 0; i < this.debug.spidersAmount ; i++) {
      let monster = new CharacterManager(createVector(startX, startY), maze.cellSize, maze.grid, "Monster");
      Spiders.push(monster);
    }
  }

  updateSpeed() {
    player.speed = this.debug.speed;
  }

  updateZoom() {
    zoom = this.debug.zoom;
  }

  monitorPanelState() {
    const guiElement = this.gui.domElement;
    
    const closeButton = guiElement.querySelector('.close-button') || guiElement.querySelector('.close-bottom');

    const updateButtonText = () => {
      if (closeButton) {
        closeButton.innerText = this.text;
      }
    };

    updateButtonText();

    guiElement.addEventListener('click', () => {
      updateButtonText();
    });
  }
}
