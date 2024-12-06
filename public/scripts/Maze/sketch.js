let debug = {
  debugMode: false,
  colission: false,
  showHitbox: false,
  speed: 25,
  zoom: 0.5,
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

let MainCharacterZoom = debug.minZoom && debug.debugMode ? 1 : 6;
let MainCharacterSpeed = debug.fastSpeed && debug.debugMode ? 10 : 0.9;
let MainCharacterFog = 70

let MonsterZoom = debug.minZoom && debug.debugMode ? 1 : 8;
let MonsterSpeed = debug.fastSpeed && debug.debugMode ? 10 : 1;
let MonsterFog = 60

let Textures = {};
let Sprites = {}

let Spiders = [];

let isSpiderDelayed = false;
const keepAliveInterval = 1000;
let lastKeepAliveTime = 0;


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

  let gameMode = window.Server.getRoomProperty('gameMode');
  let monsterMode = window.Server.getRoomProperty('monsterMode');
  let botCount = window.Server.getRoomProperty('botCount');
  let seed = window.Server.getRoomProperty('seed');
  let mapDimensions = window.Server.getRoomProperty('mapDimensions');
  let debugMode = window.Server.getRoomProperty('debugMode') || debug.debugMode;

  if (debugMode) {
    debug.debugMode = true;
    debugHandler = new DebugHandler(debug);
  }

  let difficulty = 0;
  if (gameMode === "easy") {
    difficulty = 1;
  } else if (gameMode === "medium") {
    difficulty = 0.5;
  } else if (gameMode === "hard") {
    difficulty = 0;
  }

  maze = new MazeGenerator(mapDimensions.width, mapDimensions.height, seed, difficulty);
  maze.generateMaze();

  let cellSize = maze.cellSize;

  startX = floor(maze.cols / 2) * cellSize + cellSize / 2;
  startY = floor(maze.rows / 2) * cellSize + cellSize / 2;

  initializePlayers();

  let characterType = "Player";
  let delaySpawn = false;

  if (monsterMode === "bot") {
      spawnSpiders(botCount);
  } else if (monsterMode === "roomOwner") {
      if (window.Server.isRoomCreator()) {
          characterType = "Monster";
          delaySpawn = true;
      }
  } else if (monsterMode === "randomPlayer") {
      const monsterActorNr = window.Server.getRoomProperty("monsterActorNr");
      if (window.Server.myActor().actorNr === Number(monsterActorNr)) {
          characterType = "Monster";
          delaySpawn = true;
      }
  }
  
  if (delaySpawn && characterType === "Monster") {
      isSpiderDelayed = true;
      setTimeout(() => {
          player = new CharacterManager(createVector(startX, startY), cellSize, maze.grid, characterType);
          players.push(player);
          isSpiderDelayed = false;

          window.Server.raiseEvent(40,{message: "A aranha acabou de nascer no meio!"})
      }, debug.debugMode ? 1500 : 15000);
  } else {
      player = new CharacterManager(createVector(startX, startY), cellSize, maze.grid, characterType);
      players.push(player);
  }

  minigame = new MinigameBar();
  interfaceHandler = new InterfaceHandler();
  camera = new CameraHandler(debugMode ? debug.zoom : isSpiderDelayed ? MonsterZoom : MainCharacterZoom);

  gameRunning = true;
}

function waitForGameStart() {
  if (window.Server.getRoomProperty("isStarted")) {
    document.body.style.overflow = 'hidden';
    initializeGame();
  } else {
    setTimeout(waitForGameStart, 100);
  }
}


function draw() {
  if (millis() - lastKeepAliveTime > keepAliveInterval) {
    lastKeepAliveTime = millis();
    sendKeepAliveMessage();
  }

  if (isSpiderDelayed) {
    showSpiderDelayScreen();
    return;
  }

  if (player && player.Type === "Monster") {
    if (isGameOver()) {
      showGameOverScreenForMonster();
    } else {
      runGame();
    }
  } else if (hasExited) {
    showEscapeScreen();
  } else if (gameRunning) {
    if (player && player.isDead) {
      showDeadScreen()
    } else {
      runGame();
    }
  }
}

function isGameOver() {
  const escapedPlayers = Object.keys(window.Server.getEscapedPlayers()).length;
  const poisonedPlayers = Object.keys(window.Server.getPoisonedPlayers()).length;
  const DeadPlayers = Object.keys(window.Server.getDeadPlayers()).length;

  const totalPlayers = Object.keys(window.Server.getPlayers()).length - 1;

  const activePlayers = totalPlayers - escapedPlayers - poisonedPlayers - DeadPlayers;
  return activePlayers <= 0;
}

function showSpiderDelayScreen() {
  background(0);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(32);
  text("Você é uma aranha e irá spawnar em breve...", width / 2, height / 3);
  textSize(24);
  text("Aguarde um momento...", width / 2, height / 2);
}

function showDeadScreen() {
  background(0);
  textAlign(CENTER, CENTER);
  fill(255);

  textSize(32);
  text("Você morreu!", width / 2, height / 3);

  textSize(24);

  if (isGameOver()) {
    showRedirectButton()
  } else {
    text("Aguarde o reinício...", width / 2, height / 2);
  }
}


function showGameOverScreenForMonster() {
  background(30, 0, 0);
  textAlign(CENTER, CENTER);
  fill(255, 0, 0);
  textSize(40);
  text("TODOS OS JOGADORES ESTÃO ENVENENADOS OU ESCAPARAM!", width / 2, height / 3);
  const exitedPlayers = Object.keys(window.Server.getEscapedPlayers()).length;
  const totalPlayers = Object.keys(window.Server.getPlayers()).length - 1
  text(exitedPlayers + " de " + totalPlayers + " jogadores conseguiram escapar!", width / 2, height / 2 - 80);
  textSize(28);
  fill(200);
  text("O JOGO ACABOU!", width / 2, height / 2);

  showRedirectButton()
}

function showMonsterWaitingScreen() {
  background(10);
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(32);
  text("Você é o monstro, aguarde os jogadores...", width / 2, height / 3);
  textSize(24);
  fill(200);
  text("Caça ou espere a saída de todos!", width / 2, height / 2);
}

function showEscapeScreen() {
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

  const exitedPlayers = Object.keys(window.Server.getEscapedPlayers()).length;
  const totalPlayers = Object.keys(window.Server.getPlayers()).length - 1;

  text("Até agora, " + exitedPlayers + " de " + totalPlayers + " jogadores conseguiram escapar!", width / 2, height / 2 - 80);

  if (exitedPlayers < totalPlayers) {
    textSize(22);
    fill(255, 200, 200);
    text("Aguarde os outros jogadores...", width / 2, height - 50);

    if (exitedPlayers < totalPlayers - 1) {
      showRedirectButton();
    }
  } else {
    showRedirectButton();
  }

  noStroke();
  for (let i = 0; i < 50; i++) {
    fill(255, 255, 255, 20);
    ellipse(random(width), height - random(20), random(100, 300), random(20, 40));
  }
}

function showRedirectButton() {
  const buttonWidth = 200;
  const buttonHeight = 50;
  const buttonX = width / 2 - buttonWidth / 2;
  const buttonY = height / 2 + 50;

  fill(0, 150, 255);
  rect(buttonX, buttonY, buttonWidth, buttonHeight, 10);

  fill(255);
  textSize(18);
  textAlign(CENTER, CENTER);
  text("Voltar para o início", width / 2, buttonY + buttonHeight / 2);

  if (mouseIsPressed) {
    const mouseXWithin = mouseX >= buttonX && mouseX <= buttonX + buttonWidth;
    const mouseYWithin = mouseY >= buttonY && mouseY <= buttonY + buttonHeight;

    if (mouseXWithin && mouseYWithin) {
      window.location.href = "multiplayer.html";
    }
  }
}

function runGame() {
  background(0);

  let cameraX = -player.pos.x * camera.zoom + width / 2;
  let cameraY = -player.pos.y * camera.zoom + height / 2;
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

  interfaceHandler.DrawUI();
}

function sendKeepAliveMessage() {
  window.Server.raiseEvent(0, { type: "keep-alive" });
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function drawFog() {
  let visibleRadius = player.Type == "Player" ? MainCharacterFog : MonsterFog ;

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
  drawingContext.fillRect(-width, -height, width * 999, height * 999);
}

let lastAttackTime = 0;
const attackCooldown = 1500;

function mouseClicked() {
  if (player && player.Type == "Monster") {
    const currentTime = Date.now();
    if (currentTime - lastAttackTime >= attackCooldown) {
      player.isAttacking = true;
      player.CanMove = false;
      
      player.MonsterAttack();
      
      lastAttackTime = currentTime;
      
      setTimeout(() => {
        player.isAttacking = false;
        player.CanMove = true;
      }, 800);
    } else {
      console.log("Ataque em cooldown!");
    }
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
Texto de entrar na porta sobrepoem o texto da porta.
Não esquecer de voltar os valores aos normais e balancear

Resolver o bug da tela de sair pro último player
Resolver jogadores que saiem do jogo
*/