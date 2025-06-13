'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Wand2, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import GameCanvas from '@/components/GameCanvas';
import toast from 'react-hot-toast';


interface AICustomizerProps {
  onNext: () => void;
}

export default function AICustomizer({ onNext }: AICustomizerProps) {
  const { selectedTemplate, gameConfig, updateGameConfig, setGeneratedAsset } = useGameStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompts, setPrompts] = useState({
    theme: '',
    character: '',
    environment: '',
    style: 'cartoon'
  });

  const handleGenerateAssets = async () => {
    if (!prompts.theme) {
      toast.error('Please enter a theme for your game');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate character
      if (prompts.character) {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${prompts.character}, ${prompts.style} style, game asset, transparent background`,
            type: 'character'
          })
        });
        const data = await response.json();
        if (data.imageUrl) {
          setGeneratedAsset('player', data.imageUrl);
          updateGameConfig({
            assets: { ...gameConfig?.assets, player: data.imageUrl }
          });
        }
      }

      // Generate background
      if (prompts.environment) {
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${prompts.environment}, ${prompts.style} style, game background`,
            type: 'background'
          })
        });
        const data = await response.json();
        if (data.imageUrl) {
          setGeneratedAsset('background', data.imageUrl);
          updateGameConfig({
            assets: { ...gameConfig?.assets, background: data.imageUrl }
          });
        }
      }

      updateGameConfig({ theme: prompts.theme });
      toast.success('Assets generated successfully!');
    } catch (error) {
      toast.error('Failed to generate assets');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - AI Controls */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Customize with AI
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Game Theme
            </label>
            <input
              type="text"
              value={prompts.theme}
              onChange={(e) => setPrompts({ ...prompts, theme: e.target.value })}
              placeholder="e.g., Space adventure, Medieval fantasy, Underwater world"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Main Character
            </label>
            <input
              type="text"
              value={prompts.character}
              onChange={(e) => setPrompts({ ...prompts, character: e.target.value })}
              placeholder="e.g., Cute robot, Flying dragon, Brave knight"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Environment/Background
            </label>
            <input
              type="text"
              value={prompts.environment}
              onChange={(e) => setPrompts({ ...prompts, environment: e.target.value })}
              placeholder="e.g., Starry sky, Castle walls, Coral reef"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Art Style
            </label>
            <select
              value={prompts.style}
              onChange={(e) => setPrompts({ ...prompts, style: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            >
              <option value="cartoon">Cartoon</option>
              <option value="pixel">Pixel Art</option>
              <option value="realistic">Realistic</option>
              <option value="watercolor">Watercolor</option>
              <option value="neon">Neon/Cyberpunk</option>
            </select>
          </div>

          <button
            onClick={handleGenerateAssets}
            disabled={isGenerating || !prompts.theme}
            className={`
              w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              ${isGenerating || !prompts.theme
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
              }
            `}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Assets...
              </>
            ) : (
              
            <>
                <Wand2 className="w-5 h-5" />
                Generate Assets
              </>
            )}
          </button>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <button
            onClick={onNext}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 shadow-lg transition-all"
          >
            Continue to Parameters
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Panel - Game Preview */}
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Preview</h3>
          <button
            onClick={handleGenerateAssets}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
        </div>
        
        {selectedTemplate && gameConfig && (
          <GameCanvas
            gameTemplate={selectedTemplate.id}
            config={gameConfig}
          />
        )}
      </div>
    </div>
  );
}
