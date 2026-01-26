import { useEffect, useMemo, useRef, useState } from "react";

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
    <div className="inline-flex items-center gap-2.5" aria-label="남은 시간">
      <div className="w-52 sm:w-[260px] h-2.5 rounded-full bg-gray-900/10 overflow-hidden">
        <div
          ref={fillRef}
          className="w-full h-full origin-left bg-indigo-600/85 will-change-transform"
          style={{ transform: "scaleX(1)" }}
        />
      </div>
      <div className="text-xs font-black text-gray-900 min-w-[44px] text-right">
        {label}
      </div>
    </div>
  );
}
