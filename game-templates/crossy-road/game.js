class CrossyRoadGame extends Phaser.Scene {
  constructor() {
    super({ key: 'CrossyRoadGame' });
    this.gameConfig = window.GAME_CONFIG || {};
    if (!this.gameConfig.assets) this.gameConfig.assets = {};
    if (!this.gameConfig.parameters) this.gameConfig.parameters = {};

    this.score = 0;
    this.lanes = [];
    this.vehicles = null; // Will be initialized as a group in create()
    this.canMove = true;
  }

  preload() {
    if (this.gameConfig.assets && this.gameConfig.assets.player) {
      const asset = this.gameConfig.assets.player;
      if (asset.startsWith('data:')) {
        this.textures.addBase64('player', asset);
      } else {
        this.load.image('player', asset);
      }
    }
    if (this.gameConfig.assets.background) {
      this.load.image('background', this.gameConfig.assets.background);
    }
    if (this.gameConfig.assets.obstacles && this.gameConfig.assets.obstacles[0]) {
      this.load.image('vehicle', this.gameConfig.assets.obstacles[0]);
    }

    this.load.image('player-default', '/games/crossy-road/assets/chicken.png');
    this.load.image('background-default', '/games/crossy-road/assets/background.png');
    this.load.image('vehicle-default', '/games/crossy-road/assets/car.png');
    this.load.image('road-default', '/games/crossy-road/assets/road.png');
    this.load.image('grass-default', '/games/crossy-road/assets/grass.png');
  }

  create() {
    const playerAsset = this.textures.exists('player') ? 'player' : 'player-default';
    const bgAsset = this.textures.exists('background') ? 'background' : 'background-default';
    const vehicleAsset = this.textures.exists('vehicle') ? 'vehicle' : 'vehicle-default';

    this.add.image(400, 300, bgAsset);

    // Create lanes
    for (let i = 0; i < 12; i++) {
      const y = 575 - i * 50;
      const isRoad = i > 0 && i < 11 && i % 2 !== 0;
      
      if (isRoad) {
        this.add.tileSprite(400, y, 800, 50, 'road-default');
        this.lanes.push({ y: y, type: 'road', speed: Phaser.Math.Between(100, 200) * (Math.random() > 0.5 ? 1 : -1) });
      } else {
        this.add.tileSprite(400, y, 800, 50, 'grass-default');
        this.lanes.push({ y: y, type: 'grass', speed: 0 });
      }
    }

    this.player = this.physics.add.sprite(400, 575, playerAsset);
    this.player.setScale(0.8);
    this.player.setDepth(10);
    this.player.setCollideWorldBounds(true);

    this.vehicles = this.physics.add.group();

    this.time.addEvent({
      delay: this.gameConfig.parameters.spawnRate || 1000,
      callback: () => this.spawnVehicle(vehicleAsset),
      callbackScope: this,
      loop: true
    });
    
    this.scoreText = this.add.text(16, 16, 'Score: 0', { 
      fontSize: '32px', 
      fill: '#fff',
      stroke: '#000',
      strokeThickness: 4
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.on('pointerdown', (pointer) => this.handleTouch(pointer));
    
    this.physics.add.overlap(this.player, this.vehicles, () => this.gameOver(), null, this);
  }

  update() {
    if (this.canMove) {
      if (!this.cursors) return;
      if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.movePlayer(0, -50);
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        this.movePlayer(0, 50);
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.movePlayer(-50, 0);
      } else if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.movePlayer(50, 0);
      }
    }
    
    this.vehicles.children.entries.forEach(vehicle => {
      if (vehicle.x < -100 && vehicle.body.velocity.x < 0) {
        vehicle.destroy();
      } else if (vehicle.x > 900 && vehicle.body.velocity.x > 0) {
        vehicle.destroy();
      }
    });
  }

  handleTouch(pointer) {
    if (!this.canMove) return;
    
    const dx = pointer.x - this.player.x;
    const dy = pointer.y - this.player.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      if (Math.abs(dx) > 25) this.movePlayer(dx > 0 ? 50 : -50, 0);
    } else {
      if (Math.abs(dy) > 25) this.movePlayer(0, dy > 0 ? 50 : -50);
    }
  }

  movePlayer(dx, dy) {
    this.canMove = false;
    
    const newX = this.player.x + dx;
    const newY = this.player.y + dy;
    
    if (newY < 25) { // Win condition
        this.winGame();
        return;
    }
    
    if (dy < 0) {
      this.score++;
      this.scoreText.setText('Score: ' + this.score);
    }
    
    this.tweens.add({
      targets: this.player,
      x: newX,
      y: newY,
      duration: 150,
      ease: 'Linear',
      onComplete: () => {
        this.canMove = true;
      }
    });
  }

  spawnVehicle(vehicleAsset) {
    const roadLanes = this.lanes.filter(lane => lane.type === 'road');
    if (roadLanes.length === 0) return;
    
    const lane = Phaser.Utils.Array.GetRandom(roadLanes);
    const speed = lane.speed || (this.gameConfig.parameters.speed || 150) * (Math.random() > 0.5 ? 1 : -1);
    const side = speed > 0 ? -50 : 850;
    
    const vehicle = this.vehicles.create(side, lane.y, vehicleAsset);
    vehicle.setVelocityX(speed);
    
    if (speed < 0) {
      vehicle.setFlipX(true);
    }
  }
  
  showEndMessage(message) {
      this.canMove = false;
      this.physics.pause();
      
      this.add.text(400, 300, message, {
          fontSize: '48px',
          fill: '#fff',
          stroke: '#000',
          strokeThickness: 6,
          align: 'center'
      }).setOrigin(0.5);
      
      this.time.delayedCall(2000, () => {
          this.scene.restart();
      });
  }

  gameOver() {
      if (!this.canMove) return;
      this.showEndMessage('Game Over!\nScore: ' + this.score);
  }

  winGame() {
      if (!this.canMove) return;
      this.score += 100; // Bonus for winning
      this.showEndMessage('You Made It!\nScore: ' + this.score);
  }
}

const phaserGameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [CrossyRoadGame]
};

// This wrapper ensures the game instance is created only after the
// config has been set on the window object.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    new Phaser.Game(phaserGameConfig);
} else {
    document.addEventListener('DOMContentLoaded', () => new Phaser.Game(phaserGameConfig));
}
