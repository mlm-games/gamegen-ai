class Match3Game extends Phaser.Scene {
  constructor(config) {
    super({ key: 'Match3Game' });
    this.gameConfig = config;
    this.score = 0;
    this.grid = [];
    this.gridSize = 8;
    this.tileSize = 64;
    this.selectedTile = null;
    this.canMove = true;
  }

  preload() {
    // Load custom assets
    if (this.gameConfig.assets.items && this.gameConfig.assets.items.length > 0) {
      this.gameConfig.assets.items.forEach((item, index) => {
        this.load.image('gem' + index, item);
      });
    }
    if (this.gameConfig.assets.background) {
      this.load.image('background', this.gameConfig.assets.background);
    }
    
    // Load default gems
    const colors = ['red', 'blue', 'green', 'yellow', 'purple'];
    colors.forEach((color, index) => {
      this.load.image('gem-default' + index, `/games/match-3/assets/gem-${color}.png`);
    });
    this.load.image('background-default', '/games/match-3/assets/background.png');
  }

  create() {
    // Background
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    this.add.image(400, 300, bgAsset);
    
    // Create grid
    const startX = 400 - (this.gridSize * this.tileSize) / 2 + this.tileSize / 2;
    const startY = 300 - (this.gridSize * this.tileSize) / 2 + this.tileSize / 2;
    
    for (let row = 0; row < this.gridSize; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.gridSize; col++) {
        const gemType = Phaser.Math.Between(0, 4);
        const gemAsset = this.textures.exists('gem' + gemType) ? 'gem' + gemType : 'gem-default' + gemType;
        
        const gem = this.add.sprite(
          startX + col * this.tileSize,
          startY + row * this.tileSize,
          gemAsset
        );
        
        gem.setInteractive();
        gem.setScale(0.8);
        gem.gridX = col;
        gem.gridY = row;
        gem.gemType = gemType;
        
        gem.on('pointerdown', () => this.selectTile(gem));
        
        this.grid[row][col] = gem;
      }
    }
    
    // Score
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });
    
    // Check for initial matches
    this.time.delayedCall(500, () => this.checkMatches());
  }

  selectTile(tile) {
    if (!this.canMove) return;
    
    if (!this.selectedTile) {
      this.selectedTile = tile;
      tile.setTint(0x00ff00);
    } else {
      // Check if adjacent
      const dx = Math.abs(tile.gridX - this.selectedTile.gridX);
      const dy = Math.abs(tile.gridY - this.selectedTile.gridY);
      
      if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
        this.swapTiles(this.selectedTile, tile);
      }
      
      this.selectedTile.clearTint();
      this.selectedTile = null;
    }
  }

  swapTiles(tile1, tile2) {
    this.canMove = false;
    
    // Swap positions
    const tempX = tile1.x;
    const tempY = tile1.y;
    
    this.tweens.add({
      targets: tile1,
      x: tile2.x,
      y: tile2.y,
      duration: 300,
      ease: 'Power2'
    });
    
    this.tweens.add({
      targets: tile2,
      x: tempX,
      y: tempY,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        // Swap in grid
        this.grid[tile1.gridY][tile1.gridX] = tile2;
        this.grid[tile2.gridY][tile2.gridX] = tile1;
        
        // Swap grid positions
        const tempGridX = tile1.gridX;
        const tempGridY = tile1.gridY;
        tile1.gridX = tile2.gridX;
        tile1.gridY = tile2.gridY;
        tile2.gridX = tempGridX;
        tile2.gridY = tempGridY;
        
        // Check for matches
        const matches = this.checkMatches();
        if (matches.length === 0) {
          // Swap back if no matches
          this.swapTiles(tile1, tile2);
        } else {
          this.canMove = true;
        }
      }
    });
  }

  checkMatches() {
    const matches = [];
    
    // Check horizontal matches
    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize - 2; col++) {
        const gem1 = this.grid[row][col];
        const gem2 = this.grid[row][col + 1];
        const gem3 = this.grid[row][col + 2];
        
        if (gem1.gemType === gem2.gemType && gem2.gemType === gem3.gemType) {
          if (!matches.includes(gem1)) matches.push(gem1);
          if (!matches.includes(gem2)) matches.push(gem2);
          if (!matches.includes(gem3)) matches.push(gem3);
        }
      }
    }
    
    // Check vertical matches
    for (let col = 0; col < this.gridSize; col++) {
      for (let row = 0; row < this.gridSize - 2; row++) {
        const gem1 = this.grid[row][col];
        const gem2 = this.grid[row + 1][col];
        const gem3 = this.grid[row + 2][col];
        
        if (gem1.gemType === gem2.gemType && gem2.gemType === gem3.gemType) {
          if (!matches.includes(gem1)) matches.push(gem1);
          if (!matches.includes(gem2)) matches.push(gem2);
          if (!matches.includes(gem3)) matches.push(gem3);
        }
      }
    }
    
    if (matches.length > 0) {
      this.removeMatches(matches);
    }
    
    return matches;
  }

  removeMatches(matches) {
    this.score += matches.length * 10;
    this.scoreText.setText('Score: ' + this.score);
    
    matches.forEach(gem => {
      this.tweens.add({
        targets: gem,
        alpha: 0,
        scale: 0,
        duration: 300,
        onComplete: () => {
          gem.destroy();
        }
      });
    });
    
    this.time.delayedCall(400, () => this.dropGems());
  }

  dropGems() {
    // Implementation for dropping gems would go here
    // For simplicity, we'll just refill the board
    this.canMove = true;
  }
}

class GameMain {
  constructor(config) {
    const phaserConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: 'game-container',
      scene: new Match3Game(config)
    };
    
    this.game = new Phaser.Game(phaserConfig);
  }
}
