class WhackAMoleGame extends Phaser.Scene {
  constructor(config) {
    super({ key: 'WhackAMoleGame' });
    this.gameConfig = config;
    this.score = 0;
    this.moles = [];
    this.holes = [];
    this.timeLeft = 60;
  }

  preload() {
   
    if (this.gameConfig.assets.player) {
      this.load.image('mole', this.gameConfig.assets.player);
    }
    if (this.gameConfig.assets.background) {
      this.load.image('background', this.gameConfig.assets.background);
    }
    
   
    this.load.image('mole-default', '/games/whack-a-mole/assets/mole.png');
    this.load.image('hole-default', '/games/whack-a-mole/assets/hole.png');
    this.load.image('background-default', '/games/whack-a-mole/assets/background.png');
  }

  create() {
   
    const moleAsset = this.textures.exists('mole') ? 'mole' : 'mole-default';
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    
   
    this.add.image(400, 300, bgAsset);
    
   
    const positions = [
      { x: 200, y: 200 }, { x: 400, y: 200 }, { x: 600, y: 200 },
      { x: 200, y: 350 }, { x: 400, y: 350 }, { x: 600, y: 350 },
      { x: 200, y: 500 }, { x: 400, y: 500 }, { x: 600, y: 500 }
    ];
    
    positions.forEach((pos, index) => {
     
      const hole = this.add.image(pos.x, pos.y, 'hole-default');
      this.holes.push(hole);
      
     
      const mole = this.add.sprite(pos.x, pos.y + 30, moleAsset);
      mole.setInteractive();
      mole.setScale(0.8);
      mole.setVisible(false);
      mole.on('pointerdown', () => this.whackMole(index));
      this.moles.push(mole);
    });
    
   
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });
    
   
    this.timerText = this.add.text(784, 16, 'Time: 60', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4,
      origin: { x: 1, y: 0 }
    });
    
   
    this.time.addEvent({
      delay: this.gameConfig.parameters.spawnRate || 1000,
      callback: () => this.showRandomMole(),
      callbackScope: this,
      loop: true
    });
    
   
    this.time.addEvent({
      delay: 1000,
      callback: () => this.updateTimer(),
      callbackScope: this,
      loop: true
    });
    
   
    this.input.setDefaultCursor('crosshair');
  }

  showRandomMole() {
    const availableMoles = this.moles.filter(mole => !mole.visible);
    if (availableMoles.length === 0) return;
    
    const randomMole = Phaser.Utils.Array.GetRandom(availableMoles);
    randomMole.setVisible(true);
    
   
    const hideDelay = this.gameConfig.parameters.moleUpTime || 1500;
    this.time.delayedCall(hideDelay, () => {
      if (randomMole.visible) {
        randomMole.setVisible(false);
      }
    });
  }

  whackMole(index) {
    if (this.moles[index].visible) {
      this.moles[index].setVisible(false);
      this.score++;
      this.scoreText.setText('Score: ' + this.score);
      
     
      const mole = this.moles[index];
      this.tweens.add({
        targets: mole,
        scaleX: 1.2,
        scaleY: 0.8,
        duration: 100,
        yoyo: true
      });
    }
  }

  updateTimer() {
    this.timeLeft--;
    this.timerText.setText('Time: ' + this.timeLeft);
    
    if (this.timeLeft <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.add.text(400, 300, 'Game Over!\nFinal Score: ' + this.score, {
      fontSize: '48px',
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 6,
      align: 'center'
    }).setOrigin(0.5);
    
    this.scene.pause();
  }
}

const phaserGameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: { default: 'arcade' },
    scene: [WhackAMoleGame]
};
new Phaser.Game(phaserGameConfig);
