class Match3Game extends Phaser.Scene {
  constructor() {
    super({ key: 'Match3Game' });
    this.gameConfig = window.GAME_CONFIG || {};
    if (!this.gameConfig.assets) this.gameConfig.assets = {};
    if (!this.gameConfig.parameters) this.gameConfig.parameters = {};

    this.score = 0;
    this.gridSize = this.gameConfig.parameters.gridSize || 8;
    this.tileSize = 500 / this.gridSize;
    this.gemTypes = 5;
    
    this.grid = [];
    this.gems = null;
    this.selectedGem = null;
    this.canMove = false;
  }

  preload() {
    if (this.gameConfig.assets.items && this.gameConfig.assets.items.length > 0) {
      this.gameConfig.assets.items.forEach((item, index) => {
        if (item.startsWith('data:')) {
          this.textures.addBase64('gem' + index, item);
        } else {
          this.load.image('gem' + index, item);
        }
      });
      this.gemTypes = this.gameConfig.assets.items.length;
    }
    if (this.gameConfig.assets.background) {
      this.load.image('background', this.gameConfig.assets.background);
    }
    
    const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'orange'];
    colors.forEach((color, index) => {
      this.load.image('gem-default' + index, `/games/match-3/assets/gem-${color}.png`);
    });
    this.load.image('background-default', '/games/match-3/assets/background.png');
  }

  create() {
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    this.add.image(400, 300, bgAsset).setDisplaySize(800, 600);
    
    this.grid = Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(null));
    this.gems = this.add.group();
    
    this.drawGrid();
    
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });
    
    this.input.on('gameobjectdown', this.selectGem, this);
  }

  drawGrid() {
    const startX = 400 - (this.gridSize * this.tileSize) / 2;
    const startY = 300 - (this.gridSize * this.tileSize) / 2;
    
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        let gemType;
        do {
          gemType = Phaser.Math.Between(0, this.gemTypes - 1);
        } while ((col >= 2 && this.grid[row][col-1]?.type === gemType && this.grid[row][col-2]?.type === gemType) ||
                 (row >= 2 && this.grid[row-1][col]?.type === gemType && this.grid[row-2][col]?.type === gemType));
        
        const gem = this.addGem(row, col, gemType, startX, startY);
        this.grid[row][col] = gem;
      }
    }
    this.canMove = true;
  }
  
  addGem(row, col, type, startX, startY) {
      const gemAsset = this.textures.exists('gem' + type) ? 'gem' + type : 'gem-default' + type;
      const x = startX + col * this.tileSize + this.tileSize / 2;
      const y = startY + row * this.tileSize + this.tileSize / 2;
      const gem = this.gems.create(x, y, gemAsset);
      gem.setDisplaySize(this.tileSize * 0.9, this.tileSize * 0.9);
      gem.setInteractive();
      gem.type = type;
      gem.gridPos = { row, col };
      return gem;
  }

  selectGem(pointer, gem) {
    if (!this.canMove) return;

    if (!this.selectedGem) {
      this.selectedGem = gem;
      this.selectedGem.setScale(this.selectedGem.scale * 1.2);
    } else {
      if (this.isAdjacent(this.selectedGem, gem)) {
        this.selectedGem.setScale(this.selectedGem.scale / 1.2);
        this.swapGems(this.selectedGem, gem);
        this.selectedGem = null;
      } else {
        this.selectedGem.setScale(this.selectedGem.scale / 1.2);
        this.selectedGem = gem;
        this.selectedGem.setScale(this.selectedGem.scale * 1.2);
      }
    }
  }

  isAdjacent(gem1, gem2) {
      const { row: r1, col: c1 } = gem1.gridPos;
      const { row: r2, col: c2 } = gem2.gridPos;
      return (Math.abs(r1 - r2) === 1 && c1 === c2) || (Math.abs(c1 - c2) === 1 && r1 === r2);
  }

  swapGems(gem1, gem2, isUndo = false) {
    this.canMove = false;
    
    const { row: r1, col: c1 } = gem1.gridPos;
    const { row: r2, col: c2 } = gem2.gridPos;
    
    this.grid[r1][c1] = gem2;
    this.grid[r2][c2] = gem1;
    gem1.gridPos = { row: r2, col: c2 };
    gem2.gridPos = { row: r1, col: c1 };

    this.tweens.add({
      targets: gem1,
      x: gem2.x, y: gem2.y,
      duration: 300, ease: 'Power2'
    });
    this.tweens.add({
      targets: gem2,
      x: gem1.x, y: gem1.y,
      duration: 300, ease: 'Power2',
      onComplete: () => {
        const matches = this.findMatches();
        if (matches.length > 0) {
          this.handleMatches(matches);
        } else if (!isUndo) {
          this.swapGems(gem1, gem2, true); // Undo swap
        } else {
          this.canMove = true;
        }
      }
    });
  }

  findMatches() {
    const matches = new Set();
    // Horizontal
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize - 2; col++) {
        if (this.grid[row][col] && this.grid[row][col+1] && this.grid[row][col+2]) {
          if (this.grid[row][col].type === this.grid[row][col+1].type && this.grid[row][col+1].type === this.grid[row][col+2].type) {
            matches.add(this.grid[row][col]).add(this.grid[row][col+1]).add(this.grid[row][col+2]);
          }
        }
      }
    }
    // Vertical
    for (let col = 0; col < this.gridSize; col++) {
      for (let row = 0; row < this.gridSize - 2; row++) {
        if (this.grid[row][col] && this.grid[row+1][col] && this.grid[row+2][col]) {
          if (this.grid[row][col].type === this.grid[row+1][col].type && this.grid[row+1][col].type === this.grid[row+2][col].type) {
            matches.add(this.grid[row][col]).add(this.grid[row+1][col]).add(this.grid[row+2][col]);
          }
        }
      }
    }
    return Array.from(matches);
  }

  handleMatches(matches) {
    this.score += matches.length * 10;
    this.scoreText.setText('Score: ' + this.score);

    matches.forEach(gem => {
      this.grid[gem.gridPos.row][gem.gridPos.col] = null;
      this.tweens.add({
        targets: gem,
        alpha: 0, scale: 0,
        duration: 300,
        onComplete: () => gem.destroy()
      });
    });
    
    this.time.delayedCall(350, this.refillGrid, [], this);
  }

  refillGrid() {
    const startX = 400 - (this.gridSize * this.tileSize) / 2;
    const startY = 300 - (this.gridSize * this.tileSize) / 2;
    let gemsMoved = 0;

    // Drop existing gems down
    for (let col = 0; col < this.gridSize; col++) {
      let emptySlots = 0;
      for (let row = this.gridSize - 1; row >= 0; row--) {
        if (this.grid[row][col] === null) {
          emptySlots++;
        } else if (emptySlots > 0) {
          const gem = this.grid[row][col];
          const newRow = row + emptySlots;
          this.grid[newRow][col] = gem;
          this.grid[row][col] = null;
          gem.gridPos.row = newRow;
          
          this.tweens.add({
            targets: gem,
            y: startY + newRow * this.tileSize + this.tileSize/2,
            duration: 200 * emptySlots,
            ease: 'Power1',
            onComplete: () => gemsMoved--
          });
          gemsMoved++;
        }
      }
    }

    // Add new gems from the top
    for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
            if(this.grid[row][col] === null) {
                const gemType = Phaser.Math.Between(0, this.gemTypes - 1);
                const gem = this.addGem(row, col, gemType, startX, startY);
                gem.y = startY - this.tileSize;
                this.grid[row][col] = gem;
                
                this.tweens.add({
                    targets: gem,
                    y: startY + row * this.tileSize + this.tileSize / 2,
                    duration: 400,
                    ease: 'Power1',
                    delay: 100 * row,
                    onComplete: () => gemsMoved--
                });
                gemsMoved++;
            }
        }
    }

    // After refill, check for new matches
    const checkAgain = () => {
        if (gemsMoved === 0) {
            const newMatches = this.findMatches();
            if (newMatches.length > 0) {
                this.handleMatches(newMatches);
            } else {
                this.canMove = true;
            }
        } else {
            this.time.delayedCall(100, checkAgain, [], this);
        }
    }
    this.time.delayedCall(100, checkAgain, [], this);
  }
}

const phaserGameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2d3748',
    scene: [Match3Game]
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    new Phaser.Game(phaserGameConfig);
} else {
    document.addEventListener('DOMContentLoaded', () => new Phaser.Game(phaserGameConfig));
}
