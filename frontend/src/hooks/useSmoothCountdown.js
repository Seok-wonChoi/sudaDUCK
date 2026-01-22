import { useCallback, useEffect, useRef, useState } from "react";

export default function useSmoothCountdown(totalSeconds, { onDone } = {}) {
  const totalMs = Math.max(0, totalSeconds * 1000);

  const [remainingSec, setRemainingSec] = useState(Math.ceil(totalMs / 1000));
  const [progressRatio, setProgressRatio] = useState(1);

  const rafRef = useRef(0);
  const runningRef = useRef(false);
  const endAtRef = useRef(0);

  const lastUiAtRef = useRef(0);
  const lastShownSecRef = useRef(-1);

  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
  }, []);

  const reset = useCallback(() => {
    stop();
    doneRef.current = false;
    lastUiAtRef.current = 0;
    lastShownSecRef.current = -1;
    setRemainingSec(Math.ceil(totalMs / 1000));
    setProgressRatio(1);
  }, [stop, totalMs]);

  const start = useCallback(() => {
    reset();
    runningRef.current = true;
    endAtRef.current = performance.now() + totalMs;

    const UI_INTERVAL_MS = 50;

    const tick = (now) => {
      if (!runningRef.current) return;

      const remainMs = Math.max(0, endAtRef.current - now);
      const ratio = totalMs > 0 ? remainMs / totalMs : 0;

      if (now - lastUiAtRef.current > UI_INTERVAL_MS) {
        lastUiAtRef.current = now;
        setProgressRatio(ratio);

        const sec = Math.ceil(remainMs / 1000);
        if (sec !== lastShownSecRef.current) {
          lastShownSecRef.current = sec;
          setRemainingSec(sec);
        }
      }

      if (remainMs <= 0) {
        setProgressRatio(0);
        setRemainingSec(0);
        stop();

        if (!doneRef.current) {
          doneRef.current = true;
          if (typeof onDoneRef.current === "function") onDoneRef.current();
        }
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [reset, stop, totalMs]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  return { remainingSec, progressRatio, start, stop, reset };
}
