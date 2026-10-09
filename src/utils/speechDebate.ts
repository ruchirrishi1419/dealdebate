// Web Speech API utility for DealDebate
// Uses browser's native window.speechSynthesis and window.SpeechRecognition / window.webkitSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

// Select the most natural English voice available in the client's browser
export function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Filter English voices
  const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
  if (enVoices.length === 0) return voices[0];

  // Preferred list of high-fidelity, articulate English voices
  const preferredRegex = /Google US English|Natural|Premium|Enhanced|Samantha|Daniel|Oliver|Guy|Ryan|Arthur|Alex|Google UK English Female/i;
  const preferred = enVoices.find(v => preferredRegex.test(v.name));
  if (preferred) return preferred;

  // Next prefer standard en-US or en-GB voices
  const usOrGb = enVoices.find(v => v.lang === 'en-US' || v.lang === 'en-GB');
  if (usOrGb) return usOrGb;

  return enVoices[0];
}

// Speaks text using the browser's speechSynthesis with DealDebate vocal characteristics
export function speakText(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  }
): () => void {
  if (!isSpeechSynthesisSupported()) {
    callbacks?.onEnd?.();
    return () => {};
  }

  // Cancel any existing playback
  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    console.error('Cancel speech error', e);
  }

  // Clean text from excessive symbols or markdown formatting if any
  const cleanText = text
    .replace(/[*_#`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    callbacks?.onEnd?.();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voice = getBestEnglishVoice();
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = voice?.lang || 'en-US';
  utterance.rate = 0.98; // Clear, measured debate cadence
  utterance.pitch = 0.98; // Firm, authoritative tone

  let isFinished = false;
  const handleFinish = () => {
    if (!isFinished) {
      isFinished = true;
      callbacks?.onEnd?.();
    }
  };

  utterance.onstart = () => {
    callbacks?.onStart?.();
  };

  utterance.onend = () => {
    handleFinish();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis playback note:', e);
    callbacks?.onError?.(e);
    handleFinish();
  };

  // Browser watchdog: Chrome can pause speech after ~12s without error
  const watchdog = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      if (!window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    } else {
      clearInterval(watchdog);
    }
  }, 10000);

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Failed to invoke speech synthesis', err);
    callbacks?.onError?.(err);
    handleFinish();
  }

  return () => {
    clearInterval(watchdog);
    try {
      window.speechSynthesis.cancel();
    } catch {}
  };
}
