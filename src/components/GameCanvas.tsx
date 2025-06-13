'use client';

import { useEffect, useRef, useState } from 'react';
import type { GameConfig } from '@/types/game';

interface GameCanvasProps {
  gameTemplate: string;
  config: GameConfig;
  onGameReady?: () => void;
}

export default function GameCanvas({ gameTemplate, config, onGameReady }: GameCanvasProps) {
  const gameRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    const loadGame = async () => {
      try {
        // Dynamically import Phaser only on client side
        const Phaser = await import('phaser');
        
        let GameScene: any;
        
        // Dynamic import based on template
        switch (gameTemplate) {
          case 'flappy-bird': {
            const flappyModule = await import('@/games/templates/flappy-bird/game');
            GameScene = flappyModule.default;
            break;
          }
          case 'endless-runner': {
            const runnerModule = await import('@/games/templates/endless-runner/game');
            GameScene = runnerModule.default;
            break;
          }
          default:
            console.error(`Unknown game template: ${gameTemplate}`);
            return;
        }
        
        // Create scene instance with config
        const scene = new GameScene(config);
        
        const phaserConfig: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          parent: containerRef.current,
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 0 },
              debug: false
            }
          },
          scene: scene
        };
        
        gameRef.current = new Phaser.Game(phaserConfig);
        setIsLoading(false);
        onGameReady?.();
      } catch (error) {
        console.error('Failed to load game:', error);
        setIsLoading(false);
      }
    };

    loadGame();

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [gameTemplate, config, onGameReady]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-gray-600">Loading game...</div>
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full max-w-4xl mx-auto rounded-lg overflow-hidden shadow-lg"
      />
    </div>
  );
}
