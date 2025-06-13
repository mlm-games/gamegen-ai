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
  
  updateGameConfig: (config) => set((state) => {
    console.log('Store updateGameConfig called with:', config);
    
    const newConfig = state.gameConfig ? { ...state.gameConfig } : null;
    
    if (newConfig && config) {
      // Deep merge for nested objects
      if (config.assets) {
        newConfig.assets = {
          ...newConfig.assets,
          ...config.assets
        };
        
        // Special handling for obstacles to ensure it's an array
        if ('obstacles' in config.assets) {
          newConfig.assets.obstacles = config.assets.obstacles;
          console.log('Set obstacles to:', newConfig.assets.obstacles);
        }
      }
      
      if (config.parameters) {
        newConfig.parameters = {
          ...newConfig.parameters,
          ...config.parameters
        };
      }
      
      // Copy other properties
      Object.keys(config).forEach(key => {
        if (key !== 'assets' && key !== 'parameters') {
          (newConfig as any)[key] = (config as any)[key];
        }
      });
    }
    
    console.log('Store final config:', newConfig);
    return { gameConfig: newConfig };
  }),
  
  setGeneratedAsset: (key, url) => set((state) => ({
    generatedAssets: { ...state.generatedAssets, [key]: url }
  })),
  
  resetStore: () => set({
    selectedTemplate: null,
    gameConfig: null,
    generatedAssets: {}
  })
}));
