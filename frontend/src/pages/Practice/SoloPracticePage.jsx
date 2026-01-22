import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SoloPracticePage.module.css";

import AppHeader from "../../components/Layout/AppHeader/AppHeader";
import ExitGuard from "../../components/Common/ExitGuard/ExitGuard";

import duckImg from "../../assets/images/duck.png";
import duckHappyImg from "../../assets/images/duck_happy.png";

// 실제 확장자에 맞게 수정 필요
import micOnIcon from "../../assets/icons/mic_on.png";
import micOffIcon from "../../assets/icons/mic_off.png";

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function VoiceWave({ level, enabled }) {
  const multipliers = [0.35, 0.55, 0.8, 1, 0.8, 0.55, 0.35];
  const v = Math.max(0, Math.min(1, level));

  return (
    <span
      className={`${styles.Wave} ${enabled ? styles.WaveOn : styles.WaveOff}`}
      aria-hidden="true"
    >
      {multipliers.map((m, idx) => {
        const h = enabled ? 6 + v * 20 * m : 6;
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
  const TOTAL_SECONDS = 60;

  const [micOn, setMicOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  const [started, setStarted] = useState(false);
  const [remainingSec, setRemainingSec] = useState(TOTAL_SECONDS);

  const [isCountdownOpen, setIsCountdownOpen] = useState(true);
  const [countdownSec, setCountdownSec] = useState(3);

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

      const THRESHOLD = 0.03; // 음성 감지 임계값
      const HOLD_MS = 220; // 말하는 상태 유지 시간
      const UI_INTERVAL_MS = 60; // UI 업데이트 주기

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

  // 3초 카운트다운 후 시작
  useEffect(() => {
    setIsCountdownOpen(true);
    setCountdownSec(3);
    setStarted(false);
    setRemainingSec(TOTAL_SECONDS);

    const id = window.setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setIsCountdownOpen(false);
          setStarted(true);
          setRemainingSec(TOTAL_SECONDS);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  // 카운트다운 진행
  useEffect(() => {
    if (!started) return;
    if (remainingSec <= 0) return;

    const id = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [started, remainingSec]);

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
    console.log("대화 종료 클릭");
  }, [stopAudioAnalysis]);

  const handleBack = useCallback(() => {
    navigate("/practice");
  }, [navigate]);

  const displaySec = started ? remainingSec : TOTAL_SECONDS;
  const progressRatio = started ? remainingSec / TOTAL_SECONDS : 1;

  return (
    <div className={styles.Page}>
      <div className={styles.Shell}>
        <ExitGuard to="/" message="메인 화면으로 나가시겠습니까?" />

        <AppHeader userName="user" notifications={[]} />

        <div className={styles.BackRow}>
          <button type="button" className={styles.BackButton} onClick={handleBack}>
            &lt; 뒤로가기
          </button>
        </div>

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
          <div className={styles.HeaderRow}>
            <div className={styles.TopicRow}>
              <img className={styles.SmallDuck} src={duckImg} alt="오리" />
              <div className={styles.TopicBubble}>첫 번째 대화 주제는 {topic}입니다!</div>
            </div>

            <div className={styles.ProgressRow}>
              <div className={styles.ProgressTrack} aria-label="남은 시간 진행 바">
                <div
                  className={styles.ProgressFill}
                  style={{ width: `${Math.max(0, Math.min(1, progressRatio)) * 100}%` }}
                />
              </div>

              <div className={styles.Time} aria-label="남은 시간">
                <span className={styles.ClockDot} aria-hidden="true" />
                {formatTime(displaySec)}
              </div>
            </div>
          </div>

          <div className={styles.Stage}>
            <div className={styles.LeftStage}>
              <div className={styles.VideoArea}>
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
                      <VoiceWave level={voiceLevel} enabled={micOn} />
                      <span className={styles.MeLabel}>나</span>
                    </div>

                    <div className={styles.VideoFooterRight} aria-label="마이크 상태">
                      <img
                        className={styles.MicMini}
                        src={micOn ? micOffIcon : micOnIcon}
                        alt={micOn ? "마이크 켜짐" : "마이크 꺼짐"}
                      />
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
                  <img
                    className={styles.ButtonIcon}
                    src={micOn ? micOnIcon : micOffIcon}
                    alt=""
                    aria-hidden="true"
                  />
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
                  <span className={styles.AiTitle}>AI 영어덕</span>
                  <span className={styles.AiDot} aria-hidden="true" />
                </div>

                <div className={styles.AiFace} aria-hidden="true">
                  🙂
                </div>

                <div className={styles.AiMainText}>영어로 편하게 대화해 보세요!</div>
                <div className={styles.AiSubText}>
                  5초 동안 침묵이 지속되면 제가 도와드릴게요.
                </div>

                <div className={styles.AiPointer} aria-hidden="true" />
              </div>

              <img className={styles.BigDuck} src={duckHappyImg} alt="AI 오리" />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
