'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Wand2, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import GameCanvas from '@/components/GameCanvas';
import toast from 'react-hot-toast';

interface AICustomizerProps {
  onNext: () => void;
}

type GeneratingState = {
    character: boolean;
    background: boolean;
    obstacle: boolean;
    items: boolean;
}

export default function AICustomizer({ onNext }: AICustomizerProps) {
  const { selectedTemplate, gameConfig, updateGameConfig } = useGameStore();
  const [isGenerating, setIsGenerating] = useState<GeneratingState>({ character: false, background: false, obstacle: false, items: false });
  const [prompts, setPrompts] = useState({
    theme: '',
    character: '',
    environment: '',
    obstacle: '',
    items: '',
    style: 'cartoon'
  });

  const [localTheme, setLocalTheme] = useState(gameConfig?.theme || '');

  const updateGlobalTheme = () => {
    // Only update if the local value is different from the global one
    if (localTheme !== gameConfig?.theme) {
      console.log(`Updating global theme to: "${localTheme}"`);
      updateGameConfig({ name: localTheme, theme: localTheme });
    }
  };




  const handleGenerateAsset = async (assetType: 'character' | 'background' | 'obstacle' | 'items') => {
    let prompt = '';
    let apiType = '';
    let toastId = assetType;
    let numToGenerate = 1;

    updateGlobalTheme();

    switch (assetType) {
        case 'character':
            if (!prompts.character) { toast.error('Please enter a character description.'); return; }
            prompt = prompts.character;
            apiType = 'character';
            break;
        case 'background':
            if (!prompts.environment) { toast.error('Please enter an environment description.'); return; }
            prompt = prompts.environment;
            apiType = 'background';
            break;
        case 'obstacle':
            if (!prompts.obstacle) { toast.error('Please enter an obstacle description.'); return; }
            prompt = prompts.obstacle;
            apiType = 'obstacle';
            break;
        case 'items':
            if (!prompts.items) { toast.error('Please enter item descriptions (comma separated).'); return; }
            prompt = prompts.items;
            apiType = 'item';
            numToGenerate = Math.min(5, prompts.items.split(',').length);
            break;
        default:
            return;
    }

    setIsGenerating(prev => ({ ...prev, [assetType]: true }));
    toast.loading(`Generating ${assetType}... (1/${numToGenerate})`, { id: toastId });

    try {
        if (assetType === 'items') {
            const itemPrompts = prompts.items.split(',').map(p => p.trim()).slice(0, 5);
            const generatedUrls = [];
            for (let i = 0; i < itemPrompts.length; i++) {
                toast.loading(`Generating ${assetType}... (${i+1}/${numToGenerate})`, { id: toastId });
                const response = await fetch('/api/generate-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: itemPrompts[i], type: apiType, style: prompts.style })
                });
                const data = await response.json();
                if (!response.ok || !data.assetUrl) throw new Error(data.error || `Failed to generate item ${i+1}`);
                generatedUrls.push(data.assetUrl);
            }
            updateGameConfig({ assets: { items: generatedUrls } });
        } else {
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, type: apiType, style: prompts.style })
            });

            const data = await response.json();
            if (!response.ok || !data.assetUrl) throw new Error(data.error || 'API returned invalid data.');
            
            if (assetType === 'character') updateGameConfig({ assets: { player: data.assetUrl } });
            if (assetType === 'background') updateGameConfig({ assets: { background: data.assetUrl } });
            if (assetType === 'obstacle') updateGameConfig({ assets: { obstacles: [data.assetUrl] } });
        }

      toast.success(`${assetType.charAt(0).toUpperCase() + assetType.slice(1)} generated!`, { id: toastId });
    } catch (error) {
      console.error(`Generation error for ${assetType}:`, error);
      toast.error(`Generation failed: ${(error as Error).message}`, { id: toastId });
    } finally {
      setIsGenerating(prev => ({ ...prev, [assetType]: false }));
    }
  };
  
  const anyGenerating = Object.values(isGenerating).some(s => s);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Panel - AI Controls */}
      <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">
          Customize with AI
        </h2>

        {/* --- GLOBAL SETTINGS --- */}
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Global Settings</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Game Theme / Title</label>
                <input
                  type="text"
                  value={localTheme}
                  onChange={(e) => setLocalTheme(e.target.value)}
                  onBlur={updateGlobalTheme} // 3. Update global state when input loses focus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateGlobalTheme();
                      (e.target as HTMLInputElement).blur(); // Optional: lose focus on enter
                    }
                  }} // 4. Update global state on Enter key
                  placeholder="e.g., Underwater Quest"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Art Style</label>
                <select
                  value={prompts.style}
                  onChange={(e) => setPrompts({ ...prompts, style: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="cartoon">Cartoon</option>
                  <option value="pixel art">Pixel Art</option>
                  <option value="3d rendering">3D Rendering</option>
                  <option value="watercolor">Watercolor</option>
                  <option value="low-poly">Low Poly</option>
                </select>
            </div>
        </div>

        {/* --- ASSET GENERATION --- */}
        <div className="space-y-4 p-4 border rounded-lg">
            <h3 className="font-semibold text-lg">Asset Generation</h3>
            {/* Character */}
            <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Main Character</label>
                    <input type="text" value={prompts.character} onChange={(e) => setPrompts({ ...prompts, character: e.target.value })} placeholder="e.g., A brave little submarine" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <button onClick={() => handleGenerateAsset('character')} disabled={isGenerating.character} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2">
                    {isGenerating.character ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                </button>
            </div>
             {/* Background */}
            <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Background / Environment</label>
                    <input type="text" value={prompts.environment} onChange={(e) => setPrompts({ ...prompts, environment: e.target.value })} placeholder="e.g., A vibrant coral reef" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <button onClick={() => handleGenerateAsset('background')} disabled={isGenerating.background} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2">
                    {isGenerating.background ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                </button>
            </div>
             {/* Obstacle */}
            {selectedTemplate && ['flappy-bird', 'endless-runner', 'crossy-road'].includes(selectedTemplate.id) && <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Obstacle</label>
                    <input type="text" value={prompts.obstacle} onChange={(e) => setPrompts({ ...prompts, obstacle: e.target.value })} placeholder="e.g., Dangerous sea mine" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <button onClick={() => handleGenerateAsset('obstacle')} disabled={isGenerating.obstacle} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2">
                    {isGenerating.obstacle ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                </button>
            </div>}
             {/* Items */}
            {selectedTemplate?.id === 'match-3' && <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Items (up to 5, comma-separated)</label>
                    <input type="text" value={prompts.items} onChange={(e) => setPrompts({ ...prompts, items: e.target.value })} placeholder="e.g., pearl, shell, starfish" className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <button onClick={() => handleGenerateAsset('items')} disabled={isGenerating.items} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2">
                    {isGenerating.items ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
                </button>
            </div>}
        </div>

        <div className="mt-auto pt-6 border-t border-gray-200">
          <button
            onClick={onNext}
            disabled={anyGenerating}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 shadow-lg transition-all disabled:bg-gray-400"
          >
            Continue to Parameters
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right Panel - Game Preview */}
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-gray-800">Preview</h3>
        </div>
        
        {selectedTemplate && gameConfig ? (
          <GameCanvas
            gameTemplate={selectedTemplate.id}
            config={gameConfig}
          />
        ) : (
            <div className="w-full aspect-[4/3] border-0 rounded-lg bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Select a template to begin</p>
            </div>
        )}
      </div>
    </div>
  );
}
