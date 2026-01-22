import { useCallback, useEffect, useRef, useState } from "react";

export default function useMicAnalyzer(options = {}) {
  const {
    threshold = 0.03,
    holdMs = 220,
    uiIntervalMs = 60,
    smoothing = 0.85,
    fftSize = 2048,
  } = options;

  const [micOn, setMicOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const audioRef = useRef({
    stream: null,
    ctx: null,
    analyser: null,
    source: null,
    rafId: null,
    lastVoiceAt: 0,
    speakingNow: false,
    level: 0,
    lastUiAt: 0,
  });

  const stop = useCallback(async () => {
    const a = audioRef.current;

    if (a.rafId) {
      cancelAnimationFrame(a.rafId);
      a.rafId = null;
    }

    if (a.stream) {
      a.stream.getTracks().forEach((t) => t.stop());
      a.stream = null;
    }

    if (a.ctx) {
      try {
        await a.ctx.close();
      } catch (e) {
        // ignore
      }
      a.ctx = null;
    }

    a.analyser = null;
    a.source = null;
    a.lastVoiceAt = 0;
    a.speakingNow = false;
    a.level = 0;
    a.lastUiAt = 0;

    setIsSpeaking(false);
    setVoiceLevel(0);
  }, []);

  const start = useCallback(async () => {
    const a = audioRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      a.stream = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      a.ctx = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothing;
      a.analyser = analyser;

      const source = ctx.createMediaStreamSource(stream);
      a.source = source;
      source.connect(analyser);

      const data = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (!a.analyser) return;

        if (typeof a.analyser.getFloatTimeDomainData === "function") {
          a.analyser.getFloatTimeDomainData(data);

          let sum = 0;
          for (let i = 0; i < data.length; i += 1) {
            const v = data[i];
            sum += v * v;
          }
          const rms = Math.sqrt(sum / data.length);

          const now = performance.now();

          if (rms > threshold) a.lastVoiceAt = now;
          const speaking = now - a.lastVoiceAt < holdMs;

          if (speaking !== a.speakingNow) {
            a.speakingNow = speaking;
            setIsSpeaking(speaking);
          }

          const raw = Math.max(0, Math.min(1, (rms - 0.005) / 0.08));
          a.level = a.level * 0.82 + raw * 0.18;

          if (now - a.lastUiAt > uiIntervalMs) {
            a.lastUiAt = now;
            setVoiceLevel(a.level);
          }
        }

        a.rafId = requestAnimationFrame(tick);
      };

      try {
        await ctx.resume();
      } catch (e) {
        // ignore
      }

      tick();
    } catch (e) {
      setIsSpeaking(false);
      setVoiceLevel(0);
    }
  }, [fftSize, holdMs, smoothing, threshold, uiIntervalMs]);

  const toggleMic = useCallback(async () => {
    if (micOn) {
      setMicOn(false);
      await stop();
      return;
    }
    setMicOn(true);
    await start();
  }, [micOn, start, stop]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    micOn,
    setMicOn,
    isSpeaking,
    voiceLevel,
    start,
    stop,
    toggleMic,
  };
}
