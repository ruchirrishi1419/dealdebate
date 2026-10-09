// Web Speech API utility for DealDebate
// Uses browser's native window.speechSynthesis and window.SpeechRecognition / window.webkitSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

// Global Set to keep SpeechSynthesisUtterance references from being garbage collected by Chrome V8 mid-speech
const activeUtterances = new Set<SpeechSynthesisUtterance>();

// Stored DealDebate voice: Loaded once, chosen carefully, and strictly reused for every utterance in every round
let storedDebateVoice: SpeechSynthesisVoice | null = null;
let speechPlaybackHasOccurred = false;
let hasSetupVoiceListener = false;

export function getSpeechRecognitionConstructor(): (new () => any) | null {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return !!getSpeechRecognitionConstructor();
}

export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}

// Request microphone permission properly using navigator.mediaDevices.getUserMedia
export async function requestMicPermission(): Promise<{ granted: boolean; error?: string }> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    // If getUserMedia is not available, return false with reason
    return { granted: false, error: 'Speech recognition not supported in this browser' };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately so the hardware mic is released for webkitSpeechRecognition
    stream.getTracks().forEach((track) => track.stop());
    return { granted: true };
  } catch (err: any) {
    const errName = err?.name || '';
    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      return { granted: false, error: 'Mic blocked' };
    }
    return { granted: false, error: err?.message || 'Mic error' };
  }
}

/**
 * Evaluates candidate voices and returns the most natural, human-sounding English voice.
 * Priorities:
 * 1. Microsoft Edge: "Microsoft ... Online (Natural)" (e.g. Aria, Guy, Jenny Natural)
 * 2. Chrome: "Google US English"
 * 3. Best available English voice (Natural/Neural/Premium/Enhanced, high-clarity OS voices, en-US/en-GB)
 */
function findBestVoiceMatch(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // Filter English voices
  const enVoices = voices.filter(v => v.lang.toLowerCase().startsWith('en'));
  const candidatePool = enVoices.length > 0 ? enVoices : voices;

  // 1. On Microsoft Edge: Prefer "Microsoft ... Online (Natural)" (e.g. Aria, Guy, Jenny Natural)
  // Check Aria, Guy, Jenny Natural first
  const edgeAriaGuyJenny = candidatePool.find(v =>
    /Microsoft.*(Aria|Guy|Jenny).*Online.*\(Natural\)/i.test(v.name) ||
    (/Microsoft/i.test(v.name) && /(Aria|Guy|Jenny)/i.test(v.name) && /Natural/i.test(v.name))
  );
  if (edgeAriaGuyJenny) return edgeAriaGuyJenny;

  // Any other Microsoft Online Natural English voice (e.g. Christopher, Eric, Ryan, Sonia, etc.)
  const edgeAnyOnlineNatural = candidatePool.find(v =>
    (/Microsoft/i.test(v.name) && /Online.*\(Natural\)/i.test(v.name)) ||
    (/Microsoft/i.test(v.name) && /Natural/i.test(v.name))
  );
  if (edgeAnyOnlineNatural) return edgeAnyOnlineNatural;

  // Any voice containing Online (Natural)
  const anyOnlineNatural = candidatePool.find(v => /Online.*\(Natural\)/i.test(v.name));
  if (anyOnlineNatural) return anyOnlineNatural;

  // 2. On Chrome: Prefer "Google US English"
  const chromeGoogleUS = candidatePool.find(v =>
    v.name.toLowerCase() === 'google us english' ||
    v.name.toLowerCase().includes('google us english')
  );
  if (chromeGoogleUS) return chromeGoogleUS;

  // Other Google natural English voices (e.g. Google UK English Female/Male)
  const chromeGoogleOther = candidatePool.find(v =>
    /Google (UK English Female|UK English Male|US English)/i.test(v.name)
  );
  if (chromeGoogleOther) return chromeGoogleOther;

  // 3. Fallback: High quality natural/neural/enhanced voices
  const naturalEnhanced = candidatePool.find(v =>
    /Natural|Neural|Premium|Enhanced/i.test(v.name)
  );
  if (naturalEnhanced) return naturalEnhanced;

  // Well-known clear natural OS voices
  const qualityOSVoice = candidatePool.find(v =>
    /Samantha|Daniel|Alex|Oliver|Arthur|Serena|Ava|Evan|Nathan|Karen|Moira/i.test(v.name)
  );
  if (qualityOSVoice) return qualityOSVoice;

  // Standard en-US or en-GB voices
  const standardEn = candidatePool.find(v => v.lang === 'en-US' || v.lang === 'en-GB');
  if (standardEn) return standardEn;

  return candidatePool[0];
}

/**
 * Checks if a voice is considered a top-tier natural voice (Microsoft Online Natural or Google US English).
 */
function isTopTierNaturalVoice(v: SpeechSynthesisVoice | null): boolean {
  if (!v) return false;
  return /Microsoft.*(Aria|Guy|Jenny|Online).*Natural/i.test(v.name) ||
         v.name.toLowerCase().includes('google us english') ||
         /Online.*\(Natural\)/i.test(v.name);
}

/**
 * Selects ONE voice once and stores it.
 * Reuses that exact same voice object for every utterance in every round.
 */
function pickAndStoreVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;

  // If we already have a top-tier voice or speech has already occurred, lock it in permanently
  if (storedDebateVoice) {
    if (speechPlaybackHasOccurred || isTopTierNaturalVoice(storedDebateVoice)) {
      return storedDebateVoice;
    }
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return storedDebateVoice;
  }

  const candidate = findBestVoiceMatch(voices);
  if (candidate) {
    // If we didn't have a voice yet, or if candidate is top-tier natural voice and we haven't spoken yet, upgrade & store
    if (!storedDebateVoice || (!speechPlaybackHasOccurred && isTopTierNaturalVoice(candidate))) {
      storedDebateVoice = candidate;
    }
  }

  return storedDebateVoice;
}

/**
 * Returns the permanently stored DealDebate voice.
 * Loaded once and reused across all rounds.
 */
export function getDebateVoice(): SpeechSynthesisVoice | null {
  if (storedDebateVoice) {
    return storedDebateVoice;
  }
  return pickAndStoreVoice();
}

// Select the most natural English voice available in the client's browser (alias)
export function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  return getDebateVoice();
}

/**
 * Ensures voices are loaded asynchronously via voiceschanged and locks in the single voice.
 */
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice | null> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve(null);
      return;
    }

    if (storedDebateVoice && (speechPlaybackHasOccurred || isTopTierNaturalVoice(storedDebateVoice))) {
      resolve(storedDebateVoice);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const v = pickAndStoreVoice();
      if (isTopTierNaturalVoice(v) || speechPlaybackHasOccurred) {
        resolve(v);
        return;
      }
    }

    let resolved = false;
    const onVoicesChanged = () => {
      if (resolved) return;
      const voice = pickAndStoreVoice();
      if (voice) {
        resolved = true;
        try {
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        } catch {}
        resolve(voice);
      }
    };

    try {
      window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged);
    } catch {}

    // Safety timeout in case browser never fires voiceschanged
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        try {
          window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged);
        } catch {}
        resolve(pickAndStoreVoice());
      }
    }, 1000);
  });
}

// Attach listener once at startup so voices load asynchronously as early as possible
if (typeof window !== 'undefined' && 'speechSynthesis' in window && !hasSetupVoiceListener) {
  hasSetupVoiceListener = true;
  // If voices are already ready on script execution:
  pickAndStoreVoice();

  // Listen to voiceschanged event:
  const handleVoicesChanged = () => {
    pickAndStoreVoice();
  };
  try {
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
  } catch {}
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
  // Retain utterance in global set to prevent Chrome GC bug where onend never fires!
  activeUtterances.add(utterance);

  // Mark that speech playback has occurred to strictly freeze the stored voice
  speechPlaybackHasOccurred = true;

  // Reuse the exact same stored voice object for every utterance in every round
  const voice = getDebateVoice();
  if (voice) {
    utterance.voice = voice;
  }
  utterance.lang = voice?.lang || 'en-US';
  utterance.rate = 1.0; // Natural speaking rate (around 1.0, not too fast)
  utterance.pitch = 1.0; // Neutral pitch

  let isFinished = false;
  let safetyTimeout: NodeJS.Timeout | null = null;

  const handleFinish = () => {
    if (safetyTimeout) {
      clearTimeout(safetyTimeout);
      safetyTimeout = null;
    }
    activeUtterances.delete(utterance);
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

  // Browser watchdog: Chrome can pause speech after ~10s without error
  const watchdog = setInterval(() => {
    if (window.speechSynthesis.speaking) {
      if (!window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    } else {
      clearInterval(watchdog);
    }
  }, 8000);

  // Safety fallback: if utterance never triggers onend (browser bug), trigger finish based on word count
  // Average reading speed is ~150 wpm = ~400ms per word. We add a generous 4-second safety buffer.
  const wordCount = cleanText.split(/\s+/).length;
  const estimatedDurationMs = Math.max(3000, wordCount * 500 + 4000);
  safetyTimeout = setTimeout(() => {
    if (!isFinished && !window.speechSynthesis.speaking) {
      handleFinish();
    }
  }, estimatedDurationMs);

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Failed to invoke speech synthesis', err);
    callbacks?.onError?.(err);
    handleFinish();
  }

  return () => {
    if (safetyTimeout) clearTimeout(safetyTimeout);
    clearInterval(watchdog);
    activeUtterances.delete(utterance);
    try {
      window.speechSynthesis.cancel();
    } catch {}
  };
}
