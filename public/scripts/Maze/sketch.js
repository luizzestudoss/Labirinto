let debug = {
  debugMode: false,
  colission: false,
  showHitbox: false,
  speed: 1,
  zoom: 1,
  drawFog: false,
  spidersAmount: 0,
  SpawnSpider: true
};

let players = []

let gameRunning = false;
let hasExited = false;

let maze;
let player;
let camera;
let interfaceHandler;
let minigame = null;
let isHoldingSpace = false;

let startX;
let startY;

let zoom = debug.minZoom && debug.debugMode ? 1 : 6;
let MainCharacterSpeed = debug.fastSpeed && debug.debugMode ? 10 : 1;
let MonsterSpeed = debug.fastSpeed && debug.debugMode ? 10 : 1.5;

let Textures = {};
let Sprites = {}

let Spiders = [];


function preload() {
  Textures["FloorTexture"] = loadImage('assets/Textures/Floor3.jpg');
  Textures["WallTexture"] = loadImage('assets/Textures/Wall.jpg');
  Textures['DoorTexture'] = loadImage('assets/Textures/Wall1.jpg');

  Sprites["MainCharacter"] = {}

  let MainCharacter = Sprites["MainCharacter"]
  MainCharacter['up'] = loadImage('assets/Sprites/MainCharacter/up.png');
  MainCharacter['down'] = loadImage('assets/Sprites/MainCharacter/down.png');
  MainCharacter['left'] = loadImage('assets/Sprites/MainCharacter/left.png');
  MainCharacter['right'] = loadImage('assets/Sprites/MainCharacter/right.png');

  Sprites["Monster"] = loadImage('assets/Sprites/Monster/SpiderSprite.png')
  Sprites['SpiderWebEffect'] = loadImage('assets/Sprites/SpiderWebEffect.png')
  Sprites['Chest'] = loadImage('assets/Sprites/Chest.png')
}

function spawnSpiders(botCount) {
  setTimeout(() => {
      for (let i = 0; i < botCount; i++) {
        let monster = new CharacterManager(createVector(startX, startY), maze.cellSize, maze.grid, "Monster");
        Spiders.push(monster);

        interfaceHandler.AddGameText(botCount + " aranhas spawnaram no meio.", 0.5, 0.2, 2000);
      }
  }, 15000);
}

function setup() {
  waitForGameStart();
}

function initializePlayers() {
  const myActor = window.Server.myActor();
  const actors = window.Server.myRoomActors();
  const monsterActorNr = window.Server.getRoomProperty("monsterActorNr"); 

  for (const actorId in actors) {
    const actor = actors[actorId];
    const isMonster = parseInt(actorId) === parseInt(monsterActorNr);

    const characterType = isMonster ? "Monster" : "Player";

    if (parseInt(actorId) === myActor.actorNr) continue;

    const newPlayer = new CharacterManager(
      createVector(startX, startY),
      maze.cellSize,
      maze.grid,
      characterType,
      actor
    );
    players.push(newPlayer);
  }
}

function initializeGame() {
  const mainContainer = document.getElementById("main-container");
  mainContainer.remove();
  
  createCanvas(windowWidth, windowHeight);

  let gameMode = window.Server.getRoomProperty('gameMode')
  let monsterMode = window.Server.getRoomProperty('monsterMode')
  let botCount = window.Server.getRoomProperty('botCount')
  let seed = window.Server.getRoomProperty('seed')
  let mapDimensions = window.Server.getRoomProperty('mapDimensions')
  let debugMode = window.Server.getRoomProperty('debugMode')

  if (debugMode) {
    debug.debugMode = true
    debugHandler = new DebugHandler(debug);
  }

  let difficulty = 0
  if (gameMode === "easy") {
    difficulty = 1
  } else if (gameMode === "medium") {
    difficulty = 0.5
  } else if (gameMode === "hard") {
    difficulty = 0
  }

  maze = new MazeGenerator(mapDimensions.width, mapDimensions.height, seed, difficulty);
  maze.generateMaze();

  let cellSize = maze.cellSize;

  startX = floor(maze.cols / 2) * cellSize + cellSize / 2;
  startY = floor(maze.rows / 2) * cellSize + cellSize / 2;

  initializePlayers()

  let characterType = "Player";

  if (monsterMode === "bot") {
      spawnSpiders(botCount);
  } else if (monsterMode === "roomOwner") {
      characterType = window.Server.isRoomCreator() ? "Monster" : "Player";
  } else if (monsterMode === "randomPlayer") {
      const monsterActorNr = window.Server.getRoomProperty("monsterActorNr");
      characterType = window.Server.myActor().actorNr === Number(monsterActorNr) ? "Monster" : "Player";
  }
  
  player = new CharacterManager(createVector(startX, startY), cellSize, maze.grid, characterType);
  players.push(player);

  interfaceHandler = new InterfaceHandler();
  camera = new CameraHandler();

  minigame = new MinigameBar();

  gameRunning = true;
}

function waitForGameStart() {
  if (window.Server.getRoomProperty("isStarted")) {
    initializeGame();
  } else {
    setTimeout(waitForGameStart, 100);
  }
}

function draw() {
  if (gameRunning) {
    background(0)
  
    let cameraX = -player.pos.x * zoom + width / 2;
    let cameraY = -player.pos.y * zoom + height / 2;
    camera.update(cameraX, cameraY);
  
    maze.render();

    player.move();

    for (const otherPlayer of players) {
      if (otherPlayer.playerData?.actorNr !== window.Server.myActor().actorNr) {
        otherPlayer.renderReplicatedPlayer();
      }
    }
    
    for (let spider of Spiders) {
      spider.moveAI();
    } 
  
    if (debug.debugMode) {
     if (debug.drawFog) {
      drawFog();
     }
    } else {
      drawFog();
    }
    
    interfaceHandler.DrawUI()
  } else if (hasExited) {
    background(20, 20, 50); 
    for (let i = 0; i < 200; i++) {
        fill(100, 100, 150, random(50, 100));
        ellipse(random(width), random(height), random(2, 8), random(2, 8)); 
    }

    textAlign(CENTER, CENTER);
    textSize(40);
    fill(255, 0, 0);
    textFont('Georgia');
    text("VOCÊ ESCAPOU DO LABIRINTO!", width / 2, height / 4);

    textSize(28);
    fill(200);
    text("Jogadores que escaparam até agora:", width / 2, height / 2 - 80);

    let yOffset = height / 2 - 50;
    let exitedPlayers = window.Server.getEscapedPlayers();
    for (let i = 0; i < exitedPlayers.length; i++) {
        let alpha = map(i, 0, exitedPlayers.length, 100, 255);
        fill(255, 255, 255, alpha);
        textSize(24);
        text(`${i + 1}. ${exitedPlayers[i]}`, width / 2, yOffset);
        yOffset += 35;
    }

    textSize(22);
    fill(255, 200, 200);
    text("Aguarde os outros jogadores...", width / 2, height - 50);

    noStroke();
    for (let i = 0; i < 50; i++) {
        fill(255, 255, 255, 20); 
        ellipse(random(width), height - random(20), random(100, 300), random(20, 40));
    }
}

}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawFog() {
  let visibleRadius = 75;

  let gradient = drawingContext.createRadialGradient(
    player.pos.x,
    player.pos.y,
    visibleRadius / 2,
    player.pos.x,
    player.pos.y,
    visibleRadius
  );

  gradient.addColorStop(0, "rgba(0, 0, 0, 0.2)");
  gradient.addColorStop(0.2, "rgba(0, 0, 0, 0.4)");
  gradient.addColorStop(0.4, "rgba(0, 0, 0, 0.6)");
  gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.8)");
  gradient.addColorStop(0.6, "rgba(0, 0, 0, 0.975)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.999)");

  drawingContext.fillStyle = gradient;
  drawingContext.fillRect(-width, -height, width * 3, height * 3);
}

function mouseClicked() {
  if (player) {
    player.isAttacking = true;
    player.CanMove = false;
    
    player.MonsterAttack()
    setTimeout(() => {
      player.isAttacking = false;
      player.CanMove = true;
    }, 800);
  }
}

function keyPressed() {
  if (keyCode === 32 && minigame.canHoldSpace) {
      isHoldingSpace = true;
      if (!minigame.active) {
          minigame.start();
      }
  }
}
function keyReleased() {
  if (keyCode === 32 && minigame.active) {
    isHoldingSpace = false;
    minigame.stop();
  }
}


/* TO DO:
Balancear o jogo
Colocar os sons
Jumpscares

Sistema de correr
Sistema de salvar amigo

Resolver tela de sair
Resolver jogadores que saiem do jogo

Refatoração
*/