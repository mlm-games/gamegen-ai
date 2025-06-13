'use client';

import { useState } from 'react';
import GameSelector from '@/components/GameSelector';
import AICustomizer from '@/components/AICustomizer';
import ParameterControls from '@/components/ParameterControls';
import ExportManager from '@/components/ExportManager';
import { useGameStore } from '@/lib/store';
import { ChevronRight, Sparkles } from 'lucide-react';

type Step = 'select' | 'reskin' | 'parameters' | 'export';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('select');
  const { selectedTemplate, gameConfig } = useGameStore();

  const steps = [
    { id: 'select', label: 'Select Template', icon: '🎮' },
    { id: 'reskin', label: 'AI Reskin', icon: '🎨' },
    { id: 'parameters', label: 'Set Parameters', icon: '⚙️' },
    { id: 'export', label: 'Export Game', icon: '📦' },
  ];

  const canProceed = (step: Step): boolean => {
    switch (step) {
      case 'select':
        return true;
      case 'reskin':
        return selectedTemplate !== null;
      case 'parameters':
        return selectedTemplate !== null && gameConfig !== null;
      case 'export':
        return selectedTemplate !== null && gameConfig !== null;
      default:
        return false;
    }
  };

  const handleStepClick = (step: Step) => {
    if (canProceed(step)) {
      setCurrentStep(step);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <Sparkles className="w-12 h-12 text-purple-600" />
            GameGen AI
          </h1>
          <p className="text-xl text-gray-600">
            Create custom games with AI - No coding required!
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.id as Step)}
                  disabled={!canProceed(step.id as Step)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-full transition-all
                    ${currentStep === step.id 
                      ? 'bg-purple-600 text-white shadow-lg scale-105' 
                      : canProceed(step.id as Step)
                        ? 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <span className="text-xl">{step.icon}</span>
                  <span className="font-medium">{step.label}</span>
                </button>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-400 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="max-w-6xl mx-auto">
          {currentStep === 'select' && (
            <GameSelector onNext={() => setCurrentStep('reskin')} />
          )}
          {currentStep === 'reskin' && (
            <AICustomizer onNext={() => setCurrentStep('parameters')} />
          )}
          {currentStep === 'parameters' && (
            <ParameterControls onNext={() => setCurrentStep('export')} />
          )}
          {currentStep === 'export' && (
            <ExportManager />
          )}
        </div>
      </div>
    </main>
  );
}
