import { useState, useEffect, useRef, useCallback } from 'react';

interface UseNarrationReturn {
  play: (text: string) => void;
  stop: () => void;
  isPlaying: boolean;
  currentCaption: string;
}

export function useNarration(): UseNarrationReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCaption, setCurrentCaption] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  // Track queue index to know when we are done
  const queueRef = useRef<SpeechSynthesisUtterance[]>([]);
  const isCancelledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialize and load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();
    
    // Some browsers need this event to load voices
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const selectBestVoice = useCallback((availableVoices: SpeechSynthesisVoice[], langCode?: string) => {
    if (availableVoices.length === 0) return null;

    if (langCode && langCode.startsWith('hi')) {
      const hindiVoice = availableVoices.find(v => v.lang.startsWith('hi'));
      if (hindiVoice) return hindiVoice;
      // Fallback: note that no Hindi voice was found, will use default
      console.warn("[Narration] No Hindi voice found, falling back to default.");
    }

    // 1. Google US English
    const googleVoice = availableVoices.find(v => v.name.includes('Google') && v.lang.includes('en-US'));
    if (googleVoice) return googleVoice;

    // 2. Network-backed (localService: false) English voice
    const networkVoice = availableVoices.find(v => !v.localService && v.lang.startsWith('en'));
    if (networkVoice) return networkVoice;

    // 3. Fallback to any English voice
    const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
    if (englishVoice) return englishVoice;

    // 4. Ultimate fallback
    return availableVoices[0];
  }, []);

  const formatTextForSpeech = (text: string) => {
    let formatted = text;
    // Clean markdown bolding
    formatted = formatted.replace(/\*\*/g, '');
    // Expand percentages
    formatted = formatted.replace(/%/g, ' percent');
    // Clean up underscores
    formatted = formatted.replace(/_/g, ' ');
    return formatted;
  };

  const chunkText = (text: string): string[] => {
    // Split by ., !, ?, or । (Devanagari danda) followed by space or end of string
    const chunks = text.split(/(?<=[.!?।])\s*(?=[A-Z0-9\u0900-\u097F]|$)/g).map(c => c.trim()).filter(c => c.length > 0);
    return chunks.length > 0 ? chunks : [text];
  };

  // Helper to detect if text contains Hindi characters
  const isHindi = (text: string) => {
    return /[\u0900-\u097F]/.test(text);
  };

  const playNextChunk = useCallback(() => {
    if (isCancelledRef.current || queueRef.current.length === 0) {
      setIsPlaying(false);
      setCurrentCaption('');
      return;
    }

    const utterance = queueRef.current.shift()!;
    setCurrentCaption(utterance.text);
    
    utterance.onend = () => {
      if (!isCancelledRef.current) {
        // Add a small pause between sentences (~200ms)
        timeoutRef.current = setTimeout(() => {
          playNextChunk();
        }, 200);
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsPlaying(false);
      setCurrentCaption('');
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const play = useCallback((text: string) => {
    stop();
    isCancelledRef.current = false;
    setIsPlaying(true);

    const langCode = isHindi(text) ? 'hi-IN' : 'en-US';
    const voice = selectBestVoice(voices, langCode);
    
    // LOGGING FOR VERIFICATION
    console.log("[Narration] Available voices:", voices.map(v => v.name));
    if (voice) {
      console.log("[Narration] Selected voice:", voice.name, "for lang:", langCode);
    }

    const formattedText = formatTextForSpeech(text);
    const chunks = chunkText(formattedText);

    const utterances = chunks.map(chunk => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      if (voice) utterance.voice = voice;
      utterance.lang = langCode;
      utterance.rate = 0.95; // Slightly slower
      utterance.pitch = 1.0;
      return utterance;
    });

    // LOGGING FOR VERIFICATION
    console.log("[Narration] Chunked utterances:", chunks);

    queueRef.current = utterances;
    playNextChunk();
  }, [voices, selectBestVoice, playNextChunk]);

  const stop = useCallback(() => {
    isCancelledRef.current = true;
    window.speechSynthesis.cancel();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsPlaying(false);
    setCurrentCaption('');
    queueRef.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    play,
    stop,
    isPlaying,
    currentCaption
  };
}
