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
  startTimeMs = null, // 절대 시작 시간 (timestamp)
}) {
  const fillRef = useRef(null);
  const rafRef = useRef(0);
  const endAtRef = useRef(0);
  const lastShownSecRef = useRef(-1);
  const remainingMsRef = useRef(durationMs); // 남은 시간 저장 (일시정지/재개용)

  const [shownSec, setShownSec] = useState(() =>
    Math.ceil(durationMs / 1000)
  );

  const label = useMemo(() => formatMMSS(Math.max(0, shownSec)), [shownSec]);

  useEffect(() => {
    if (!isRunning) {
      // 일시정지: 현재 남은 시간 저장
      cancelAnimationFrame(rafRef.current);

      if (startTimeMs) {
        // 절대 시간 모드: 현재 남은 시간 계산
        const now = Date.now();
        const elapsed = now - startTimeMs;
        const remain = Math.max(0, durationMs - elapsed);
        remainingMsRef.current = remain;
      } else {
        // 상대 시간 모드
        const now = performance.now();
        if (endAtRef.current > 0) {
          const remain = Math.max(0, endAtRef.current - now);
          remainingMsRef.current = remain;
        }
      }
      return;
    }

    // 재개
    if (startTimeMs) {
      // 절대 시간 모드: 시작 시간 기준으로 종료 시간 계산
      endAtRef.current = startTimeMs + durationMs;
    } else {
      // 상대 시간 모드: 남은 시간부터 시작
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
    <div className={styles.Wrap} aria-label="남은 시간">
      <div className={styles.Track}>
        <div ref={fillRef} className={styles.Fill} />
      </div>
      <div className={styles.Time}>{label}</div>
    </div>
  );
}
