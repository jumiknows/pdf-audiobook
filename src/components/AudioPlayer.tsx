import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';

interface Document {
  id: string;
  title: string;
  original_filename: string;
  summary_text: string | null;
  current_position: number;
}

interface AudioPlayerProps {
  document: Document;
  onBack: () => void;
}

export function AudioPlayer({ document, onBack }: AudioPlayerProps) {
  const [currentCharIndex, setCurrentCharIndex] = useState(document.current_position);
  const [ready, setReady] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);

  const { speak, pause, resume, stop, speaking, paused } = useSpeechSynthesis({
    onBoundary: (charIndex) => {
      setCurrentCharIndex(charIndex);
    },
    onEnd: async () => {
      await api.documents.updatePosition(document.id, 0);
      setCurrentCharIndex(0);
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.speechSynthesis.getVoices().length > 0) {
        setReady(true);
      } else {
        window.speechSynthesis.getVoices();
        setReady(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentCharIndex]);

  const handlePlay = () => {
    if (!document.summary_text) return;

    if (paused) {
      resume();
    } else {
      const text = document.summary_text;
      speak(text, currentCharIndex);
    }
  };

  const handlePause = async () => {
    pause();
    await api.documents.updatePosition(document.id, currentCharIndex);
  };

  const handleStop = async () => {
    stop();
    await api.documents.updatePosition(document.id, 0);
    setCurrentCharIndex(0);
  };

  const renderTextWithHighlight = () => {
    const text = document.summary_text || '';
    if (!text) return null;

    const before = text.substring(0, currentCharIndex);
    const current = text.charAt(currentCharIndex);
    const after = text.substring(currentCharIndex + 1);

    return (
      <>
        <span className="text-gray-700">{before}</span>
        <span
          ref={highlightRef}
          className="bg-yellow-300 text-gray-900 px-1 rounded"
        >
          {current || ' '}
        </span>
        <span className="text-gray-700">{after}</span>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Library
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">{document.title}</h1>
            <p className="text-blue-100">{document.original_filename}</p>
          </div>

          <div className="p-8">
            <div
              ref={textRef}
              className="prose max-w-none mb-8 text-lg leading-relaxed h-96 overflow-y-auto bg-gray-50 p-6 rounded-xl"
            >
              {renderTextWithHighlight()}
            </div>

            {!ready && (
              <div className="mb-4 text-center text-sm text-gray-600">
                Loading voices...
              </div>
            )}

            <div className="flex items-center justify-center gap-4">
              {!speaking && !paused ? (
                <button
                  onClick={handlePlay}
                  disabled={!ready}
                  className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span className="font-semibold">Play</span>
                </button>
              ) : paused ? (
                <button
                  onClick={handlePlay}
                  className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span className="font-semibold">Resume</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center gap-3 bg-amber-600 text-white px-8 py-4 rounded-full hover:bg-amber-700 transition-colors shadow-lg"
                >
                  <Pause className="w-6 h-6 fill-current" />
                  <span className="font-semibold">Pause</span>
                </button>
              )}

              <button
                onClick={handleStop}
                disabled={!speaking && !paused}
                className="flex items-center gap-3 bg-gray-600 text-white px-8 py-4 rounded-full hover:bg-gray-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Square className="w-6 h-6 fill-current" />
                <span className="font-semibold">Stop</span>
              </button>
            </div>

            {currentCharIndex > 0 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Position: {currentCharIndex} / {document.summary_text?.length || 0}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
