import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface UseSpeechSynthesisOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string; // e.g., 'en', 'tr', 'en-US'
}

export interface UseSpeechSynthesis {
  supported: boolean;
  speaking: boolean;
  paused: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
  volume: number;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setVoiceByName: (name: string) => void;
  setVoiceByLangPrefix: (langPrefix: string) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
}

export function useSpeechSynthesis(options: UseSpeechSynthesisOptions = {}): UseSpeechSynthesis {
  const { rate = 1, pitch = 1, volume = 1, lang } = options;
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [rateState, setRateState] = useState(rate);
  const [pitchState, setPitchState] = useState(pitch);
  const [volumeState, setVolumeState] = useState(volume);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const isSupported = typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined';
    setSupported(isSupported);
    if (!isSupported) return;

    const loadVoices = () => {
      const loadedVoices = window.speechSynthesis.getVoices();
      setVoices(loadedVoices);
      if (!selectedVoice && loadedVoices.length > 0) {
        // Prefer a voice by lang if provided, else default to the first available
        const preferred = lang
          ? loadedVoices.find(v => v.lang?.toLowerCase().startsWith(lang.toLowerCase())) || null
          : null;
        setSelectedVoice(preferred ?? loadedVoices[0] ?? null);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [lang, selectedVoice]);

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
    setPaused(false);
  }, [supported]);

  const speak = useCallback((text: string) => {
    if (!supported || !text?.trim()) return;
    // Stop any ongoing speech before starting a new one
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.volume = volumeState;
    utter.rate = rateState;
    utter.pitch = pitchState;
    if (selectedVoice) utter.voice = selectedVoice;
    if (lang && !selectedVoice) utter.lang = lang;

    utter.onstart = () => { setSpeaking(true); setPaused(false); };
    utter.onend = () => { setSpeaking(false); setPaused(false); utteranceRef.current = null; };
    utter.onerror = () => { setSpeaking(false); setPaused(false); utteranceRef.current = null; };
    utter.onpause = () => { setPaused(true); };
    utter.onresume = () => { setPaused(false); };

    utteranceRef.current = utter;
    window.speechSynthesis.speak(utter);
  }, [supported, pitchState, rateState, volumeState, selectedVoice, lang]);

  const pause = useCallback(() => {
    if (!supported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }, [supported]);

  const resume = useCallback(() => {
    if (!supported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    }
  }, [supported]);

  const setVoiceByName = useCallback((name: string) => {
    if (!voices?.length) return;
    const v = voices.find(voice => voice.name === name) || null;
    setSelectedVoice(v);
  }, [voices]);

  const setVoiceByLangPrefix = useCallback((langPrefix: string) => {
    if (!voices?.length) return;
    const v = voices.find(voice => voice.lang?.toLowerCase().startsWith(langPrefix.toLowerCase())) || null;
    setSelectedVoice(v);
  }, [voices]);

  const api = useMemo<UseSpeechSynthesis>(() => ({
    supported,
    speaking,
    paused,
    voices,
    selectedVoice,
    rate: rateState,
    pitch: pitchState,
    volume: volumeState,
    speak,
    pause,
    resume,
    stop,
    setVoiceByName,
    setVoiceByLangPrefix,
    setRate: setRateState,
    setPitch: setPitchState,
    setVolume: setVolumeState,
  }), [supported, speaking, paused, voices, selectedVoice, rateState, pitchState, volumeState, speak, pause, resume, stop, setVoiceByName, setVoiceByLangPrefix]);

  return api;
}

