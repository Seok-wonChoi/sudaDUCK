import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./TimerGauge.module.css";

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function TimerGauge({
  durationMs = 60_000,
  isRunning = true,
  onDone,
}) {
  const fillRef = useRef(null);
  const rafRef = useRef(0);
  const endAtRef = useRef(0);
  const lastShownSecRef = useRef(-1);

  const [shownSec, setShownSec] = useState(() =>
    Math.ceil(durationMs / 1000)
  );

  const label = useMemo(() => formatMMSS(Math.max(0, shownSec)), [shownSec]);

  useEffect(() => {
    if (!isRunning) return;

    const start = performance.now();
    endAtRef.current = start + durationMs;

    const tick = (now) => {
      const remain = Math.max(0, endAtRef.current - now);
      const progress = durationMs > 0 ? remain / durationMs : 0;

      if (fillRef.current) {
        fillRef.current.style.transform = `scaleX(${progress})`;
      }

      const sec = Math.ceil(remain / 1000);
      if (sec !== lastShownSecRef.current) {
        lastShownSecRef.current = sec;
        setShownSec(sec);
      }

      if (remain <= 0) {
        if (typeof onDone === "function") onDone();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [durationMs, isRunning, onDone]);

  return (
    <div className={styles.Wrap} aria-label="남은 시간">
      <div className={styles.Track}>
        <div ref={fillRef} className={styles.Fill} />
      </div>
      <div className={styles.Time}>{label}</div>
    </div>
  );
}
