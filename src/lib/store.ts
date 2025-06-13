import { create } from 'zustand';
import { GameConfig, GameTemplate } from '@/types/game';
import { produce } from 'immer';

interface GameStore {
  selectedTemplate: GameTemplate | null;
  gameConfig: GameConfig | null;
  setSelectedTemplate: (template: GameTemplate) => void;
  updateGameConfig: (config: Partial<GameConfig | { assets: Partial<GameConfig['assets']>, parameters: Partial<GameConfig['parameters']> }>) => void;
  resetStore: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  selectedTemplate: null,
  gameConfig: null,
  
  setSelectedTemplate: (template) => set({ 
    selectedTemplate: template,
    gameConfig: JSON.parse(JSON.stringify(template.defaultConfig)) // Deep copy
  }),
  
  updateGameConfig: (configUpdate) => set(produce((state: GameStore) => {
      if (state.gameConfig) {
        if (configUpdate.assets) {
            state.gameConfig.assets = { ...state.gameConfig.assets, ...configUpdate.assets };
        }
        if (configUpdate.parameters) {
            state.gameConfig.parameters = { ...state.gameConfig.parameters, ...configUpdate.parameters };
        }
        // Handle top-level properties
        const otherKeys = Object.keys(configUpdate).filter(k => k !== 'assets' && k !== 'parameters');
        otherKeys.forEach(key => {
            (state.gameConfig as any)[key] = (configUpdate as any)[key];
        });
      }
  })),
  
  resetStore: () => set({
    selectedTemplate: null,
    gameConfig: null,
  })
}));
