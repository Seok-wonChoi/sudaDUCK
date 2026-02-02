import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SoloPracticePage.module.css";

import AppHeader from "@/components/layout/AppHeader/AppHeader";
import ExitGuard from "@/components/common/ExitGuard/ExitGuard";
import ExitButton from "@/components/common/ExitButton/ExitButton";
import TimerGauge from "@/components/common/TimerGauge/TimerGauge";
import ConfirmModal from "@/components/common/ConfirmModal/ConfirmModal";

import duckImg from "@/assets/images/duck.png";
import duckBotCyanImg from "@/assets/images/duck_bot_cyan.png";
import micOnIcon from "@/assets/icons/mic_on.png";
import micOffIcon from "@/assets/icons/mic_off.png";

function VoiceWave({ level, enabled }) {
  const multipliers = [0.5, 0.7, 0.85, 1, 0.85, 0.7, 0.5];
  const v = Math.max(0, Math.min(1, level));

  return (
    <span
      className={`${styles.Wave} ${enabled ? styles.WaveOn : styles.WaveOff}`}
      aria-hidden="true"
    >
      {multipliers.map((m, idx) => {
        const h = enabled ? 10 + v * 16 * m : 10;
        return (
          <span
            key={idx}
            className={`${styles.WaveBar} ${styles[`WaveBar${idx + 1}`]}`}
            style={{ height: `${h}px` }}
          />
        );
      })}
    </span>
  );
}

export default function SoloPracticePage() {
  const navigate = useNavigate();
  const topic = useMemo(() => "좋아하는 음식", []);
  const DURATION_MS = 60_000;

  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const handleBack = () => {
    setShowBackConfirm(true);
  };

  const handleBackConfirm = useCallback(() => {
    setShowBackConfirm(false);
    if (window.history.length > 1) navigate(-1);
    else navigate("/practice");
  }, [navigate]);

  const handleBackCancel = useCallback(() => {
    setShowBackConfirm(false);
  }, []);

  const [micOn, setMicOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const [isCountdownOpen, setIsCountdownOpen] = useState(true);
  const [countdownSec, setCountdownSec] = useState(3);
  const [isRunning, setIsRunning] = useState(false);

  // 타이머 시작 시간 (절대 timestamp)
  const [timerStartedAt] = useState(() => {
    try {
      const saved = sessionStorage.getItem('solo_practice_timer');
      return saved ? parseInt(saved, 10) : Date.now();
    } catch {
      return Date.now();
    }
  });

  // sessionStorage 저장
  useEffect(() => {
    try {
      sessionStorage.setItem('solo_practice_timer', String(timerStartedAt));
    } catch {
      // ignore
    }
  }, [timerStartedAt]);

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
          // 카운트다운 종료 시 마이크 자동 켜기
          startAudioAnalysis();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [startAudioAnalysis]);

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
    // 대화 종료 후 녹음 페이지로 이동
    navigate("/recording", {
      replace: true,
      state: {
        mode: "solo",
        topic,
      }
    });
  }, [stopAudioAnalysis, navigate, topic]);

  const handleDone = useCallback(async () => {
    await stopAudioAnalysis();
    setMicOn(false);
    setIsRunning(false);
    console.log("시간 종료");

    // 대화 종료 후 녹음 페이지로 이동
    navigate("/recording", {
      replace: true,
      state: {
        mode: "solo",
        topic,
      }
    });
  }, [stopAudioAnalysis, navigate, topic]);

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <ExitGuard to="/" message="메인 화면으로 나가시겠습니까?" />
        <AppHeader userName="user" notifications={[]} />

        {isCountdownOpen && (
          <div className={styles.CountdownOverlay} role="dialog" aria-label="연습 시작 카운트다운">
            <div className={styles.CountdownModal}>
              <div className={styles.CountdownTitle}>곧 시작합니다</div>
              <div className={styles.CountdownNumber}>{countdownSec}</div>
              <div className={styles.CountdownHint}>마이크를 준비해 주세요</div>
            </div>
          </div>
        )}

        <div className={styles.Content}>
          <button
            className={styles.BackButton}
            type="button"
            onClick={handleBack}
            aria-label="뒤로 가기"
          >
            &lt;
          </button>

          <div className={styles.HeaderRow}>
            <div className={styles.ExitCol}>
              <ExitButton to="/" label="나가기" confirmMessage="연습을 종료하고 나가시겠습니까?" />
            </div>

            <div className={styles.TopicRow}>
              <img className={styles.SmallDuck} src={duckImg} alt="오리" />
              <div className={styles.TopicBubble}>첫 번째 대화 주제는 {topic}입니다!</div>
            </div>

            <div className={styles.TimerCol}>
              <TimerGauge durationMs={DURATION_MS} isRunning={isRunning} onDone={handleDone} startTimeMs={timerStartedAt} />
            </div>
          </div>

          <div className={styles.Stage}>
            <div className={styles.LeftStage}>
              <div className={styles.VideoArea}>
                <div className={styles.CardsGrid}>
                  <div
                    className={`${styles.VideoCard} ${
                      isSpeaking ? styles.VideoCardSpeaking : styles.VideoCardIdle
                    }`}
                  >
                    <div className={styles.VideoInner}>
                      <div className={styles.AvatarCircle}>
                        <img className={styles.AvatarDuck} src={duckImg} alt="내 아바타" />
                      </div>
                    </div>

                    <div className={styles.VideoFooter}>
                      <div className={styles.VideoFooterLeft}>
                        <span className={styles.MeLabel}>나</span>
                        <img
                          className={styles.MicMini}
                          src={micOn ? micOffIcon : micOnIcon}
                          alt={micOn ? "마이크 켜짐" : "마이크 꺼짐"}
                        />
                      </div>

                      <div className={styles.VideoFooterRight}>
                        <VoiceWave level={voiceLevel} enabled={micOn} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.BottomActions}>
                <button
                  type="button"
                  className={styles.PrimaryButton}
                  onClick={toggleMic}
                  disabled={isCountdownOpen}
                >
                  <img className={styles.ButtonIcon} src={micOn ? micOffIcon : micOnIcon} alt="" aria-hidden="true" />
                  {micOn ? "마이크 끄기" : "마이크 켜기"}
                </button>

                <button type="button" className={styles.SecondaryButton} onClick={handleEnd}>
                  대화 종료
                </button>
              </div>
            </div>

            <aside className={styles.RightStage} aria-label="AI 도우미">
              <div className={styles.AiBubble}>
                <div className={styles.AiHeader}>
                  <span className={styles.AiDot} aria-hidden="true" />
                  <span className={styles.AiTitle}>AI 수덕</span>
                  <span className={styles.AiDot} aria-hidden="true" />
                </div>

                <div className={styles.AiFace} aria-hidden="true">
                  🙂
                </div>

                <div className={styles.AiMainText}>한국어로 편하게 말해보세요!</div>
                <div className={styles.AiSubText}>막히면 짧게라도 이어서 말하는 것이 중요합니다.</div>

                <div className={styles.AiPointer} aria-hidden="true" />
              </div>

              <img className={styles.BigDuck} src={duckBotCyanImg} alt="AI 오리" />
            </aside>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showBackConfirm}
        message="연습을 종료하고 나가시겠습니까?"
        confirmText="나가기"
        cancelText="취소"
        onConfirm={handleBackConfirm}
        onClose={handleBackCancel}
      />
    </div>
  );
}
