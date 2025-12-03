import { useState, useEffect, useCallback } from 'react';

interface UseSpeechSynthesisOptions {
  onBoundary?: (charIndex: number) => void;
  onEnd?: () => void;
}

export function useSpeechSynthesis({ onBoundary, onEnd }: UseSpeechSynthesisOptions = {}) {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      if (availableVoices.length > 0 && !selectedVoice) {
        const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));

        const preferredVoice =
          englishVoices.find(v => v.name.includes('Google') && v.name.includes('US')) ||
          englishVoices.find(v => v.name.includes('Google')) ||
          englishVoices.find(v => v.name.includes('Samantha')) ||
          englishVoices.find(v => v.name.includes('Natural')) ||
          englishVoices.find(v => v.name.includes('Premium')) ||
          englishVoices.find(v => v.name.includes('Enhanced')) ||
          englishVoices.find(v => v.name.includes('Microsoft') && v.name.includes('Online')) ||
          englishVoices.find(v => v.localService === false) ||
          englishVoices[0] ||
          availableVoices[0];

        setSelectedVoice(preferredVoice);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const speak = useCallback((text: string, startPosition: number = 0) => {
    if (!text) return;

    window.speechSynthesis.cancel();

    const textToSpeak = text.substring(startPosition);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
    };

    utterance.onboundary = (event) => {
      const actualCharIndex = startPosition + event.charIndex;
      setCurrentCharIndex(actualCharIndex);
      onBoundary?.(actualCharIndex);
    };

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setSpeaking(false);
      setPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, onBoundary, onEnd]);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentCharIndex(0);
  }, []);

  return {
    speak,
    pause,
    resume,
    stop,
    speaking,
    paused,
    currentCharIndex,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
}
