'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { Download, Loader2, CheckCircle, Code, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExportManager() {
  const { selectedTemplate, gameConfig } = useGameStore();
  const [isExporting, setIsExporting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const handleExport = async () => {
    if (!selectedTemplate || !gameConfig) return;

    setIsExporting(true);
    try {
      const response = await fetch('/api/export-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate.id,
          config: gameConfig
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      
      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${gameConfig.name.toLowerCase().replace(/\s+/g, '-')}-game.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success('Game exported successfully!');
    } catch (error) {
      toast.error('Failed to export game');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Your Game is Ready!
          </h2>
          <p className="text-gray-600">
            Export your customized game and share it with the world
          </p>
        </div>

        {/* Game Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-gray-800 mb-4">Game Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Template:</span>
              <span className="font-medium">{selectedTemplate?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Theme:</span>
              <span className="font-medium">{gameConfig?.theme || 'Classic'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Difficulty:</span>
              <span className="font-medium capitalize">{gameConfig?.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-4">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className={`
              w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-medium transition-all
              ${isExporting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg'
              }
            `}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Exporting Game...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Game (HTML5)
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
              <Code className="w-4 h-4" />
              View Code
            </button>
            <button className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all">
              <Play className="w-4 h-4" />
              Test Game
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3">How to use your game:</h4>
          <ol className="space-y-2 text-sm text-gray-600">
            <li>1. Extract the downloaded ZIP file</li>
            <li>2. Open the index.html file in any web browser</li>
            <li>3. Share the folder with friends or host it online</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
