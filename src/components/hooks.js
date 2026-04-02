import { useState, useRef, useEffect, useCallback } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const h = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);
  return isMobile;
};

export const useSpeechRecognition = (onResult) => {
  const recogRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [supported] = useState(
    () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );

  // Stop and clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recogRef.current) {
        recogRef.current.onresult = null;
        recogRef.current.onend = null;
        recogRef.current.onerror = null;
        recogRef.current.abort();
        recogRef.current = null;
      }
    };
  }, []);

  const start = useCallback(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR();
    r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = (e) => onResult(e.results[0][0].transcript);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recogRef.current = r; r.start(); setListening(true);
  }, [supported, onResult]);

  const stop = useCallback(() => {
    if (recogRef.current) {
      recogRef.current.stop();
      recogRef.current = null;
    }
    setListening(false);
  }, []);

  return { listening, supported, start, stop };
};
