import { create } from 'zustand';
import { GameConfig, GameTemplate } from '@/types/game';

interface GameStore {
  selectedTemplate: GameTemplate | null;
  gameConfig: GameConfig | null;
  generatedAssets: Record<string, string>;
  
  setSelectedTemplate: (template: GameTemplate) => void;
  updateGameConfig: (config: Partial<GameConfig>) => void;
  setGeneratedAsset: (key: string, url: string) => void;
  resetStore: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  selectedTemplate: null,
  gameConfig: null,
  generatedAssets: {},
  
  setSelectedTemplate: (template) => set({ 
    selectedTemplate: template,
    gameConfig: { ...template.defaultConfig }
  }),
  
  updateGameConfig: (config) => set((state) => ({
    gameConfig: state.gameConfig ? { ...state.gameConfig, ...config } : null
  })),
  
  setGeneratedAsset: (key, url) => set((state) => ({
    generatedAssets: { ...state.generatedAssets, [key]: url }
  })),
  
  resetStore: () => set({
    selectedTemplate: null,
    gameConfig: null,
    generatedAssets: {}
  })
}));
