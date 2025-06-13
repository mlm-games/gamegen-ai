// src/types/game.ts
export interface GameAssets {
  player?: string;
  background?: string;
  obstacles?: string[];
  items?: string[];
}

export interface GameParameters {
  speed?: number;
  gravity?: number;
  jumpVelocity?: number;
  pipeSpeed?: number;
  pipeSpawnDelay?: number;
  gapSize?: number;
  spawnRate?: number;
  [key: string]: number | undefined;
}

export interface GameAudio {
  bgm?: string;
  effects?: string[];
}

export interface GameConfig {
  id: string;
  name: string;
  theme: string;
  difficulty: 'easy' | 'medium' | 'hard';
  assets: GameAssets;
  parameters: GameParameters;
  audio?: GameAudio;
}

export interface GameTemplate {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
  defaultConfig: GameConfig;
}
