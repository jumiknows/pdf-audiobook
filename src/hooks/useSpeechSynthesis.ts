import { useState, useEffect, useCallback, useRef } from 'react';

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
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startPositionRef = useRef<number>(0);
  const textLengthRef = useRef<number>(0);
  const boundaryDetectedRef = useRef<boolean>(false);

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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const textToSpeak = text.substring(startPosition);
    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    startTimeRef.current = Date.now();
    startPositionRef.current = startPosition;
    textLengthRef.current = textToSpeak.length;
    boundaryDetectedRef.current = false;

    utterance.onstart = () => {
      setSpeaking(true);
      setPaused(false);
      startTimeRef.current = Date.now();

      intervalRef.current = window.setInterval(() => {
        if (!boundaryDetectedRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          const avgCharsPerSecond = 15;
          const estimatedChars = Math.floor((elapsed / 1000) * avgCharsPerSecond);
          const estimatedPosition = Math.min(
            startPositionRef.current + estimatedChars,
            startPositionRef.current + textLengthRef.current
          );
          setCurrentCharIndex(estimatedPosition);
          onBoundary?.(estimatedPosition);
        }
      }, 100);
    };

    utterance.onboundary = (event) => {
      boundaryDetectedRef.current = true;
      const actualCharIndex = startPosition + event.charIndex;
      setCurrentCharIndex(actualCharIndex);
      onBoundary?.(actualCharIndex);
    };

    utterance.onend = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setSpeaking(false);
      setPaused(false);
      onEnd?.();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setSpeaking(false);
      setPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [selectedVoice, onBoundary, onEnd]);

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      startTimeRef.current = Date.now();

      if (!boundaryDetectedRef.current) {
        intervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - startTimeRef.current;
          const avgCharsPerSecond = 15;
          const estimatedChars = Math.floor((elapsed / 1000) * avgCharsPerSecond);
          const estimatedPosition = Math.min(
            startPositionRef.current + estimatedChars,
            startPositionRef.current + textLengthRef.current
          );
          setCurrentCharIndex(estimatedPosition);
        }, 100);
      }
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setSpeaking(false);
    setPaused(false);
    setCurrentCharIndex(0);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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
