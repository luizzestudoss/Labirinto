class CharacterManager {
    constructor(startPos, w, grid, type, playerData) {
      this.playerData = playerData 

      this.pos = startPos;
      this.vel = createVector(0,0)
      this.Inventory = []

      this.grid = grid;
      this.Type = type
      this.w = w;
      this.speed = this.Type == "Monster" ? MonsterSpeed : MainCharacterSpeed;

      this.isSprinting = false;

      this.MaxHealth = 100
      this.Health = this.MaxHealth

      this.MaxStamina = 100
      this.Stamina = this.MaxStamina

      this.isPoisoned = false;
      this.lastPoisonTick = 0;
      this.poisonDamage = debug.debugMode ? 10 : .045;

      this.canMove = true;
      this.currentDirection = "down"
      this.isMoving = false;
      this.isAttacking = false

      this.directionCooldown = 50;
      this.lastDirectionChange = 0;

      this.frameIndex = 0;
      this.frameCount = 4;
      this.frameRate = 5;
      this.lastFrameChange = 0;
      this.spriteWidth = 128;
      this.spriteHeight = 128;

      this.path = []
      this.target = null;

      this.RescueMessageIndex = null;
      this.HasEscaped = false;
      this.isDead = false;
    }

    showName() {
        if (player.Type === "Monster" || this.Type == "Monster") return;
    
        textSize(10);
        textAlign(CENTER, CENTER);
        fill(255, 200, 200);
    
        let name = window.Server.myActor().getCustomProperties().name;
    
        let textX = this.pos.x;
        let textY = this.pos.y - 10;
    
        text(name, textX, textY);
    }
    

    showHitbox(x, y, height, width) {
        noFill();
        stroke(255, 0, 0, 150);
        strokeWeight(2);
      
        rect(x, y, width, height);
      
        noStroke();
        fill(255);
    }
    
    setHasEscaped() {
        this.HasEscaped = true
    }

    replicaServer() {
        const playerdata = {
            pos: {
                x: this.pos.x,
                y: this.pos.y
            },
            isMoving: this.isMoving,
            currentDirection: this.currentDirection,
            isAttacking: this.isAttacking,
            isPoisoned: this.isPoisoned
        };
    
        if (this.HasEscaped) {
            playerdata.HasEscaped = true;
        }

        if (this.isDead) {
            playerdata.isDead = true
        }
    
        window.Server.myActor().setCustomProperty("player", playerdata);
    
        window.Server.raiseEvent(1, {
            actorNr: window.Server.myActor().actorNr,
            playerdata
        });
    }
    
    
    renderLocalPlayer() {
        const actor = window.Server.myActor();
    
        if (!actor) {
            console.error("Ator local não encontrado!");
            return;
        }
    
        const isPoisoned = window.Server.poisonedPlayers && window.Server.poisonedPlayers[actor.actorNr];
    
        if (isPoisoned) {
            this.isPoisoned = true;
            this.canMove = false;
        } else {
            this.isPoisoned = false;
            this.canMove = true;
        }
    }

    replicaIsPoisoned() {
        const targetActorNr = this.playerData.actorNr;
        const isPoisoned = true;
    
        window.Server.raiseEvent(2, { 
            actorId: targetActorNr,
            isPoisoned: isPoisoned,
        });
    }
    
    replicaIsNotPoisoned() {
        const targetActorNr = this.playerData.actorNr;
        const isPoisoned = false;
    
        window.Server.raiseEvent(2, { 
            actorId: targetActorNr,
            isPoisoned: isPoisoned,
        });
    }
    
    renderReplicatedPlayer() {
        if (!this.playerData || !this.playerData.customProperties) {
          return;
        }
      
        const actorData = this.playerData.customProperties.player;
        if (!actorData) {
            return
        }

        this.pos.x = actorData.pos.x
        this.pos.y = actorData.pos.y
        this.currentDirection = actorData.currentDirection
        this.isMoving = actorData.isMoving
        this.isAttacking = actorData.isAttacking
        this.isPoisoned = actorData.isPoisoned

        if (actorData.HasEscaped) {
            this.HasEscaped = actorData.HasEscaped
        }

        if (actorData.isDead) {
            this.isDead = actorData.isDead
        }
        
        if (this.HasEscaped || this.isDead )  {
            return
        }

        if (this.Type === "Player") {
          this.animateCharacter();
        } else if (this.Type === "Monster") {
          this.animateMonster();
        }

        if (this.isPoisoned) {
            SpiderWebAnimation(this)

            const distance = dist(player.pos.x, player.pos.y, this.pos.x, this.pos.y);
            if (distance < 30 && player.Type !== "Monster" && !player.isPoisoned) {
                if (this.RescueMessageIndex === null) { 
                    this.RescueMessageIndex = interfaceHandler.AddGameText(
                        "[Segure espaço para salvar seu amigo]",
                        .5,
                        .7
                    );
                    
                    minigame.configure(3000, () => {
                      this.replicaIsNotPoisoned()
                    });
                    minigame.canHoldSpace = true;
                }
            } else if (distance > 30) {
              if (this.RescueMessageIndex !== null) {
                interfaceHandler.RemoveGameText(this.RescueMessageIndex);
                this.RescueMessageIndex = null;
        
                minigame.canHoldSpace = false;
              }
            }
        }
      
        this.showName()

        if (debug.showHitbox) {
          const hitboxSize = this.w / 2;
          const hitboxX = this.pos.x - hitboxSize / 2;
          const hitboxY = this.pos.y - hitboxSize / 2;
          this.showHitbox(hitboxX, hitboxY,hitboxSize,hitboxSize);
        }
    }

    sprint() {
        if (this.Type == "Monster") return
        if (this.Stamina > 0) {
            this.Stamina -= 0.75;
            this.speed = debug.debugMode ? this.speed : MainCharacterSpeed * 2;
            this.isSprinting = true;
        } else {
            this.stopSprint();
        }
    }

    canStartSprint() {
        return this.Stamina >= this.MaxStamina * 0.2;
    }

    stopSprint() {
        this.isSprinting = false;
        this.speed = debug.debugMode ? this.speed : MainCharacterSpeed;
    }


    regenerateStamina() {
        if (!this.isSprinting && this.Stamina < this.MaxStamina) {
            this.Stamina += 0.1;
        }
        this.Stamina = constrain(this.Stamina, 0, this.MaxStamina);
    }


    move() {
        this.handlePoison()

        let dx = 0;
        let dy = 0;

        if (keyIsDown(SHIFT)) {
            if (this.isSprinting || this.canStartSprint()) {
                this.sprint();
            }
        } else {
            this.stopSprint();
        }

        this.regenerateStamina(); 
    
        if (millis() - this.lastDirectionChange > this.directionCooldown) {
            if (keyIsDown(87) || keyIsDown(UP_ARROW)) {
                dy -= this.speed;
                if (this.currentDirection !== "up") {
                    this.currentDirection = "up";
                    this.lastDirectionChange = millis();
                }
            } else if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) {
                dy += this.speed;
                if (this.currentDirection !== "down") {
                    this.currentDirection = "down";
                    this.lastDirectionChange = millis();
                }
            } else if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) {
                dx += this.speed;
                if (this.currentDirection !== "right") {
                    this.currentDirection = "right";
                    this.lastDirectionChange = millis();
                }
            } else if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) {
                dx -= this.speed;
                if (this.currentDirection !== "left") {
                    this.currentDirection = "left";
                    this.lastDirectionChange = millis();
                }
            }
        }
    
        if (this.canMove) {
            this.isMoving = dx !== 0 || dy !== 0;

            if (this.isMoving) {
                if (dx > 0 && dy === 0) this.currentDirection = "right";
                else if (dx < 0 && dy === 0) this.currentDirection = "left";
                else if (dy > 0 && dx === 0) this.currentDirection = "down";
                else if (dy < 0 && dx === 0) this.currentDirection = "up";
            }
        
    
            let [validMoveX, validMoveY] = debug.colission == false && debug.debugMode ? [true, true] : this.checkHitbox(dx, dy);
            if (validMoveX) this.pos.x += dx;
            if (validMoveY) this.pos.y += dy;
        }

    
        if (this.Type === "Player") {
            this.animateCharacter();
        } else if (this.Type === "Monster") {
            this.animateMonster();
        }
    
        if (debug.showHitbox) {
            let hitboxSize = this.w / 2;
            let hitboxX = this.pos.x - hitboxSize / 2;
            let hitboxY = this.pos.y - hitboxSize / 2;

            this.showHitbox(hitboxX,hitboxY,hitboxSize,hitboxSize);
        }

        this.replicaServer()
        this.renderLocalPlayer()

        if (this.isPoisoned) {
            SpiderWebAnimation(this)
        }
    }

    findClosestPlayer() {
        let closestPlayer = null;
        let minDistance = Infinity;
    
        for (let player of players) {
            if (!player.isPoisoned) {
                const distance = dist(this.pos.x, this.pos.y, player.pos.x, player.pos.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlayer = player;
                }
            } 
        }
    
        return closestPlayer;
    }

    setRandomTargetInMaze() {
        const randomX = Math.floor(random() * maze.cols);
        const randomY = Math.floor(random() * maze.rows);
        this.target = { x: randomX, y: randomY };
    }

    calculatePath(target) {
        const start = { x: Math.floor(this.pos.x / maze.cellSize), y: Math.floor(this.pos.y / maze.cellSize) };
        const end = { x: target.x, y: target.y };
        this.path = aStar(maze.grid, start, end);
        if (this.path.length > 0 && this.path[0].x === start.x && this.path[0].y === start.y) {
            this.path.shift();
        }
    }

    moveAI() {
        const detectionRadius = 70;
        const targetPlayer = this.findClosestPlayer();
        
        if (targetPlayer) {
            const playerDistance = dist(this.pos.x, this.pos.y, targetPlayer.pos.x, targetPlayer.pos.y);
    
            if (playerDistance <= detectionRadius) {
                this.target = {
                    x: Math.floor(targetPlayer.pos.x / maze.cellSize),
                    y: Math.floor(targetPlayer.pos.y / maze.cellSize),
                };
                this.isChasing = true;
                this.path = [];
            } else if (this.isChasing) {
                this.isChasing = false;
                this.target = null;
                this.path = [];
            }
                    
            const dx = targetPlayer.pos.x - this.pos.x;
            const dy = targetPlayer.pos.y - this.pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) {
                this.MonsterAttack()
            }
        } else {
            this.isChasing = false;
        }
    
        if (this.isChasing && this.target) {
            if (this.path.length === 0) {
                this.calculatePath(this.target);
            }

            this.FollowPath()
        } else {
            if (!this.target || this.path.length === 0) {
                this.setRandomTargetInMaze();
                this.calculatePath(this.target);
            }

            this.FollowPath()
        }

        if (debug.showHitbox) {
            let hitboxSize = this.w / 2;
            let hitboxX = this.pos.x - hitboxSize / 2;
            let hitboxY = this.pos.y - hitboxSize / 2;

            this.showHitbox(hitboxX,hitboxY,hitboxSize,hitboxSize);
        }
        
    
        this.animateMonster();
    }

    FollowPath() {
        if (this.path.length > 0) {
            const nextStep = this.path[0];
            const targetPos = {
                x: nextStep.x * maze.cellSize + maze.cellSize / 2,
                y: nextStep.y * maze.cellSize + maze.cellSize / 2,
            };
    
            const dx = targetPos.x - this.pos.x;
            const dy = targetPos.y - this.pos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
    
            this.isMoving = dx !== 0 || dy !== 0;

            
            if (distance < 0.5) {
                this.pos.x = targetPos.x;
                this.pos.y = targetPos.y;
                this.path.shift();
                return;
            }
    
            const targetVel = {
                x: (dx / distance) * this.speed,
                y: (dy / distance) * this.speed,
            };
    
            this.vel.x += (targetVel.x - this.vel.x) * 0.1;
            this.vel.y += (targetVel.y - this.vel.y) * 0.1;
    
            this.pos.x += this.vel.x;
            this.pos.y += this.vel.y;
    
            if (Math.abs(dx) > Math.abs(dy)) {
                this.currentDirection = dx > 0 ? "right" : "left";
            } else {
                this.currentDirection = dy > 0 ? "down" : "up";
            }
        } else {
            this.vel.x = 0;
            this.vel.y = 0;
        }
    }
    
    hasCollided() {
        let dx = 0, dy = 0;
    
        switch (this.currentDirection) {
            case "up":    dy = -this.speed; break;
            case "down":  dy = this.speed; break;
            case "left":  dx = -this.speed; break;
            case "right": dx = this.speed; break;
        }
    
        let [validMoveX, validMoveY] = this.checkHitbox(dx, dy);
    
        return !validMoveX || !validMoveY;
    }

    chooseNewDirection() {
        let possibleDirections = ["up", "down", "left", "right"];
        this.currentDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
        this.isMoving = true;
    }

    chooseDirectionTowards(target) {
        let dx = target.pos.x - this.pos.x;
        let dy = target.pos.y - this.pos.y;

        if (Math.abs(dx) > Math.abs(dy)) {
            this.currentDirection = dx > 0 ? "right" : "left";
        } else {
            this.currentDirection = dy > 0 ? "down" : "up";
        }
    
        this.isMoving = true;
    }

    handlePoison() {
        if (this.isPoisoned && Date.now() - this.lastPoisonTick > 1) {
            this.lastPoisonTick = Date.now();
            if (this.Health - this.poisonDamage < 0) {
                this.Health = 0;

                if (!this.isDead) {
                    window.Server.raiseEvent(40,{message: "O jogador " + window.Server.myActor().getCustomProperty("name") + " acabou de morrer!"})
                    this.isDead = true;
                }
            } else {
                this.Health -=  this.poisonDamage
            }
        }

        if (this.Health < this.MaxHealth && !this.isPoisoned && !this.isDead) {
            this.Health += this.regenerationRate;
    
            if (this.Health > this.MaxHealth) {
                this.Health = this.MaxHealth;
            }
        }
    }
    
    checkHitbox(dx, dy) {
        let nextX = this.pos.x + dx;
        let nextY = this.pos.y + dy;
    
        let cellX = floor(this.pos.x / this.w);
        let cellY = floor(this.pos.y / this.w);
    
        if (cellX < 0 || cellX >= this.grid.length || cellY < 0 || cellY >= this.grid[0].length) {
            return [false,false]
        }
    
        let cell = this.grid[cellX][cellY];
        let radius = this.w / 4;
        let hitboxSize = radius;
    
        let validMoveX = true;
        let validMoveY = true;
        if (dx > 0) {
            if (cell.walls[1] && nextX + hitboxSize > (cellX + 1) * this.w) validMoveX = false;
            let rightCell = this.grid[cellX + 1]?.[cellY];
            if (rightCell && rightCell.walls[3] && nextX + hitboxSize > (cellX + 1) * this.w) validMoveX = false;
        } else if (dx < 0) {
            if (cell.walls[3] && nextX - hitboxSize < cellX * this.w) validMoveX = false;
            let leftCell = this.grid[cellX - 1]?.[cellY];
            if (leftCell && leftCell.walls[1] && nextX - hitboxSize < cellX * this.w) validMoveX = false;
        }

        if (dy > 0) {
            if (cell.walls[2] && nextY + hitboxSize > (cellY + 1) * this.w) validMoveY = false;
            let bottomCell = this.grid[cellX]?.[cellY + 1];
            if (bottomCell && bottomCell.walls[0] && nextY + hitboxSize > (cellY + 1) * this.w) validMoveY = false;
        } else if (dy < 0) {
            if (cell.walls[0] && nextY - hitboxSize < cellY * this.w) validMoveY = false;
            let topCell = this.grid[cellX]?.[cellY - 1];
            if (topCell && topCell.walls[2] && nextY - hitboxSize < cellY * this.w) validMoveY = false;
        }

        return [validMoveX,validMoveY];
    }

    animateCharacter() {
        let spriteSheet = Sprites["MainCharacter"][this.currentDirection]
        if (this.isMoving) {
            if (millis() - this.lastFrameChange > 1000 / this.frameRate) {
                this.frameIndex = (this.frameIndex + 1) % this.frameCount;
                this.lastFrameChange = millis();
            }
        } else {
            this.frameIndex = 1;
        }
    
        let sx = this.frameIndex * this.spriteWidth;
        let drawX = this.pos.x - this.w / 2;
        let drawY = this.pos.y - this.w / 2;
    
        image(spriteSheet, drawX, drawY, this.w, this.w, sx, 0, this.spriteWidth, this.spriteHeight);
    }
    
    animateMonster(scaleFactor = 1.7, offsetX = 0, offsetY = -10) {
        if (this.isAttacking) {
            this.animateMonsterAttack()
            return;
        } 

        let spriteSheet = Sprites["Monster"]
        let frameBase = this.isMoving ? 5 : 5;
    
        if (this.isMoving) {
            if (this.isMoving && millis() - this.lastFrameChange > 1000 / this.frameRate) {
                this.frameIndex = ((this.frameIndex - frameBase + 1) % (10 - frameBase + 1)) + frameBase;
                this.lastFrameChange = millis();
            }
        
        } else {
            this.frameIndex = 7
        }

        let directionColumn = 
            this.currentDirection === "left" ? 0 : 
            this.currentDirection === "up" ? 2 : 
            this.currentDirection === "right" ? 4 : 
            6;
    
        let sx = this.frameIndex * this.spriteWidth;
        let sy = directionColumn * this.spriteHeight;
    
        let drawSize = this.w * scaleFactor;
        let drawX = this.pos.x - drawSize / 2 + offsetX;
        let drawY = this.pos.y - drawSize / 2 + offsetY;
    
        image(spriteSheet, drawX, drawY, drawSize, drawSize, sx, sy, this.spriteWidth, this.spriteHeight);
    }

    animateMonsterAttack(scaleFactor = 1.7, offsetX = 0, offsetY = -10) {
        let spriteSheet = Sprites["Monster"]
        let frameBase = 30;
    
        if (millis() - this.lastFrameChange > 1000 / this.frameRate) {
            this.frameIndex = ((this.frameIndex - frameBase + 1) % (32 - frameBase)) + frameBase;
            this.lastFrameChange = millis();
        }
    
        let directionColumn = 
            this.currentDirection === "left" ? 0 : 
            this.currentDirection === "up" ? 2 : 
            this.currentDirection === "right" ? 4 : 
            6;
    
        let sx = this.frameIndex * this.spriteWidth;
        let sy = directionColumn * this.spriteHeight;
    
        let drawSize = this.w * scaleFactor;
        let drawX = this.pos.x - drawSize / 2 + offsetX;
        let drawY = this.pos.y - drawSize / 2 + offsetY;
    
        image(spriteSheet, drawX, drawY, drawSize, drawSize, sx, sy, this.spriteWidth, this.spriteHeight);
    }


    MonsterAttack() {
        const attackRange = 50;
        const widthMultiplier = 1.2;
        const heightMultiplier = 1.1;
        const monsterWidth = this.w;
        const monsterHeight = this.w;

        let hitbox = {};

        switch (this.currentDirection) {
            case 'up':
                hitbox = {
                    x: this.pos.x - (monsterWidth * widthMultiplier) / 2,
                    y: this.pos.y - attackRange,
                    width: monsterWidth * widthMultiplier,
                    height: attackRange,
                };
                break;
            case 'down':
                hitbox = {
                    x: this.pos.x - (monsterWidth * widthMultiplier) / 2,
                    y: this.pos.y,
                    width: monsterWidth * widthMultiplier,
                    height: attackRange,
                };
                break;
            case 'left':
                hitbox = {
                    x: this.pos.x - attackRange,
                    y: this.pos.y - (monsterHeight * heightMultiplier) / 2,
                    width: attackRange,
                    height: monsterHeight * heightMultiplier,
                };
                break;
            case 'right':
                hitbox = {
                    x: this.pos.x,
                    y: this.pos.y - (monsterHeight * heightMultiplier) / 2,
                    width: attackRange,
                    height: monsterHeight * heightMultiplier,
                };
                break;
        }

        players.forEach(Player => {
            if (Player.playerData) {
                const playerX = Player.pos.x;
                const playerY = Player.pos.y;

                if (
                    playerX >= hitbox.x &&
                    playerX <= hitbox.x + hitbox.width &&
                    playerY >= hitbox.y &&
                    playerY <= hitbox.y + hitbox.height
                ) {
                    const dx = playerX - this.pos.x;
                    const dy = playerY - this.pos.y;

                    const [validMoveX, validMoveY] = this.checkHitbox(dx, dy);

                    if (validMoveX && validMoveY) {
                        Player.replicaIsPoisoned();
                    }
                }
            }
        });

        if (debug.showHitbox) {
            this.showHitbox(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        }
    }


    addItem(item) {
        if (!this.Inventory.includes(item)) {
            this.Inventory.push(item);
        }
    }

    hasItem(itemName) {
        return this.Inventory.includes(itemName);
    }
}
  