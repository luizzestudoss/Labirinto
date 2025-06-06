let random;

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

class MazeGenerator {
  constructor(cols, rows, seed, difficulty) {
    this.difficulty = difficulty

    this.cols = cols;
    this.rows = rows;
    this.cellSize = 40;
    this.seed = seed;
    this.grid = [];
    this.stack = [];
    this.current = null;
    this.clusters = [];
    this.maxClusterSize = Math.min(cols, rows) * 2;
    this.chest = null;
    this.lastChestOpened = null;
    this.hasChest = false;
    this.chestIndex = 0

    this.Door1 = null;
    this.Door2 = null;

    random = new Math.seedrandom(this.seed);
  }

  generateMaze() {
    for (let x = 0; x < this.cols; x++) {
      this.grid[x] = [];
      for (let y = 0; y < this.rows; y++) {
        let centerBoost = 1 - Math.hypot(x - this.cols / 2, y - this.rows / 2) / (Math.max(this.cols, this.rows) / 2);
        centerBoost = Math.pow(centerBoost, 2);
  
        let clusterProbability = random() + centerBoost * 2;
  
        if (centerBoost > 0.8) {
          clusterProbability = 1;
        }
  
        let inCluster = clusterProbability > 0.4;
  
        this.grid[x][y] = new Cell(x, y, this.cellSize, inCluster);
      }
    }
    
  
    this.current = this.grid[Math.floor(this.cols / 2)][Math.floor(this.rows / 2)];
    this.current.visited = true;
  
    while (this.stack.length > 0 || this.current) {
      let next = this.current.checkNeighbors(this.grid, this.cols, this.rows);
  
      if (next) {
        next.visited = true;
        if (this.current.inCluster || next.inCluster) {
          if (this.clusters.length < this.maxClusterSize) {
            this.current.markAsCluster();
            next.markAsCluster();
            this.clusters.push(this.current);
          } else {
            this.current.inCluster = false;
            next.inCluster = false;
          }
        }
  
        this.stack.push(this.current);
        this.removeWalls(this.current, next);
        this.current = next;
      } else if (this.stack.length > 0) {
        this.current = this.stack.pop();
      } else {
        this.current = null;
      }
    }
  
    this.createOpenAreas();
    this.addRandomDoors()
    this.addBorderWalls();
    this.ensureMultipleExits();
    this.generateChest()

    this.createLoops(this.difficulty);
  }
  
  generateChest() {
    if (this.hasChest) return;

    let possibleCells = [];
    const minDistance = 3;

    randomSeed(this.chestIndex);

    for (let x = 0; x < this.cols; x++) {
        for (let y = 0; y < this.rows; y++) {
            let cell = this.grid[x][y];

            if (cell.walls[0] && cell.walls[1] && !cell.walls[2] && cell.walls[3]) {
                let isFarEnough = true;

                if (this.lastChestOpened) {
                    let dx = cell.x - this.lastChestOpened.x;
                    let dy = cell.y - this.lastChestOpened.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < minDistance) {
                        isFarEnough = false;
                    }
                }

                if (isFarEnough) {
                    possibleCells.push(cell);
                }
            }
        }
    }

    if (possibleCells.length > 0) {
        let farthestCells = [];
        let maxDistance = -Infinity;

        if (this.lastChestOpened) {
            for (let cell of possibleCells) {
                let dx = cell.x - this.lastChestOpened.x;
                let dy = cell.y - this.lastChestOpened.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > maxDistance) {
                    maxDistance = distance;
                    farthestCells = [cell];
                } else if (distance === maxDistance) {
                    farthestCells.push(cell);
                }
            }
        } else {
            farthestCells = possibleCells;
        }

        let chosenIndex = this.chestIndex % farthestCells.length;
        let chosenCell = farthestCells[chosenIndex];

        let chestX = chosenCell.x;
        let chestY = chosenCell.y;

        this.chest = new Chest(chestX, chestY);
        this.hasChest = true;
    }
}


addRandomDoors() {
  const doorPositions = [
    [Math.floor(this.cols / 2), 0],
    [Math.floor(this.cols / 2), this.rows - 1],
    [0, Math.floor(this.rows / 2)],
    [this.cols - 1, Math.floor(this.rows / 2)]
  ];

  randomSeed(this.seed);

  let keys = ['Chave 1', 'Chave 2'];
  let availablePositions = [...doorPositions];

  for (let i = 0; i < 2; i++) {
    let randomIndex = Math.floor(random() * availablePositions.length);
    let pos = availablePositions.splice(randomIndex, 1)[0];

    let x = pos[0];
    let y = pos[1];

    let cell = this.grid[x][y];

    cell.isDoor = true;

    if (x === 0) cell.wallDoor = 3;
    if (y === 0) cell.wallDoor = 0;
    if (x === this.cols - 1) cell.wallDoor = 1;
    if (y === this.rows - 1) cell.wallDoor = 2;

    if (x === 0) cell.walls[3] = false;
    if (y === 0) cell.walls[0] = false;
    if (x === this.cols - 1) cell.walls[1] = false; 
    if (y === this.rows - 1) cell.walls[2] = false;

    cell.Door = new DoorHandler(cell.wallDoor, this.Door1 ? 2 : 1);
    cell.Door.assignKey(keys);

    if (!this.Door1) {
      this.Door1 = cell.Door;
    } else {
        this.Door2 = cell.Door;
      }
    }
}



  createLoops(probability) {
    for (let x = 1; x < this.cols - 1; x++) {
      for (let y = 1; y < this.rows - 1; y++) {
        let cell = this.grid[x][y];
        let neighbors = [
          this.grid[x - 1][y],
          this.grid[x + 1][y],
          this.grid[x][y - 1],
          this.grid[x][y + 1],
        ].filter(Boolean);
  
        if (random() < probability) {
          let neighbor = neighbors[Math.floor(random() * neighbors.length)];
          this.removeWalls(cell, neighbor);
        }
      }
    }
  }
  

  createOpenAreas() {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        let cell = this.grid[x][y];
        if (cell.inCluster) {
          cell.walls = [false, false, false, false];
        }
      }
    }
  } 


  RenderServerReplication() {
    if (window.Server.chestIndex !== this.chestIndex) {
        this.chestIndex = window.Server.chestIndex;

        this.chest.isOpened = true;
        this.lastChestOpened = this.chest;

        this.chest = null;
        this.hasChest = false;

        this.generateChest();
    }

    if (this.chest && this.chest.isOpened) {
        this.hasChest = false;
        
        window.Server.raiseEvent(10);

        this.lastChestOpened = this.chest;
        this.chest = null;

        this.chestIndex++;
        window.Server.chestIndex = this.chestIndex;

        this.generateChest();
    }

    if (window.Server.Doors[1] && !this.Door1.Opened) {
        this.Door1.Opened = true;
    }

    if (window.Server.Doors[2] && !this.Door2.Opened) {
        this.Door2.Opened = true;
    }
}

  addBorderWalls() {
    for (let x = 0; x < this.cols; x++) {
      for (let y = 0; y < this.rows; y++) {
        let cell = this.grid[x][y];
        if (x === 0) cell.walls[3] = true;
        if (y === 0) cell.walls[0] = true;
        if (x === this.cols - 1) cell.walls[1] = true;
        if (y === this.rows - 1) cell.walls[2] = true;
      }
    }
  }

  ensureMultipleExits() {
    const centerX = Math.floor(this.cols / 2);
    const centerY = Math.floor(this.rows / 2);
  
    const centerCells = [
      this.grid[centerX][centerY],
      this.grid[centerX - 1]?.[centerY],
      this.grid[centerX + 1]?.[centerY],
      this.grid[centerX]?.[centerY - 1],
      this.grid[centerX]?.[centerY + 1],
    ].filter(Boolean);
  
    for (let cell of centerCells) {
      const neighbors = [
        this.grid[cell.x - 1]?.[cell.y],
        this.grid[cell.x + 1]?.[cell.y],
        this.grid[cell.x]?.[cell.y - 1],
        this.grid[cell.x]?.[cell.y + 1],
      ].filter(Boolean);
  
      let connections = 0;
      for (let neighbor of neighbors) {
        if (connections >= 2) break;
        if (neighbor && !neighbor.inCluster) {
          this.removeWalls(cell, neighbor);
          connections++;
        }
      }
    }
  }
  
  isValidCell(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
        return false;
    }

    return this.grid[y][x] === 0;
}

  removeWalls(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;

    if (dx === 1) {
      a.walls[3] = false;
      b.walls[1] = false;
    } else if (dx === -1) {
      a.walls[1] = false;
      b.walls[3] = false;
    }
    if (dy === 1) {
      a.walls[0] = false;
      b.walls[2] = false;
    } else if (dy === -1) {
      a.walls[2] = false;
      b.walls[0] = false;
    }
    
  }

  render() {
    this.RenderServerReplication()

    let visibleWidth = Math.ceil(windowWidth / (this.cellSize * camera.zoom));
    let visibleHeight = Math.ceil(windowHeight / (this.cellSize * camera.zoom));
  
    let centerX = Math.floor(player.pos.x / this.cellSize);
    let centerY = Math.floor(player.pos.y / this.cellSize);
  
    let startX = Math.max(0, centerX - Math.ceil(visibleWidth / 2));
    let endX = Math.min(this.cols - 1, centerX + Math.ceil(visibleWidth / 2));
    let startY = Math.max(0, centerY - Math.ceil(visibleHeight / 2));
    let endY = Math.min(this.rows - 1, centerY + Math.ceil(visibleHeight / 2));
  
    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        this.grid[x][y].show();
      }
    }

    if (this.chest) {
      this.chest.show()
    }

    if (this.lastChestOpened ) {
      this.lastChestOpened.show()
    }

  }

  noise(x, y) {
    return (random() * 2 - 1) * Math.abs(Math.sin(x * y));
  }
  
}

class Cell {
  constructor(x, y, size, inCluster) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.walls = [true, true, true, true];
    this.visited = false;
    this.inCluster = inCluster;
  }

  getNeighbors(grid) {
    let neighbors = [];
    if (!this.walls[0] && grid[this.x]?.[this.y - 1]) neighbors.push(grid[this.x][this.y - 1]);
    if (!this.walls[1] && grid[this.x + 1]?.[this.y]) neighbors.push(grid[this.x + 1][this.y]);
    if (!this.walls[2] && grid[this.x]?.[this.y + 1]) neighbors.push(grid[this.x][this.y + 1]);
    if (!this.walls[3] && grid[this.x - 1]?.[this.y]) neighbors.push(grid[this.x - 1][this.y]);
    return neighbors;
}

  checkNeighbors(grid, cols, rows) {
    let neighbors = [];
    let top = this.index(this.x, this.y - 1, grid);
    let right = this.index(this.x + 1, this.y, grid);
    let bottom = this.index(this.x, this.y + 1, grid);
    let left = this.index(this.x - 1, this.y, grid);
  
    if (top && !top.visited) neighbors.push(top);
    if (right && !right.visited) neighbors.push(right);
    if (bottom && !bottom.visited) neighbors.push(bottom);
    if (left && !left.visited) neighbors.push(left);
  
    return neighbors.length > 0 ? neighbors[Math.floor(random() * neighbors.length)] : undefined;
  }

  index(x, y, grid) {
    if (x < 0 || y < 0 || x >= grid.length || y >= grid[0].length) {
      return null;
    }
    return grid[x][y];
  }

  markAsCluster() {
    this.inCluster = true;
  }

  show() {
    const x = this.x * this.size;
    const y = this.y * this.size;
    let size = this.size

    image(Textures["FloorTexture"], x, y, this.size, this.size);

    noStroke();
    if (this.isDoor) {
      this.Door.render(x,y,size)
    } else {
      if (this.walls[0]) image(Textures["WallTexture"], x, y, size, size / 10);
      if (this.walls[1]) image(Textures["WallTexture"], x + size - size / 10, y, size / 10, size);
      if (this.walls[2]) image(Textures["WallTexture"], x, y + size - size / 10, size, size / 10);
      if (this.walls[3]) image(Textures["WallTexture"], x, y, size / 10, size);  
    }
  }
}