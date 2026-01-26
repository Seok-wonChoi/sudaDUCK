import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitGuard from "@/components/common/ExitGuard/ExitGuard";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import TimerGauge from "@/components/common/TimerGauge/TimerGauge";

import duckImg from "@/assets/images/duck.png";
import duckHappyImg from "@/assets/images/duck_happy.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";

const WAVE_COLORS = [
  "rgba(34, 197, 94, 0.95)",
  "rgba(16, 185, 129, 0.95)",
  "rgba(59, 130, 246, 0.95)",
  "rgba(99, 102, 241, 0.95)",
  "rgba(168, 85, 247, 0.95)",
  "rgba(59, 130, 246, 0.95)",
  "rgba(16, 185, 129, 0.95)",
];

function VoiceWave({ level, enabled }) {
  const multipliers = [0.35, 0.55, 0.8, 1, 0.8, 0.55, 0.35];
  const v = Math.max(0, Math.min(1, level));

  return (
    <span className="inline-flex items-end gap-[3px] h-[22px]" aria-hidden="true">
      {multipliers.map((m, idx) => {
        const h = enabled ? 6 + v * 20 * m : 6;
        return (
          <span
            key={idx}
            className="w-1 rounded-full transition-[height] duration-[120ms]"
            style={{
              height: `${h}px`,
              background: enabled ? WAVE_COLORS[idx] : "rgba(209, 213, 219, 1)",
              opacity: enabled ? 0.95 : 1,
            }}
          />
        );
      })}
    </span>
  );
}

export default function SoloPracticePage() {
  const topic = useMemo(() => "좋아하는 음식", []);
  const DURATION_MS = 60_000;

  const [micOn, setMicOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const [isCountdownOpen, setIsCountdownOpen] = useState(true);
  const [countdownSec, setCountdownSec] = useState(3);
  const [isRunning, setIsRunning] = useState(false);

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

  const stopAudioAnalysis = useCallback(async () => {
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

  const startAudioAnalysis = useCallback(async () => {
    const a = audioRef.current;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      a.stream = stream;

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      a.ctx = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      a.analyser = analyser;

      const source = ctx.createMediaStreamSource(stream);
      a.source = source;
      source.connect(analyser);

      const data = new Float32Array(analyser.fftSize);

      const THRESHOLD = 0.03;
      const HOLD_MS = 220;
      const UI_INTERVAL_MS = 60;

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
          if (rms > THRESHOLD) a.lastVoiceAt = now;

          const speaking = now - a.lastVoiceAt < HOLD_MS;

          if (speaking !== a.speakingNow) {
            a.speakingNow = speaking;
            setIsSpeaking(speaking);
          }

          const raw = Math.max(0, Math.min(1, (rms - 0.005) / 0.08));
          a.level = a.level * 0.82 + raw * 0.18;

          if (now - a.lastUiAt > UI_INTERVAL_MS) {
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
  }, []);

  useEffect(() => {
    setIsCountdownOpen(true);
    setCountdownSec(3);
    setIsRunning(false);

    const id = window.setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setIsCountdownOpen(false);
          setIsRunning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      stopAudioAnalysis();
    };
  }, [stopAudioAnalysis]);

  const toggleMic = useCallback(async () => {
    if (isCountdownOpen) return;

    if (micOn) {
      setMicOn(false);
      await stopAudioAnalysis();
      return;
    }

    setMicOn(true);
    await startAudioAnalysis();
  }, [isCountdownOpen, micOn, startAudioAnalysis, stopAudioAnalysis]);

  const handleEnd = useCallback(async () => {
    await stopAudioAnalysis();
    console.log("대화 종료");
  }, [stopAudioAnalysis]);

  const handleDone = useCallback(async () => {
    await stopAudioAnalysis();
    setMicOn(false);
    setIsRunning(false);
    console.log("시간 종료");
  }, [stopAudioAnalysis]);

  return (
    <div className="min-h-screen bg-[#f6f8ff] py-7">
      <div className="max-w-[1120px] mx-auto bg-white rounded-[28px] shadow-[0_18px_50px_rgba(17,24,39,0.1)] overflow-hidden relative">
        <ExitGuard to="/" message="메인 화면으로 나가시겠습니까?" />
        <AppHeader userName="user" notifications={[]} />

        {isCountdownOpen && (
          <div
            className="absolute inset-0 bg-gray-900/25 flex items-center justify-center z-50"
            role="dialog"
            aria-label="연습 시작 카운트다운"
          >
            <div className="w-[min(320px,86vw)] bg-white rounded-2xl border border-gray-200 shadow-[0_18px_50px_rgba(17,24,39,0.18)] p-4 pb-4 text-center">
              <div className="text-[13px] font-black text-gray-900">곧 시작합니다</div>
              <div className="mt-2.5 text-5xl font-black text-indigo-600 tracking-tight">{countdownSec}</div>
              <div className="mt-1.5 text-xs font-bold text-gray-500">마이크를 준비해 주세요</div>
            </div>
          </div>
        )}

        <div className="px-4 lg:px-8 py-5 pb-7">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] items-center gap-3.5 pb-2.5">
            <div className="flex items-center">
              <ExitButton to="/" label="나가기" confirmMessage="연습을 종료하고 나가시겠습니까?" />
            </div>

            <div className="flex items-center gap-3.5 min-w-0">
              <img className="w-14 h-14 object-contain" src={duckImg} alt="오리" />
              <div className="bg-white border border-[#e8edf6] rounded-2xl py-3 px-4
                text-[13px] font-black text-gray-900 shadow-[0_14px_26px_rgba(17,24,39,0.1)]
                whitespace-nowrap overflow-hidden text-ellipsis">
                첫 번째 대화 주제는 {topic}입니다!
              </div>
            </div>

            <div className="flex justify-end items-center lg:justify-start">
              <TimerGauge durationMs={DURATION_MS} isRunning={isRunning} onDone={handleDone} />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-center">
            <div className="flex flex-col items-center">
              <div className="w-full flex justify-center py-7 pb-5">
                <div className="w-[min(520px,100%)] grid grid-cols-1 gap-4">
                  <div
                    className={`h-[220px] rounded-xl bg-[#fbfcff] flex flex-col justify-between p-4 pb-3.5
                      border-2 relative
                      ${isSpeaking
                        ? "border-green-500/95 shadow-[0_0_0_3px_rgba(34,197,94,0.18),0_0_22px_rgba(34,197,94,0.30),0_18px_34px_rgba(17,24,39,0.12)]"
                        : "border-gray-200 shadow-none"
                      }`}
                  >
                    <div className="flex justify-center items-center h-[150px]">
                      <div className="w-[92px] h-[92px] rounded-full bg-white border border-indigo-50
                        shadow-[0_14px_26px_rgba(17,24,39,0.1)] flex items-center justify-center">
                        <img className="w-[62px] h-[62px] object-contain" src={duckImg} alt="내 아바타" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-2.5">
                        <VoiceWave level={voiceLevel} enabled={micOn} />
                        <span className="text-[13px] font-black text-gray-900">나</span>
                      </div>

                      <div className="inline-flex items-center justify-end min-w-[18px]" aria-label="마이크 상태">
                        <img
                          className="w-4.5 h-4.5 object-contain"
                          src={micOn ? micOffIcon : micOnIcon}
                          alt={micOn ? "마이크 켜짐" : "마이크 꺼짐"}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-1.5 flex items-center justify-center gap-3.5">
                <button
                  type="button"
                  className="h-[38px] px-4 rounded-xl border border-indigo-600 bg-indigo-600 text-white
                    text-xs font-black inline-flex items-center gap-2 cursor-pointer
                    disabled:opacity-55 disabled:cursor-not-allowed"
                  onClick={toggleMic}
                  disabled={isCountdownOpen}
                >
                  <img className="w-4 h-4 object-contain" src={micOn ? micOnIcon : micOffIcon} alt="" aria-hidden="true" />
                  {micOn ? "마이크 끄기" : "마이크 켜기"}
                </button>

                <button
                  type="button"
                  className="h-[38px] px-4 rounded-xl border border-gray-200 bg-white text-gray-900
                    text-xs font-black cursor-pointer"
                  onClick={handleEnd}
                >
                  대화 종료
                </button>
              </div>
            </div>

            <aside className="relative h-full min-h-[360px] lg:min-h-[440px]" aria-label="AI 도우미">
              <div className="relative bg-white border-2 border-indigo-600/25 rounded-2xl p-3.5 px-4 pb-4
                shadow-[0_18px_40px_rgba(17,24,39,0.14)] z-[2]">
                <div className="flex items-center justify-center gap-2 text-xs font-black text-indigo-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600/65" aria-hidden="true" />
                  <span className="text-indigo-600">AI 영어덕</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600/65" aria-hidden="true" />
                </div>

                <div className="mt-2.5 text-center text-[22px]" aria-hidden="true">🙂</div>

                <div className="mt-2 text-center text-sm font-black text-gray-900 leading-snug">
                  영어로 편하게 말해보세요!
                </div>
                <div className="mt-2 text-center text-xs font-bold text-gray-500 leading-relaxed">
                  막히면 짧게라도 이어서 말하는 것이 중요합니다.
                </div>

                <div className="absolute left-[52%] -bottom-2.5 w-4.5 h-4.5 bg-white
                  border-l-2 border-b-2 border-indigo-600/25 -translate-x-1/2 rotate-45" aria-hidden="true" />
              </div>

              <img
                className="absolute -right-1.5 -bottom-2 w-[220px] lg:w-[280px] h-[220px] lg:h-[280px] object-contain z-[1]
                  drop-shadow-[0_18px_30px_rgba(17,24,39,0.12)]"
                src={duckHappyImg}
                alt="AI 오리"
              />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
