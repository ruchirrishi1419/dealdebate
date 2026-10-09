import React from 'react';
import { MessageSquare, Mic, X, Loader2, Sparkles } from 'lucide-react';
import { DifficultyLevel } from '../types';

interface ModeSelectionModalProps {
  isOpen: boolean;
  scenario: string;
  difficulty: DifficultyLevel;
  isLoading?: boolean;
  onSelectMode: (mode: 'text' | 'voice') => void;
  onClose: () => void;
}

export const ModeSelectionModal: React.FC<ModeSelectionModalProps> = ({
  isOpen,
  scenario,
  difficulty,
  isLoading = false,
  onSelectMode,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 font-sans">
      <div 
        className="bg-white border-2 border-[#111111] max-w-xl w-full p-6 sm:p-8 shadow-[8px_8px_0px_#111111] relative text-[#111111] animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-selection-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-5 right-5 p-1.5 text-neutral-500 hover:text-[#111111] border border-transparent hover:border-[#111111] transition-colors disabled:opacity-30"
          title="Cancel"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Metadata */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 font-semibold">
              Format Selection
            </span>
            <span className="text-neutral-300">·</span>
            {difficulty === 'EASY' ? (
              <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 bg-neutral-100 text-[#111111] border border-[#111111]">
                Practice (Easy)
              </span>
            ) : difficulty === 'HARD' ? (
              <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 bg-[#111111] text-white border border-[#111111]">
                Interview (Hard)
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 bg-neutral-100 text-neutral-800 border border-[#e5e5e5]">
                Medium
              </span>
            )}
          </div>

          <h2 
            id="mode-selection-title"
            className="font-serif text-2xl sm:text-3xl font-normal text-[#111111] tracking-tight leading-tight"
          >
            How do you want to debate?
          </h2>

          <p className="mt-2 text-xs sm:text-sm text-neutral-600 line-clamp-2">
            Topic: <span className="text-[#111111] font-medium">"{scenario}"</span>
          </p>
        </div>

        {/* Two Big Mode Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
          {/* Button 1: Text */}
          <button
            type="button"
            onClick={() => onSelectMode('text')}
            disabled={isLoading}
            className="group relative border-2 border-[#111111] bg-white hover:bg-neutral-50 text-[#111111] p-5 sm:p-6 text-left transition-all active:scale-[0.98] disabled:opacity-40 flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 border border-[#111111] bg-white group-hover:bg-[#111111] group-hover:text-white transition-colors flex items-center justify-center mb-4">
                <MessageSquare className="w-5 h-5 text-[#111111] group-hover:text-white transition-colors" />
              </div>
              <h3 className="font-serif text-xl font-medium text-[#111111] mb-1.5 flex items-center justify-between">
                <span>Text</span>
              </h3>
              <p className="text-xs text-neutral-600 font-sans leading-relaxed">
                Type responses at your own pace with on-screen strategy hints and live feedback.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-200 flex items-center justify-between text-[11px] font-medium text-neutral-700">
              <span className="uppercase tracking-wider text-[10px]">Standard Mode</span>
              <span className="group-hover:translate-x-0.5 transition-transform">Start &rarr;</span>
            </div>
          </button>

          {/* Button 2: Voice */}
          <button
            type="button"
            onClick={() => onSelectMode('voice')}
            disabled={isLoading}
            className="group relative border-2 border-[#111111] bg-[#111111] hover:bg-black text-white p-5 sm:p-6 text-left transition-all active:scale-[0.98] disabled:opacity-40 flex flex-col justify-between shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"
          >
            <div>
              <div className="w-10 h-10 border border-white/30 bg-neutral-900 group-hover:border-white transition-colors flex items-center justify-center mb-4">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-serif text-xl font-medium text-white mb-1.5 flex items-center justify-between">
                <span>Voice</span>
                <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-white text-black font-sans font-bold">
                  Hands-Free
                </span>
              </h3>
              <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                Speak live into your microphone with automated speech and the glowing accretion orb.
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] font-medium text-neutral-300">
              <span className="uppercase tracking-wider text-[10px]">Pure Voice Chamber</span>
              <span className="group-hover:translate-x-0.5 transition-transform text-white">Enter &rarr;</span>
            </div>
          </button>
        </div>

        {/* Footer Note */}
        <div className="pt-2 text-center">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-600">
              <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
              <span>Preparing debate chamber...</span>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="text-xs text-neutral-500 hover:text-[#111111] underline underline-offset-4 transition-colors font-sans"
            >
              Cancel and return to topics
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
