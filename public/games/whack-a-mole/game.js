class WhackAMoleGame extends Phaser.Scene {
  constructor() {
    super({ key: 'WhackAMoleGame' });
    this.gameConfig = window.GAME_CONFIG || {};
    if (!this.gameConfig.assets) this.gameConfig.assets = {};
    if (!this.gameConfig.parameters) this.gameConfig.parameters = {};

    this.score = 0;
    this.moles = [];
    this.holes = [];
    this.timeLeft = 30; // Shorter game time
    this.isGameOver = false;
  }

  preload() {
    if (this.gameConfig.assets && this.gameConfig.assets.player) {
      const asset = this.gameConfig.assets.player;
      if (asset.startsWith('data:')) {
        this.textures.addBase64('mole', asset);
      } else {
        this.load.image('mole', asset);
      }
    }
    if (this.gameConfig.assets.background) {
      this.load.image('background', this.gameConfig.assets.background);
    }
    
    this.load.image('mole-default', '/games/whack-a-mole/assets/mole.png');
    this.load.image('hole-default', '/games/whack-a-mole/assets/hole.png');
    this.load.image('background-default', '/games/whack-a-mole/assets/background.png');
    this.load.image('hammer', '/games/whack-a-mole/assets/hammer.png');
  }

  create() {
    const moleAsset = this.textures.exists('mole') ? 'mole' : 'mole-default';
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    
    this.add.image(400, 300, bgAsset);
    
    const positions = [
      { x: 200, y: 250 }, { x: 400, y: 250 }, { x: 600, y: 250 },
      { x: 200, y: 400 }, { x: 400, y: 400 }, { x: 600, y: 400 },
    ];
    
    positions.forEach((pos) => {
      this.add.image(pos.x, pos.y, 'hole-default');
      const mole = this.add.sprite(pos.x, pos.y - 20, moleAsset);
      mole.setInteractive();
      mole.setVisible(false);
      mole.on('pointerdown', () => this.whackMole(mole));
      this.moles.push(mole);
    });
    
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });
    
    this.timerText = this.add.text(784, 16, 'Time: ' + this.timeLeft, { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(1, 0);
    
    this.moleTimer = this.time.addEvent({
      delay: this.gameConfig.parameters.spawnRate || 1000,
      callback: this.showRandomMole,
      callbackScope: this,
      loop: true
    });
    
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true
    });
    
    this.input.setDefaultCursor('url(/games/whack-a-mole/assets/hammer.png), pointer');
  }

  showRandomMole() {
    if (this.isGameOver) return;
    const availableMoles = this.moles.filter(mole => !mole.visible);
    if (availableMoles.length === 0) return;
    
    const randomMole = Phaser.Utils.Array.GetRandom(availableMoles);
    randomMole.setVisible(true);
    randomMole.setData('out', true); // Mark as out
    
    const hideDelay = this.gameConfig.parameters.moleUpTime || 800;
    this.time.delayedCall(hideDelay, () => {
      if (randomMole.getData('out')) {
        randomMole.setVisible(false);
        randomMole.setData('out', false);
      }
    });
  }

  whackMole(mole) {
    if (mole.visible && mole.getData('out')) {
      mole.setVisible(false);
      mole.setData('out', false); // Mark as whacked
      this.score++;
      this.scoreText.setText('Score: ' + this.score);
      
      const hitText = this.add.text(mole.x, mole.y - 50, '+1', { fontSize: '24px', fill: '#ffdd00', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);
      this.tweens.add({
          targets: hitText,
          y: hitText.y - 50,
          alpha: 0,
          duration: 500,
          onComplete: () => hitText.destroy()
      });
    }
  }

  updateTimer() {
    if (this.isGameOver) return;
    this.timeLeft--;
    this.timerText.setText('Time: ' + this.timeLeft);
    
    if (this.timeLeft <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.moleTimer.remove(false);
    this.gameTimer.remove(false);

    this.add.text(400, 300, 'Game Over!\nFinal Score: ' + this.score, {
      fontSize: '48px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5);
    
    this.time.delayedCall(2000, () => this.scene.restart());
  }
}

const phaserGameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    scene: [WhackAMoleGame]
};

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    new Phaser.Game(phaserGameConfig);
} else {
    document.addEventListener('DOMContentLoaded', () => new Phaser.Game(phaserGameConfig));
}
