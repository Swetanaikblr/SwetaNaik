import React, { useState } from 'react';
import { Volume2, Check, Sparkles, X, Play, Loader2, Music } from 'lucide-react';
import {
  AVAILABLE_VOICES,
  GeminiVoiceName,
  VoiceMetadata,
  getActiveVoiceName,
  setActiveVoiceName,
} from '../../voice/voiceRegistry';

interface VoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoice?: GeminiVoiceName;
  onVoiceChanged?: (newVoice: GeminiVoiceName) => void;
  childName?: string;
}

export const VoiceSelectorModal: React.FC<VoiceSelectorModalProps> = ({
  isOpen,
  onClose,
  currentVoice,
  onVoiceChanged,
  childName = 'Aarav',
}) => {
  const [selectedVoice, setSelectedVoice] = useState<GeminiVoiceName>(() => {
    return currentVoice || getActiveVoiceName();
  });
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Play natural voice preview using /api/tts
  const handlePreviewVoice = async (voice: VoiceMetadata, e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioError(null);

    // Stop currently playing
    if (playingVoiceId === voice.id) {
      setPlayingVoiceId(null);
      return;
    }

    setAudioLoading(voice.id);

    try {
      const sampleText = `Hey ${childName}! I'm speaking in the ${voice.name} voice. How do I sound?`;
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voice: voice.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to load voice audio');
      const data = await res.json();

      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        setAudioLoading(null);
        setPlayingVoiceId(voice.id);

        audio.onended = () => {
          setPlayingVoiceId(null);
        };
        audio.onerror = () => {
          setPlayingVoiceId(null);
          setAudioError('Preview playback failed in this browser');
        };
        await audio.play();
      } else {
        // Fallback to Web Speech if backend TTS is offline
        setAudioLoading(null);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(sampleText);
          utterance.pitch = voice.id === 'Fenrir' ? 1.2 : voice.id === 'Charon' ? 0.85 : 1.05;
          utterance.rate = voice.id === 'Fenrir' ? 1.1 : 0.95;
          setPlayingVoiceId(voice.id);
          utterance.onend = () => setPlayingVoiceId(null);
          window.speechSynthesis.speak(utterance);
        } else {
          setAudioError('Audio preview not available');
        }
      }
    } catch (err: any) {
      console.warn('Voice preview error:', err);
      setAudioLoading(null);
      setPlayingVoiceId(null);
      setAudioError('Could not generate voice sample preview');
    }
  };

  const handleApply = (voiceId: GeminiVoiceName) => {
    setSelectedVoice(voiceId);
    setActiveVoiceName(voiceId);
    if (onVoiceChanged) {
      onVoiceChanged(voiceId);
    }
    onClose();
  };

  return (
    <div
      id="voice-selector-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Companion Voice Studio</h2>
              <p className="text-xs text-blue-100">
                Choose the Gemini Live & TTS voice for Echo & companion activities
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Informational Sub-banner */}
        <div className="bg-blue-50/80 border-b border-blue-100 px-5 py-2.5 flex items-center justify-between text-xs text-blue-900 font-medium">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Powered by Google Gemini Live 24kHz Native Speech
          </span>
          <span className="text-[11px] bg-blue-200/80 px-2 py-0.5 rounded-full font-bold text-blue-800">
            Current: {selectedVoice}
          </span>
        </div>

        {audioError && (
          <div className="mx-5 mt-3 p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
            <span>{audioError}</span>
            <button
              type="button"
              onClick={() => setAudioError(null)}
              className="text-amber-600 hover:text-amber-900 font-bold ml-2"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Voice List */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {AVAILABLE_VOICES.map((voice) => {
            const isSelected = selectedVoice === voice.id;
            const isPlaying = playingVoiceId === voice.id;
            const isLoading = audioLoading === voice.id;

            return (
              <div
                key={voice.id}
                onClick={() => handleApply(voice.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-blue-50/50 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xs border border-slate-100 shrink-0"
                      style={{ backgroundColor: `${voice.accentColor}15` }}
                    >
                      {voice.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-slate-900">{voice.name}</h3>
                        {voice.isDefault && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                            Echo Default
                          </span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {voice.timbre}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{voice.tagline}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
                        {voice.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Action: Preview & Select */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handlePreviewVoice(voice, e)}
                      disabled={isLoading}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs animate-pulse'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                      title={`Listen to sample in ${voice.name}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                          <span>Loading...</span>
                        </>
                      ) : isPlaying ? (
                        <>
                          <Music className="w-3.5 h-3.5 animate-bounce" />
                          <span>Playing...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current text-blue-600" />
                          <span>Test Voice</span>
                        </>
                      )}
                    </button>

                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3 text-blue-700" />
                        Selected
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleApply(voice.id)}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Tap to select
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span>
            Selected Voice: <strong className="text-slate-900">{selectedVoice}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => handleApply(selectedVoice)}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Voice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
