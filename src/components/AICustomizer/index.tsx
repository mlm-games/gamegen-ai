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

  const [generatedImages, setGeneratedImages] = useState<{
    player?: string;
    background?: string;
    obstacle?: string;
  }>({});

  const handleGenerateAssets = async () => {
    if (!prompts.theme) {
      toast.error('Please enter a theme for your game');
      return;
    }

    setIsGenerating(true);
    setGeneratedImages({}); // Reset images
    
    try {
      // Store all updates to apply at once
      const updates: any = {
        theme: prompts.theme,
        assets: { ...gameConfig?.assets }
      };

      // Generate character
      if (prompts.character) {
        toast.loading('Generating character...', { id: 'character' });
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${prompts.character}, ${prompts.style} style, game asset`,
            type: 'character'
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate character');
        }
        
        const data = await response.json();
        console.log('Character response:', data);
        
        if (data.imageUrl) {
          toast.success('Character generated!', { id: 'character' });
          setGeneratedImages(prev => ({ ...prev, player: data.imageUrl }));
          setGeneratedAsset('player', data.imageUrl);
          updates.assets.player = data.imageUrl;
        }
      }

      // Generate background
      if (prompts.environment) {
        toast.loading('Generating background...', { id: 'background' });
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `${prompts.environment}, ${prompts.style} style, game background`,
            type: 'background'
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate background');
        }
        
        const data = await response.json();
        console.log('Background response:', data);
        
        if (data.imageUrl) {
          toast.success('Background generated!', { id: 'background' });
          setGeneratedImages(prev => ({ ...prev, background: data.imageUrl }));
          setGeneratedAsset('background', data.imageUrl);
          updates.assets.background = data.imageUrl;
        }
      }

      // Generate obstacles for flappy bird
      if (selectedTemplate?.id === 'flappy-bird') {
        toast.loading('Generating obstacles...', { id: 'obstacle' });
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: `vertical pipe obstacle, ${prompts.style} style, game asset`,
            type: 'obstacle'
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate obstacle');
        }
        
        const data = await response.json();
        console.log('Obstacle response:', data);
        
        if (data.imageUrl) {
          toast.success('Obstacle generated!', { id: 'obstacle' });
          setGeneratedImages(prev => ({ ...prev, obstacle: data.imageUrl }));
          setGeneratedAsset('obstacle', data.imageUrl);
          // Make sure obstacles is an array
          updates.assets.obstacles = [data.imageUrl];
        }
      }

      // Apply all updates at once
      console.log('Applying config updates:', updates);
      updateGameConfig(updates);
      
      toast.success('All assets generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate assets: ' + (error as Error).message);
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

          {/* Show generated images */}
          {generatedImages.player && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Generated Character:</p>
              <img 
                src={generatedImages.player} 
                alt="Generated character" 
                className="w-20 h-20 object-contain border rounded bg-white"
                onError={(e) => console.error('Failed to load player image:', e)}
              />
            </div>
          )}
          {generatedImages.background && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Generated Background:</p>
              <img 
                src={generatedImages.background} 
                alt="Generated background" 
                className="w-32 h-20 object-cover border rounded"
                onError={(e) => console.error('Failed to load background image:', e)}
              />
            </div>
          )}
          {generatedImages.obstacle && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Generated Obstacle:</p>
              <img 
                src={generatedImages.obstacle} 
                alt="Generated obstacle" 
                className="w-20 h-20 object-contain border rounded bg-white"
                onError={(e) => console.error('Failed to load obstacle image:', e)}
              />
            </div>
          )}
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
