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
  durationMs = 40_000,
  isRunning = true,
  onDone,
  startTimeMs = null, // ?ˆë? ?œìž‘ ?œê°„ (timestamp)
}) {
  const fillRef = useRef(null);
  const rafRef = useRef(0);
  const endAtRef = useRef(0);
  const lastShownSecRef = useRef(-1);
  const remainingMsRef = useRef(durationMs); // ?¨ì? ?œê°„ ?€??(?¼ì‹œ?•ì?/?¬ê°œ??

  const [shownSec, setShownSec] = useState(() =>
    Math.ceil(durationMs / 1000)
  );

  const label = useMemo(() => formatMMSS(Math.max(0, shownSec)), [shownSec]);

  useEffect(() => {
    if (!isRunning) {
      // ?¼ì‹œ?•ì?: ?„ìž¬ ?¨ì? ?œê°„ ?€??
      cancelAnimationFrame(rafRef.current);

      if (startTimeMs) {
        // ?ˆë? ?œê°„ ëª¨ë“œ: ?„ìž¬ ?¨ì? ?œê°„ ê³„ì‚°
        const now = Date.now();
        const elapsed = now - startTimeMs;
        const remain = Math.max(0, durationMs - elapsed);
        remainingMsRef.current = remain;
      } else {
        // ?ë? ?œê°„ ëª¨ë“œ
        const now = performance.now();
        if (endAtRef.current > 0) {
          const remain = Math.max(0, endAtRef.current - now);
          remainingMsRef.current = remain;
        }
      }
      return;
    }

    // ?¬ê°œ
    if (startTimeMs) {
      // ?ˆë? ?œê°„ ëª¨ë“œ: ?œìž‘ ?œê°„ ê¸°ì??¼ë¡œ ì¢…ë£Œ ?œê°„ ê³„ì‚°
      endAtRef.current = startTimeMs + durationMs;
    } else {
      // ?ë? ?œê°„ ëª¨ë“œ: ?¨ì? ?œê°„ë¶€???œìž‘
      const start = performance.now();
      endAtRef.current = start + remainingMsRef.current;
    }

    const tick = () => {
      const now = startTimeMs ? Date.now() : performance.now();
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
  }, [durationMs, isRunning, onDone, startTimeMs]);

  return (
    <div className={styles.Wrap} aria-label="?¨ì? ?œê°„">
      <div className={styles.Track}>
        <div ref={fillRef} className={styles.Fill} />
      </div>
      <div className={styles.Time}>{label}</div>
    </div>
  );
}
