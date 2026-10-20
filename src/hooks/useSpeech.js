import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MALE_HINTS = [
  'male', 'david', 'mark', 'daniel', 'alex', 'fred', 'tom', 'james', 'john', 'george',
  'paul', 'ryan', 'aaron', 'arthur', 'eric', 'diego', 'jorge', 'juan', 'oliver', 'oskar',
  'xander', 'reed', 'rocko', 'ralph', 'albert', 'thomas', 'rishi', 'gordon', 'jacques',
  'luca', 'guy', 'brian', 'matthew', 'justin', 'kevin', 'michael',
];

const isFemaleName = (n) => n.includes('female') || n.includes('woman') || n.includes('girl');

export function filterVoices(all, showAll) {
  const byLang = (a, b) =>
    Number(b.lang.startsWith('en')) - Number(a.lang.startsWith('en')) ||
    a.name.localeCompare(b.name);
  if (showAll) return [...all].sort(byLang);

  let list = all.filter((v) => {
    const n = v.name.toLowerCase();
    return !isFemaleName(n) && MALE_HINTS.some((k) => n.includes(k));
  });
  if (list.length === 0) list = all.filter((v) => v.lang.startsWith('en'));
  if (list.length === 0) list = all;
  return [...list].sort(byLang);
}

const synth = () => (typeof window !== 'undefined' ? window.speechSynthesis : undefined);

export function useSpeech(settings) {
  const cfgRef = useRef(settings);
  cfgRef.current = settings;

  const [allVoices, setAllVoices] = useState([]);
  const allVoicesRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => {
    const s = synth();
    if (!s) return undefined;
    const load = () => {
      const list = s.getVoices();
      allVoicesRef.current = list;
      setAllVoices(list);
    };
    load();
    s.addEventListener('voiceschanged', load);
    return () => s.removeEventListener('voiceschanged', load);
  }, []);

  const voices = useMemo(
    () => filterVoices(allVoices, settings.showAllVoices),
    [allVoices, settings.showAllVoices],
  );

  const selectedURI = useMemo(() => {
    const chosen = allVoices.find((v) => v.voiceURI === settings.voiceURI);
    return (chosen ?? voices[0])?.voiceURI ?? '';
  }, [allVoices, voices, settings.voiceURI]);

  const speak = useCallback((text) => {
    const s = synth();
    const cfg = cfgRef.current;
    if (!s || !cfg.voiceEnabled) return;
    try {
      s.cancel();
      const u = new SpeechSynthesisUtterance(String(text));
      const list = allVoicesRef.current;
      const voice =
        list.find((v) => v.voiceURI === cfg.voiceURI) ?? filterVoices(list, cfg.showAllVoices)[0];
      if (voice) u.voice = voice;
      u.rate = cfg.voiceRate;
      u.pitch = cfg.voicePitch;
      u.volume = cfg.voiceVolume;
      s.speak(u);
    } catch {
      /* a speech failure must never break the timer */
    }
  }, []);

  const stop = useCallback(() => synth()?.cancel(), []);

  const audioContext = useCallback(() => {
    if (!audioRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioRef.current = new Ctx();
    }
    return audioRef.current;
  }, []);

  const beep = useCallback(
    (frequency = 880, ms = 140) => {
      if (!cfgRef.current.beepEnabled) return;
      const ctx = audioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + ms / 1000 + 0.02);
      } catch {
        /* audio is best-effort */
      }
    },
    [audioContext],
  );

  /** Call from a user gesture: mobile browsers only allow audio/speech after one. */
  const unlock = useCallback(() => {
    audioContext()?.resume?.();
    const s = synth();
    if (!s || s.speaking) return;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      s.speak(u);
    } catch {
      /* best-effort */
    }
  }, [audioContext]);

  return {
    supported: Boolean(synth()),
    voices,
    selectedURI,
    speak,
    stop,
    beep,
    unlock,
  };
}
